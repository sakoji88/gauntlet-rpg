// Расчёт поинтов за прохождение игры — учитывает класс, статы, регион, фазу сезона.
// Возвращает структуру с финальной суммой и подробным разбором (для показа игроку).

import { getRegionById } from "./regions";

// Жанры, которые считаются "hardcore" — для бонуса СИЛЫ и Берсерка
const HARDCORE_GENRES = ["Souls-like", "Action", "Fighting", "Beat'em up"];

// Жанры, привязанные к каждому региону (повторяет данные из regions.ts —
// но мы храним отдельно для гибкости и не зависим от того что в данных региона)
function isGameInRegionGenres(gameRegion: string): boolean {
  // Если игра роллилась в регионе — она автоматически в его жанре
  return Boolean(gameRegion);
}

export interface PointsBreakdownEntry {
  label: string;       // Что это
  value: number;       // Сколько поинтов
  type: "base" | "bonus" | "penalty" | "multiplier";
}

export interface PointsResult {
  total: number;
  breakdown: PointsBreakdownEntry[];
  cappedAt25: boolean;
}

interface CalcInput {
  // Данные игры
  region: string;            // ID региона где прошёл (chakhly-bor и т.д.)
  hours: number | null;      // Часов на прохождение
  rating: number | null;     // Metacritic 0-100
  isMaxDifficulty: boolean;  // Прошёл ли на макс. сложности (потом ставит юзер)
  conditionType: "basic" | "genre" | "special"; // Тип условий, выбранный при ролле

  // Данные игрока
  playerClass: string | null;
  strength: number;
  patience: number;
  luck: number;
  charisma: number;

  // Данные сезона
  seasonDay: number;         // Какой сейчас день сезона (1..21)

  // Активные предметы / эффекты на игрока (на будущее)
  activeBuffs?: string[];    // эффекты-ключи, например ["greed_ring", "heart_of_dark"]
  activeTraps?: string[];    // эффекты-ключи дебаффов от других игроков

  // +поинты, если игрок первым в сезоне прошёл эту игру (учитывается до лимита 25)
  firstInSeasonBonus?: number;
}

