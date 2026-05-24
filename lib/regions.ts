// Данные о всех регионах Темнодушного Лета
// Источник правды для карты, экранов регионов, расчётов бонусов

export type RegionId =
  | "chakhly-bor"
  | "terem"
  | "khutor"
  | "bazar"
  | "tabor"
  | "pustyri"
  | "kukhnya"
  | "atelye"
  | "prison"
  | "perov"; // Псевдо-регион Духа Перова — не на карте, используется для PEROV-квестов

// === Условия ролла ===
// Игрок при ролле выбирает один из доступных типов условий.
// basic — широкие жанры региона, +0 поинтов сверху базы
// genre — узкие поджанры/требования, +3 поинта
// special — уникальный челлендж NPC, +7 поинтов. Шанс 15% при заходе. Отказался → больше не появится в этом сезоне.
export interface RegionCondition {
  description: string;          // Что игрок видит на карточке
  flavor: string;               // Реплика NPC в стиле персонажа
  minHours?: number;
  maxHours?: number;
  genres?: string[];            // Допустимые жанры/теги (игра должна попадать хотя бы в один)
  minRating?: number;           // Metacritic 0..100
  maxRating?: number;
  minYear?: number;
  maxYear?: number;
  maxPrice?: number;            // В долларах ($)
  requireMaxDifficulty?: boolean;
}

export interface RegionConditions {
  basic?: RegionCondition;      // У Тюрьмы — только это. У обычных регионов — широкие жанры.
  genre?: RegionCondition;      // Узкие требования (для обычных регионов)
  special?: RegionCondition;    // Уникальный челлендж NPC (15% шанс)
}

export interface RegionData {
  id: RegionId;
  name: string;
  shortName: string;
  npcName: string;
  npcTitle: string;
  genres: string[]; // Жанры игр в этом регионе
  passiveBonus: string; // Описание пассивки
  description: string; // Атмосферное описание

  // Позиция точки на карте в процентах от ширины/высоты карты
  // (0,0) — верхний левый угол, (100,100) — нижний правый
  position: { x: number; y: number };

  // Цвет акцента для региона
  accentColor: string;

  // Соседние регионы (для расчёта стоимости перехода)
  neighbors: RegionId[];

  // Условия ролла (опционально — Ателье и Тюрьма без них)
  conditions?: RegionConditions;
}

