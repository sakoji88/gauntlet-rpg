// Реестр эффектов предметов.
//
// Структура: для каждого effectKey описан handler, который выполняет применение
// (мутации БД, проверки и т.д.) в транзакции и возвращает результат.
//
// 4 класса эффектов:
//   INSTANT — мгновенное действие (изменение energy, освобождение из тюрьмы)
//   BUFF    — добавление в Player.activeBuffs до срабатывания на событии
//   PASSIVE — пассивные эффекты в инвентаре (тут не "использовать", просто храним)
//   WEEKLY  — с кулдауном (Половник)
//
// Срабатывание BUFF происходит в соответствующих роутах:
//   triple_points     — finish/route.ts complete на max difficulty (consumed)
//   prevent_drop      — finish/route.ts drop (consumed)
//   lucky_roll        — wheel/spin (consumed)
//   choose_of_three   — wheel/spin (consumed)
//   reroll_game       — отдельный UI / API (consumed)

import { prisma } from "./prisma";
import type { Prisma, Player, InventoryItem } from "@prisma/client";
import {
  parseActiveBuffs,
  serializeActiveBuffs,
  hasBuff,
  addBuff,
  removeBuff,
} from "./active-buffs";
import { TRAP_BUFF_KEYS } from "./trap-effects";

export type EffectClass = "INSTANT" | "BUFF" | "PASSIVE" | "WEEKLY";

// === ОПИСАНИЕ КАЖДОГО ЭФФЕКТА ===
export interface EffectMeta {
  effectKey: string;
  class: EffectClass;
  // Можно ли активировать? Если нет — текст для UI.
  // (Например для prevent_drop проверяем что не использован в этом сезоне.)
  isUsable?: (ctx: UsabilityCtx) => { ok: true } | { ok: false; reason: string };
  // Запускается при /api/player/inventory/use. Должна вернуть текст-итог для UI.
  // Все мутации БД выполняются внутри. Charges предмета уже декрементированы снаружи.
  apply: (ctx: ApplyCtx) => Promise<{ message: string; data?: Record<string, unknown> }>;
}

export interface UsabilityCtx {
  player: Player;
  invItem: InventoryItem;
  activeSeasonId: string | null;
}

export interface ApplyCtx {
  tx: Prisma.TransactionClient;
  player: Player;
  invItem: InventoryItem;
  activeSeasonId: string | null;
}

