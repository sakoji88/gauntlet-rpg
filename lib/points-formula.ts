// Расчёт поинтов за прохождение игры.
//
// === ФИЛОСОФИЯ ===
// Базовая ценность игры пропорциональна КОРНЮ из часов: base = √hours × 3.
// Свойство sqrt: N часов в одной игре ≈ √N коротышей по 1 часу.
// Это значит «несколько коротких ≈ одна длинная» по часам — игроки не могут
// нафармить больше, чем у пути длинных игр.
//
// Дальше — % множители (условие, регион, класс, статы, фаза) и плоские
// бонусы (струггл, ловушки, активки). Cap 50 (75 с Сердцем Тьмы).

import { getRegionById } from "./regions";

function isGameInRegionGenres(gameRegion: string): boolean {
  return Boolean(gameRegion);
}

export interface PointsBreakdownEntry {
  label: string;
  value: number;
  type: "base" | "bonus" | "penalty" | "multiplier";
}

export interface PointsResult {
  total: number;
  breakdown: PointsBreakdownEntry[];
  cappedAt25: boolean; // legacy название — теперь это просто "сработал ли cap"
}

interface CalcInput {
  // Данные игры
  region: string;
  hours: number | null;            // часов потрачено игроком
  hltbHours?: number | null;       // эталон по HowLongToBeat (для struggle bonus)
  rating: number | null;           // личная оценка 0-10 (для лора)
  metacriticRating?: number | null; // 0-100, для пассивки Страдальца
  isMaxDifficulty: boolean;
  conditionType: "basic" | "genre" | "special";

  // Данные игрока
  playerClass: string | null;
  strength: number;
  patience: number;
  luck: number;
  charisma: number;

  // Данные сезона
  seasonDay: number;

  // Активные эффекты
  activeBuffs?: string[];
  activeTraps?: string[];

  // Первопроходец сезона (раз в сезон)
  firstInSeasonBonus?: number;

  // Плоский бонус от баффов с готовой подписью (catch_up, lucky_loser, монетки)
  itemFlatBonus?: { label: string; value: number };
}

// === КОНСТАНТЫ БАЛАНСА ===
const BASE_HOURS_RATE = 3;          // √hours × 3 — базовая ставка поинтов
const FALLBACK_HOURS = 5;           // если игрок не вписал часы

const COND_MULT = { basic: 1.0, genre: 1.3, special: 1.6 } as const;
const REGION_MULT = 1.05;           // +5% если игра в профильном регионе и cond genre/special
const STRENGTH_DIVISOR = 100;       // мягкий буст: сила/100 на Пустырях
const PATIENCE_DIVISOR = 120;       // мягкий буст: терпение/120 на 15ч+
const CHARISMA_DIVISOR = 200;       // мягкий буст: харизма/200 всегда

const LOREMAN_MULT_15H = 1.15;
const LOREMAN_MULT_30H = 1.25;
const LOREMAN_MULT_50H = 1.4;
const LOREMAN_PENALTY_LT5H = 0.7;   // смягчили с ×0.5 — мягкий «фи», не казнь

const BERSERKER_MAX_DIFF_MULT = 1.3;
const SUFFERER_MULT_LT60 = 1.2;
const SUFFERER_MULT_LT40 = 1.4;
const SUFFERER_PENALTY_GT85 = 0.7;

const PUNISH_TSHIRT_MULT = 1.3;     // points_mult_next
const PHASE_RACE_MULT = 1.3;        // 15+ день сезона
const FURY_MULT = 1.3;              // Ярость Бати на «тяжёлом прогоне» (раньше 1.5 — слишком жирно вкупе с Берсерк-классом 1.3)
const HEART_OF_DARK_MULT = 2;       // Сердце Тьмы на max diff (раньше ×3)
const SELF_FLAG_FLAT = 5;           // Самобичевание — теперь +5 плоско вместо ×2
const HYPE_SUCCESS = 5;
const HYPE_FAIL = -3;

const STRUGGLE_BONUS_CAP = 3;

const CAP_NORMAL = 50;
const CAP_HEART_OF_DARK = 75;

