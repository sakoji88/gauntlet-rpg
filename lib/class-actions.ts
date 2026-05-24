// Активки классов — описание для UI и логики.
// Сами эффекты применяются в /api/player/class-action/route.ts.

export type ClassActionKey =
  | "fury"        // Берсерк — Ярость Бати
  | "ancient"     // Лороман — Древнее Знание
  | "self_flag"   // Страдалец — Самобичевание
  | "hype"        // Бард — Хайп
  | "alchemy"     // Алхимик — Алхимия
  | "podkidysh";  // Урка — Подкидыш (PvP, отложено)

export interface ClassActionDef {
  key: ClassActionKey;
  classId: string;            // ID класса в lib/classes.ts ("berserker", "loreman" и т.д.)
  name: string;
  shortDescription: string;   // Что делает (1 строка для кнопки)
  longDescription: string;    // Подробное описание
  flavor: string;             // Стилизованная подсказка
  // Требует ли активка ввод от игрока (например текст обещания для Барда)
  requiresInput?: { field: string; label: string; placeholder?: string };
  // Для алхимика — нужен itemId для слияния
  requiresItemPick?: boolean;
  // Не реализована в текущей версии (PvP-зависимая)
  unavailable?: boolean;
}

export const CLASS_ACTIONS: Record<string, ClassActionDef> = {
  berserker: {
    key: "fury",
    classId: "berserker",
    name: "Ярость Бати",
    shortDescription: "Следующая игра на макс. сложности → ×2 поинтов",
    longDescription:
      "Берсерк ярится. На следующем «прошёл» если поставишь галку «Макс. сложность» — поинты умножаются на 2. Если не поставишь — бафф сгорит впустую.",
    flavor: "ХУУУУХ. ПОЕХАЛИ. БЕЗ САХАРА.",
  },
  loreman: {
    key: "ancient",
    classId: "loreman",
    name: "Древнее Знание",
    shortDescription: "Покрути колесо игры дважды и впиши лучшее",
    longDescription:
      "На следующем ролле игры можешь покрутить pickaga.me дважды и вписать тот тайтл, который понравился больше. По чести — мы не проверяем, как ты крутишь.",
    flavor: "Видения двойного гадания. Выбери своё прозрение.",
  },
  sufferer: {
    key: "self_flag",
    classId: "sufferer",
    name: "Самобичевание",
    shortDescription: "Возьми штраф на след. игру → ×2 поинтов",
    longDescription:
      "Опиши себе ограничение (без звука, без сейвов, без интерфейса — что хочешь). Выполнил → следующая игра даёт ×2 поинтов. По чести.",
    flavor: "Боль очищает. Чем хуже — тем слаще.",
    requiresInput: {
      field: "restriction",
      label: "Что за самоштраф?",
      placeholder: "Без звука / без сейвов / без интерфейса...",
    },
  },
  bard: {
    key: "hype",
    classId: "bard",
    name: "Хайп",
    shortDescription: "Анонс цели: выполнил → +5, нет → −3",
    longDescription:
      "Громко скажи всем — «пройду игру X за Y часов» или другое смелое обещание. На следующем «прошёл» отметишь — выполнил или нет. +5 если да, −3 если нет.",
    flavor: "Сцена ждёт. Зритель ждёт. Не подведи зрителя.",
    requiresInput: {
      field: "promise",
      label: "Твой анонс",
      placeholder: "Пройду Hollow Knight за 20 часов",
    },
  },
  alchemist: {
    key: "alchemy",
    classId: "alchemist",
    name: "Алхимия",
    shortDescription: "3 ЛЮБЫХ расходника/экипировки → 1 случайный артефакт",
    longDescription:
      "Кинь в котёл 3 любых расходника или экипировки (не обязательно одинаковых, легендарки и косметику нельзя) — на выходе будет случайный артефакт. Алхимия — это вера в случай.",
    flavor: "Котёл шипит. Что-то стало чем-то.",
    requiresItemPick: true,
  },
  urka: {
    key: "podkidysh",
    classId: "urka",
    name: "Подкидыш",
    shortDescription: "Превратить бафф в ловушку (PvP)",
    longDescription:
      "Активка будет доступна после релиза PvP-этапа. Превращает любой расходник в инвентаре в ловушку для другого игрока.",
    flavor: "Тс-с-с. Ты ничего не видел.",
    unavailable: true,
  },
};

// Длительность кулдауна между активками (24 часа)
export const CLASS_ACTION_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export function getClassActionForPlayer(classId: string | null): ClassActionDef | null {
  if (!classId) return null;
  return CLASS_ACTIONS[classId] ?? null;
}

export function classActionCooldownLeft(lastAt: Date | null): number {
  if (!lastAt) return 0;
  const passed = Date.now() - lastAt.getTime();
  return Math.max(0, CLASS_ACTION_COOLDOWN_MS - passed);
}
