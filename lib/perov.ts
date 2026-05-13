// Дух Гомодрила Перова — особый NPC, появляется случайно и даёт легендарные испытания.
//
// Призрак древнего игрока, сошедшего с ума.
// Триггеры появления:
//   1. Гарантировано 1 раз в сезон (день 5-18), если в этом сезоне ещё не приходил.
//   2. После 3+ дропов за сезон — может прийти.
//   3. Не чаще 1 раза в 7 дней на игрока.

import type { QuestTemplate } from "./quest-types";

export const PEROV_NPC_REGION = "perov";

// Шаблоны испытаний (3 варианта). При появлении выбирается один детерминированно по дню.
// Все возвращают +20 поинтов + Сосуд Перова + 50 EXP.
export const PEROV_TRIALS: QuestTemplate[] = [
  {
    id: "perov_trial_abyss_of_shame",
    npcRegion: PEROV_NPC_REGION,
    tier: "PEROV",
    minLevel: 1,
    type: "RATING",
    title: "Бездна Стыда",
    description:
      "Пройди игру с рейтингом 50 или ниже. До конца. НЕ дропать. Каждая секунда — твоё унижение.",
    flavor:
      "Хе-хе-хе... тебе будет... плохо... играй унижение, играй стыд... пятьдесят и ниже... докажи, что ты ничто...",
    targetCount: 1,
    params: { maxRating: 50 },
    rewards: { points: 20, exp: 50, itemId: "perov_vessel" },
    durationDays: 7,
  },
  {
    id: "perov_trial_echo_of_past",
    npcRegion: PEROV_NPC_REGION,
    tier: "PEROV",
    minLevel: 1,
    type: "LORE",
    title: "Эхо Прошлого",
    description:
      "Пройди игру 1990-х годов. На эмуляторе. Сегодня. По чести — отметишь когда закончишь.",
    flavor:
      "Вспомни... тогда было лучше... картриджи... электронно-лучевые... верни мне их хоть на день, путник...",
    targetCount: 1,
    params: {},
    rewards: { points: 20, exp: 50, itemId: "perov_vessel" },
    durationDays: 3,
  },
  {
    id: "perov_trial_triad_of_abyss",
    npcRegion: PEROV_NPC_REGION,
    tier: "PEROV",
    minLevel: 1,
    type: "LORE",
    title: "Триада Бездны",
    description:
      "Пройди ТРИ игры за один день в трёх разных регионах. По чести — отметишь когда выполнишь.",
    flavor:
      "Беги... беги по карте... три точки... три прохождения... один день... докажи, что ты не зря дышишь...",
    targetCount: 1,
    params: {},
    rewards: { points: 20, exp: 50, itemId: "perov_vessel" },
    durationDays: 2,
  },
];

export function getPerovTrialById(id: string): QuestTemplate | null {
  return PEROV_TRIALS.find((t) => t.id === id) ?? null;
}

// Детерминированный выбор шаблона на день
export function pickPerovTrialForDay(playerId: string, now: Date = new Date()): QuestTemplate {
  const day = now.toISOString().slice(0, 10);
  const seed = `perov:${playerId}:${day}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  return PEROV_TRIALS[Math.abs(hash) % PEROV_TRIALS.length];
}

// Детерминированный бросок 30% появления Перова в этот день.
export function shouldPerovTryToday(playerId: string, percent: number, now: Date = new Date()): boolean {
  const day = now.toISOString().slice(0, 10);
  const seed = `perov-roll:${playerId}:${day}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(hash % 100) < percent;
}
