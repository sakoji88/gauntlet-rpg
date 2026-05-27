// Серверная логика появления Духа Гомодрила Перова.
// Возвращает уже существующий OFFERED/ACTIVE Perov-квест либо создаёт новый,
// если триггеры сошлись. null = Перов сегодня не приходит.

import { prisma } from "./prisma";
import {
  PEROV_NPC_REGION,
  PEROV_TRIALS,
  pickPerovTrialForDay,
  shouldPerovTryToday,
  destinedPerovDay,
} from "./perov";
import { getSeasonDay } from "./points-formula";
import type { Quest } from "@prisma/client";

const PEROV_BASE_CHANCE_PERCENT = 30;
const MIN_DAYS_BETWEEN_VISITS = 7;
const GUARANTEED_SEASON_DAYS_FROM = 5;
const GUARANTEED_SEASON_DAYS_TO = 18;
const DROP_THRESHOLD = 3;

export async function getOrCreatePerovTrial(playerId: string): Promise<Quest | null> {
  // 1. Уже есть OFFERED/ACTIVE Perov-квест? Возвращаем.
  const existing = await prisma.quest.findFirst({
    where: {
      playerId,
      npcRegion: PEROV_NPC_REGION,
      status: { in: ["OFFERED", "ACTIVE"] },
    },
    orderBy: { offeredAt: "desc" },
  });
  if (existing) return existing;

  // 2. Активный сезон — для определения дня сезона
  const season = await prisma.season.findFirst({
    where: { endedAt: null },
    orderBy: { startedAt: "desc" },
  });
  if (!season) return null; // нет активного сезона — Перов не приходит

  const seasonDay = getSeasonDay(season.startedAt);

  // 3. Когда был последний раз? (любой Perov-квест от этого игрока)
  const lastPerov = await prisma.quest.findFirst({
    where: { playerId, npcRegion: PEROV_NPC_REGION },
    orderBy: { offeredAt: "desc" },
  });
  if (lastPerov) {
    const daysSince =
      (Date.now() - lastPerov.offeredAt.getTime()) / (24 * 60 * 60 * 1000);
    if (daysSince < MIN_DAYS_BETWEEN_VISITS) return null;
  }

  // 4. Проверяем триггеры:
  //   a) В этом сезоне ещё ни разу не приходил И сейчас день 5-18 → ГАРАНТИЯ
  //   b) Игрок дропнул ≥3 игр за сезон → может прийти (с шансом)
  //   c) Иначе — стандартный 30% бросок (только если выполнен какой-то триггер)

  const everPerovThisSeason = !!(await prisma.quest.findFirst({
    where: {
      playerId,
      npcRegion: PEROV_NPC_REGION,
      offeredAt: { gte: season.startedAt },
    },
  }));

  // У каждого игрока СВОЙ «судьбоносный день» в окне 5-18 —
  // детерминированный по playerId + seasonId. Перов придёт именно в этот
  // день (или позже, если игрок в этот день не зашёл на карту). У разных
  // игроков выпадают разные дни → они НЕ появляются одновременно.
  const myDestinedDay = destinedPerovDay(
    playerId,
    season.id,
    GUARANTEED_SEASON_DAYS_FROM,
    GUARANTEED_SEASON_DAYS_TO,
  );
  const inMyWindow =
    seasonDay >= myDestinedDay && seasonDay <= GUARANTEED_SEASON_DAYS_TO;

  const dropsThisSeason = await prisma.game.count({
    where: {
      playerId,
      status: "DROPPED",
      completedAt: { gte: season.startedAt },
    },
  });

  const guaranteedTrigger = !everPerovThisSeason && inMyWindow;
  const dropTrigger = dropsThisSeason >= DROP_THRESHOLD;

  let shouldAppear = false;
  if (guaranteedTrigger) {
    shouldAppear = true; // гарантия
  } else if (dropTrigger) {
    // 30% дневной бросок, детерминированный
    shouldAppear = shouldPerovTryToday(playerId, PEROV_BASE_CHANCE_PERCENT);
  }

  if (!shouldAppear) return null;

  // 5. Выбираем испытание и создаём OFFERED квест
  const trial = pickPerovTrialForDay(playerId);
  const expiresAt = new Date(Date.now() + trial.durationDays * 24 * 60 * 60 * 1000);

  return await prisma.quest.create({
    data: {
      playerId,
      templateId: trial.id,
      npcRegion: PEROV_NPC_REGION,
      type: trial.type,
      title: trial.title,
      description: trial.description,
      flavor: trial.flavor,
      targetCount: trial.targetCount,
      progress: 0,
      params: JSON.stringify(trial.params),
      rewards: JSON.stringify(trial.rewards),
      status: "OFFERED",
      // expiresAt применим при принятии (accept route), не сейчас
    },
  });
}
