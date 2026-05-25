// Реестр ловушек.
//
// Каждая ловушка имеет один из двух режимов:
//   - "buff"    — навешивает effectKey в Player.activeBuffs у жертвы.
//                 Эффект отрабатывается в соответствующих роутах (move/roll/finish).
//   - "instant" — отрабатывается сразу в момент броска (api/player/trap/throw).
//                 Никакого buff на жертве не висит.

export type TrapMode = "buff" | "instant";

export interface TrapDef {
  itemEffectKey: string;     // ключ предмета (item.effectKey)
  itemId: string;            // ID предмета в БД
  name: string;
  mode: TrapMode;
  // Для buff-режима:
  buffKey?: string;          // что положим в Player.activeBuffs у жертвы
  // Где сработает buff (информативно, для будущей системы UI/иммунитетов).
  appliesTo?: "move" | "any_action" | "roll" | "next_complete" | "stink" | "curse_x2";
  // Сила/счётчик. Для счётчиков (Зловоние, Двойное Проклятье) — это число тиков.
  magnitude: number;
  // Для instant-режима:
  instantKind?:
    | "steal_gold"        // Крыса: украсть N Злата → бросающему
    | "burn_charge"       // Огнемёт: сжечь 1 заряд случайному предмету жертвы
    | "drain_gold"        // Дрисево: списать N Злата у жертвы (без передачи)
    | "teleport_home"     // Пердак: швырнуть жертву в Хутор (или Чахлый Бор если уже там)
    | "lose_random_item"  // Поддельный Квест: удалить случайный consumable у жертвы
    | "force_game";       // Скальп Говяды: задать жертве конкретную игру (бесплатно)
  description: string;       // краткое описание для UI/сообщений
  // true — перед броском игрок должен вписать название игры (Скальп Говяды).
  requiresGameTitle?: boolean;
}

export const TRAPS: TrapDef[] = [
  // ===== БАЗОВЫЕ (механики не меняем — игроки уже их знают) =====
  {
    itemEffectKey: "trap_slow",
    itemId: "rake",
    name: "Грабли",
    mode: "buff",
    buffKey: "trap_slow",
    appliesTo: "move",
    magnitude: 1,
    description: "+1 ход на следующее перемещение жертвы",
  },
  {
    itemEffectKey: "trap_extra_cost",
    itemId: "sticky_slime",
    name: "Липкая Жижа",
    mode: "buff",
    buffKey: "trap_extra_cost",
    appliesTo: "any_action",
    magnitude: 1,
    description: "+1 ход на следующее действие жертвы",
  },
  {
    itemEffectKey: "trap_points",
    itemId: "rotten_shawarma",
    name: "Тухлая Шаурма",
    mode: "buff",
    buffKey: "trap_points",
    appliesTo: "next_complete",
    magnitude: 2,
    description: "−2 поинта на следующей засчитанной игре жертвы",
  },

  // ===== НОВЫЕ buff-эффекты =====
  {
    // Зловоние: +1 ход на следующих 2-х перемещениях.
    // Счётчик хранится в payload.remaining.
    itemEffectKey: "trap_shitbag",
    itemId: "shit_bag_chakhlik",
    name: "Сральный пакет Чахлика",
    mode: "buff",
    buffKey: "trap_stink",
    appliesTo: "stink",
    magnitude: 2,
    description: "+1 ход на следующие ДВА перемещения жертвы (вонь долго не выветривается)",
  },
  {
    // Похмелье: следующий ролл игры жертве стоит +1 ход.
    itemEffectKey: "trap_rvotnichki",
    itemId: "rvotnichki",
    name: "Рвотнички",
    mode: "buff",
    buffKey: "trap_roll_extra",
    appliesTo: "roll",
    magnitude: 1,
    description: "Следующий ролл игры жертве стоит +1 ход",
  },
  {
    // Контузия: следующая засчитанная игра не даст EXP.
    itemEffectKey: "trap_zigomet",
    itemId: "zigomet_chakhlik",
    name: "Зигомёт Чахлика",
    mode: "buff",
    buffKey: "trap_no_exp",
    appliesTo: "next_complete",
    magnitude: 0,
    description: "Следующая засчитанная игра жертве не даст опыт",
  },
  {
    // Двойное проклятье: −2 поинта на следующих ДВУХ играх.
    itemEffectKey: "trap_barin",
    itemId: "barin_curse",
    name: "Проклятье барина",
    mode: "buff",
    buffKey: "trap_curse_x2",
    appliesTo: "curse_x2",
    magnitude: 2, // тиков (игр), на каждой −2 поинта
    description: "−2 поинта на следующих ДВУХ засчитанных играх",
  },

  // ===== НОВЫЕ instant-эффекты =====
  {
    itemEffectKey: "trap_drisevo",
    itemId: "mexican_drisevo",
    name: "Мексиканское дрисево",
    mode: "instant",
    instantKind: "drain_gold",
    magnitude: 5,
    description: "Жертва бежит срочно — теряет 5 Злата",
  },
  {
    itemEffectKey: "trap_strong_slow",
    itemId: "rat",
    name: "Крыса",
    mode: "instant",
    instantKind: "steal_gold",
    magnitude: 10,
    description: "Крыса крадёт 10 Злата у жертвы и приносит бросающему",
  },
  {
    itemEffectKey: "trap_flamethrower",
    itemId: "flamethrower_dushik",
    name: "Огнемёт душика",
    mode: "instant",
    instantKind: "burn_charge",
    magnitude: 1,
    description: "Сгорает 1 заряд случайного предмета в инвентаре жертвы",
  },
  {
    itemEffectKey: "trap_fake_quest",
    itemId: "fake_quest",
    name: "Поддельный Квест",
    mode: "instant",
    instantKind: "lose_random_item",
    magnitude: 1,
    description: "Жертва уходит на ложный путь и теряет случайный расходник",
  },
  {
    itemEffectKey: "trap_perdak",
    itemId: "vasilisa_perdak",
    name: "Пердак Василисы",
    mode: "instant",
    instantKind: "teleport_home",
    magnitude: 0,
    description: "Жертву сдувает в Хутор Душлендора (если уже там — в Чахлый Бор)",
  },
  {
    // Скальп Говяды — особая ловушка: бросающий задаёт название игры,
    // жертве она ставится в актив бесплатно. Жертва обязана пройти или дропнуть.
    itemEffectKey: "trap_forced_game",
    itemId: "govyada_scalp",
    name: "Скальп Говяды",
    mode: "instant",
    instantKind: "force_game",
    magnitude: 0,
    description: "Бросающий задаёт жертве игру вручную — она встаёт в актив без затрат хода",
    requiresGameTitle: true,
  },
];

export function getTrapByEffectKey(effectKey: string): TrapDef | null {
  return TRAPS.find((t) => t.itemEffectKey === effectKey) ?? null;
}

export function getTrapByItemId(itemId: string): TrapDef | null {
  return TRAPS.find((t) => t.itemId === itemId) ?? null;
}

export function getTrapByBuffKey(buffKey: string): TrapDef | null {
  return TRAPS.find((t) => t.buffKey === buffKey) ?? null;
}

// Все buff-keys, которые относятся к ловушкам (для фильтрации в UI и в эффектах,
// которые "снимают все дебаффы": ромашковый чай, анализы Душика и т.п.).
export const TRAP_BUFF_KEYS = TRAPS
  .filter((t) => t.mode === "buff" && t.buffKey)
  .map((t) => t.buffKey as string);