// === ОСНОВНАЯ ФУНКЦИЯ ===
export function calculatePoints(input: CalcInput): PointsResult {
  const breakdown: PointsBreakdownEntry[] = [];

  // 1) БАЗА
  const BASE_POINTS = 3;
  let raw = BASE_POINTS;
  breakdown.push({ label: "База за прохождение", value: BASE_POINTS, type: "base" });

  // 2) ТИП УСЛОВИЙ РОЛЛА — задаётся при ролле, не меняется при засчёте
  // basic +0 (только база), genre +3, special +7
  if (input.conditionType === "genre") {
    raw += 3;
    breakdown.push({ label: "Жанровые условия NPC", value: 3, type: "bonus" });
  } else if (input.conditionType === "special") {
    raw += 7;
    breakdown.push({ label: "Особое условие NPC 💎", value: 7, type: "bonus" });
  }

  // 3) РЕГИОНАЛЬНЫЙ ПАССИВНЫЙ БОНУС (если ты находишься В регионе данной игры)
  if (isGameInRegionGenres(input.region)) {
    raw += 1;
    const region = getRegionById(input.region);
    breakdown.push({
      label: `Регион «${region?.shortName ?? input.region}»: пассивный бонус`,
      value: 1,
      type: "bonus",
    });
  }

  // 4) БОНУСЫ ОТ СТАТОВ
  // Каждые 4 очка статов = +1 поинт при определённых условиях

  // СИЛА — за hardcore игры (Souls-like, Fighting, Action, Beat'em up)
  // Так как реальных тегов игры у нас нет, используем регион Пустыри как индикатор
  if (input.region === "pustyri") {
    const strengthBonus = Math.floor(input.strength / 4);
    if (strengthBonus > 0) {
      raw += strengthBonus;
      breakdown.push({
        label: `Сила ${input.strength} → бонус за hardcore`,
        value: strengthBonus,
        type: "bonus",
      });
    }
  }

  // ТЕРПЕНИЕ — за длинные игры (15+ часов)
  if (input.hours !== null && input.hours >= 15) {
    const patienceBonus = Math.floor(input.patience / 4);
    if (patienceBonus > 0) {
      raw += patienceBonus;
      breakdown.push({
        label: `Терпение ${input.patience} → бонус за длинную игру`,
        value: patienceBonus,
        type: "bonus",
      });
    }
  }

  // ХАРИЗМА — общий бонус (за каждую игру) — небольшой, +1 за каждые 6 очков
  const charismaBonus = Math.floor(input.charisma / 6);
  if (charismaBonus > 0) {
    raw += charismaBonus;
    breakdown.push({
      label: `Харизма ${input.charisma} → природное обаяние`,
      value: charismaBonus,
      type: "bonus",
    });
  }

  // 5) БОНУСЫ ОТ КЛАССА
  const classBonus = getClassBonus(input);
  if (classBonus.value !== 0) {
    raw += classBonus.value;
    breakdown.push(classBonus);
  }

  // 6) ШТРАФЫ ОТ КЛАССА
  const classPenalty = getClassPenalty(input);
  if (classPenalty.value !== 0) {
    raw += classPenalty.value; // value уже отрицательное
    breakdown.push(classPenalty);
  }

  // 6.5) ПЕРВОЕ ПРОХОЖДЕНИЕ ИГРЫ В СЕЗОНЕ
  if (input.firstInSeasonBonus && input.firstInSeasonBonus > 0) {
    raw += input.firstInSeasonBonus;
    breakdown.push({
      label: "Первым прошёл эту игру в сезоне",
      value: input.firstInSeasonBonus,
      type: "bonus",
    });
  }

  // 6.6) БАФФЫ «+поинты следующей игре» (расходники-баффы)
  const pointsBuffs: Array<[string, number]> = [
    ["points_next_2", 2],
    ["points_next_3", 3],
    ["points_next_5", 5],
  ];
  for (const [key, amount] of pointsBuffs) {
    if (input.activeBuffs?.includes(key)) {
      raw += amount;
      breakdown.push({ label: `Бафф предмета: +${amount}`, value: amount, type: "bonus" });
    }
  }

  // 7) АКТИВНЫЕ ПРЕДМЕТЫ (на будущее)
  if (input.activeBuffs?.includes("greed_ring")) {
    raw += 1;
    breakdown.push({ label: "Кольцо Жадности", value: 1, type: "bonus" });
  }
  if (input.activeTraps?.includes("rotten_shawarma")) {
    raw -= 2;
    breakdown.push({ label: "Тухлая Шаурма (ловушка)", value: -2, type: "penalty" });
  }

  // === АКТИВКИ КЛАССОВ (стакаются с другими множителями) ===

  // Ярость Бати: ×2 если макс. сложность
  if (input.activeBuffs?.includes("class_fury") && input.isMaxDifficulty) {
    const before = raw;
    raw = raw * 2;
    breakdown.push({ label: "Ярость Бати — ×2", value: raw - before, type: "multiplier" });
  }

  // Самобичевание: ×2 на любую следующую игру (доверие)
  if (input.activeBuffs?.includes("class_self_flag")) {
    const before = raw;
    raw = raw * 2;
    breakdown.push({ label: "Самобичевание — ×2", value: raw - before, type: "multiplier" });
  }

  // Хайп Барда — +5 если выполнил, -3 если нет (отдельный сигнал из body)
  if (input.activeBuffs?.includes("class_hype_success")) {
    raw += 5;
    breakdown.push({ label: "Хайп выполнен — +5", value: 5, type: "bonus" });
  } else if (input.activeBuffs?.includes("class_hype_fail")) {
    raw -= 3;
    breakdown.push({ label: "Хайп провален — −3", value: -3, type: "penalty" });
  }

  // Очень мощный бафф — Сердце Тьмы — даёт x3 (если игрок принял на макс. сложности)
  let hardCapMultiplier = 1;
  if (input.activeBuffs?.includes("heart_of_dark") && input.isMaxDifficulty) {
    hardCapMultiplier = 3;
    breakdown.push({ label: "Сердце Тьмы — x3", value: raw * 2, type: "multiplier" });
    raw = raw * 3;
  }

  // 7.5) МНОЖИТЕЛЬ ОТ ПРЕДМЕТА — ×1.5
  if (input.activeBuffs?.includes("points_mult_next")) {
    const before = raw;
    raw = Math.round(raw * 1.5);
    breakdown.push({
      label: "Бафф предмета: ×1.5",
      value: raw - before,
      type: "multiplier",
    });
  }

  // 8) ФАЗОВЫЙ МНОЖИТЕЛЬ — на 15+ дне сезона x1.5
  if (input.seasonDay >= 15) {
    const before = raw;
    raw = Math.round(raw * 1.5);
    breakdown.push({
      label: "Фаза Гонки (день 15+): множитель ×1.5",
      value: raw - before,
      type: "multiplier",
    });
  }

  // 9) ЛИМИТ 25 — для всех кроме случая с Сердцем Тьмы (там до 75)
  const cap = hardCapMultiplier > 1 ? 75 : 25;
  let cappedAt25 = false;
  if (raw > cap) {
    breakdown.push({
      label: `Лимит ${cap} поинтов/игру`,
      value: cap - raw,
      type: "penalty",
    });
    raw = cap;
    cappedAt25 = true;
  }

  // Минимум 0 (если штрафы перевесили)
  if (raw < 0) raw = 0;

  return { total: raw, breakdown, cappedAt25 };
}

