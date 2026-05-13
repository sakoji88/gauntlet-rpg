// Каталог всех предметов Темнодушного Лета.
// Эти предметы нужно один раз залить в БД через сидер (см. scripts/seed-items.ts).
// Здесь же — данные для отображения иконок/цветов на фронте.

export type ItemCategory = "CONSUMABLE" | "EQUIPMENT" | "ARTIFACT" | "TRAP" | "COSMETIC";
export type ItemRarity = "COMMON" | "RARE" | "EPIC" | "LEGENDARY";

export interface ItemDef {
  id: string;
  name: string;
  description: string;
  category: ItemCategory;
  rarity: ItemRarity;
  iconKey: string;     // ключ для отрисовки (соответствует /public/images/items/[iconKey].png)
  effectKey?: string;  // машинный ключ эффекта
  charges?: number;
  rollWeight: number;  // больше — чаще выпадает
  isTrap?: boolean;
}

export const ITEMS: ItemDef[] = [
  // ===== РАСХОДНИКИ =====
  {
    id: "scroll_reroll",
    name: "Свиток Реролла",
    description: "Позволяет крутнуть колесо игры заново. Тратит 1 ход.",
    category: "CONSUMABLE", rarity: "COMMON",
    iconKey: "scroll", effectKey: "reroll_game",
    charges: 1, rollWeight: 20,
  },
  {
    id: "luck_potion",
    name: "Зелье Удачи",
    description: "На следующий ролл предметов — выпадает только редкое или выше.",
    category: "CONSUMABLE", rarity: "RARE",
    iconKey: "vial_gold", effectKey: "lucky_roll",
    charges: 1, rollWeight: 8,
  },
  {
    id: "wisdom_potion",
    name: "Зелье Мудрости",
    description: "На следующий ролл показывает 3 игры вместо одной — выбираешь любую.",
    category: "CONSUMABLE", rarity: "RARE",
    iconKey: "vial_blue", effectKey: "choose_of_three",
    charges: 1, rollWeight: 7,
  },
  {
    id: "bomb_difficulty",
    name: "Бомба Сложности",
    description: "Снижает требование региона на 1 ранг (например, hardcore → action).",
    category: "CONSUMABLE", rarity: "RARE",
    iconKey: "bomb", effectKey: "lower_difficulty",
    charges: 1, rollWeight: 6,
  },
  {
    id: "guard_bribe",
    name: "Подкуп Стражника",
    description: "Выйти из Тюрьмы без прохождения игры.",
    category: "CONSUMABLE", rarity: "EPIC",
    iconKey: "coin_pouch", effectKey: "escape_prison",
    charges: 1, rollWeight: 3,
  },
  {
    id: "streamer_coffee",
    name: "Кофе Стримера",
    description: "+2 хода прямо сейчас.",
    category: "CONSUMABLE", rarity: "RARE",
    iconKey: "coffee", effectKey: "add_energy_2",
    charges: 1, rollWeight: 5,
  },
  {
    id: "salt_pinch",
    name: "Щепотка Соли",
    description: "Восстановить 1 ход.",
    category: "CONSUMABLE", rarity: "COMMON",
    iconKey: "salt", effectKey: "add_energy_1",
    charges: 1, rollWeight: 15,
  },

  // ===== ЭКИПИРОВКА =====
  {
    id: "survivor_helmet",
    name: "Шлем Сурвайвора",
    description: "Раз в сезон отменяет один дроп (игра считается завершённой без штрафа).",
    category: "EQUIPMENT", rarity: "EPIC",
    iconKey: "helmet", effectKey: "prevent_drop",
    charges: 1, rollWeight: 3,
  },
  {
    id: "speedrunner_boots",
    name: "Сапоги Спидраннера",
    description: "Перемещения по карте стоят на 1 ход меньше (минимум 1).",
    category: "EQUIPMENT", rarity: "EPIC",
    iconKey: "boots", effectKey: "cheap_move",
    charges: 99, rollWeight: 3,
  },
  {
    id: "stealth_cloak",
    name: "Плащ Стелса",
    description: "Скрывает твою активную игру из публичной ленты на 48 часов.",
    category: "EQUIPMENT", rarity: "RARE",
    iconKey: "cloak", effectKey: "hide_game",
    charges: 1, rollWeight: 5,
  },
  {
    id: "greed_ring",
    name: "Кольцо Жадности",
    description: "+1 поинт за каждую игру, но -1 удача.",
    category: "EQUIPMENT", rarity: "RARE",
    iconKey: "ring", effectKey: "greed",
    charges: 99, rollWeight: 6,
  },

  // ===== АРТЕФАКТЫ =====
  {
    id: "stream_crown",
    name: "Корона Короля",
    description: "Носится текущим лидером. За убийство носителя в дуэли — +5 поинтов.",
    category: "ARTIFACT", rarity: "LEGENDARY",
    iconKey: "crown", effectKey: "leader_crown",
    charges: 99, rollWeight: 1,
  },
  {
    id: "heart_of_dark",
    name: "Сердце Тьмы",
    description: "Следующая игра на макс. сложности даст x3 поинтов. Раз в сезон.",
    category: "ARTIFACT", rarity: "LEGENDARY",
    iconKey: "heart_dark", effectKey: "triple_points",
    charges: 1, rollWeight: 1,
  },
  {
    id: "lonenkov_ladle",
    name: "Половник Гнилостня",
    description: "Раз в неделю можно \"сварить себе фарт\" — рандомный +5 к одному стату.",
    category: "ARTIFACT", rarity: "LEGENDARY",
    iconKey: "ladle", effectKey: "stat_boost_random",
    charges: 3, rollWeight: 1,
  },
  {
    id: "perov_vessel",
    name: "Сосуд Перова",
    description: "Реролл любого исхода (роллa, колеса, события). Только от Перова.",
    category: "ARTIFACT", rarity: "LEGENDARY",
    iconKey: "cartridge_ghost", effectKey: "any_reroll",
    charges: 1, rollWeight: 0, // только от Перова, не на колесе
  },

  // ===== ЛОВУШКИ =====
  {
    id: "rake",
    name: "Грабли",
    description: "Жертва получает -1 к следующему перемещению на карте.",
    category: "TRAP", rarity: "COMMON",
    iconKey: "rake", effectKey: "trap_slow",
    charges: 1, rollWeight: 15, isTrap: true,
  },
  {
    id: "sticky_slime",
    name: "Липкая Жижа",
    description: "Жертва на следующем ходе тратит +1 ход на любое действие.",
    category: "TRAP", rarity: "COMMON",
    iconKey: "slime", effectKey: "trap_extra_cost",
    charges: 1, rollWeight: 12, isTrap: true,
  },
  {
    id: "rotten_shawarma",
    name: "Тухлая Шаурма",
    description: "Жертва получает -2 поинта при следующем прохождении.",
    category: "TRAP", rarity: "RARE",
    iconKey: "shawarma", effectKey: "trap_points",
    charges: 1, rollWeight: 7, isTrap: true,
  },
  {
    id: "fake_quest",
    name: "Поддельный Квест",
    description: "Жертва видит фальшивый квест от случайного NPC.",
    category: "TRAP", rarity: "RARE",
    iconKey: "scroll_fake", effectKey: "trap_fake_quest",
    charges: 1, rollWeight: 5, isTrap: true,
  },
  {
    id: "rat",
    name: "Крыса",
    description: "Жертва -3 к следующему броску. Можно отказаться и переролить колесо.",
    category: "TRAP", rarity: "RARE",
    iconKey: "rat", effectKey: "trap_strong_slow",
    charges: 1, rollWeight: 4, isTrap: true,
  },

  // ===== КОСМЕТИКА =====
  {
    id: "bronze_frame",
    name: "Бронзовая Рамка",
    description: "Бронзовая рамка для аватарки. Навсегда в коллекции.",
    category: "COSMETIC", rarity: "COMMON",
    iconKey: "frame_bronze",
    rollWeight: 0, // косметика не выпадает с колеса — только за квесты/условия
  },
  {
    id: "gold_frame",
    name: "Золотая Рамка",
    description: "Золотая рамка для аватарки. Навсегда.",
    category: "COSMETIC", rarity: "EPIC",
    iconKey: "frame_gold",
    rollWeight: 0,
  },
  {
    id: "title_drop_champ",
    name: "Титул «Дроп-Чемпион»",
    description: "Иронический титул для тех, кто часто бросает игры.",
    category: "COSMETIC", rarity: "RARE",
    iconKey: "title",
    rollWeight: 0,
  },
  {
    id: "title_iron_will",
    name: "Титул «Железная Воля»",
    description: "За прохождение игры в Тюрьме.",
    category: "COSMETIC", rarity: "EPIC",
    iconKey: "title",
    rollWeight: 0,
  },
  {
    id: "frame_thorns",
    name: "Терновая Рамка",
    description: "Рамка для Отшельника-Страдальца.",
    category: "COSMETIC", rarity: "RARE",
    iconKey: "frame_thorns",
    rollWeight: 0,
  },
];

// === ЦВЕТА РЕДКОСТИ ===
export const RARITY_COLORS: Record<ItemRarity, { border: string; text: string; glow: string }> = {
  COMMON:    { border: "#6b6b6b", text: "#c4b5a0", glow: "transparent" },
  RARE:      { border: "#4a6ba8", text: "#8baee3", glow: "rgba(74,107,168,0.25)" },
  EPIC:      { border: "#7a4ab0", text: "#b88be3", glow: "rgba(122,74,176,0.3)" },
  LEGENDARY: { border: "#d4a574", text: "#f0c98c", glow: "rgba(212,165,116,0.4)" },
};

export const RARITY_NAMES: Record<ItemRarity, string> = {
  COMMON: "Обычное",
  RARE: "Редкое",
  EPIC: "Эпическое",
  LEGENDARY: "Легендарное",
};

export const CATEGORY_NAMES: Record<ItemCategory, string> = {
  CONSUMABLE: "Расходник",
  EQUIPMENT: "Экипировка",
  ARTIFACT: "Артефакт",
  TRAP: "Ловушка",
  COSMETIC: "Косметика",
};
