// Шаблоны квестов от каждого NPC.
//
// Структура по NPC (8 NPC × 3 шаблона = 24 квеста):
//   STARTER  — лёгкий вводный, выдаётся гарантированно на 1-м уровне при первом заходе.
//   STORY    — глава 1 сюжетной линии NPC, гарантированно после STARTER + уровень ≥ 2.
//   SIDE     — рандомный побочный (пул), 20% шанс когда сюжетных нет.
//
// Реплики (flavor) стилизованы под характер NPC из CONCEPT.md и npc-dialogues.ts.

import type { QuestTemplate } from "./quest-types";

export const QUEST_TEMPLATES: QuestTemplate[] = [
  // ================================================================
  // 🌲 ЧАХЛЫЙ БОР — Чахлик Невмерующий
  // ================================================================
  {
    id: "chakhly_bor_starter",
    npcRegion: "chakhly-bor",
    tier: "STARTER",
    minLevel: 1,
    type: "GENRE",
    title: "Шёпот Сосен",
    description: "Пройди 1 игру в Чахлом Бору. Лес ждёт.",
    flavor:
      "...а-а-а, путник... тише, тише... возьми одну хоррор-игру и пройди её здесь... лес примет тебя, если справишься...",
    targetCount: 1,
    params: { region: "chakhly-bor" },
    rewards: { points: 4, exp: 30 },
    durationDays: 7,
  },
  {
    id: "chakhly_bor_story_1",
    npcRegion: "chakhly-bor",
    tier: "STORY",
    chapterIndex: 1,
    requiresTemplateId: "chakhly_bor_starter",
    minLevel: 2,
    type: "GENRE",
    title: "Двойная Тьма",
    description: "Пройди 2 игры в Чахлом Бору. Сосны помнят имена.",
    flavor:
      "...ты вернулся... хорошо... теперь два хоррора... один — для леса, второй — для меня... шепни их названия, когда закончишь...",
    targetCount: 2,
    params: { region: "chakhly-bor" },
    rewards: { points: 8, exp: 30, itemId: "frame_thorns" },
    durationDays: 10,
  },
  {
    id: "chakhly_bor_side_cry",
    npcRegion: "chakhly-bor",
    tier: "SIDE",
    minLevel: 1,
    type: "LORE",
    title: "Крик в Соснах",
    description: "Найди и пройди игру, в которой слышен женский крик. Сам отметь когда закончишь.",
    flavor:
      "...слышишь? оно опять кричит... женский голос... принеси мне игру, где это уже было... я хочу вспомнить...",
    targetCount: 1,
    params: {},
    rewards: { points: 6, exp: 30 },
    durationDays: 7,
  },

  // ================================================================
  // 🏰 ТЕРЕМ — Костанай Зажиточный
  // ================================================================
  {
    id: "terem_starter",
    npcRegion: "terem",
    tier: "STARTER",
    minLevel: 1,
    type: "GENRE",
    title: "Покажи Себя",
    description: "Пройди 1 игру в Тереме (RPG-регион). Покажи, что не зря пришёл.",
    flavor:
      "ХАМ! Не дыши! Ладно, ладно... возьми ОДНУ RPG и пройди мне. Покажи, что ты не безнадёжный нищеброд.",
    targetCount: 1,
    params: { region: "terem" },
    rewards: { points: 4, exp: 30 },
    durationDays: 7,
  },
  {
    id: "terem_story_1",
    npcRegion: "terem",
    tier: "STORY",
    chapterIndex: 1,
    requiresTemplateId: "terem_starter",
    minLevel: 2,
    type: "DURATION",
    title: "Достойное Вложение",
    description: "Пройди игру длительностью 30+ часов. Меньше — для холопов.",
    flavor:
      "Ну, не подвёл. Теперь — серьёзная задача. Тридцать часов. Не меньше. Я инвестирую в твоё время, докажи что оно стоит чего-то.",
    targetCount: 1,
    params: { minHours: 30 },
    rewards: { points: 10, exp: 30, itemId: "gold_frame" },
    durationDays: 14,
  },
  {
    id: "terem_side_rating_90",
    npcRegion: "terem",
    tier: "SIDE",
    minLevel: 1,
    type: "RATING",
    title: "Шедевр для Знатока",
    description: "Пройди игру с рейтингом 90+ Metacritic. Только настоящее золото.",
    flavor:
      "Эй, червь, у меня прихоть! Принеси мне ШЕДЕВР! Девяносто баллов, не меньше! Я хочу хвастаться, что мой знакомец прошёл такое.",
    targetCount: 1,
    params: { minRating: 90 },
    rewards: { points: 9, exp: 30 },
    durationDays: 10,
  },

  // ================================================================
  // 🌾 ХУТОР — Душлендор Тупиздень
  // ================================================================
  {
    id: "khutor_starter",
    npcRegion: "khutor",
    tier: "STARTER",
    minLevel: 1,
    type: "GENRE",
    title: "Первая Картоха",
    description: "Пройди 1 игру на Хуторе. Душевно так, без надрыва.",
    flavor:
      "Ой, мил человек! Поможи, а? Одну игру простенькую пройди — я тебе картохи дам! Свежей! Ну ты согласен, ага?",
    targetCount: 1,
    params: { region: "khutor" },
    rewards: { points: 4, exp: 30 },
    durationDays: 7,
  },
  {
    id: "khutor_story_1",
    npcRegion: "khutor",
    tier: "STORY",
    chapterIndex: 1,
    requiresTemplateId: "khutor_starter",
    minLevel: 2,
    type: "GENRE",
    title: "Свежий Воздух",
    description: "Пройди 3 игры на Хуторе. Простые. Душевные. Как самогон.",
    flavor:
      "Е-моё, ты вернулся! А я тут самогон гнал... Принеси ещё ТРИ игры пройти, мил человек. Совсем уж нашу деревенскую душу не забудем!",
    targetCount: 3,
    params: { region: "khutor" },
    rewards: { points: 7, exp: 30 },
    durationDays: 10,
  },
  {
    id: "khutor_side_short",
    npcRegion: "khutor",
    tier: "SIDE",
    minLevel: 1,
    type: "DURATION",
    title: "На Вечерок",
    description: "Найди игру до 4 часов и пройди её.",
    flavor:
      "Ой, у меня баран опять в колодце! Пока я его тащу — пройди чё-нить коротенькое, четыре часа, не больше! А то стемнеет!",
    targetCount: 1,
    params: { maxHours: 4 },
    rewards: { points: 5, exp: 30 },
    durationDays: 5,
  },

  // ================================================================
  // 🪙 БАЗАР — Романал Жидовский
  // ================================================================
  {
    id: "bazar_starter",
    npcRegion: "bazar",
    tier: "STARTER",
    minLevel: 1,
    type: "GENRE",
    title: "Первая Сделка",
    description: "Пройди 1 игру на Базаре. Налаживаем деловые отношения.",
    flavor:
      "Шалом, дорогой! Дельце есть — одну стратегию пройди мне, я тебе скидку устрою! Это не торговля, это — ИНВЕСТИЦИЯ в дружбу!",
    targetCount: 1,
    params: { region: "bazar" },
    rewards: { points: 4, exp: 30 },
    durationDays: 7,
  },
  {
    id: "bazar_story_1",
    npcRegion: "bazar",
    tier: "STORY",
    chapterIndex: 1,
    requiresTemplateId: "bazar_starter",
    minLevel: 2,
    type: "RATING",
    title: "Качественный Товар",
    description: "Пройди игру с рейтингом 80+. Я не торгую дрянью.",
    flavor:
      "Ах, друг ты мой золотой! Растём в качестве! Восемьдесят баллов минимум — ниже не возьму на свою полку. Это вопрос РЕПУТАЦИИ!",
    targetCount: 1,
    params: { minRating: 80 },
    rewards: { points: 8, exp: 30 },
    durationDays: 7,
  },
  {
    id: "bazar_side_strategy_2",
    npcRegion: "bazar",
    tier: "SIDE",
    minLevel: 1,
    type: "GENRE",
    title: "Двойная Сделка",
    description: "Пройди 2 игры на Базаре (стратегии / симуляторы).",
    flavor:
      "О-о-о, постоянный клиент! Две стратегии за одно посещение — это золотая жила, дорогой! Скидка ровно ноль процентов, но я тебя люблю!",
    targetCount: 2,
    params: { region: "bazar" },
    rewards: { points: 7, exp: 30 },
    durationDays: 14,
  },

  // ================================================================
  // 🎪 ТАБОР — Мистер Клопс
  // ================================================================
  {
    id: "tabor_starter",
    npcRegion: "tabor",
    tier: "STARTER",
    minLevel: 1,
    type: "GENRE",
    title: "Первое Колесо",
    description: "Пройди 1 игру в Таборе. Бубен в курсе.",
    flavor:
      "Дорогой! Иди, иди! Бубен сказал — твоя судьба здесь! Один рогалик пройди, и я тебе погадаю на медведе!",
    targetCount: 1,
    params: { region: "tabor" },
    rewards: { points: 4, exp: 30 },
    durationDays: 7,
  },
  {
    id: "tabor_story_1",
    npcRegion: "tabor",
    tier: "STORY",
    chapterIndex: 1,
    requiresTemplateId: "tabor_starter",
    minLevel: 2,
    type: "CHALLENGE",
    title: "Доверься Судьбе",
    description: "Пройди игру в Таборе на МАКСИМАЛЬНОЙ сложности. Бубен подтверждает.",
    flavor:
      "О-о-о, ты вернулся, дорогой! Карты выпали — туз, валет, медведь! Это значит МАКСИМАЛЬНАЯ сложность! Не плачь, если будет больно!",
    targetCount: 1,
    params: { region: "tabor", requireMaxDifficulty: true },
    rewards: { points: 12, exp: 30 },
    durationDays: 7,
  },
  {
    id: "tabor_side_bad_rating",
    npcRegion: "tabor",
    tier: "SIDE",
    minLevel: 1,
    type: "RATING",
    title: "Подвальный Рогалик",
    description: "Пройди roguelike/card с рейтингом ≤65. Иногда дно — это золото.",
    flavor:
      "Ах, бубен говорит — иногда мусор оказывается сокровищем! Шестьдесят пять или ниже! Это РЕЛИКВИЯ, поверь Клопсу!",
    targetCount: 1,
    params: { maxRating: 65 },
    rewards: { points: 7, exp: 30 },
    durationDays: 7,
  },

  // ================================================================
  // ⚔️ ПУСТЫРИ — Рыцарь Галемиус
  // ================================================================
  {
    id: "pustyri_starter",
    npcRegion: "pustyri",
    tier: "STARTER",
    minLevel: 1,
    type: "GENRE",
    title: "Первая Кровь",
    description: "Пройди 1 игру на Пустырях. Покажи, что не боишься боли.",
    flavor:
      "Путник. Перед тобой длинная дорога. Начни с малого — пройди одну hardcore-игру. Я буду наблюдать.",
    targetCount: 1,
    params: { region: "pustyri" },
    rewards: { points: 4, exp: 30 },
    durationDays: 7,
  },
  {
    id: "pustyri_story_1",
    npcRegion: "pustyri",
    tier: "STORY",
    chapterIndex: 1,
    requiresTemplateId: "pustyri_starter",
    minLevel: 2,
    type: "CHALLENGE",
    title: "Испытание Доблести",
    description: "Пройди игру на Пустырях на МАКСИМАЛЬНОЙ сложности.",
    flavor:
      "Я видел, ты дрался. Теперь — настоящий бой. Максимальная сложность. Без поблажек. Без жалости. Это и есть доблесть.",
    targetCount: 1,
    params: { region: "pustyri", requireMaxDifficulty: true },
    rewards: { points: 12, exp: 30 },
    durationDays: 7,
  },
  {
    id: "pustyri_side_long",
    npcRegion: "pustyri",
    tier: "SIDE",
    minLevel: 1,
    type: "DURATION",
    title: "Долгий Бой",
    description: "Пройди игру на Пустырях длительностью 15+ часов.",
    flavor:
      "Помню, в Гагарине мы шли пятнадцать дней без сна. Пройди мне игру в пятнадцать часов. И не плачь.",
    targetCount: 1,
    params: { region: "pustyri", minHours: 15 },
    rewards: { points: 9, exp: 30 },
    durationDays: 14,
  },

  // ================================================================
  // 🍳 ГНИЛАЯ КУХНЯ — Гнилостень Лоненков
  // ================================================================
  {
    id: "kukhnya_starter",
    npcRegion: "kukhnya",
    tier: "STARTER",
    minLevel: 1,
    type: "GENRE",
    title: "Первый Котёл",
    description: "Пройди 1 игру на Кухне. ¡Vamos!",
    flavor:
      "¡HOLA, AMIGO! Котёл кипит, гремлины бегают! Одно блюдо приготовь — то есть, одну игру пройди! Острый соус — за мной!",
    targetCount: 1,
    params: { region: "kukhnya" },
    rewards: { points: 4, exp: 30 },
    durationDays: 7,
  },
  {
    id: "kukhnya_story_1",
    npcRegion: "kukhnya",
    tier: "STORY",
    chapterIndex: 1,
    requiresTemplateId: "kukhnya_starter",
    minLevel: 2,
    type: "GENRE",
    title: "Двойной Котёл",
    description: "Пройди 2 игры на Кухне. Гремлины благодарны.",
    flavor:
      "¡VAMOS! Гремлин-7, отойди от соуса! Amigo, ты вернулся! Два котла, два рецепта — я доволен, гремлины тоже!",
    targetCount: 2,
    params: { region: "kukhnya" },
    rewards: { points: 8, exp: 30 },
    durationDays: 10,
  },
  {
    id: "kukhnya_side_rotten",
    npcRegion: "kukhnya",
    tier: "SIDE",
    minLevel: 1,
    type: "RATING",
    title: "Гнилой Деликатес",
    description: "Пройди игру с рейтингом ≤60. Гнилое — тоже еда.",
    flavor:
      "¡SÍ! Принеси мне gnilую игру! Шестьдесят и ниже, fermentada, marinade! Гремлины ОБОЖАЮТ дно!",
    targetCount: 1,
    params: { maxRating: 60 },
    rewards: { points: 7, exp: 30 },
    durationDays: 7,
  },

  // ================================================================
  // 👔 АТЕЛЬЕ — Портной Пеньков
  // ================================================================
  {
    id: "atelye_starter",
    npcRegion: "atelye",
    tier: "STARTER",
    minLevel: 1,
    type: "LORE",
    title: "Покажи Стиль",
    description: "Пройди ЛЮБУЮ игру и расскажи мне, насколько она была стильной. Я доверюсь.",
    flavor:
      "Душенька, я хочу узнать ТЕБЯ. Пройди что-нибудь — что угодно — и опиши мне эстетику. Я оценю твой вкус. Не подведи.",
    targetCount: 1,
    params: {},
    rewards: { points: 4, exp: 30 },
    durationDays: 7,
  },
  {
    id: "atelye_story_1",
    npcRegion: "atelye",
    tier: "STORY",
    chapterIndex: 1,
    requiresTemplateId: "atelye_starter",
    minLevel: 2,
    type: "RATING",
    title: "Эстетический Шедевр",
    description: "Пройди игру с рейтингом 85+. Только шедевры.",
    flavor:
      "Ах, твой вкус не безнадёжен! Теперь — настоящее искусство. Восемьдесят пять баллов минимум. Меньше — это позор, я плачу.",
    targetCount: 1,
    params: { minRating: 85 },
    rewards: { points: 9, exp: 30, itemId: "bronze_frame" },
    durationDays: 10,
  },
  {
    id: "atelye_side_beautiful",
    npcRegion: "atelye",
    tier: "SIDE",
    minLevel: 1,
    type: "LORE",
    title: "Изящная Игра",
    description: "Пройди визуально красивую игру (определи сам). Эстетика — это всё.",
    flavor:
      "Дорогой, мне НУЖНА красота! Найди игру с настоящей эстетикой — арт, музыка, стиль. Доверюсь твоему вкусу. Но если разочаруешь — я заплачу.",
    targetCount: 1,
    params: {},
    rewards: { points: 6, exp: 30 },
    durationDays: 10,
  },
];

// ===== Хелперы =====

export function getTemplatesForNpc(npcRegion: string): QuestTemplate[] {
  return QUEST_TEMPLATES.filter((t) => t.npcRegion === npcRegion);
}

export function getTemplateById(id: string): QuestTemplate | null {
  return QUEST_TEMPLATES.find((t) => t.id === id) ?? null;
}
