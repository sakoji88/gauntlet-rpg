// Лёгкие одношаговые диалоги с NPC.
// Случайно появляются при заходе в регион (15% шанс, детерминированный по дню).
// Каждый диалог — один вопрос NPC + 2 варианта ответа, каждый меняет npcAttitudes.
//
// Один диалог проигрывается каждому игроку максимум 1 раз — id запоминается в Player.seenDialogues.

import type { RegionId } from "./regions";

export interface DialogueChoice {
  text: string;            // что отвечает игрок
  attitudeDelta: number;   // +/- к отношению NPC
  response: string;        // короткая реакция NPC
}

export interface DialogueTemplate {
  id: string;
  npcRegion: RegionId;
  prompt: string;          // что говорит NPC
  choices: DialogueChoice[];
}

export const DIALOGUES: DialogueTemplate[] = [
  // ===== ЧАХЛЫЙ БОР — Чахлик =====
  {
    id: "chakhly_bor_d1",
    npcRegion: "chakhly-bor",
    prompt: "...тс-с-с... ты слышишь шёпот? он зовёт тебя из чащи...",
    choices: [
      { text: "Слышу", attitudeDelta: +5, response: "...значит, ты один из нас... хе-хе..." },
      { text: "Ничего не слышу", attitudeDelta: -5, response: "...глухой... жаль..." },
    ],
  },
  {
    id: "chakhly_bor_d2",
    npcRegion: "chakhly-bor",
    prompt: "...подари мне один волос с твоей головы... для амулета...",
    choices: [
      { text: "Возьми", attitudeDelta: +10, response: "...ты добр... хе-хе... теперь часть тебя моя..." },
      { text: "Отстань, дед", attitudeDelta: -10, response: "...ты пожалеешь... в темноте..." },
    ],
  },

  // ===== ТЕРЕМ — Костанай =====
  {
    id: "terem_d1",
    npcRegion: "terem",
    prompt: "А ну-ка, поклонись Хозяину Терема, червяк.",
    choices: [
      { text: "Кланяюсь", attitudeDelta: +5, response: "Хех. Уже умнее, чем выглядишь." },
      { text: "Сам кланяйся", attitudeDelta: -10, response: "ХАМ! Я запомню!" },
    ],
  },
  {
    id: "terem_d2",
    npcRegion: "terem",
    prompt: "Похвали мою бороду. Только честно — я отличу лесть.",
    choices: [
      { text: "Прекрасна, как у патриарха", attitudeDelta: +10, response: "Знал, что ты не безнадёжен." },
      { text: "Воняет селёдкой", attitudeDelta: -15, response: "ВОН! ВОН! ВОН ИЗ ТЕРЕМА!" },
    ],
  },

  // ===== ХУТОР — Душлендор =====
  {
    id: "khutor_d1",
    npcRegion: "khutor",
    prompt: "Здарова! Будешь самогона глоточек, мил человек?",
    choices: [
      { text: "Конечно, наливай", attitudeDelta: +10, response: "Дюже добро! Свой человек!" },
      { text: "Не, не пью", attitudeDelta: -5, response: "Эх... ну как знаешь..." },
    ],
  },
  {
    id: "khutor_d2",
    npcRegion: "khutor",
    prompt: "Слухай, баран мой опять в колодец сиганул. Поможешь достать?",
    choices: [
      { text: "Помогу", attitudeDelta: +10, response: "Спаси-и-ибо! Я тебя люблю!" },
      { text: "Не моя проблема", attitudeDelta: -10, response: "Эх... а я уж надеялся..." },
    ],
  },

  // ===== БАЗАР — Романал =====
  {
    id: "bazar_d1",
    npcRegion: "bazar",
    prompt: "Ах, дорогой! Купи у меня шафран — для тебя СКИДКА!",
    choices: [
      { text: "Беру!", attitudeDelta: +5, response: "Шалом! Ты — мой золотой клиент!" },
      { text: "Дороговато", attitudeDelta: -5, response: "Эх... скряга. Но я тебя всё равно люблю. Меньше." },
    ],
  },
  {
    id: "bazar_d2",
    npcRegion: "bazar",
    prompt: "Угадай мой возраст, друг. По чести!",
    choices: [
      { text: "Лет сорок?", attitudeDelta: +10, response: "О-о-о! У тебя глаз есть! Комплимент!" },
      { text: "Под сотню", attitudeDelta: -10, response: "...я в шоке от твоего вкуса." },
    ],
  },

  // ===== ТАБОР — Клопс =====
  {
    id: "tabor_d1",
    npcRegion: "tabor",
    prompt: "Дай руку, дорогой! Погадаю по линиям судьбы!",
    choices: [
      { text: "Гадай", attitudeDelta: +10, response: "О-о-о! Линия удачи — длинная! Ты везунчик!" },
      { text: "Не верю в это", attitudeDelta: -5, response: "Зря, дорогой, зря. Бубен обижается." },
    ],
  },
  {
    id: "tabor_d2",
    npcRegion: "tabor",
    prompt: "Медведь голодный. Покорми его улыбкой?",
    choices: [
      { text: "Улыбаюсь медведю", attitudeDelta: +10, response: "Хороший человек! Медведь доволен!" },
      { text: "Без шуток", attitudeDelta: -5, response: "Серый ты человек. Серый." },
    ],
  },

  // ===== ПУСТЫРИ — Галемиус =====
  {
    id: "pustyri_d1",
    npcRegion: "pustyri",
    prompt: "Чтишь ли ты память Гагарина, путник?",
    choices: [
      { text: "Чту", attitudeDelta: +10, response: "Брат. Земля помнит таких как мы." },
      { text: "Не знаю что это", attitudeDelta: -10, response: "Невежда. Иди читай Википедию." },
    ],
  },
  {
    id: "pustyri_d2",
    npcRegion: "pustyri",
    prompt: "Видишь пыль на горизонте? Это память Бездны.",
    choices: [
      { text: "Вижу. Тяжело.", attitudeDelta: +5, response: "Ты чувствуешь. Это хорошо." },
      { text: "Ничего не вижу", attitudeDelta: 0, response: "Слепые мы все. Иногда." },
    ],
  },

  // ===== ГНИЛАЯ КУХНЯ — Гнилостень =====
  {
    id: "kukhnya_d1",
    npcRegion: "kukhnya",
    prompt: "¡Amigo! Прибавишь чили хабанеро в этот соус? Он трус!",
    choices: [
      { text: "Прибавлю", attitudeDelta: +10, response: "¡VAMOS! Ты — повар! Я узнал в тебе brother!" },
      { text: "Хватит уже остроты", attitudeDelta: -5, response: "Mucho трус. Без огня нет жизни." },
    ],
  },
  {
    id: "kukhnya_d2",
    npcRegion: "kukhnya",
    prompt: "Гремлин-3 опять перепутал чили хабанеро с обычным! Накажешь?",
    choices: [
      { text: "Накажу", attitudeDelta: +5, response: "¡Sí! Дисциплина! Гремлин-3, на колени!" },
      { text: "Не буду, он маленький", attitudeDelta: -5, response: "...нежный какой. Это кухня, не детский сад." },
    ],
  },

  // ===== АТЕЛЬЕ — Пеньков =====
  {
    id: "atelye_d1",
    npcRegion: "atelye",
    prompt: "Что у тебя за обувь? Опиши.",
    choices: [
      { text: "Лучшее, что было в шкафу", attitudeDelta: +5, response: "Хех! Тщеславие — это уже искусство!" },
      { text: "Просто кеды, какая разница", attitudeDelta: -10, response: "О, ужас... отойди, ты пачкаешь мне пол." },
    ],
  },
  {
    id: "atelye_d2",
    npcRegion: "atelye",
    prompt: "Срочный вопрос — индиго или ультрамарин для финального штриха?",
    choices: [
      { text: "Индиго", attitudeDelta: +5, response: "О-о-о, у тебя ЕСТЬ вкус! Спасён мой манекен!" },
      { text: "Это одно и то же", attitudeDelta: -15, response: "Я с тобой больше не общаюсь. Уходи." },
    ],
  },
];

