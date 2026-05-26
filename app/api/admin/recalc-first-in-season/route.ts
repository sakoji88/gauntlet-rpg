import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { calculatePoints, getSeasonDay } from "@/lib/points-formula";

// Полный перерасчёт поинтов за весь активный сезон по новой формуле
// (sqrt(hours)×3 + множители + cap 50/75).
//
// Старое название endpoint'а сохранено для обратной совместимости UI-кнопки.
//
// Что делает:
//   1. Берёт все COMPLETED игры текущего сезона по возрастанию completedAt.
//   2. Первая в сезоне получает firstInSeasonBonus = +2 (Первопроходец Сезона).
//   3. Каждой игре пересчитывает pointsEarned по новой формуле.
//   4. Для обычной игры — calculatePoints(...). Для тюрьмы — отдельная формула.
//   5. Считает delta = newPoints - oldPoints, накапливает по игроку.
//   6. Если applied=true (dryRun=false): обновляет game.pointsEarned и
//      player.points на сумму дельт.
//
// ОГРАНИЧЕНИЯ:
//   - Активные баффы/ловушки на момент засчёта НЕ сохраняются — recalc
//     считает БЕЗ них. Если у игрока были Сердце Тьмы / Ярость — он
//     потеряет этот множитель в перерасчёте. Это компромисс.
//   - isMaxDifficulty не сохраняется в Game — считаем что false.
//   - metacriticRating не сохраняется — Страдалец-бонусы не считаются.
//   - itemFlatBonus, struggle от HLTB — не считаются.
//   - Используются ТЕКУЩИЕ статы/класс игрока (а не на момент игры).
//
// Body: { dryRun?: boolean } — true по умолчанию.

const PRISON_REGION_ID = "prison";
const PRISON_RELEASE_BONUS = 1;
const PRISON_FAST_BONUS = 1;
const PRISON_FAST_THRESHOLD = 8;
const PRISON_HARD_BONUS = 1;

interface Adjustment {
  gameId: string;
  playerId: string;
  playerNickname: string;
  title: string;
  region: string;
  hours: number | null;
  completedAt: string;
  oldPoints: number;
  newPoints: number;
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

  // Все COMPLETED игры сезона по хронологии
  const games = await prisma.game.findMany({
    where: {
      status: "COMPLETED",
      completedAt: { gte: season.startedAt },
    },
    include: {
      player: {
        select: {
          id: true,
          nickname: true,
          class: true,
          strength: true,
          patience: true,
          luck: true,
          charisma: true,
        },
      },
    },
    orderBy: { completedAt: "asc" },
  });

  const firstGameId = games[0]?.id ?? null;
  const adjustments: Adjustment[] = [];
  const playerDeltas = new Map<string, { nickname: string; delta: number; games: number }>();

  for (const g of games) {
    const isPrison = g.region === PRISON_REGION_ID;
    let newPoints: number;

    if (isPrison) {
      // Тюрьма — отдельная формула (повторяет логику finish/route.ts).
      const hours = g.hours ?? 0;
      const base = hours > 0 ? Math.max(1, Math.round(Math.sqrt(hours))) : 1;
      let total = base + PRISON_RELEASE_BONUS;
      if (hours > 0 && hours <= PRISON_FAST_THRESHOLD) total += PRISON_FAST_BONUS;
      // isMaxDifficulty и metacriticRating не сохранены в Game — пропускаем
      // соответствующие бонусы. Это сознательный компромисс перерасчёта.
      void PRISON_HARD_BONUS; // зарезервировано на будущее, если будем хранить maxDiff
      newPoints = total;
    } else {
      // Обычная игра — calculatePoints
      const conditionType =
        g.conditionType === "genre" || g.conditionType === "special"
          ? g.conditionType
          : "basic";

      // Расчёт seasonDay на МОМЕНТ завершения игры, не сейчас
      // (чтобы фаза Гонки применилась корректно).
      const dayAtCompletion = g.completedAt
        ? Math.max(
            1,
            Math.floor(
              (g.completedAt.getTime() - season.startedAt.getTime()) /
                (1000 * 60 * 60 * 24),
            ) + 1,
          )
        : getSeasonDay(season.startedAt);

      const result = calculatePoints({
        region: g.region,
        hours: g.hours,
        rating: g.rating,
        metacriticRating: null, // не сохранено
        isMaxDifficulty: false, // не сохранено
        conditionType,
        playerClass: g.player.class,
        strength: g.player.strength,
        patience: g.player.patience,
        luck: g.player.luck,
        charisma: g.player.charisma,
        seasonDay: dayAtCompletion,
        activeBuffs: [],
        activeTraps: [],
        firstInSeasonBonus: g.id === firstGameId ? 2 : 0,
      });
      newPoints = result.total;
    }

    const delta = newPoints - g.pointsEarned;
    adjustments.push({
      gameId: g.id,
      playerId: g.player.id,
      playerNickname: g.player.nickname,
      title: g.title,
      region: g.region,
      hours: g.hours,
      completedAt: g.completedAt?.toISOString() ?? "",
      oldPoints: g.pointsEarned,
      newPoints,
      delta,
    });

    if (delta !== 0) {
      const existing = playerDeltas.get(g.player.id);
      if (existing) {
        existing.delta += delta;
        existing.games += 1;
      } else {
        playerDeltas.set(g.player.id, {
          nickname: g.player.nickname,
          delta,
          games: 1,
        });
      }
    }
  }

  const summary = {
    seasonStartedAt: season.startedAt,
    totalGames: games.length,
    affectedGames: adjustments.filter((a) => a.delta !== 0).length,
    playerDeltas: [...playerDeltas.entries()].map(([id, x]) => ({
      playerId: id,
      nickname: x.nickname,
      delta: x.delta,
      games: x.games,
    })),
    adjustments,
  };

  if (dryRun) {
    return NextResponse.json({ dryRun: true, ...summary });
  }

  // Применяем — одна транзакция:
  //   1. Обновляем game.pointsEarned для каждой изменённой игры
  //   2. Обновляем player.points на сумму дельт по игроку
  const ops: any[] = [];
  for (const a of adjustments) {
    if (a.delta !== 0) {
      ops.push(
        prisma.game.update({
          where: { id: a.gameId },
          data: { pointsEarned: a.newPoints },
        }),
      );
    }
  }
  for (const [playerId, x] of playerDeltas) {
    ops.push(
      prisma.player.update({
        where: { id: playerId },
        data: { points: { increment: x.delta } },
      }),
    );
  }
  if (ops.length > 0) {
    await prisma.$transaction(ops);
  }

  return NextResponse.json({
    dryRun: false,
    appliedToGames: adjustments.filter((a) => a.delta !== 0).length,
    appliedToPlayers: playerDeltas.size,
    ...summary,
  });
}