// === ОСНОВНАЯ ФУНКЦИЯ ===
export function calculatePoints(input: CalcInput): PointsResult {
  const breakdown: PointsBreakdownEntry[] = [];
  const hours = input.hours !== null && input.hours > 0 ? input.hours : FALLBACK_HOURS;

  // 1) БАЗА: √hours × 3
  let raw = Math.round(Math.sqrt(hours) * BASE_HOURS_RATE);
  if (raw < 1) raw = 1;
  breakdown.push({
    label: `База: √${input.hours ?? FALLBACK_HOURS}ч × ${BASE_HOURS_RATE}`,
    value: raw,
    type: "base",
  });

  // 2) УСЛОВИЕ (множитель)
  const condMult =
    COND_MULT[input.conditionType as keyof typeof COND_MULT] ?? 1.0;
  if (condMult !== 1.0) {
    const before = raw;
    raw = Math.round(raw * condMult);
    breakdown.push({
      label: `${input.conditionType === "special" ? "Особое условие 💎" : "Жанровое условие"} ×${condMult}`,
      value: raw - before,
      type: "multiplier",
    });
  }

  // 3) РЕГИОН — только если игрок взял genre/special профильные условия
  if (
    (input.conditionType === "genre" || input.conditionType === "special") &&
    isGameInRegionGenres(input.region)
  ) {
    const before = raw;
    raw = Math.round(raw * REGION_MULT);
    const region = getRegionById(input.region);
    breakdown.push({
      label: `Регион «${region?.shortName ?? input.region}» ×${REGION_MULT}`,
      value: raw - before,
      type: "multiplier",
    });
  }

  // 4) СТАТЫ как мягкие %
  if (input.region === "pustyri" && input.strength > 0) {
    const mult = 1 + input.strength / STRENGTH_DIVISOR;
    const before = raw;
    raw = Math.round(raw * mult);
    if (raw !== before) {
      breakdown.push({
        label: `Сила ${input.strength} ×${mult.toFixed(2)} (Пустыри)`,
        value: raw - before,
        type: "multiplier",
      });
    }
  }

  if (hours >= 15 && input.patience > 0) {
    const mult = 1 + input.patience / PATIENCE_DIVISOR;
    const before = raw;
    raw = Math.round(raw * mult);
    if (raw !== before) {
      breakdown.push({
        label: `Терпение ${input.patience} ×${mult.toFixed(2)} (15ч+)`,
        value: raw - before,
        type: "multiplier",
      });
    }
  }

  if (input.charisma > 0) {
    const mult = 1 + input.charisma / CHARISMA_DIVISOR;
    const before = raw;
    raw = Math.round(raw * mult);
    if (raw !== before) {
      breakdown.push({
        label: `Харизма ${input.charisma} ×${mult.toFixed(2)}`,
        value: raw - before,
        type: "multiplier",
      });
    }
  }

  // 5) КЛАССОВЫЙ БУСТ (множитель)
  const classBuff = applyClassMultiplier(raw, input);
  if (classBuff.label) {
    raw = classBuff.newRaw;
    breakdown.push({
      label: classBuff.label,
      value: classBuff.delta,
      type: "multiplier",
    });
  }

  // 6) КЛАССОВЫЙ ШТРАФ (множитель < 1)
  const classPenalty = applyClassPenalty(raw, input);
  if (classPenalty.label) {
    raw = classPenalty.newRaw;
    breakdown.push({
      label: classPenalty.label,
      value: classPenalty.delta,
      type: "penalty",
    });
  }

  // 7) Punish-футболка (×1.3 вместо старого 1.5)
  if (input.activeBuffs?.includes("points_mult_next")) {
    const before = raw;
    raw = Math.round(raw * PUNISH_TSHIRT_MULT);
    breakdown.push({
      label: `Punish-футболка ×${PUNISH_TSHIRT_MULT}`,
      value: raw - before,
      type: "multiplier",
    });
  }

  // 8) ФАЗА ГОНКИ (15+ день сезона)
  if (input.seasonDay >= 15) {
    const before = raw;
    raw = Math.round(raw * PHASE_RACE_MULT);
    breakdown.push({
      label: `Фаза Гонки ×${PHASE_RACE_MULT}`,
      value: raw - before,
      type: "multiplier",
    });
  }

  // === ПЛОСКИЕ БОНУСЫ/ШТРАФЫ ===

  // Первопроходец Сезона
  if (input.firstInSeasonBonus && input.firstInSeasonBonus > 0) {
    raw += input.firstInSeasonBonus;
    breakdown.push({
      label: "Первопроходец Сезона",
      value: input.firstInSeasonBonus,
      type: "bonus",
    });
  }

  // ItemFlatBonus с готовой подписью (catch_up, lucky_loser, монетки)
  if (input.itemFlatBonus && input.itemFlatBonus.value !== 0) {
    raw += input.itemFlatBonus.value;
    breakdown.push({
      label: input.itemFlatBonus.label,
      value: input.itemFlatBonus.value,
      type: input.itemFlatBonus.value > 0 ? "bonus" : "penalty",
    });
  }

  // Расходники +N
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

  // Кольцо Жадности
  if (input.activeBuffs?.includes("greed_ring")) {
    raw += 1;
    breakdown.push({ label: "Кольцо Жадности +1", value: 1, type: "bonus" });
  }

  // Ловушки
  if (input.activeTraps?.includes("rotten_shawarma")) {
    raw -= 2;
    breakdown.push({ label: "Тухлая Шаурма (ловушка)", value: -2, type: "penalty" });
  }
  if (input.activeTraps?.includes("barin_curse")) {
    raw -= 2;
    breakdown.push({ label: "Проклятье барина (ловушка)", value: -2, type: "penalty" });
  }

  // Самобичевание — плоское +5 (раньше ×2 — слишком жирно при новой базе)
  if (input.activeBuffs?.includes("class_self_flag")) {
    raw += SELF_FLAG_FLAT;
    breakdown.push({ label: `Самобичевание +${SELF_FLAG_FLAT}`, value: SELF_FLAG_FLAT, type: "bonus" });
  }

  // Хайп
  if (input.activeBuffs?.includes("class_hype_success")) {
    raw += HYPE_SUCCESS;
    breakdown.push({ label: `Хайп выполнен +${HYPE_SUCCESS}`, value: HYPE_SUCCESS, type: "bonus" });
  } else if (input.activeBuffs?.includes("class_hype_fail")) {
    raw += HYPE_FAIL;
    breakdown.push({ label: `Хайп провален ${HYPE_FAIL}`, value: HYPE_FAIL, type: "penalty" });
  }

  // === КРИТМНОЖИТЕЛИ (после плоских — чтобы стакалось правильно) ===

  // Ярость Бати ×1.5 на max diff
  if (input.activeBuffs?.includes("class_fury") && input.isMaxDifficulty) {
    const before = raw;
    raw = Math.round(raw * FURY_MULT);
    breakdown.push({ label: `Ярость Бати ×${FURY_MULT}`, value: raw - before, type: "multiplier" });
  }

  // Сердце Тьмы ×2 на max diff
  let heartActive = false;
  if (input.activeBuffs?.includes("heart_of_dark") && input.isMaxDifficulty) {
    heartActive = true;
    const before = raw;
    raw = Math.round(raw * HEART_OF_DARK_MULT);
    breakdown.push({ label: `Сердце Тьмы ×${HEART_OF_DARK_MULT}`, value: raw - before, type: "multiplier" });
  }

  // Struggle bonus (HLTB) — +0..3 за отклонение от эталона
  if (
    input.hltbHours !== null &&
    input.hltbHours !== undefined &&
    input.hltbHours > 0 &&
    input.hours !== null &&
    input.hours > 0
  ) {
    const ratio = input.hours / input.hltbHours;
    const dev = Math.abs(Math.log(ratio));
    const bonus = Math.max(0, Math.min(STRUGGLE_BONUS_CAP, Math.round(dev * 2)));
    if (bonus > 0) {
      raw += bonus;
      breakdown.push({
        label: `${ratio < 1 ? "Спидран" : "Тупняк"} ×${ratio.toFixed(2)} от HLTB +${bonus}`,
        value: bonus,
        type: "bonus",
      });
    }
  }

  // === CAP ===
  const cap = heartActive ? CAP_HEART_OF_DARK : CAP_NORMAL;
  let capHit = false;
  if (raw > cap) {
    breakdown.push({
      label: `Лимит ${cap} поинтов/игру`,
      value: cap - raw,
      type: "penalty",
    });
    raw = cap;
    capHit = true;
  }
  if (raw < 1) raw = 1; // никогда не 0 — за прохождение всегда что-то

  return { total: raw, breakdown, cappedAt25: capHit };
}

