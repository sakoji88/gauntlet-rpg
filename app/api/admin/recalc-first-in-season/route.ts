import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { normalizeGameTitle } from "@/lib/game-title";

// Одноразовый перерасчёт бонуса «+2 первым прошёл» в текущем сезоне.
//
// Проблема: раньше сравнение title в finish/route.ts шло строго (с учётом
// пробелов, кавычек, римских/арабских цифр), из-за чего почти каждый игрок
// получал +2 при засчёте — типа он "первый". Этот эндпоинт пересчитывает
// группы по нормализованному title, оставляет +2 только хронологически
// первому в каждой группе, и снимает по 2 поинта со всех остальных игр.
//
// Body:
//   { dryRun?: boolean }  — true (по умолчанию): только показать что будет.
//                           false: применить изменения.
//
// Возвращает список затронутых игр и итоговую дельту по каждому игроку.

interface Adjustment {
  gameId: string;
  playerId: string;
  playerNickname: string;
  title: string;
  normalizedTitle: string;
  completedAt: string;
  reason: string; // "kept_first" | "revoke_dup"
  delta: number;  // 0 для kept_first, -2 для revoke
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    // тело необязательно
  }
  const dryRun = body.dryRun !== false; // по умолчанию dry-run

  const season = await prisma.season.findFirst({
    where: { endedAt: null },
    orderBy: { startedAt: "desc" },
  });
  if (!season) {
    return NextResponse.json({ error: "Нет активного сезона" }, { status: 400 });
  }

  // Все завершённые игры этого сезона
  const games = await prisma.game.findMany({
    where: {
      status: "COMPLETED",
      completedAt: { gte: season.startedAt },
    },
    include: { player: { select: { id: true, nickname: true } } },
    orderBy: { completedAt: "asc" },
  });

  // Группируем по нормализованному title
  const groups = new Map<string, typeof games>();
  for (const g of games) {
    const key = normalizeGameTitle(g.title);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(g);
  }

  const adjustments: Adjustment[] = [];
  const playerDeltas = new Map<string, number>();

  for (const [normTitle, group] of groups) {
    if (group.length <= 1) continue; // одиночные — ничего не меняем
    // group уже отсортирована по completedAt asc
    for (let i = 0; i < group.length; i++) {
      const g = group[i];
      if (i === 0) {
        adjustments.push({
          gameId: g.id,
          playerId: g.player.id,
          playerNickname: g.player.nickname,
          title: g.title,
          normalizedTitle: normTitle,
          completedAt: g.completedAt?.toISOString() ?? "",
          reason: "kept_first",
          delta: 0,
        });
      } else {
        adjustments.push({
          gameId: g.id,
          playerId: g.player.id,
          playerNickname: g.player.nickname,
          title: g.title,
          normalizedTitle: normTitle,
          completedAt: g.completedAt?.toISOString() ?? "",
          reason: "revoke_dup",
          delta: -2,
        });
        playerDeltas.set(
          g.player.id,
          (playerDeltas.get(g.player.id) ?? 0) - 2,
        );
      }
    }
  }

  if (dryRun) {
    return NextResponse.json({
      dryRun: true,
      seasonStartedAt: season.startedAt,
      totalGames: games.length,
      groupsAffected: [...groups.values()].filter((g) => g.length > 1).length,
      adjustments,
      playerDeltas: [...playerDeltas.entries()].map(([id, delta]) => ({
        playerId: id,
        delta,
      })),
    });
  }

  // Применяем
  await prisma.$transaction(
    [...playerDeltas.entries()].map(([playerId, delta]) =>
      prisma.player.update({
        where: { id: playerId },
        data: { points: { increment: delta } },
      }),
    ),
  );

  return NextResponse.json({
    dryRun: false,
    seasonStartedAt: season.startedAt,
    totalGames: games.length,
    adjustments,
    playerDeltas: [...playerDeltas.entries()].map(([id, delta]) => ({
      playerId: id,
      delta,
    })),
    appliedTo: playerDeltas.size,
  });
}
