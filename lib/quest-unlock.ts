// Логика "разблокировки" NPC для выдачи квестов.
//
// На 1-м уровне у игрока доступны только 2 стартовых NPC (по класс-affinity).
// Каждый следующий уровень разблокирует +1 NPC, детерминированно по seed'у игрока,
// но порядок РАЗНЫЙ между игроками. На уровне 7 все 8 NPC дают квесты.
//
// "Разблокирован NPC" = он может выдавать любые свои квесты (STARTER/STORY/SIDE).
// Если NPC закрыт — вообще ничего не предлагает.

import type { RegionId } from "./regions";

// Класс-affinity: 2 региона, где данный класс "свой" и сразу получает квесты.
const CLASS_AFFINITY: Record<string, RegionId[]> = {
  berserker: ["pustyri", "tabor"],
  loreman: ["terem", "atelye"],
  sufferer: ["chakhly-bor", "kukhnya"],
  urka: ["tabor", "bazar"],
  alchemist: ["kukhnya", "bazar"], // Терем заблокирован классом, не даём affinity туда
  bard: ["atelye", "khutor"],
};

// Дефолт для игроков без класса (на всякий случай) — нейтральные стартовые регионы.
const DEFAULT_AFFINITY: RegionId[] = ["bazar", "khutor"];

const ALL_REGIONS: RegionId[] = [
  "chakhly-bor",
  "terem",
  "khutor",
  "bazar",
  "tabor",
  "pustyri",
  "kukhnya",
  "atelye",
];

/**
 * Возвращает множество регионов, NPC которых уже "познакомились" с игроком
 * и могут выдавать квесты на текущем уровне.
 */
export function getUnlockedNpcs(
  playerLevel: number,
  playerClass: string | null,
  playerId: string,
): Set<RegionId> {
  const affinity =
    (playerClass && CLASS_AFFINITY[playerClass]) || DEFAULT_AFFINITY;
  const unlocked = new Set<RegionId>(affinity);

  // Оставшиеся регионы — разблокируются по 1 за уровень, начиная со 2-го.
  const remaining = ALL_REGIONS.filter((r) => !unlocked.has(r));

  // Детерминированная сортировка: каждому игроку — свой порядок разблокировки.
  const sorted = [...remaining].sort((a, b) => {
    return hashSeed(`${playerId}:unlock:${a}`) - hashSeed(`${playerId}:unlock:${b}`);
  });

  // На уровне N открывается (N-1) дополнительных регионов из sorted.
  // Lvl 1 → 0, lvl 2 → 1, ..., lvl 7+ → 6 (все 8 открыты).
  const extra = Math.max(0, playerLevel - 1);
  for (let i = 0; i < extra && i < sorted.length; i++) {
    unlocked.add(sorted[i]);
  }

  return unlocked;
}

/**
 * Какой следующий регион разблокируется при подъёме на новый уровень.
 * Используется для UI-уведомления "На lvl N откроется NPC X".
 */
export function getNextUnlockAtLevel(
  currentLevel: number,
  playerClass: string | null,
  playerId: string,
): RegionId | null {
  const affinity =
    (playerClass && CLASS_AFFINITY[playerClass]) || DEFAULT_AFFINITY;
  const unlockedNow = new Set<RegionId>(affinity);

  const remaining = ALL_REGIONS.filter((r) => !unlockedNow.has(r));
  const sorted = [...remaining].sort((a, b) => {
    return hashSeed(`${playerId}:unlock:${a}`) - hashSeed(`${playerId}:unlock:${b}`);
  });

  // Сейчас (currentLevel) разблокировано: extra = currentLevel - 1.
  // На следующем уровне будет extra + 1 — это индекс sorted[currentLevel - 1].
  const nextIndex = Math.max(0, currentLevel - 1);
  return sorted[nextIndex] ?? null;
}

function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}
