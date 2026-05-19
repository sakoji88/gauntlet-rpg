// Котёл Гнилостня Лоненкова — крафт предметов ИЗ предметов.
//
// Игрок кидает в котёл 2–3 своих предмета (они сгорают) и варит. Исход — гэмбл:
//   • Удача   — на выходе предмет НА РАНГ ВЫШЕ лучшего ингредиента.
//   • Норма   — предмет того же ранга, что лучший ингредиент (свёл барахло в одно).
//   • Провал  — ингредиенты сгорели впустую, ничего.
// Стат Удачи смещает шансы в сторону успеха и от провала.
//
// Легендарки и косметику в котёл кидать нельзя, и легендарку котёл не варит.

export const RARITY_VALUE: Record<string, number> = {
  COMMON: 1,
  RARE: 2,
  EPIC: 3,
  LEGENDARY: 4,
};

const VALUE_RARITY: Record<number, "COMMON" | "RARE" | "EPIC"> = {
  1: "COMMON",
  2: "RARE",
  3: "EPIC",
  4: "EPIC", // выше EPIC котёл не варит
};

export const MIN_INGREDIENTS = 2;
export const MAX_INGREDIENTS = 3;

export type CraftOutcome = "success" | "ok" | "fail";

export interface CraftResult {
  outcome: CraftOutcome;
  resultRarity: "COMMON" | "RARE" | "EPIC" | null; // null при провале
  chances: { fail: number; success: number; ok: number };
}

/**
 * Решает исход варки.
 * @param ingredientRarities редкости съеденных предметов
 * @param luck стат Удачи игрока
 */
export function rollCraft(ingredientRarities: string[], luck: number): CraftResult {
  const values = ingredientRarities.map((r) => RARITY_VALUE[r] ?? 1);
  const maxTier = values.length > 0 ? Math.max(...values) : 1;

  // Удача: снижает провал, повышает успех
  const fail = Math.max(8, Math.round(32 - luck));
  const success = Math.min(58, Math.round(18 + luck * 1.4));
  const ok = Math.max(0, 100 - fail - success);

  const roll = Math.random() * 100;
  let outcome: CraftOutcome;
  if (roll < fail) outcome = "fail";
  else if (roll < fail + success) outcome = "success";
  else outcome = "ok";

  if (outcome === "fail") {
    return { outcome, resultRarity: null, chances: { fail, success, ok } };
  }
  const tier = outcome === "success" ? Math.min(3, maxTier + 1) : maxTier;
  return { outcome, resultRarity: VALUE_RARITY[tier], chances: { fail, success, ok } };
}