// === БОНУС КЛАССА ===
function getClassBonus(input: CalcInput): PointsBreakdownEntry {
  switch (input.playerClass) {
    case "berserker":
      // Натиск Бати — на макс. сложности +50%
      if (input.isMaxDifficulty) {
        return { label: "Берсерк: натиск (макс. сложность)", value: 3, type: "bonus" };
      }
      break;

    case "loreman":
      // Терпеливое Око — за 15+/30+/50+ часов +3/5/10
      if (input.hours !== null) {
        if (input.hours >= 50) return { label: "Лороман: Терпеливое Око (50+ ч)", value: 10, type: "bonus" };
        if (input.hours >= 30) return { label: "Лороман: Терпеливое Око (30+ ч)", value: 5, type: "bonus" };
        if (input.hours >= 15) return { label: "Лороман: Терпеливое Око (15+ ч)", value: 3, type: "bonus" };
      }
      break;

    case "sufferer":
      // Сладость Страдания — за рейтинг <60 +3, <40 +6
      if (input.rating !== null) {
        if (input.rating < 40) return { label: "Страдалец: Сладость (<40 рейтинг)", value: 6, type: "bonus" };
        if (input.rating < 60) return { label: "Страдалец: Сладость (<60 рейтинг)", value: 3, type: "bonus" };
      }
      break;

    case "alchemist":
      // Алхимик не имеет прямых бонусов поинтов
      break;

    case "bard":
      // Бард — +2 за квесты (но не за игры) — применяется в 3.6.2
      break;

    case "urka":
      // Урка — слабость в квестах NPC (применяется в 3.6.2)
      break;
  }
  return { label: "", value: 0, type: "bonus" };
}

// === ШТРАФ КЛАССА ===
function getClassPenalty(input: CalcInput): PointsBreakdownEntry {
  switch (input.playerClass) {
    case "loreman":
      // -1 за игры <5 часов
      if (input.hours !== null && input.hours < 5) {
        return { label: "Лороман: Презрение к Мелочи (<5 ч)", value: -1, type: "penalty" };
      }
      break;

    case "sufferer":
      // -2 за игры с рейтингом >85
      if (input.rating !== null && input.rating > 85) {
        return { label: "Страдалец: Презрение к Успеху (>85 рейтинг)", value: -2, type: "penalty" };
      }
      break;
  }
  return { label: "", value: 0, type: "penalty" };
}

// === Вспомогательный: получить текущий день сезона ===
// Использует startedAt сезона и текущую дату
export function getSeasonDay(startedAt: Date | null): number {
  if (!startedAt) return 1;
  const now = new Date();
  const diff = now.getTime() - new Date(startedAt).getTime();
  return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)) + 1);
}