// === РЕЕСТР ===
export const EFFECTS: Record<string, EffectMeta> = {
  // ========= INSTANT (мгновенные) =========
  add_energy_1: {
    effectKey: "add_energy_1",
    class: "INSTANT",
    isUsable: ({ player }) =>
      player.energy >= 3
        ? { ok: false, reason: "У тебя уже максимум ходов" }
        : { ok: true },
    apply: async ({ tx, player }) => {
      await tx.player.update({
        where: { id: player.id },
        data: { energy: { increment: 1 } },
      });
      return { message: "+1 ход" };
    },
  },

  add_energy_2: {
    effectKey: "add_energy_2",
    class: "INSTANT",
    isUsable: ({ player }) =>
      player.energy >= 3
        ? { ok: false, reason: "У тебя уже максимум ходов" }
        : { ok: true },
    apply: async ({ tx, player }) => {
      // Кофе даёт +2 ходов — энергия может уйти выше 3 в виде "бонусной"
      await tx.player.update({
        where: { id: player.id },
        data: { energy: { increment: 2 } },
      });
      return { message: "+2 хода. Бодрит." };
    },
  },

  escape_prison: {
    effectKey: "escape_prison",
    class: "INSTANT",
    isUsable: ({ player }) =>
      !player.inPrison
        ? { ok: false, reason: "Ты не в тюрьме" }
        : { ok: true },
    apply: async ({ tx, player }) => {
      await tx.player.update({
        where: { id: player.id },
        data: { inPrison: false },
      });
      // Активную тюремную игру — отменяем (если есть)
      if (player.activeGameId) {
        await tx.game.update({
          where: { id: player.activeGameId },
          data: { status: "DROPPED", completedAt: new Date() },
        });
        await tx.player.update({
          where: { id: player.id },
          data: { activeGameId: null },
        });
      }
      return { message: "Стражник отвёл взгляд. Ты свободен — но всё ещё на клетке Тюрьмы." };
    },
  },

  // ========= BUFF (на следующее событие) =========
  triple_points: {
    effectKey: "triple_points",
    class: "BUFF",
    isUsable: ({ player }) => {
      const buffs = parseActiveBuffs(player.activeBuffs);
      if (hasBuff(buffs, "triple_points")) {
        return { ok: false, reason: "Бафф уже активен" };
      }
      return { ok: true };
    },
    apply: async ({ tx, player }) => {
      const buffs = parseActiveBuffs(player.activeBuffs);
      const next = addBuff(buffs, {
        effectKey: "triple_points",
        sourceItemId: "heart_of_dark",
        activatedAt: new Date().toISOString(),
      });
      await tx.player.update({
        where: { id: player.id },
        data: { activeBuffs: serializeActiveBuffs(next) },
      });
      return {
        message:
          "Сердце Тьмы бьётся в твоей груди. Следующая игра на МАКС. СЛОЖНОСТИ даст ×3 поинтов.",
      };
    },
  },

  prevent_drop: {
    effectKey: "prevent_drop",
    class: "BUFF",
    isUsable: ({ player, activeSeasonId }) => {
      if (!activeSeasonId) {
        return { ok: false, reason: "Нет активного сезона" };
      }
      if (player.helmetUsedSeasonId === activeSeasonId) {
        return { ok: false, reason: "Шлем уже использован в этом сезоне" };
      }
      const buffs = parseActiveBuffs(player.activeBuffs);
      if (hasBuff(buffs, "prevent_drop")) {
        return { ok: false, reason: "Бафф уже активен" };
      }
      return { ok: true };
    },
    apply: async ({ tx, player }) => {
      const buffs = parseActiveBuffs(player.activeBuffs);
      const next = addBuff(buffs, {
        effectKey: "prevent_drop",
        sourceItemId: "survivor_helmet",
        activatedAt: new Date().toISOString(),
      });
      await tx.player.update({
        where: { id: player.id },
        data: { activeBuffs: serializeActiveBuffs(next) },
      });
      return {
        message:
          "Шлем Сурвайвора надет. Один следующий дроп будет отменён (но шлем уйдёт).",
      };
    },
  },

  lucky_roll: {
    effectKey: "lucky_roll",
    class: "BUFF",
    isUsable: ({ player }) => {
      const buffs = parseActiveBuffs(player.activeBuffs);
      if (hasBuff(buffs, "lucky_roll")) {
        return { ok: false, reason: "Бафф уже активен" };
      }
      return { ok: true };
    },
    apply: async ({ tx, player }) => {
      const buffs = parseActiveBuffs(player.activeBuffs);
      const next = addBuff(buffs, {
        effectKey: "lucky_roll",
        sourceItemId: "luck_potion",
        activatedAt: new Date().toISOString(),
      });
      await tx.player.update({
        where: { id: player.id },
        data: { activeBuffs: serializeActiveBuffs(next) },
      });
      return {
        message:
          "Зелье Удачи выпито. Следующее колесо предметов выдаст только редкое или выше.",
      };
    },
  },

  choose_of_three: {
    effectKey: "choose_of_three",
    class: "BUFF",
    isUsable: ({ player }) => {
      const buffs = parseActiveBuffs(player.activeBuffs);
      if (hasBuff(buffs, "choose_of_three")) {
        return { ok: false, reason: "Бафф уже активен" };
      }
      return { ok: true };
    },
    apply: async ({ tx, player }) => {
      const buffs = parseActiveBuffs(player.activeBuffs);
      const next = addBuff(buffs, {
        effectKey: "choose_of_three",
        sourceItemId: "wisdom_potion",
        activatedAt: new Date().toISOString(),
      });
      await tx.player.update({
        where: { id: player.id },
        data: { activeBuffs: serializeActiveBuffs(next) },
      });
      return {
        message:
          "Зелье Мудрости. Следующее колесо предметов покажет 3 на выбор.",
      };
    },
  },

  reroll_game: {
    effectKey: "reroll_game",
    class: "INSTANT",
    isUsable: ({ player }) => {
      if (!player.activeGameId) {
        return { ok: false, reason: "Нет активной игры для реролла" };
      }
      return { ok: true };
    },
    apply: async ({ tx, player }) => {
      // Свиток отменяет текущую игру БЕЗ штрафа и тюрьмы.
      // Игра помечается как DROPPED (для истории), но без -2 поинтов.
      if (player.activeGameId) {
        await tx.game.update({
          where: { id: player.activeGameId },
          data: {
            status: "DROPPED",
            description: "[Свиток Реролла — отменено без штрафа]",
            pointsEarned: 0,
            completedAt: new Date(),
          },
        });
        await tx.player.update({
          where: { id: player.id },
          data: { activeGameId: null },
        });
      }
      return {
        message:
          "Свиток сгорел в твоей руке. Активная игра отменена без штрафа. Иди и роллни новую — у тебя ещё есть ходы.",
      };
    },
  },

  // ========= WEEKLY (с кулдауном) =========
  stat_boost_random: {
    effectKey: "stat_boost_random",
    class: "WEEKLY",
    isUsable: ({ invItem }) => {
      if (invItem.lastUsedAt) {
        const sinceMs = Date.now() - invItem.lastUsedAt.getTime();
        const weekMs = 7 * 24 * 60 * 60 * 1000;
        if (sinceMs < weekMs) {
          const daysLeft = Math.ceil((weekMs - sinceMs) / (24 * 60 * 60 * 1000));
          return { ok: false, reason: `Половник остыл. Ждать ещё ${daysLeft}д` };
        }
      }
      return { ok: true };
    },
    apply: async ({ tx, player, invItem }) => {
      // Случайный стат
      const stats: Array<keyof Pick<Player, "strength" | "patience" | "luck" | "charisma">> = [
        "strength",
        "patience",
        "luck",
        "charisma",
      ];
      const stat = stats[Math.floor(Math.random() * stats.length)];
      const labels: Record<typeof stat, string> = {
        strength: "Силу",
        patience: "Терпение",
        luck: "Удачу",
        charisma: "Харизму",
      };

      await tx.player.update({
        where: { id: player.id },
        data: { [stat]: { increment: 5 } } as Record<string, unknown>,
      });
      await tx.inventoryItem.update({
        where: { id: invItem.id },
        data: { lastUsedAt: new Date() },
      });

      return {
        message: `Сварено! +5 к ${labels[stat]}.`,
        data: { stat, delta: 5 },
      };
    },
  },

  // ========= INSTANT: Злато (новые) =========
  gain_gold_10: {
    effectKey: "gain_gold_10",
    class: "INSTANT",
    apply: async ({ tx, player }) => {
      await tx.player.update({
        where: { id: player.id },
        data: { gold: { increment: 10 } },
      });
      return { message: "+10 Злата звякнуло в кошель." };
    },
  },

  gain_gold_25: {
    effectKey: "gain_gold_25",
    class: "INSTANT",
    apply: async ({ tx, player }) => {
      await tx.player.update({
        where: { id: player.id },
        data: { gold: { increment: 25 } },
      });
      return { message: "+25 Злата. Романал бы позавидовал." };
    },
  },

  // ========= INSTANT: EXP =========
  // Уровень пересчитается при следующем завершении игры/квеста.
  gain_exp_25: {
    effectKey: "gain_exp_25",
    class: "INSTANT",
    apply: async ({ tx, player }) => {
      await tx.player.update({
        where: { id: player.id },
        data: { exp: { increment: 25 } },
      });
      return { message: "+25 опыта влилось в твою душу." };
    },
  },

  gain_exp_50: {
    effectKey: "gain_exp_50",
    class: "INSTANT",
    apply: async ({ tx, player }) => {
      await tx.player.update({
        where: { id: player.id },
        data: { exp: { increment: 50 } },
      });
      return { message: "+50 опыта. Ты стал чуть менее ничтожен." };
    },
  },

  // ========= INSTANT: +3 хода =========
  add_energy_3: {
    effectKey: "add_energy_3",
    class: "INSTANT",
    isUsable: ({ player }) =>
      player.energy >= 3
        ? { ok: false, reason: "У тебя уже максимум ходов" }
        : { ok: true },
    apply: async ({ tx, player }) => {
      await tx.player.update({
        where: { id: player.id },
        data: { energy: { increment: 3 } },
      });
      return { message: "+3 хода. Полный заряд — гуляй." };
    },
  },

  // ========= INSTANT: +1 случайный стат =========
  heal_stat_1: {
    effectKey: "heal_stat_1",
    class: "INSTANT",
    apply: async ({ tx, player }) => {
      const stats: Array<keyof Pick<Player, "strength" | "patience" | "luck" | "charisma">> = [
        "strength",
        "patience",
        "luck",
        "charisma",
      ];
      const stat = stats[Math.floor(Math.random() * stats.length)];
      const labels: Record<typeof stat, string> = {
        strength: "Силе",
        patience: "Терпению",
        luck: "Удаче",
        charisma: "Харизме",
      };
      await tx.player.update({
        where: { id: player.id },
        data: { [stat]: { increment: 1 } } as Record<string, unknown>,
      });
      return { message: `+1 к ${labels[stat]}.`, data: { stat, delta: 1 } };
    },
  },

  // ========= INSTANT: снять все дебаффы/ловушки с себя =========
  cleanse_debuffs: {
    effectKey: "cleanse_debuffs",
    class: "INSTANT",
    isUsable: ({ player }) => {
      const buffs = parseActiveBuffs(player.activeBuffs);
      const bad = buffs.filter(
        (b) => TRAP_BUFF_KEYS.includes(b.effectKey) || b.effectKey === "perov_disdain",
      );
      return bad.length > 0
        ? { ok: true }
        : { ok: false, reason: "На тебе нет ни ловушек, ни дебаффов" };
    },
    apply: async ({ tx, player }) => {
      let buffs = parseActiveBuffs(player.activeBuffs);
      const before = buffs.length;
      for (const key of [...TRAP_BUFF_KEYS, "perov_disdain"]) {
        buffs = removeBuff(buffs, key);
      }
      await tx.player.update({
        where: { id: player.id },
        data: { activeBuffs: serializeActiveBuffs(buffs) },
      });
      return {
        message: `Очищено. Снято дебаффов: ${before - buffs.length}.`,
      };
    },
  },

  // ========= BUFF: +поинты следующей завершённой игре =========
  points_next_2: makePointsBuff("points_next_2", 2),
  points_next_3: makePointsBuff("points_next_3", 3),
  points_next_5: makePointsBuff("points_next_5", 5),

  // ========= BUFF: ×1.5 множитель следующей игре =========
  points_mult_next: {
    effectKey: "points_mult_next",
    class: "BUFF",
    isUsable: ({ player }) => {
      const buffs = parseActiveBuffs(player.activeBuffs);
      return hasBuff(buffs, "points_mult_next")
        ? { ok: false, reason: "Множитель уже активен" }
        : { ok: true };
    },
    apply: async ({ tx, player, invItem }) => {
      const buffs = parseActiveBuffs(player.activeBuffs);
      const next = addBuff(buffs, {
        effectKey: "points_mult_next",
        sourceItemId: invItem.itemId,
        activatedAt: new Date().toISOString(),
      });
      await tx.player.update({
        where: { id: player.id },
        data: { activeBuffs: serializeActiveBuffs(next) },
      });
      return {
        message: "Готово. Следующая засчитанная игра даст ×1.5 поинтов.",
      };
    },
  },

  // ========= INSTANT: +50 Злата =========
  gain_gold_50: {
    effectKey: "gain_gold_50",
    class: "INSTANT",
    apply: async ({ tx, player }) => {
      await tx.player.update({
        where: { id: player.id },
        data: { gold: { increment: 50 } },
      });
      return { message: "+50 Злата в кошель." };
    },
  },

  // ========= BUFF: следующее перемещение бесплатно =========
  free_move: makeMarkerBuff("free_move", "Готово. Следующее перемещение по карте — бесплатное."),

  // ========= BUFF: следующая игра даёт ×2 Злата =========
  gold_double_next: makeMarkerBuff(
    "gold_double_next",
    "Готово. Следующая засчитанная игра даст ×2 Злата.",
  ),

  // ========= BUFF: следующий квест даёт ×2 поинтов =========
  quest_double_next: makeMarkerBuff(
    "quest_double_next",
    "Готово. Следующий выполненный квест даст ×2 поинтов.",
  ),

  // ========= BUFF: первая ловушка на тебе будет погашена =========
  protect_from_trap: makeMarkerBuff(
    "protect_from_trap",
    "Защита надета. Первая брошенная в тебя ловушка не сработает.",
  ),

  // ========= BUFF: следующая игра — ×2 опыта =========
  exp_double_next: makeMarkerBuff(
    "exp_double_next",
    "Готово. Следующая засчитанная игра даст ×2 опыта.",
  ),

  // ========= BUFF: бонус догоняющему — +N поинтов по месту в рейтинге =========
  catch_up_bonus: makeMarkerBuff(
    "catch_up_bonus",
    "Готово. Следующая игра даст +поинты по твоему отставанию от лидера (до +6).",
  ),

  // ========= BUFF: +1 поинт за каждый активный дебафф на следующей игре =========
  lucky_loser: makeMarkerBuff(
    "lucky_loser",
    "Готово. Следующая игра даст +1 поинт за каждый активный на тебе дебафф (до +6).",
  ),

  // ========= BUFF: следующий дроп — без Тюрьмы =========
  no_prison_next_drop: makeMarkerBuff(
    "no_prison_next_drop",
    "Готово. Если дропнешь следующую игру — −2 поинта получишь, но в Тюрьму не пойдёшь.",
  ),

  // ========= INSTANT: снять случайный дебафф, выдать случайный бафф =========
  debuff_to_buff: {
    effectKey: "debuff_to_buff",
    class: "INSTANT",
    isUsable: ({ player }) => {
      const buffs = parseActiveBuffs(player.activeBuffs);
      const bad = buffs.filter(
        (b) => TRAP_BUFF_KEYS.includes(b.effectKey) || b.effectKey === "perov_disdain",
      );
      return bad.length > 0
        ? { ok: true }
        : { ok: false, reason: "На тебе нет дебаффов — нечего конвертировать" };
    },
    apply: async ({ tx, player, invItem }) => {
      let buffs = parseActiveBuffs(player.activeBuffs);
      const bad = buffs.filter(
        (b) => TRAP_BUFF_KEYS.includes(b.effectKey) || b.effectKey === "perov_disdain",
      );
      // Снимаем один случайный дебафф
      const removed = bad[Math.floor(Math.random() * bad.length)];
      buffs = removeBuff(buffs, removed.effectKey);
      // Выдаём случайный бафф из пула
      const goodPool = [
        "lucky_roll",
        "choose_of_three",
        "points_next_3",
        "gold_double_next",
        "free_move",
      ];
      const goodKey = goodPool[Math.floor(Math.random() * goodPool.length)];
      buffs = addBuff(buffs, {
        effectKey: goodKey,
        sourceItemId: invItem.itemId,
        activatedAt: new Date().toISOString(),
      });
      await tx.player.update({
        where: { id: player.id },
        data: { activeBuffs: serializeActiveBuffs(buffs) },
      });
      return {
        message: `Порча обращена в дар. Дебафф снят, выдан бафф: ${goodKey}.`,
      };
    },
  },
};

