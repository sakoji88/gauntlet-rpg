import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

// Одноразовый перерасчёт бонуса «Первопроходец Сезона» (+2) в текущем сезоне.
//
// Новая логика: бонус +2 даётся ровно ОДНОМУ игроку за сезон — тому, кто
// первым вообще завершит любую игру в новом сезоне.
//
// Раньше из-за кривого title-сравнения бонус начислялся почти каждому за
// каждое прохождение. Этот эндпоинт исправляет накопившуюся переплату:
//
//   1. Находит самую первую COMPLETED-игру сезона (хронологически).
//      Эта игра «легитимно» получила +2 → не трогаем.
//   2. У всех остальных COMPLETED-игр сезона: −2 поинта у соответствующего
//      игрока (бонус им начислять не должны были).
//
// Body: { dryRun?: boolean } — true (по умолчанию) показывает что будет,
// false применяет.

interface Adjustment {
  gameId: string;
  playerId: string;
  playerNickname: string;
  title: string;
  completedAt: string;
  reason: "kept_first" | "revoke";
  delta: number;
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

  // Все завершённые игры этого сезона по возрастанию completedAt
  const games = await prisma.game.findMany({
    where: {
      status: "COMPLETED",
      completedAt: { gte: season.startedAt },
    },
    include: { player: { select: { id: true, nickname: true } } },
    orderBy: { completedAt: "asc" },
  });

  const adjustments: Adjustment[] = [];
  const playerDeltas = new Map<string, number>();

  for (let i = 0; i < games.length; i++) {
    const g = games[i];
    if (i === 0) {
      // Самая первая — оставляем как есть.
      adjustments.push({
        gameId: g.id,
        playerId: g.player.id,
        playerNickname: g.player.nickname,
        title: g.title,
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
        completedAt: g.completedAt?.toISOString() ?? "",
        reason: "revoke",
        delta: -2,
      });
      playerDeltas.set(
        g.player.id,
        (playerDeltas.get(g.player.id) ?? 0) - 2,
      );
    }
  }

  const summary = {
    seasonStartedAt: season.startedAt,
    totalGames: games.length,
    firstGame: games[0]
      ? {
          gameId: games[0].id,
          playerNickname: games[0].player.nickname,
          title: games[0].title,
          completedAt: games[0].completedAt,
        }
      : null,
    revokedFromGames: Math.max(0, games.length - 1),
    playerDeltas: [...playerDeltas.entries()].map(([id, delta]) => ({
      playerId: id,
      delta,
      nickname:
        adjustments.find((a) => a.playerId === id)?.playerNickname ?? id,
    })),
    adjustments,
  };

  if (dryRun) {
    return NextResponse.json({ dryRun: true, ...summary });
  }

  // Применяем — одна транзакция
  if (playerDeltas.size > 0) {
    await prisma.$transaction(
      [...playerDeltas.entries()].map(([playerId, delta]) =>
        prisma.player.update({
          where: { id: playerId },
          data: { points: { increment: delta } },
        }),
      ),
    );
  }

  return NextResponse.json({
    dryRun: false,
    appliedTo: playerDeltas.size,
    ...summary,
  });
}