export const REGIONS: RegionData[] = [
  {
    id: "chakhly-bor",
    name: "Чахлый Бор",
    shortName: "Бор",
    npcName: "Чахлик Невмерующий",
    npcTitle: "Лесной Отшельник",
    genres: ["Horror", "Survival Horror", "Psychological Horror"],
    passiveBonus: "+1 поинт за хоррор-игры пока ты здесь",
    description: "Лес мёртвых сосен, где даже время боится зайти.",
    position: { x: 21.7, y: 18.2 },
    accentColor: "#4a5d4a",
    neighbors: ["khutor", "prison", "atelye"],
    conditions: {
      basic: {
        description: "Любой Horror / Survival Horror / Psychological Horror. От 3 часов.",
        flavor: "...возьми, что леса дают... страх — он же проводник твой...",
        genres: ["Horror", "Survival Horror", "Psychological Horror"],
        minHours: 3,
      },
      genre: {
        description: "Survival Horror или Psychological Horror. 5+ часов. Рейтинг 60–80.",
        flavor: "...глубже в чащу шагни... туда, где сосны кричат...",
        genres: ["Survival Horror", "Psychological Horror"],
        minHours: 5,
        minRating: 60,
        maxRating: 80,
      },
      special: {
        description: "Хоррор 2000–2010 года. Рейтинг ≤70. От 8 часов.",
        flavor: "...старые шорохи... игра из тех лет... когда ОНО ещё было живо... ниже семидесяти баллов... ниже... ниже...",
        genres: ["Horror", "Survival Horror", "Psychological Horror"],
        minYear: 2000,
        maxYear: 2010,
        maxRating: 70,
        minHours: 8,
      },
    },
  },
  {
    id: "terem",
    name: "Терем Зажиточного",
    shortName: "Терем",
    npcName: "Костанай Зажиточный",
    npcTitle: "Купец-Магнат",
    genres: ["RPG", "JRPG", "MMO", "CRPG"],
    passiveBonus: "+1 поинт за длинные игры (15+ ч) пока ты здесь",
    description: "Золочёный особняк на холме. Ров с осетриной. Запах потных перстней.",
    position: { x: 74.3, y: 20.2 },
    accentColor: "#a88858",
    neighbors: ["atelye", "kukhnya", "prison"],
    conditions: {
      basic: {
        description: "RPG / JRPG / MMO / CRPG. От 10 часов.",
        flavor: "Бери, голытьба. Хоть на это твоего терпения хватит.",
        genres: ["RPG", "JRPG", "MMO", "CRPG"],
        minHours: 10,
      },
      genre: {
        description: "JRPG или CRPG. 20+ часов. Рейтинг 75+.",
        flavor: "Вот это — достойное вложение времени, холоп. Длинное, рейтинговое. Как мой осетр.",
        genres: ["JRPG", "CRPG"],
        minHours: 20,
        minRating: 75,
      },
      special: {
        description: "RPG / JRPG / CRPG. Рейтинг 85+. От 40 часов.",
        flavor: "Только лучшее. Только с блеском. Сорок часов минимум — иначе позоришь Терем!",
        genres: ["RPG", "JRPG", "CRPG"],
        minRating: 85,
        minHours: 40,
      },
    },
  },
  {
    id: "khutor",
    name: "Хутор Душлендора",
    shortName: "Хутор",
    npcName: "Душлендор Тупиздень",
    npcTitle: "Селюк-Фермер",
    genres: ["Point-and-Click", "Adventure", "Visual Novel", "Casual"],
    passiveBonus: "+1 поинт за короткие игры (до 5 ч) пока ты здесь",
    description: "Кривые поля, покосившиеся сараи, лужи навоза. Слышен крик петуха.",
    position: { x: 12.3, y: 38.2 },
    accentColor: "#7a8d4a",
    neighbors: ["chakhly-bor", "bazar", "pustyri"],
    conditions: {
      basic: {
        description: "Point-and-Click / Adventure / Visual Novel / Casual. До 10 часов.",
        flavor: "Ой, бери чё попроще, мил человек. Сложное — оно колдунское.",
        genres: ["Point-and-Click", "Adventure", "Visual Novel", "Casual"],
        maxHours: 10,
      },
      genre: {
        description: "Visual Novel или Adventure. До 6 часов.",
        flavor: "Ну вон, на вечерок-два. Чай, баран в колодце пока подождёт.",
        genres: ["Visual Novel", "Adventure"],
        maxHours: 6,
      },
      special: {
        description: "Casual или Adventure. До 4 часов. Рейтинг 70+.",
        flavor: "Простая, добрая, душевная — как мой самогон. И коротенькая, чтоб не утомила!",
        genres: ["Casual", "Adventure"],
        maxHours: 4,
        minRating: 70,
      },
    },
  },
  {
    id: "bazar",
    name: "Базар Романала",
    shortName: "Базар",
    npcName: "Романал Жидовский",
    npcTitle: "Торговец-Травник",
    genres: ["Strategy", "Simulation", "Tycoon", "Trading"],
    passiveBonus: "Торгашеский нюх: +2 Злата за каждое засчитанное прохождение пока ты в Базаре",
    description: "Шатры пёстрых тканей, аромат специй, шёпот сделок.",
    position:  { x: 22.6, y: 57.3 },
    accentColor: "#c9882f",
    neighbors: ["khutor", "tabor", "prison", "atelye"],
    conditions: {
      basic: {
        description: "Strategy / Simulation / Tycoon / Trading. От 5 часов.",
        flavor: "Бери, дорогой, не за бесплатно ж торгуем... ну ладно, бери.",
        genres: ["Strategy", "Simulation", "Tycoon", "Trading"],
        minHours: 5,
      },
      genre: {
        description: "Tycoon или Trading. 15+ часов. Рейтинг 70+.",
        flavor: "О-о-о, серьёзное дело! Это инвестиция времени, дорогой!",
        genres: ["Tycoon", "Trading"],
        minHours: 15,
        minRating: 70,
      },
      special: {
        description: "Strategy / Simulation. Стоимость ≤ $5. Рейтинг 70+.",
        flavor: "Шалом! Дельце! За копейки — золото! За пять долларов — алмаз! Только сегодня!",
        genres: ["Strategy", "Simulation"],
        maxPrice: 5,
        minRating: 70,
      },
    },
  },
  {
    id: "tabor",
    name: "Табор Клопса",
    shortName: "Табор",
    npcName: "Мистер Клопс",
    npcTitle: "Цыган-Фокусник",
    genres: ["Roguelike", "Roguelite", "Card Game"],
    passiveBonus: "+5% удача при крутке колеса пока ты здесь",
    description: "Кибитки, костры, медведь на цепи. Кто-то поёт под бубен.",
    position: { x: 48.4, y: 80.6 },
    accentColor: "#a85a3a",
    neighbors: ["bazar", "pustyri", "kukhnya", "prison"],
    conditions: {
      basic: {
        description: "Roguelike / Roguelite / Card Game. От 5 часов.",
        flavor: "Эй-эй, судьба крутит! Бери, что выпадет, не плачь!",
        genres: ["Roguelike", "Roguelite", "Card Game"],
        minHours: 5,
      },
      genre: {
        description: "Roguelike. 10+ часов. Рейтинг 75+.",
        flavor: "Карты говорят — это твоя игра! Бубен подтверждает! Медведь кивает! Наверное.",
        genres: ["Roguelike"],
        minHours: 10,
        minRating: 75,
      },
      special: {
        description: "Roguelike или Card Game. С 2018 года. Рейтинг 80+. От 15 часов.",
        flavor: "О-о-о, СВЕЖАЯ судьба! Бубен прыгает, медведь танцует! Игра — золотая! После двух тысяч восемнадцатого, не раньше!",
        genres: ["Roguelike", "Card Game"],
        minYear: 2018,
        minRating: 80,
        minHours: 15,
      },
    },
  },
  {
    id: "pustyri",
    name: "Пустыри Галемиуса",
    shortName: "Пустыри",
    npcName: "Рыцарь Галемиус",
    npcTitle: "Странник из Гагарина",
    genres: ["Souls-like", "Action", "Fighting", "Beat'em up"],
    passiveBonus: "+1 поинт за hardcore-игры пока ты здесь",
    description: "Степи разорения. Ржавые ДК, скелеты, ветер с пылью.",
    position: { x: 23.7, y: 82.3 },
    accentColor: "#7a4a3a",
    neighbors: ["khutor", "tabor"],
    conditions: {
      basic: {
        description: "Souls-like / Action / Fighting / Beat'em up. От 8 часов.",
        flavor: "Возьми. И не плачь, когда заплачешь.",
        genres: ["Souls-like", "Action", "Fighting", "Beat'em up"],
        minHours: 8,
      },
      genre: {
        description: "Souls-like или Fighting. 15+ часов. На максимальной сложности.",
        flavor: "Без боли — без чести. Максималка. Иначе — пшёл вон.",
        genres: ["Souls-like", "Fighting"],
        minHours: 15,
        requireMaxDifficulty: true,
      },
      special: {
        description: "Souls-like. Рейтинг 80+. От 20 часов. На максимальной сложности.",
        flavor: "Испытание доблести. Только Souls-like. Только высокий рейтинг. Только до конца. И только — на максималке.",
        genres: ["Souls-like"],
        minRating: 80,
        minHours: 20,
        requireMaxDifficulty: true,
      },
    },
  },
  {
    id: "kukhnya",
    name: "Гнилая Кухня",
    shortName: "Кухня",
    npcName: "Гнилостень Лоненков",
    npcTitle: "Повар Тёмной Армии",
    genres: ["Cooking", "Crafting", "Survival", "Farming"],
    passiveBonus: "Доступ к крафту зелий пока ты здесь",
    description: "Дым, пар, бульканье котлов. Кто-то орёт по-испански.",
    position: { x: 75.6, y: 76.9 },
    accentColor: "#5a7a4a",
    neighbors: ["terem", "tabor", "atelye"],
    conditions: {
      basic: {
        description: "Cooking / Crafting / Survival / Farming. От 8 часов.",
        flavor: "¡Vamos, amigo! Бери, режь, кипяти! Marinate!",
        genres: ["Cooking", "Crafting", "Survival", "Farming"],
        minHours: 8,
      },
      genre: {
        description: "Survival или Farming. 20+ часов. Рейтинг 70+.",
        flavor: "Долгий рецепт! Терпение! Aroma! ¡Sí!",
        genres: ["Survival", "Farming"],
        minHours: 20,
        minRating: 70,
      },
      special: {
        description: "Cooking или Survival. Рейтинг ≤65. От 15 часов.",
        flavor: "¡Una receta especial! Гнилая, fermentada, долгая! Гремлины такое обожают! Осилишь — ты повар!",
        genres: ["Cooking", "Survival"],
        maxRating: 65,
        minHours: 15,
      },
    },
  },
  {
    id: "atelye",
    name: "Ателье Пенькова",
    shortName: "Ателье",
    npcName: "Портной Пеньков",
    npcTitle: "Местный портной — шарит за дрип",
    genres: ["Shooter", "FPS", "Tactical Shooter", "Hero Shooter", "Battle Royale"],
    passiveBonus: "Роллы со вкусом пороха. Шарящий портной, базар.",
    description: "Скромная мастерская — верстак, обрезки, грубая шерсть. Пеньков шьёт и тихо ругается.",
    position: { x: 80.2, y: 48.3 },
    accentColor: "#a8588a",
    neighbors: ["terem", "kukhnya", "chakhly-bor", "bazar"],
    conditions: {
      basic: {
        description: "Shooter / FPS / Tactical / Battle Royale. От 5 часов.",
        flavor: "ну го пострелять. соус должен быть, не как соевые петухи.",
        genres: ["Shooter", "FPS", "Tactical Shooter", "Hero Shooter", "Battle Royale"],
        minHours: 5,
      },
      genre: {
        description: "FPS или Tactical Shooter. 12+ часов.",
        flavor: "оч здравая авантюра, базар. долгая, со стилем — не торопись, чувак.",
        genres: ["FPS", "Tactical Shooter"],
        minHours: 12,
      },
      special: {
        description: "Shooter / FPS. Рейтинг 80+. На максимальной сложности.",
        flavor: "эт тир 1 ваще, базар. макс сложность, иначе питуууух — ну ты сам понимаешь.",
        genres: ["Shooter", "FPS", "Tactical Shooter"],
        minRating: 80,
        requireMaxDifficulty: true,
      },
    },
  },
  // Тюрьма — особое место, не регион в обычном смысле
  {
    id: "prison",
    name: "Тюрьма",
    shortName: "Тюрьма",
    npcName: "Стражник",
    npcTitle: "Молчаливый Охранник",
    genres: ["Любая 6+ часов с оценкой 1-60 на Metacritic"],
    passiveBonus: "Здесь нельзя двигаться. Пройди тюремную игру чтобы выйти.",
    description: "Каменный мешок в центре мира. Сюда попадают за дроп.",
    position: { x: 50.2, y: 38.7 },
    accentColor: "#6b1a1a",
    neighbors: [], // Своих "соседей" у тюрьмы нет — переход куда угодно стоит 2 хода (после освобождения).
    conditions: {
      basic: {
        description: "Любая игра. 6+ часов. Рейтинг 1–60 Metacritic.",
        flavor: "*Стражник кивает на доску с правилами и тяжело молчит.*",
        minHours: 6,
        maxRating: 60,
      },
    },
  },
];