// Универсальная фабрика BUFF-маркеров — кладёт бафф в Player.activeBuffs,
// потребители (роуты move/finish/throw) сами проверяют и сжигают.
function makeMarkerBuff(effectKey: string, message: string): EffectMeta {
  return {
    effectKey,
    class: "BUFF",
    isUsable: ({ player }) => {
      const buffs = parseActiveBuffs(player.activeBuffs);
      return hasBuff(buffs, effectKey)
        ? { ok: false, reason: "Такой бафф уже активен" }
        : { ok: true };
    },
    apply: async ({ tx, player, invItem }) => {
      const buffs = parseActiveBuffs(player.activeBuffs);
      const next = addBuff(buffs, {
        effectKey,
        sourceItemId: invItem.itemId,
        activatedAt: new Date().toISOString(),
      });
      await tx.player.update({
        where: { id: player.id },
        data: { activeBuffs: serializeActiveBuffs(next) },
      });
      return { message };
    },
  };
}

// Фабрика BUFF-эффекта «+N поинтов следующей игре».
// Бафф ловится и сжигается в finish/route.ts на complete.
function makePointsBuff(effectKey: string, amount: number): EffectMeta {
  return {
    effectKey,
    class: "BUFF",
    isUsable: ({ player }) => {
      const buffs = parseActiveBuffs(player.activeBuffs);
      return hasBuff(buffs, effectKey)
        ? { ok: false, reason: "Такой бафф уже активен" }
        : { ok: true };
    },
    apply: async ({ tx, player, invItem }) => {
      const buffs = parseActiveBuffs(player.activeBuffs);
      const next = addBuff(buffs, {
        effectKey,
        sourceItemId: invItem.itemId,
        activatedAt: new Date().toISOString(),
      });
      await tx.player.update({
        where: { id: player.id },
        data: { activeBuffs: serializeActiveBuffs(next) },
      });
      return {
        message: `Готово. Следующая засчитанная игра даст +${amount} поинтов.`,
      };
    },
  };
}

// ========= ПАССИВНЫЕ ЭФФЕКТЫ (не вызываются через "Использовать") =========
// Просто проверяются при чтении инвентаря в других местах.
// cheap_move (Сапоги) → в move/route.ts
// greed       (Кольцо) → в points-formula.ts

export const PASSIVE_EFFECT_KEYS = new Set([
  "cheap_move",
  "greed",
  "passive_gold_find",
]);

// ========= ХЕЛПЕРЫ =========
export function getEffectMeta(effectKey: string): EffectMeta | null {
  return EFFECTS[effectKey] ?? null;
}

export function isPassive(effectKey: string): boolean {
  return PASSIVE_EFFECT_KEYS.has(effectKey);
}

/**
 * Проверка пассивного эффекта по инвентарю игрока.
 * Возвращает true если у игрока есть хотя бы один предмет с данным effectKey
 * и charges > 0.
 */
export async function hasPassiveEffect(
  playerId: string,
  effectKey: string,
): Promise<boolean> {
  const count = await prisma.inventoryItem.count({
    where: {
      playerId,
      charges: { gt: 0 },
      item: { effectKey },
    },
  });
  return count > 0;
}
