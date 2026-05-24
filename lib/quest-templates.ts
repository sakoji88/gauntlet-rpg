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

  // ================================================================
  // ★★★ ОСОБЫЕ КВЕСТЫ (SIDE/LORE) — серии и тематические задания.
  // Игры не привязаны к стандартным условиям региона: игрок сам решает,
  // подходит ли тайтл, и отмечает выполнение вручную.
  // ================================================================

  // 🌲 ЧАХЛЫЙ БОР — серии хоррора
  {
    id: "chakhly_bor_side_silent_hill",
    npcRegion: "chakhly-bor",
    tier: "SIDE",
    minLevel: 1,
    type: "LORE",
    title: "Тишина Холма",
    description: "Пройди любую игру серии Silent Hill (любая часть, ремейк или ремастер).",
    flavor: "...тише... ты слышал? сирена... иди туда, где туман съел дороги... вернись и расскажи мне...",
    targetCount: 1,
    params: {},
    rewards: { points: 8, exp: 35 },
    durationDays: 14,
  },
  {
    id: "chakhly_bor_side_resident_evil",
    npcRegion: "chakhly-bor",
    tier: "SIDE",
    minLevel: 1,
    type: "LORE",
    title: "Зло Поселилось",
    description: "Пройди любую часть Resident Evil (классику или ремейк).",
    flavor: "...мертвечина пахнет так же, как и сто лет назад... найди игру про неё, окунись... и не теряй патроны...",
    targetCount: 1,
    params: {},
    rewards: { points: 8, exp: 35 },
    durationDays: 14,
  },
  {
    id: "chakhly_bor_side_amnesia",
    npcRegion: "chakhly-bor",
    tier: "SIDE",
    minLevel: 2,
    type: "LORE",
    title: "Забытое Имя",
    description: "Пройди любую часть Amnesia или SOMA. Запомни — лес помнит тех, кто помнил себя.",
    flavor: "...не помнишь, кто ты? хорошо... игра поможет... главное — не смотри назад...",
    targetCount: 1,
    params: {},
    rewards: { points: 9, exp: 35 },
    durationDays: 14,
  },

  // 🏰 ТЕРЕМ — большие RPG-серии
  {
    id: "terem_side_elder_scrolls",
    npcRegion: "terem",
    tier: "SIDE",
    minLevel: 2,
    type: "LORE",
    title: "Свитки Древних",
    description: "Зароллить и пройти любую игру серии The Elder Scrolls (Morrowind, Oblivion, Skyrim, ESO).",
    flavor:
      "ХАМ, послушай. The Elder Scrolls — это КЛАССА. Пройди любую — Морровинд, Обливион, Скайрим, ESO — мне всё равно. Главное — почувствуй богатство.",
    targetCount: 1,
    params: {},
    rewards: { points: 10, exp: 40 },
    durationDays: 21,
  },
  {
    id: "terem_side_dragon_age",
    npcRegion: "terem",
    tier: "SIDE",
    minLevel: 2,
    type: "LORE",
    title: "Век Драконов",
    description: "Пройди любую часть Dragon Age (Origins, 2, Inquisition, Veilguard).",
    flavor: "Драконы. Политика. Романы с эльфами. Всё, как у настоящих благородных. Бери и проходи.",
    targetCount: 1,
    params: {},
    rewards: { points: 9, exp: 35 },
    durationDays: 21,
  },
  {
    id: "terem_side_witcher",
    npcRegion: "terem",
    tier: "SIDE",
    minLevel: 2,
    type: "LORE",
    title: "Белый Волк",
    description: "Пройди любую часть The Witcher (1, 2 или 3).",
    flavor: "Геральт — мой троюродный... ну почти. Серьёзная вещь. Проходи, инвестируй время. Третий — лучший, но первый — для эстетов.",
    targetCount: 1,
    params: {},
    rewards: { points: 10, exp: 40 },
    durationDays: 21,
  },

  // 🌾 ХУТОР — короткие и душевные
  {
    id: "khutor_side_stardew",
    npcRegion: "khutor",
    tier: "SIDE",
    minLevel: 1,
    type: "LORE",
    title: "Хутор Долины",
    description: "Поиграй в Stardew Valley или Sun Haven — заведи ферму, поживи в покое.",
    flavor: "Ой, мил человек, есть игра — там тоже хутор, как мой! Морковки сажают, баранов пасут. Ты глянь, может, у них самогон лучше моего!",
    targetCount: 1,
    params: {},
    rewards: { points: 6, exp: 30 },
    durationDays: 14,
  },
  {
    id: "khutor_side_visual_novel",
    npcRegion: "khutor",
    tier: "SIDE",
    minLevel: 1,
    type: "LORE",
    title: "Книга Без Картинок",
    description: "Пройди любую visual novel (Doki Doki, VA-11 Hall-A, Steins;Gate, Phoenix Wright и т.п.).",
    flavor: "Ну вот, говорят — игра, а сама КНИГА! Сидишь, читаешь, кнопочки тычешь. Это ж для самой души! Я пока баран в колодце вытащу.",
    targetCount: 1,
    params: {},
    rewards: { points: 7, exp: 30 },
    durationDays: 10,
  },

  // 🪙 БАЗАР — стратегии и менеджмент
  {
    id: "bazar_side_civilization",
    npcRegion: "bazar",
    tier: "SIDE",
    minLevel: 2,
    type: "LORE",
    title: "Ещё Один Ход",
    description: "Сыграй и доведи партию до конца в любой части Civilization (или Humankind, Old World).",
    flavor:
      "Шалом! Цивилизация — это ИМПЕРИЯ, дорогой! Один ход, ещё один ход, и солнце взошло. Доиграй мне партию до победы — научный, культурный, военный — мне всё равно, мы тут торгуем!",
    targetCount: 1,
    params: {},
    rewards: { points: 9, exp: 35 },
    durationDays: 21,
  },
  {
    id: "bazar_side_factorio",
    npcRegion: "bazar",
    tier: "SIDE",
    minLevel: 2,
    type: "LORE",
    title: "Конвейерный Барин",
    description: "Поиграй в Factorio, Satisfactory или Dyson Sphere Program — построй фабрику мечты.",
    flavor: "О-о-о, ИНДУСТРИЯ! Конвейеры, роботы, дым из труб! Это золото, дорогой! Построй мне завод, я приду на экскурсию!",
    targetCount: 1,
    params: {},
    rewards: { points: 8, exp: 35 },
    durationDays: 21,
  },

  // 🎪 ТАБОР — рогалики и карточные
  {
    id: "tabor_side_balatro",
    npcRegion: "tabor",
    tier: "SIDE",
    minLevel: 1,
    type: "LORE",
    title: "Безумный Покер",
    description: "Пройди один забег в Balatro, Slay the Spire, Monster Train или Inscryption.",
    flavor: "Карты, карты, карты! Бубен подсказал — попробуй! Один забег, до победы или до смерти — судьба сама решит!",
    targetCount: 1,
    params: {},
    rewards: { points: 8, exp: 35 },
    durationDays: 14,
  },
  {
    id: "tabor_side_isaac",
    npcRegion: "tabor",
    tier: "SIDE",
    minLevel: 1,
    type: "LORE",
    title: "Слёзы Подвала",
    description: "Победи финального босса в Binding of Isaac (любой), Hades или Dead Cells.",
    flavor:
      "Дорогой! Бубен ОРЁТ! Залезь в подвал, найди босса и ПОБЕДИ. Один раз. Главное — не плачь, когда придётся начинать заново. Заново. Опять заново.",
    targetCount: 1,
    params: {},
    rewards: { points: 10, exp: 40 },
    durationDays: 14,
  },

  // ⚔️ ПУСТЫРИ — souls и hard
  {
    id: "pustyri_side_dark_souls",
    npcRegion: "pustyri",
    tier: "SIDE",
    minLevel: 2,
    type: "LORE",
    title: "Тёмная Душа",
    description: "Пройди любую часть Dark Souls (1, 2, 3, Demon's Souls, Bloodborne, Elden Ring, Sekiro).",
    flavor:
      "Путник. Все — Dark Souls, Bloodborne, Sekiro, Elden Ring. Бери ОДНУ. Иди до конца. И не плачь, когда заплачешь.",
    targetCount: 1,
    params: {},
    rewards: { points: 12, exp: 45 },
    durationDays: 28,
  },
  {
    id: "pustyri_side_devil_may_cry",
    npcRegion: "pustyri",
    tier: "SIDE",
    minLevel: 2,
    type: "LORE",
    title: "Стиль Демона",
    description: "Пройди любую часть Devil May Cry, Bayonetta, Metal Gear Rising или Ninja Gaiden.",
    flavor: "Стиль — это доблесть. Бьёшь — красиво. Парируешь — красиво. Сдыхаешь — тоже красиво. Бери и докажи.",
    targetCount: 1,
    params: {},
    rewards: { points: 9, exp: 35 },
    durationDays: 14,
  },
  {
    id: "pustyri_side_fighting",
    npcRegion: "pustyri",
    tier: "SIDE",
    minLevel: 1,
    type: "LORE",
    title: "Кулак Северной Звезды",
    description: "Пройди arcade-режим в любом файтинге (Tekken, Street Fighter, Mortal Kombat, Guilty Gear).",
    flavor: "Файтинг — это честь. Один на один, кулак к кулаку. Аркада до титров. Не дроп. Не пауза.",
    targetCount: 1,
    params: {},
    rewards: { points: 8, exp: 35 },
    durationDays: 14,
  },

  // 🍳 КУХНЯ — кулинария и выживание
  {
    id: "kukhnya_side_overcooked",
    npcRegion: "kukhnya",
    tier: "SIDE",
    minLevel: 1,
    type: "LORE",
    title: "Кухонный Хаос",
    description: "Поиграй в Overcooked, Cooking Mama, PlateUp или любой кулинарный сим.",
    flavor: "¡VAMOS! Игра про КУХНЮ, amigo! Гремлины уже в восторге! Иди, готовь, кричи — это искусство!",
    targetCount: 1,
    params: {},
    rewards: { points: 7, exp: 30 },
    durationDays: 14,
  },
  {
    id: "kukhnya_side_survival",
    npcRegion: "kukhnya",
    tier: "SIDE",
    minLevel: 2,
    type: "LORE",
    title: "Дикий Сезон",
    description: "Поиграй в Don't Starve, Valheim, Green Hell, The Long Dark — выживи 5+ игровых дней.",
    flavor:
      "¡SÍ! Выживание — это рецепт! Голод, холод, гремлины в кустах! Пять дней — и я приму тебя в повара! Меньше — снова на кухню!",
    targetCount: 1,
    params: {},
    rewards: { points: 9, exp: 35 },
    durationDays: 21,
  },

  // 👔 АТЕЛЬЕ — шутеры и стильные игры
  {
    id: "atelye_side_call_of_duty",
    npcRegion: "atelye",
    tier: "SIDE",
    minLevel: 1,
    type: "LORE",
    title: "Modern Warfare",
    description: "Пройди кампанию любой Call of Duty (любой части, любого года).",
    flavor: "ну го, кампанию пройди, базар. сюжетка короткая, без душа. главное — соус правильный, ну ты понял.",
    targetCount: 1,
    params: {},
    rewards: { points: 7, exp: 30 },
    durationDays: 14,
  },
  {
    id: "atelye_side_half_life",
    npcRegion: "atelye",
    tier: "SIDE",
    minLevel: 2,
    type: "LORE",
    title: "Гордон, Просыпайся",
    description: "Пройди любую часть Half-Life (1, 2, эпизоды или Alyx).",
    flavor: "тут вообще базара ноль — Half-Life это эстетика. одну часть пройди, любую. ну прям шарящий выбор.",
    targetCount: 1,
    params: {},
    rewards: { points: 10, exp: 40 },
    durationDays: 21,
  },
  {
    id: "atelye_side_tactical",
    npcRegion: "atelye",
    tier: "SIDE",
    minLevel: 2,
    type: "LORE",
    title: "Тактика Решает",
    description: "Сыграй и доведи партию в Rainbow Six Siege, CS2, Valorant или Escape from Tarkov.",
    flavor: "соевые петухи не выдержат. ствол прямо, аим чисто, мозг работает. одна сессия с результатом — и считай прошёл.",
    targetCount: 1,
    params: {},
    rewards: { points: 8, exp: 35 },
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
