// Общие типы квестовой системы.
// Quest enum'ы зеркалят значения в Prisma (но импортить из @prisma/client их не обязательно тут —
// строковые литералы совпадают).

import type { RegionId } from "./regions";

export type QuestType = "GENRE" | "DURATION" | "RATING" | "CHALLENGE" | "LORE" | "IRL";

export type QuestStatus =
  | "OFFERED"
  | "ACTIVE"
  | "COMPLETED"
  | "DECLINED"
  | "EXPIRED";

// Параметры трекинга — сохраняются в Quest.params как JSON.
// Не все поля обязательны: для разных типов используются разные подмножества.
export interface QuestParams {
  // Для GENRE: игра должна быть в этом регионе (или с этим жанром в тегах,
  // но MVP — проверяем по region)
  region?: RegionId;

  // Для DURATION
  minHours?: number;
  maxHours?: number;

  // Для RATING
  minRating?: number;
  maxRating?: number;

  // Для CHALLENGE
  requireMaxDifficulty?: boolean;
}

// Награды — сохраняются в Quest.rewards как JSON
export interface QuestRewards {
  points: number;
  exp: number;
  itemId?: string; // ID предмета из lib/items.ts (опционально)
}

// Категория квеста — определяет логику выдачи
// PEROV — особые испытания от Духа Гомодрила Перова, появляются случайно.
export type QuestTier = "STARTER" | "STORY" | "SIDE" | "PEROV";

// Шаблон квеста — описывает что NPC может выдать.
// Реальный Quest (Prisma) создаётся из шаблона при выдаче.
export interface QuestTemplate {
  id: string;                       // Уникальный ID шаблона, напр. "chakhly_bor_starter"
  npcRegion: RegionId;              // Кто выдаёт
  tier: QuestTier;                  // STARTER / STORY / SIDE

  // Для STORY: позиция в сюжетной линии этого NPC (1, 2, 3, ...)
  // Для STARTER: всегда отсутствует или 0.
  chapterIndex?: number;

  // ID предыдущего шаблона в цепочке, который должен быть COMPLETED, прежде чем этот станет доступен.
  // Для STARTER: отсутствует. Для STORY ch.1: указывает STARTER. Для ch.2: указывает ch.1.
  requiresTemplateId?: string;

  // Минимальный уровень игрока (default 1)
  minLevel?: number;

  type: QuestType;
  title: string;                    // Краткое название
  description: string;              // Что нужно сделать
  flavor: string;                   // Реплика NPC при выдаче

  targetCount: number;
  params: QuestParams;
  rewards: QuestRewards;
  durationDays: number;
}

// Хелпер для безопасного парсинга JSON-полей
export function parseQuestParams(raw: string | null): QuestParams {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export function parseQuestRewards(raw: string): QuestRewards {
  try {
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof parsed.points === "number" &&
      typeof parsed.exp === "number"
    ) {
      return parsed as QuestRewards;
    }
  } catch {
    // ignore
  }
  return { points: 0, exp: 0 };
}

export function parseDeclinedQuestCooldowns(raw: string | null): Record<string, string> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null) {
      const result: Record<string, string> = {};
      for (const [k, v] of Object.entries(parsed)) {
        if (typeof v === "string") result[k] = v;
      }
      return result;
    }
  } catch {
    // ignore
  }
  return {};
}
