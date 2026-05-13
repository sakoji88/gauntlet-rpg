// Реестр ловушек. Каждая запись:
//   itemEffectKey — что стоит в Item.effectKey (см. items.ts)
//   buffKey       — что положим в Player.activeBuffs у жертвы
//   description   — для UI
//   payload       — параметры эффекта (например, насколько +1 или +2)

export interface TrapDef {
  itemEffectKey: string;     // ключ предмета (item.effectKey)
  buffKey: string;           // ключ бафа у жертвы
  itemId: string;            // ID предмета в БД
  name: string;
  description: string;
  // Категория применения — где сработает бафф
  appliesTo: "move" | "any_action" | "next_complete";
  // Сила эффекта (для move/any_action — на сколько +ходов; для complete — на сколько -поинтов)
  magnitude: number;
}

export const TRAPS: TrapDef[] = [
  {
    itemEffectKey: "trap_slow",
    buffKey: "trap_slow",
    itemId: "rake",
    name: "Грабли",
    description: "+1 ход на следующее перемещение жертвы",
    appliesTo: "move",
    magnitude: 1,
  },
  {
    itemEffectKey: "trap_extra_cost",
    buffKey: "trap_extra_cost",
    itemId: "sticky_slime",
    name: "Липкая Жижа",
    description: "+1 ход на следующее действие жертвы (перемещение или ролл)",
    appliesTo: "any_action",
    magnitude: 1,
  },
  {
    itemEffectKey: "trap_points",
    buffKey: "trap_points",
    itemId: "rotten_shawarma",
    name: "Тухлая Шаурма",
    description: "−2 поинта на следующей засчитанной игре жертвы",
    appliesTo: "next_complete",
    magnitude: 2,
  },
  {
    itemEffectKey: "trap_strong_slow",
    buffKey: "trap_strong_slow",
    itemId: "rat",
    name: "Крыса",
    description: "+2 хода на следующее перемещение жертвы",
    appliesTo: "move",
    magnitude: 2,
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

// Все buff-keys которые относятся к ловушкам (для удобного фильтра в UI и проверках)
export const TRAP_BUFF_KEYS = TRAPS.map((t) => t.buffKey);
