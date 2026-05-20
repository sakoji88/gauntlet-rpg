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

  // ============================================================
  // ===== ПРЕДМЕТЫ КОЛЕСА (сезон 2) — выпадают с рулетки =====
  // ============================================================

  // ----- COMMON расходники: ходы -----
  {
    id: "dozhitie_dushik",
    name: "Дожитие Душика",
    description: "Недоеденное, но ещё живое. +1 ход.",
    category: "CONSUMABLE", rarity: "COMMON",
    iconKey: "food", effectKey: "add_energy_1",
    charges: 1, rollWeight: 14,
  },
  {
    id: "rotten_vape",
    name: "Гнилой вейп",
    description: "Палёная дрянь, закашлялся в хлам. ☠ ДЕБАФФ (сразу с колеса): −1 ход.",
    category: "CONSUMABLE", rarity: "COMMON",
    iconKey: "vape", effectKey: "curse_energy",
    charges: 1, rollWeight: 10,
  },
  {
    id: "balanda",
    name: "Баланда",
    description: "Тюремная похлёбка тяжёлая, ноги волочишь. ☠ ДЕБАФФ (сразу с колеса): +1 ход на следующее перемещение по карте.",
    category: "CONSUMABLE", rarity: "COMMON",
    iconKey: "bowl", effectKey: "curse_slow",
    charges: 1, rollWeight: 10,
  },
  {
    id: "dushik_food_pot",
    name: "Едальный горшок Душика",
    description: "Объелся, не пошевелиться. ☠ ДЕБАФФ (сразу с колеса): +1 ход на следующее действие.",
    category: "CONSUMABLE", rarity: "COMMON",
    iconKey: "pot", effectKey: "curse_extra_cost",
    charges: 1, rollWeight: 10,
  },
  {
    id: "chebupizza",
    name: "Чебупицца",
    description: "Спустил последнее на эту мерзость. ☠ ДЕБАФФ (сразу с колеса): −10 Злата.",
    category: "CONSUMABLE", rarity: "COMMON",
    iconKey: "pizza", effectKey: "curse_gold",
    charges: 1, rollWeight: 10,
  },

  // ----- COMMON расходники: опыт / Злато / реролл / очистка -----
  {
    id: "cannula",
    name: "Канюля",
    description: "Капельница прямо в вену. +25 опыта.",
    category: "CONSUMABLE", rarity: "COMMON",
    iconKey: "cannula", effectKey: "gain_exp_25",
    charges: 1, rollWeight: 13,
  },
  {
    id: "linusik_menstra",
    name: "Менстра Линусика",
    description: "Не спрашивай. Стошнило, мир кружится. ☠ ДЕБАФФ (сразу с колеса): −2 поинта на следующей засчитанной игре.",
    category: "CONSUMABLE", rarity: "COMMON",
    iconKey: "vial_red", effectKey: "curse_points",
    charges: 1, rollWeight: 10,
  },
  {
    id: "nuggets_spoiled",
    name: "9 нагетсов скисло",
    description: "Восемь съел, девятый — урок жизни. ☠ ДЕБАФФ (сразу с колеса): −2 поинта на следующей засчитанной игре.",
    category: "CONSUMABLE", rarity: "COMMON",
    iconKey: "nuggets", effectKey: "curse_points",
    charges: 1, rollWeight: 10,
  },
  {
    id: "sold_cheap",
    name: "Продал подешевле",
    description: "Продешевил по-крупному, в кармане дыра. ☠ ДЕБАФФ (сразу с колеса): −10 Злата.",
    category: "CONSUMABLE", rarity: "COMMON",
    iconKey: "coin", effectKey: "curse_gold",
    charges: 1, rollWeight: 10,
  },
  {
    id: "bought_expensive",
    name: "Купил подороже",
    description: "Переплатил, но сдача нашлась в кармане. +10 Злата.",
    category: "CONSUMABLE", rarity: "COMMON",
    iconKey: "coin", effectKey: "gain_gold_10",
    charges: 1, rollWeight: 13,
  },
  {
    id: "usb_flashlight",
    name: "USB Фонарик",
    description: "Подсветил путь — видишь, что вляпался. Реролл активной игры без штрафа.",
    category: "CONSUMABLE", rarity: "COMMON",
    iconKey: "flashlight", effectKey: "reroll_game",
    charges: 1, rollWeight: 12,
  },
  {
    id: "chamomile_tea",
    name: "Ромашковый чай",
    description: "Успокаивает. Снимает все дебаффы и ловушки с тебя.",
    category: "CONSUMABLE", rarity: "COMMON",
    iconKey: "tea", effectKey: "cleanse_debuffs",
    charges: 1, rollWeight: 12,
  },

  // ----- RARE расходники -----
  {
    id: "new_iqos",
    name: "Новый айкос",
    description: "Чище вейпа, дороже совести. +2 хода.",
    category: "CONSUMABLE", rarity: "RARE",
    iconKey: "iqos", effectKey: "add_energy_2",
    charges: 1, rollWeight: 6,
  },
  {
    id: "basket_24_wings",
    name: "Баскет 24 крыльев",
    description: "Нажрался — ноги сами понесли. Следующее перемещение по карте бесплатное.",
    category: "CONSUMABLE", rarity: "RARE",
    iconKey: "wings", effectKey: "free_move",
    charges: 1, rollWeight: 6,
  },
  {
    id: "romanal_spices",
    name: "Специи Романала",
    description: "Приправил прохождение — вкуснее засчитают. +3 поинта следующей игре.",
    category: "CONSUMABLE", rarity: "RARE",
    iconKey: "spices", effectKey: "points_next_3",
    charges: 1, rollWeight: 6,
  },
  {
    id: "ny_cheesecake",
    name: "Чизкейк Нью-Йорк",
    description: "Угостил Романала — тот разомлел. Следующая засчитанная игра даст ×2 Злата.",
    category: "CONSUMABLE", rarity: "RARE",
    iconKey: "cheesecake", effectKey: "gold_double_next",
    charges: 1, rollWeight: 6,
  },
  {
    id: "kostik_rare_coin",
    name: "Редкая монетка Костика",
    description: "Костанай обронил, ты подобрал. +25 Злата.",
    category: "CONSUMABLE", rarity: "RARE",
    iconKey: "coin_gold", effectKey: "gain_gold_25",
    charges: 1, rollWeight: 6,
  },
  {
    id: "popov_balcony",
    name: "Разьёбанный балкон Попова",
    description: "Сидишь высоко, ловушки летят мимо. Первая брошенная в тебя ловушка не сработает.",
    category: "CONSUMABLE", rarity: "RARE",
    iconKey: "scrap", effectKey: "protect_from_trap",
    charges: 1, rollWeight: 6,
  },
  {
    id: "chakhlik_sketchbook",
    name: "Скетчбук Чахлика",
    description: "Жуткие рисунки на полях. Вдохновляет. +50 опыта.",
    category: "CONSUMABLE", rarity: "RARE",
    iconKey: "sketchbook", effectKey: "gain_exp_50",
    charges: 1, rollWeight: 6,
  },
  {
    id: "dushik_dumbbells",
    name: "Гантели Душика",
    description: "Покачался у Хутора. +1 к случайному стату.",
    category: "CONSUMABLE", rarity: "RARE",
    iconKey: "dumbbell", effectKey: "heal_stat_1",
    charges: 1, rollWeight: 6,
  },
  {
    id: "fake_beard_chakhlon",
    name: "Накладная борода Чахлона",
    description: "Под чужой личиной судьба сговорчивей. Следующее колесо игр — 3 на выбор.",
    category: "CONSUMABLE", rarity: "RARE",
    iconKey: "beard", effectKey: "choose_of_three",
    charges: 1, rollWeight: 6,
  },
  {
    id: "kharitonov_ticket",
    name: "Билет на Харитонова 10",
    description: "Прокатился — вернулся другим. Реролл активной игры без штрафа.",
    category: "CONSUMABLE", rarity: "RARE",
    iconKey: "ticket", effectKey: "reroll_game",
    charges: 1, rollWeight: 6,
  },
  {
    id: "dushik_analyses",
    name: "Анализы Душика",
    description: "Диагноз поставлен — порча снята. Снимает все дебаффы и ловушки с тебя.",
    category: "CONSUMABLE", rarity: "RARE",
    iconKey: "analyses", effectKey: "cleanse_debuffs",
    charges: 1, rollWeight: 6,
  },

  // ----- EPIC расходники -----
  {
    id: "klops_granny_gold_tooth",
    name: "Золотой зуб бабушки Клопса",
    description: "Фамильная реликвия табора. +5 поинтов следующей игре.",
    category: "CONSUMABLE", rarity: "EPIC",
    iconKey: "tooth_gold", effectKey: "points_next_5",
    charges: 1, rollWeight: 3,
  },
  {
    id: "lyrica",
    name: "Лирика",
    description: "Мир поплыл, говоришь с NPC задушевно. Следующий выполненный квест даёт ×2 поинтов.",
    category: "CONSUMABLE", rarity: "EPIC",
    iconKey: "pills", effectKey: "quest_double_next",
    charges: 1, rollWeight: 3,
  },
  {
    id: "burmaldi",
    name: "Бурмалди",
    description: "Никто не знает что это, но продаётся за конский ценник. +50 Злата.",
    category: "CONSUMABLE", rarity: "EPIC",
    iconKey: "burmaldi", effectKey: "gain_gold_50",
    charges: 1, rollWeight: 3,
  },
  {
    id: "popov_crystal",
    name: "Кристалл Максима Попова",
    description: "Светится недобро. Полный заряд бодрости — +3 хода.",
    category: "CONSUMABLE", rarity: "EPIC",
    iconKey: "crystal", effectKey: "add_energy_3",
    charges: 1, rollWeight: 3,
  },
  {
    id: "kolyan_mandate",
    name: "Мандат Коляна",
    description: "Корочка решает всё. Выйти из Тюрьмы без прохождения игры.",
    category: "CONSUMABLE", rarity: "EPIC",
    iconKey: "mandate", effectKey: "escape_prison",
    charges: 1, rollWeight: 3,
  },

  // ----- Экипировка (пассивки) -----
  {
    id: "dongle",
    name: "Донгл",
    description: "Воткнул — и тебя как будто нет в сети. Скрывает твою активную игру из ленты.",
    category: "EQUIPMENT", rarity: "RARE",
    iconKey: "dongle", effectKey: "hide_game",
    charges: 99, rollWeight: 6,
  },
  {
    id: "rusnyak_opel",
    name: "Нищий опель Ильи Русняка",
    description: "Едет на честном слове, но едет. Перемещения по карте −1 ход.",
    category: "EQUIPMENT", rarity: "EPIC",
    iconKey: "opel", effectKey: "cheap_move",
    charges: 99, rollWeight: 3,
  },

  // ----- Ловушки колеса -----
  {
    id: "mexican_drisevo",
    name: "Мексиканское дрисево",
    description: "Острое настолько, что жертва +1 ход тратит на следующее действие.",
    category: "TRAP", rarity: "COMMON",
    iconKey: "trap_food", effectKey: "trap_drisevo",
    charges: 1, rollWeight: 13, isTrap: true,
  },
  {
    id: "shit_bag_chakhlik",
    name: "Сральный пакет Чахлика",
    description: "Подкинул под порог — жертва +1 ход на следующее перемещение.",
    category: "TRAP", rarity: "COMMON",
    iconKey: "trap_bag", effectKey: "trap_shitbag",
    charges: 1, rollWeight: 13, isTrap: true,
  },
  {
    id: "flamethrower_dushik",
    name: "Огнемёт душика",
    description: "Пыхнул вслед — жертва +2 хода на следующее перемещение.",
    category: "TRAP", rarity: "RARE",
    iconKey: "trap_fire", effectKey: "trap_flamethrower",
    charges: 1, rollWeight: 6, isTrap: true,
  },
  {
    id: "zigomet_chakhlik",
    name: "Зигомёт Чахлика",
    description: "Жуткий снаряд из бора. −2 поинта жертве на следующей засчитанной игре.",
    category: "TRAP", rarity: "RARE",
    iconKey: "trap_bolt", effectKey: "trap_zigomet",
    charges: 1, rollWeight: 6, isTrap: true,
  },
  {
    id: "barin_curse",
    name: "Проклятье барина",
    description: "Барское слово тяжело. −2 поинта жертве на следующей засчитанной игре.",
    category: "TRAP", rarity: "EPIC",
    iconKey: "trap_curse", effectKey: "trap_barin",
    charges: 1, rollWeight: 3, isTrap: true,
  },

  // ----- Одёжные предметы колеса (функциональные, НЕ косметика) -----
  {
    id: "sleeveless_hoodie",
    name: "Худи безрукавка",
    description: "Свобода движений до самых плеч. +2 поинта следующей игре.",
    category: "CONSUMABLE", rarity: "COMMON",
    iconKey: "hoodie", effectKey: "points_next_2",
    charges: 1, rollWeight: 11,
  },
  {
    id: "cap_backwards",
    name: "Кепка назад",
    description: "Надел задом наперёд — и попёрло. +2 поинта следующей игре.",
    category: "CONSUMABLE", rarity: "COMMON",
    iconKey: "cap", effectKey: "points_next_2",
    charges: 1, rollWeight: 11,
  },
  {
    id: "hood_cap",
    name: "Шапка капюшон",
    description: "Нашёл в кармане мелочь. +10 Злата.",
    category: "CONSUMABLE", rarity: "COMMON",
    iconKey: "hood", effectKey: "gain_gold_10",
    charges: 1, rollWeight: 13,
  },
  {
    id: "punish_tshirt",
    name: "Футболка Punish",
    description: "Грозная надпись пугает даже игру. ×1.5 поинтов следующей игре.",
    category: "CONSUMABLE", rarity: "RARE",
    iconKey: "tshirt", effectKey: "points_mult_next",
    charges: 1, rollWeight: 6,
  },
  {
    id: "gorgonit_hoodie",
    name: "Худи Горгонит",
    description: "Морда твари на груди внушает. +3 поинта следующей игре.",
    category: "CONSUMABLE", rarity: "RARE",
    iconKey: "hoodie", effectKey: "points_next_3",
    charges: 1, rollWeight: 6,
  },
  {
    id: "rotten_newrocks",
    name: "Гнилые нью-роки",
    description: "Тяжёлые ботинки держат на ногах. Раз в сезон отменяют один дроп.",
    category: "EQUIPMENT", rarity: "EPIC",
    iconKey: "boots_dark", effectKey: "prevent_drop",
    charges: 1, rollWeight: 3,
  },

  // ============================================================
  // ===== ОСОБЫЕ ПРЕДМЕТЫ — только в Лавке Романала ===========
  // ===== (rollWeight 0 — с колеса НЕ выпадают) ===============
  // ============================================================
  {
    id: "fake_beard_chakhlik",
    name: "Накладная борода Чахлика",
    description: "Густая борода отшельника. Носишь — скрываешь активную игру из ленты.",
    category: "EQUIPMENT", rarity: "EPIC",
    iconKey: "beard", effectKey: "hide_game",
    charges: 99, rollWeight: 0,
  },
  {
    id: "dushik_chupachups",
    name: "Чупа чупс душика",
    description: "Облизанный, но сладкий. +2 хода.",
    category: "CONSUMABLE", rarity: "RARE",
    iconKey: "lollipop", effectKey: "add_energy_2",
    charges: 1, rollWeight: 0,
  },
  {
    id: "khadyzhensk_beer",
    name: "Пиво Хадыженское",
    description: "Снимает любую порчу с души. Снимает все дебаффы и ловушки с тебя.",
    category: "CONSUMABLE", rarity: "RARE",
    iconKey: "beer", effectKey: "cleanse_debuffs",
    charges: 1, rollWeight: 0,
  },
  {
    id: "romanal_chicken_feet",
    name: "Куриные лапки романала",
    description: "Деликатес базара. +3 поинта следующей игре.",
    category: "CONSUMABLE", rarity: "RARE",
    iconKey: "chicken_feet", effectKey: "points_next_3",
    charges: 1, rollWeight: 0,
  },
  {
    id: "gotham_tshirt",
    name: "Футболка I love Gotham (в говне)",
    description: "Любовь к Готэму закаляет. +1 к случайному стату.",
    category: "CONSUMABLE", rarity: "RARE",
    iconKey: "tshirt", effectKey: "heal_stat_1",
    charges: 1, rollWeight: 0,
  },
  {
    id: "not_bad_days_hoodie",
    name: "Зип худи Not Bad Days",
    description: "Дни и правда не так плохи. +5 поинтов следующей игре.",
    category: "CONSUMABLE", rarity: "EPIC",
    iconKey: "hoodie", effectKey: "points_next_5",
    charges: 1, rollWeight: 0,
  },
  {
    id: "chakhlik_hat",
    name: "Шляпа Чахлика",
    description: "Шляпа двухсотлетнего отшельника. Раз в сезон отменяет один дроп.",
    category: "EQUIPMENT", rarity: "EPIC",
    iconKey: "hat", effectKey: "prevent_drop",
    charges: 1, rollWeight: 0,
  },
  {
    id: "vasilisa_perdak",
    name: "Пердак Василисы",
    description: "Оружие чудовищной мощи. Жертва +2 хода на следующее перемещение.",
    category: "TRAP", rarity: "EPIC",
    iconKey: "trap_wind", effectKey: "trap_perdak",
    charges: 1, rollWeight: 0, isTrap: true,
  },
  {
    id: "rvotnichki",
    name: "Рвотнички",
    description: "Подложил — и жертве не до игр. +1 ход на следующее действие жертвы.",
    category: "TRAP", rarity: "COMMON",
    iconKey: "trap_vomit", effectKey: "trap_rvotnichki",
    charges: 1, rollWeight: 0, isTrap: true,
  },
  {
    id: "govyada_scalp",
    name: "Скальп Говяды",
    description: "Трофей легендарной охоты. +5 поинтов следующей игре.",
    category: "CONSUMABLE", rarity: "LEGENDARY",
    iconKey: "scalp", effectKey: "points_next_5",
    charges: 1, rollWeight: 0,
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
