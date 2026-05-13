// Расчёт уровня игрока из накопленного EXP.
// Пороги из CONCEPT.md: 1→2 = 50, 2→3 = +100, 3→4 = +150, 4→5 = +250, 5+ = +100 за уровень.

import { prisma } from "./prisma";

// Кумулятивные пороги (EXP, при котором достигается данный уровень).
const LEVEL_THRESHOLDS = [
  0,   // lvl 1 (стартовый)
  50,  // lvl 2
  150, // lvl 3
  300, // lvl 4
  550, // lvl 5
];

// После уровня 5 — каждый следующий уровень требует +100 EXP.
const POST_5_INCREMENT = 100;

export function levelFromExp(exp: number): number {
  if (exp < LEVEL_THRESHOLDS[1]) return 1;
  if (exp < LEVEL_THRESHOLDS[2]) return 2;
  if (exp < LEVEL_THRESHOLDS[3]) return 3;
  if (exp < LEVEL_THRESHOLDS[4]) return 4;
  // Уровень 5 и выше
  return 5 + Math.floor((exp - LEVEL_THRESHOLDS[4]) / POST_5_INCREMENT);
}

// EXP-граница следующего уровня (для прогресс-бара UI).
export function expToNextLevel(exp: number): { current: number; needed: number } {
  const lvl = levelFromExp(exp);
  let threshold: number;
  if (lvl < 5) {
    threshold = LEVEL_THRESHOLDS[lvl]; // напр. lvl=1 → 50, lvl=2 → 150
  } else {
    threshold = LEVEL_THRESHOLDS[4] + (lvl - 4) * POST_5_INCREMENT;
  }
  const prevThreshold = lvl <= 1 ? 0 : lvl < 5 ? LEVEL_THRESHOLDS[lvl - 1] : LEVEL_THRESHOLDS[4] + (lvl - 5) * POST_5_INCREMENT;
  return {
    current: exp - prevThreshold,
    needed: threshold - prevThreshold,
  };
}

/**
 * Пересчитать уровень игрока из его EXP и сохранить в БД, если изменился.
 * Вызывать после любого начисления EXP.
 */
export async function recomputeAndPersistLevel(
  playerId: string,
): Promise<{ level: number; leveledUp: boolean; previousLevel: number }> {
  const player = await prisma.player.findUnique({
    where: { id: playerId },
    select: { level: true, exp: true },
  });
  if (!player) return { level: 1, leveledUp: false, previousLevel: 1 };

  const newLevel = levelFromExp(player.exp);
  if (newLevel === player.level) {
    return { level: newLevel, leveledUp: false, previousLevel: player.level };
  }

  // При повышении — начисляем 3 очка статов за каждый набранный уровень
  const levelsGained = newLevel - player.level;
  const statPointsBonus = Math.max(0, levelsGained) * 3;

  await prisma.player.update({
    where: { id: playerId },
    data: {
      level: newLevel,
      ...(statPointsBonus > 0
        ? { unspentStatPoints: { increment: statPointsBonus } }
        : {}),
    },
  });

  return {
    level: newLevel,
    leveledUp: newLevel > player.level,
    previousLevel: player.level,
  };
}
