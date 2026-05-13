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
} from "./active-buffs";

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
};

// ========= ПАССИВНЫЕ ЭФФЕКТЫ (не вызываются через "Использовать") =========
// Просто проверяются при чтении инвентаря в других местах.
// cheap_move (Сапоги) → в move/route.ts
// greed       (Кольцо) → в points-formula.ts

export const PASSIVE_EFFECT_KEYS = new Set(["cheap_move", "greed", "hide_game"]);

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
