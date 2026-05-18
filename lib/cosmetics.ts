// Косметика — рамки аватара и титулы.
//
// Косметические предметы (category COSMETIC) лежат в каталоге items.ts.
// Здесь — их визуальное оформление: как рамка обводит аватар, как звучит титул.
//
// Рамки и титулы НАДЕВАЮТСЯ (Player.equippedFrameId / equippedTitleId) и
// отображаются везде, где виден игрок: профиль, лента, публичная страница.

export interface FrameStyle {
  name: string;
  border: string;   // цвет рамки
  glow: string;     // цвет свечения
}

// itemId рамки → стиль обводки аватара
export const FRAMES: Record<string, FrameStyle> = {
  bronze_frame: {
    name: "Бронзовая рамка",
    border: "#a06b3a",
    glow: "rgba(160,107,58,0.55)",
  },
  gold_frame: {
    name: "Золотая рамка",
    border: "#d4a574",
    glow: "rgba(212,165,116,0.7)",
  },
  frame_thorns: {
    name: "Терновая рамка",
    border: "#5a4530",
    glow: "rgba(90,69,48,0.8)",
  },
};

// itemId титула → текст, который показывается под именем
export const TITLES: Record<string, string> = {
  title_drop_champ: "Дроп-Чемпион",
  title_iron_will: "Железная Воля",
};

export function isFrameItem(itemId: string): boolean {
  return itemId in FRAMES;
}

export function isTitleItem(itemId: string): boolean {
  return itemId in TITLES;
}

export function getFrameStyle(frameId: string | null | undefined): FrameStyle | null {
  if (!frameId) return null;
  return FRAMES[frameId] ?? null;
}

export function getTitleText(titleId: string | null | undefined): string | null {
  if (!titleId) return null;
  return TITLES[titleId] ?? null;
}
