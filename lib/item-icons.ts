// Маппинг iconKey предметов → эмодзи.
// Используется как визуальный значок предмета в инвентаре, на колесе и в Кодексе.
// Когда появятся настоящие PNG в /public/images/items/<iconKey>.png —
// компоненты могут попробовать подгрузить картинку и упасть на эмодзи как fallback.

export const ITEM_ICON_EMOJI: Record<string, string> = {
  // ===== Свитки / зелья / расходники =====
  scroll: "📜",
  scroll_fake: "🗞",
  vial_gold: "🧪",
  vial_blue: "💙",
  vial_red: "🩸",
  bomb: "💣",
  coin: "🪙",
  coin_pouch: "💰",
  coin_gold: "🥇",
  coffee: "☕",
  salt: "🧂",
  tea: "🍵",
  food: "🍖",
  bowl: "🥣",
  pot: "🍲",
  pizza: "🍕",
  nuggets: "🍗",
  pills: "💊",
  cannula: "💉",
  cheesecake: "🍰",
  spices: "🌶",
  wings: "🍗",
  chicken_feet: "🐔",
  burmaldi: "❓",
  crystal: "🔮",
  mandate: "📑",
  lollipop: "🍭",
  beer: "🍺",
  vape: "🚬",
  iqos: "🚬",
  sketchbook: "📓",
  ticket: "🎫",
  analyses: "🧫",
  flashlight: "🔦",
  dumbbell: "🏋",
  tooth_gold: "🦷",
  scalp: "🪶",
  opel: "🚗",
  dongle: "🔌",
  scrap: "🪟",

  // ===== Экипировка / одежда =====
  helmet: "⛑",
  boots: "🥾",
  boots_dark: "👢",
  cloak: "🧥",
  ring: "💍",
  hoodie: "👕",
  tshirt: "👕",
  cap: "🧢",
  hood: "🧥",
  hat: "🎩",
  beard: "🧔",
  beard_goat: "🐐",

  // ===== Артефакты =====
  crown: "👑",
  heart_dark: "🖤",
  ladle: "🥄",
  cartridge_ghost: "👻",

  // ===== Ловушки =====
  rake: "🪤",
  slime: "🟢",
  shawarma: "🌯",
  rat: "🐀",
  trap_food: "🌶",
  trap_bag: "💩",
  trap_fire: "🔥",
  trap_bolt: "⚡",
  trap_curse: "☠",
  trap_wind: "🌪",
  trap_vomit: "🤮",
};

/**
 * Получить эмодзи для предмета по его iconKey. Если ключ неизвестен —
 * вернёт нейтральный знак.
 */
export function getItemEmoji(iconKey: string | null | undefined): string {
  if (!iconKey) return "❔";
  return ITEM_ICON_EMOJI[iconKey] ?? "❔";
}
