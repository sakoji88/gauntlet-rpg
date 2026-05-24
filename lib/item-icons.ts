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
  moustache: "👨",

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

// ===== Картинки предметов в /public/images/items/ =====
//
// По умолчанию из iconKey → /images/items/<iconKey>.png.
// Для некоторых предметов имена файлов отличаются (несколько разных худи,
// футболок и т.п. делят один iconKey) — для них держим оверрайды по itemId.
const ITEM_IMAGE_OVERRIDES: Record<string, string> = {
  gorgonit_hoodie: "hoodie-gorg",
  not_bad_days_hoodie: "hoodie-nbd",
  punish_tshirt: "tshirt-punish",
  usb_flashlight: "vseznanie", // «Шар Всезнания»
  sold_cheap: "coin-cheap",
};

/**
 * Вернуть URL картинки предмета. itemId важен для оверрайдов
 * (несколько предметов с одинаковым iconKey).
 */
export function getItemImageUrl(
  itemId: string | null | undefined,
  iconKey: string | null | undefined,
): string | null {
  if (itemId && ITEM_IMAGE_OVERRIDES[itemId]) {
    return `/images/items/${ITEM_IMAGE_OVERRIDES[itemId]}.png`;
  }
  if (iconKey) return `/images/items/${iconKey}.png`;
  return null;
}
