// Магазин Романала Жидовского.
//
// Что важно понимать про экономику:
//   • points (поинты) — это СЧЁТ на лидерборде. Тратить их в магазине = ронять себя
//     в рейтинге. За поинты продаётся только мощное (epic). Острый риск/реворд.
//   • gold (Злато) — мягкая валюта. Капает за прохождения/квесты, на лидерборд НЕ влияет.
//     Основная валюта магазина.
//
// СТОК (stockLimit):
//   • null      — товар бесконечный.
//   • число     — глобальный лимит на сезон, общий для ВСЕХ игроков.
//     Остаток считается так: stockLimit − (сколько таких предметов сейчас на руках
//     у всех игроков). Это корректно ТОЛЬКО для shop-эксклюзивных предметов
//     (rollWeight 0, не выдаются квестами). Для предметов с колеса stockLimit обязан
//     быть null — иначе счёт остатка будет врать.

export type ShopCurrency = "gold" | "points";

export interface ShopEntry {
  itemId: string;           // ID из ITEMS / SPECIAL_ITEMS
  currency: ShopCurrency;   // чем платим
  price: number;            // цена покупки
  sellPrice: number;        // сколько Злата вернёт Романал за продажу (0 = не выкупает)
  stockLimit: number | null; // глобальный лимит на сезон (null = бесконечно)
}

// === ВИТРИНА ===
// Пока — на существующих 25 предметах. Особые/новые предметы добавятся отдельно.
export const SHOP: ShopEntry[] = [
  // ----- Расходники (Злато) -----
  { itemId: "salt_pinch",       currency: "gold", price: 15, sellPrice: 6,  stockLimit: null },
  { itemId: "scroll_reroll",    currency: "gold", price: 20, sellPrice: 8,  stockLimit: null },
  { itemId: "bomb_difficulty",  currency: "gold", price: 25, sellPrice: 10, stockLimit: null },
  { itemId: "wisdom_potion",    currency: "gold", price: 30, sellPrice: 12, stockLimit: null },
  { itemId: "luck_potion",      currency: "gold", price: 32, sellPrice: 13, stockLimit: null },
  { itemId: "streamer_coffee",  currency: "gold", price: 38, sellPrice: 15, stockLimit: null },

  // ----- Ловушки (Злато) — сбалансированы, кулдаун броска отдельно -----
  { itemId: "rake",            currency: "gold", price: 14, sellPrice: 5,  stockLimit: null },
  { itemId: "sticky_slime",    currency: "gold", price: 18, sellPrice: 7,  stockLimit: null },
  { itemId: "rotten_shawarma", currency: "gold", price: 30, sellPrice: 12, stockLimit: null },

  // ----- Экипировка (Злато, дорого) -----
  { itemId: "stealth_cloak", currency: "gold", price: 55, sellPrice: 20, stockLimit: null },
  { itemId: "greed_ring",    currency: "gold", price: 48, sellPrice: 18, stockLimit: null },

  // ----- Мощное (за ПОИНТЫ — осознанная жертва рейтинга) -----
  { itemId: "guard_bribe",       currency: "points", price: 8,  sellPrice: 0, stockLimit: null },
  { itemId: "survivor_helmet",   currency: "points", price: 12, sellPrice: 0, stockLimit: null },
  { itemId: "speedrunner_boots", currency: "points", price: 15, sellPrice: 0, stockLimit: null },
];

// === ХЕЛПЕРЫ ===
export function getShopEntry(itemId: string): ShopEntry | null {
  return SHOP.find((e) => e.itemId === itemId) ?? null;
}

// Сколько Злата вернёт Романал за продажу этого предмета (0 — не выкупает).
export function getSellPrice(itemId: string): number {
  return getShopEntry(itemId)?.sellPrice ?? 0;
}