// === КЛАССОВЫЕ МНОЖИТЕЛИ ===
function applyClassMultiplier(
  raw: number,
  input: CalcInput,
): { newRaw: number; delta: number; label: string } {
  switch (input.playerClass) {
    case "berserker":
      if (input.isMaxDifficulty) {
        const next = Math.round(raw * BERSERKER_MAX_DIFF_MULT);
        return { newRaw: next, delta: next - raw, label: `Берсерк max сложность ×${BERSERKER_MAX_DIFF_MULT}` };
      }
      break;

    case "loreman":
      if (input.hours !== null) {
        if (input.hours >= 50) {
          const next = Math.round(raw * LOREMAN_MULT_50H);
          return { newRaw: next, delta: next - raw, label: `Лороман 50ч+ ×${LOREMAN_MULT_50H}` };
        }
        if (input.hours >= 30) {
          const next = Math.round(raw * LOREMAN_MULT_30H);
          return { newRaw: next, delta: next - raw, label: `Лороман 30ч+ ×${LOREMAN_MULT_30H}` };
        }
        if (input.hours >= 15) {
          const next = Math.round(raw * LOREMAN_MULT_15H);
          return { newRaw: next, delta: next - raw, label: `Лороман 15ч+ ×${LOREMAN_MULT_15H}` };
        }
      }
      break;

    case "sufferer": {
      const mc = input.metacriticRating;
      if (mc !== null && mc !== undefined) {
        if (mc < 40) {
          const next = Math.round(raw * SUFFERER_MULT_LT40);
          return { newRaw: next, delta: next - raw, label: `Страдалец (Metacritic <40) ×${SUFFERER_MULT_LT40}` };
        }
        if (mc < 60) {
          const next = Math.round(raw * SUFFERER_MULT_LT60);
          return { newRaw: next, delta: next - raw, label: `Страдалец (Metacritic <60) ×${SUFFERER_MULT_LT60}` };
        }
      }
      break;
    }
  }
  return { newRaw: raw, delta: 0, label: "" };
}

