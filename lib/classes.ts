// Данные о всех классах персонажей Темнодушного Лета
// Источник правды для экрана выбора, профиля, расчёта статов

export type ClassId =
  | "berserker"
  | "loreman"
  | "sufferer"
  | "urka"
  | "alchemist"
  | "bard";

export interface ClassData {
  id: ClassId;
  name: string;
  tagline: string;
  description: string;
  passive: {
    name: string;
    text: string;
  };
  active: {
    name: string;
    text: string;
  };
  weakness: {
    name: string;
    text: string;
  };
  startStats: {
    strength: number;
    patience: number;
    luck: number;
    charisma: number;
  };
  imageUrl: string;
  accentColor: string;
  warning?: string;
}

export const CLASSES: ClassData[] = [
  {
    id: "berserker",
    name: "Батя-Берсерк",
    tagline: "Прёт напролом. Чем больней — тем веселей.",
    description:
      "Бывалый мужик с потасканной мордой. Не задаёт вопросов. Не знает усталости. Любит, когда сложно.",
    passive: {
      name: "Натиск Бати",
      text: "При прохождении игры на максимальной сложности — +50% поинтов.",
    },
    active: {
      name: "Ярость Бати",
      text: "Раз в день. Следующая игра обязательно на максимальной сложности. Если осилишь — +100% поинтов.",
    },
    weakness: {
      name: "Гордыня",
      text: "Дроп игры даёт -3 поинта вместо -2.",
    },
    startStats: {
      strength: 14,
      patience: 6,
      luck: 10,
      charisma: 10,
    },
    imageUrl: "/images/classes/berserker.png",
    accentColor: "#8b2424",
  },
  {
    id: "loreman",
    name: "Ведьмак-Лороман",
    tagline: "Знает всё, читает свитки, говорит загадками.",
    description:
      "Сухопарый книжник в капюшоне. Изучает древние тексты, любит длинные игры, презирает короткие.",
    passive: {
      name: "Терпеливое Око",
      text: "За 15+ часовую игру — +3 поинта. За 30+ — +5. За 50+ — +10 бонусных.",
    },
    active: {
      name: "Древнее Знание",
      text: "Раз в день. На следующем ролле крутишь колесо дважды и выбираешь любую из двух игр.",
    },
    weakness: {
      name: "Презрение к Мелочи",
      text: "За игры длительностью менее 5 часов — на 1 поинт меньше.",
    },
    startStats: {
      strength: 8,
      patience: 12,
      luck: 10,
      charisma: 10,
    },
    imageUrl: "/images/classes/loreman.png",
    accentColor: "#3a4d7a",
  },
  {
    id: "sufferer",
    name: "Отшельник-Страдалец",
    tagline: "Чем хуже игра — тем больше радости.",
    description:
      "Бритоголовый аскет в веригах. Нашёл просветление в мучениях. Кайфует от кринжа и плохих игр.",
    passive: {
      name: "Сладость Страдания",
      text: "За игры с рейтингом <60/100 — +3 поинта. <40/100 — +6 бонусных.",
    },
    active: {
      name: "Самобичевание",
      text: "Раз в день. Возьми штраф на следующую игру (без звука/без UI/один сидинг). Выполнил — x2 поинта.",
    },
    weakness: {
      name: "Презрение к Успеху",
      text: "За игры с рейтингом >85/100 — на 2 поинта меньше.",
    },
    startStats: {
      strength: 8,
      patience: 14,
      luck: 10,
      charisma: 8,
    },
    imageUrl: "/images/classes/sufferer.png",
    accentColor: "#5d4a2e",
  },
  {
    id: "urka",
    name: "Урка-Ассасин",
    tagline: "В тени, с ножом, всех ненавидит.",
    description:
      "Худощавый теневик с уголовными татухами. Живёт по понятиям. Любит подкидывать гадости другим.",
    passive: {
      name: "Ловкие Пальцы",
      text: "Ловушки на других игроков стоят 0 ходов вместо 1.",
    },
    active: {
      name: "Подкидыш",
      text: "Раз в день. Превратить любой бафф в инвентаре в ловушку и кинуть бесплатно.",
    },
    weakness: {
      name: "Метка Изгоя",
      text: "NPC дают -30% поинтов за квесты. Дополнительно: каждые 3 успешные ловушки — +1 поинт.",
    },
    startStats: {
      strength: 12,
      patience: 8,
      luck: 12,
      charisma: 8,
    },
    imageUrl: "/images/classes/urka.png",
    accentColor: "#3d3d3d",
  },
  {
    id: "alchemist",
    name: "Знахарь-Алхимик",
    tagline: "Варит мутное, торгует и обменивает.",
    description:
      "Сумасшедший шарлатан с грязным фартуком. Считает что лечит, на самом деле травит. Любит крафт.",
    passive: {
      name: "Острое Чутьё",
      text: "При выпадении предмета — выпадает 3 варианта, выбираешь любой 1.",
    },
    active: {
      name: "Алхимия",
      text: "Раз в день. Потрать 3 одинаковых бафф-предмета — получи 1 редкий артефакт (рандомный).",
    },
    weakness: {
      name: "Презрение Костаная",
      text: "Костанай не пускает тебя в Терем. Ты теряешь доступ к 1 региону из 8.",
    },
    startStats: {
      strength: 10,
      patience: 10,
      luck: 14,
      charisma: 6,
    },
    imageUrl: "/images/classes/alchemist.png",
    accentColor: "#3d5a3a",
    warning: "Алхимики не допускаются в Терем Зажиточного. Вы теряете доступ к 1 региону из 8.",
  },
  {
    id: "bard",
    name: "Скоморох-Бард",
    tagline: "Развлекает, балагурит, обаятельный.",
    description:
      "Театральный шут с балалайкой. Любит публику. Без хайпа чахнет. Самый болтливый в Бездне.",
    passive: {
      name: "Языкатость",
      text: "+2 поинта от каждого квеста NPC. Харизма работает.",
    },
    active: {
      name: "Хайп",
      text: "Раз в день. Анонсируй в чат: «Пройду игру X за Y часов». Выполнил — +5, не выполнил — -3.",
    },
    weakness: {
      name: "Бремя Хайпа",
      text: "Если за 7 дней ни разу не использовал Хайп — автоматический штраф -5 поинтов.",
    },
    startStats: {
      strength: 8,
      patience: 10,
      luck: 10,
      charisma: 14,
    },
    imageUrl: "/images/classes/bard.png",
    accentColor: "#7a5a2e",
  },
];

// Хелпер: получить данные класса по id
export function getClassById(id: string | null): ClassData | null {
  if (!id) return null;
  return CLASSES.find((c) => c.id === id) ?? null;
}