// Шанс выпадения особого условия NPC (15%).
// Детерминированно по (playerId + regionId + день) — переход на карту и обратно не помогает.
// Каждый день у каждого региона — фиксированный результат «настроения NPC».
export const SPECIAL_CHANCE_PERCENT = 8;

export function shouldOfferSpecial(playerId: string, regionId: string, now: Date = new Date()): boolean {
  const day = now.toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
  const seed = `${playerId}:${regionId}:${day}`;
  // Простой строковый хеш → стабильное число
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  const bucket = Math.abs(hash % 100);
  return bucket < SPECIAL_CHANCE_PERCENT;
}

// Должен ли NPC сегодня предложить квест? Детерминированно по дню.
// baseChance / boostedChance — % шанса. boosted применяется если игрок недавно завершил квест от этого NPC.
export function shouldOfferQuest(
  playerId: string,
  regionId: string,
  chancePercent: number,
  now: Date = new Date(),
): boolean {
  const day = now.toISOString().slice(0, 10);
  const seed = `quest:${playerId}:${regionId}:${day}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  const bucket = Math.abs(hash % 100);
  return bucket < chancePercent;
}

// Хелпер: получить регион по id
export function getRegionById(id: string | null): RegionData | null {
  if (!id) return null;
  return REGIONS.find((r) => r.id === id) ?? null;
}

// === СТОИМОСТЬ ПЕРЕМЕЩЕНИЯ ===
// Цена в ходах — по hard-coded карте соседства (CLOSE_NEIGHBORS).
// Списки neighbors в самих RegionData оставлены для совместимости с другими местами,
// но НЕ используются для расчёта цены (там были «слишком щедрые» соседи типа
// Ателье↔Чахлый Бор, которые на карте находятся в противоположных углах).
//
//   соседи (в этой карте) → 1 ход
//   всё остальное          → 2 хода
//
// Кольцо вокруг карты:
//   Бор — Хутор — Базар — Пустыри — Табор — Кухня — Ателье — Терем
//   с замыканием Терем–Ателье (правая сторона), Бор отдельный «тупик» сверху-слева,
//   Хутор тоже связан с Пустырями (вертикально через болото).
const CLOSE_NEIGHBORS: Record<string, string[]> = {
  "chakhly-bor": ["khutor"],
  khutor:        ["chakhly-bor", "bazar", "pustyri"],
  bazar:         ["khutor", "pustyri", "tabor"],
  pustyri:       ["bazar", "tabor", "khutor"],
  tabor:         ["pustyri", "bazar", "kukhnya"],
  kukhnya:       ["tabor", "atelye"],
  atelye:        ["kukhnya", "terem"],
  terem:         ["atelye"],
};

export function areClose(fromId: string, toId: string): boolean {
  const list = CLOSE_NEIGHBORS[fromId];
  if (!list) return false;
  return list.includes(toId);
}

// Хелпер: можно ли переместиться из A в B
export function canMoveBetween(fromId: string, toId: string): {
  canMove: boolean;
  cost: number; // 1 (близкие соседи) или 2 (всё остальное)
  reason?: string;
} {
  const from = getRegionById(fromId);
  const to = getRegionById(toId);

  if (!from || !to) {
    return { canMove: false, cost: 0, reason: "Регион не найден" };
  }

  if (fromId === toId) {
    return { canMove: false, cost: 0, reason: "Ты уже здесь" };
  }

  if (toId === "prison") {
    return { canMove: false, cost: 0, reason: "В Тюрьму нельзя пойти добровольно" };
  }

  const cost = areClose(fromId, toId) ? 1 : 2;
  return { canMove: true, cost };
}