// === КЛАССОВЫЕ ШТРАФЫ ===
function applyClassPenalty(
  raw: number,
  input: CalcInput,
): { newRaw: number; delta: number; label: string } {
  switch (input.playerClass) {
    case "loreman":
      // Презрение к Мелочи — теперь ×0.7 (раньше ×0.5 / -1). Мягкое «фи».
      if (input.hours !== null && input.hours < 5) {
        const next = Math.round(raw * LOREMAN_PENALTY_LT5H);
        return {
          newRaw: next,
          delta: next - raw,
          label: `Лороман <5ч ×${LOREMAN_PENALTY_LT5H} (Презрение к Мелочи)`,
        };
      }
      break;

    case "sufferer": {
      const mc = input.metacriticRating;
      if (mc !== null && mc !== undefined && mc > 85) {
        const next = Math.round(raw * SUFFERER_PENALTY_GT85);
        return {
          newRaw: next,
          delta: next - raw,
          label: `Страдалец >85 Metacritic ×${SUFFERER_PENALTY_GT85} (Презрение к Успеху)`,
        };
      }
      break;
    }
  }
  return { newRaw: raw, delta: 0, label: "" };
}

// === День сезона (UTC) ===
export function getSeasonDay(startedAt: Date | null): number {
  if (!startedAt) return 1;
  const now = new Date();
  const diff = now.getTime() - new Date(startedAt).getTime();
  return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)) + 1);
}
