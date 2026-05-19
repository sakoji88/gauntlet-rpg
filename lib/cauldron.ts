// Котёл Гнилостня Лоненкова — крафт в Гнилой Кухне.
//
// За Злато варишь случайный расходник. Цена фиксированная, результат случайный —
// иногда переплатишь, иногда вытащишь что-то дорогое. Чистый гэмбл-сток Злата,
// без кулдауна (ограничитель — само Злато).

export const CAULDRON_PRICE = 25; // Злата за одну варку

// Пул варки: itemId существующего расходника + вес (чаще/реже).
export const CAULDRON_POOL: { itemId: string; weight: number }[] = [
  { itemId: "salt_pinch", weight: 14 },
  { itemId: "chamomile_tea", weight: 12 },
  { itemId: "scroll_reroll", weight: 12 },
  { itemId: "bomb_difficulty", weight: 10 },
  { itemId: "streamer_coffee", weight: 8 },
  { itemId: "new_iqos", weight: 8 },
  { itemId: "luck_potion", weight: 7 },
  { itemId: "wisdom_potion", weight: 7 },
  { itemId: "romanal_spices", weight: 7 },
  { itemId: "ny_cheesecake", weight: 7 },
  { itemId: "dushik_dumbbells", weight: 5 },
  { itemId: "basket_24_wings", weight: 5 },
  { itemId: "klops_granny_gold_tooth", weight: 2 },
  { itemId: "popov_crystal", weight: 2 },
];

// Взвешенный случайный выбор itemId из пула.
export function pickCauldronItem(): string {
  const total = CAULDRON_POOL.reduce((s, e) => s + e.weight, 0);
  let r = Math.random() * total;
  for (const e of CAULDRON_POOL) {
    r -= e.weight;
    if (r <= 0) return e.itemId;
  }
  return CAULDRON_POOL[CAULDRON_POOL.length - 1].itemId;
}