// === ХЕЛПЕРЫ ===

export function getDialoguesForNpc(npcRegion: string): DialogueTemplate[] {
  return DIALOGUES.filter((d) => d.npcRegion === npcRegion);
}

export function getDialogueById(id: string): DialogueTemplate | null {
  return DIALOGUES.find((d) => d.id === id) ?? null;
}

// Уровни отношения для отображения
export type AttitudeLevel = "hostile" | "cold" | "neutral" | "friendly" | "devoted";

export function attitudeLevel(value: number): AttitudeLevel {
  if (value <= -30) return "hostile";
  if (value < -5) return "cold";
  if (value <= 5) return "neutral";
  if (value < 30) return "friendly";
  return "devoted";
}

export const ATTITUDE_LABELS: Record<AttitudeLevel, string> = {
  hostile: "Враждебен",
  cold: "Холоден",
  neutral: "Нейтрален",
  friendly: "Расположен",
  devoted: "Предан",
};

export const ATTITUDE_COLORS: Record<AttitudeLevel, string> = {
  hostile: "#b85a5a",
  cold: "#8a8a9a",
  neutral: "#a0a0a0",
  friendly: "#9abf6e",
  devoted: "#d4a574",
};

// Парсеры JSON-полей
export function parseAttitudes(raw: string | null): Record<string, number> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      const result: Record<string, number> = {};
      for (const [k, v] of Object.entries(parsed)) {
        if (typeof v === "number") result[k] = v;
      }
      return result;
    }
  } catch {
    // ignore
  }
  return {};
}

export function parseSeenDialogues(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((x: unknown): x is string => typeof x === "string");
    }
  } catch {
    // ignore
  }
  return [];
}
