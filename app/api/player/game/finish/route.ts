import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { calculatePoints, getSeasonDay } from "@/lib/points-formula";
import { parseQuestParams, parseQuestRewards } from "@/lib/quest-types";
import { recomputeAndPersistLevel } from "@/lib/level-formula";
import {
  parseActiveBuffs,
  removeBuff,
  serializeActiveBuffs,
  hasBuff,
} from "@/lib/active-buffs";
import { hasPassiveEffect } from "@/lib/item-effects";
import type { Quest, Player } from "@prisma/client";

const PRISON_REGION_ID = "prison";
const POINTS_DROP_PENALTY = -2;
const EXP_PER_COMPLETION = 10;
const PRISON_EXP_REWARD = 5;    // EXP за тюремную игру — меньше обычного

// Злато (мягкая валюта магазина) — капает за прохождения
const GOLD_PER_COMPLETION = 3;  // обычная пройденная игра
const GOLD_PER_PRISON = 1;      // тюремная игра — меньше
const GOLD_PER_QUEST = 5;       // выполненный квест

// Тюремные награды (накладываются вместе, можно получить все три)
const PRISON_FAST_BONUS = 1;        // прошёл быстро (часов ≤ 9)
const PRISON_FAST_THRESHOLD = 9;
const PRISON_HARD_BONUS = 1;        // макс. сложность
const PRISON_LOW_RATING_BONUS = 1;  // прошёл реально плохую игру (рейтинг ≤ 30)
const PRISON_LOW_RATING_THRESHOLD = 30;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Кривое тело" }, { status: 400 });
  }

  const { action, hours, rating, description, isMaxDifficulty, bardHonored } = body;

  if (action !== "complete" && action !== "drop") {
    return NextResponse.json({ error: "Неизвестное действие" }, { status: 400 });
  }

  const player = await prisma.player.findUnique({ where: { userId } });
  if (!player || !player.activeGameId) {
    return NextResponse.json({ error: "Нет активной игры" }, { status: 400 });
  }

  const game = await prisma.game.findUnique({ where: { id: player.activeGameId } });
  if (!game) {
    return NextResponse.json({ error: "Игра не найдена" }, { status: 404 });
  }

  // ======== ПРОШЁЛ ========
  if (action === "complete") {
    // ====== ТЮРЕМНАЯ ИГРА: освобождение ======
    // Прохождение тюремной игры — не нормальная победа, формулой не считается.
    // Поинты дают ТОЛЬКО за реальные заслуги: скорость, макс. сложность, низкий рейтинг.
    if (game.region === PRISON_REGION_ID) {
      const hoursNum = typeof hours === "number" ? hours : null;
      const ratingNum = typeof rating === "number" ? rating : null;
      const maxDiff = Boolean(isMaxDifficulty);

      const breakdown: { label: string; value: number; type: "base" | "bonus" | "penalty" | "multiplier" }[] = [];
      let total = 0;

      // ⚡ Скорая отсидка — прошёл быстро (часов ≤ 9, минимум 6)
      if (hoursNum !== null && hoursNum <= PRISON_FAST_THRESHOLD) {
        total += PRISON_FAST_BONUS;
        breakdown.push({
          label: `Скорая отсидка (≤${PRISON_FAST_THRESHOLD} ч)`,
          value: PRISON_FAST_BONUS,
          type: "bonus",
        });
      }

      // 💪 Гордость зэка — макс. сложность на тюремной дряни
      if (maxDiff) {
        total += PRISON_HARD_BONUS;
        breakdown.push({
          label: "Гордость зэка (макс. сложность)",
          value: PRISON_HARD_BONUS,
          type: "bonus",
        });
      }

      // 🩸 Сладость Дна — реально плохая игра (рейтинг ≤30)
      if (ratingNum !== null && ratingNum <= PRISON_LOW_RATING_THRESHOLD) {
        total += PRISON_LOW_RATING_BONUS;
        breakdown.push({
          label: `Сладость Дна (рейтинг ≤${PRISON_LOW_RATING_THRESHOLD})`,
          value: PRISON_LOW_RATING_BONUS,
          type: "bonus",
        });
      }

      // Если ничего не выпало — добавляем нейтральную строку для показа в разборе
      if (breakdown.length === 0) {
        breakdown.push({
          label: "Освобождён без бонусов",
          value: 0,
          type: "bonus",
        });
      }

      await prisma.game.update({
        where: { id: game.id },
        data: {
          status: "COMPLETED",
          hours: hoursNum,
          rating: ratingNum,
          description: description?.trim() || null,
          pointsEarned: total,
          completedAt: new Date(),
        },
      });

      await prisma.player.update({
        where: { id: player.id },
        data: {
          activeGameId: null,
          points: { increment: total },
          exp: { increment: PRISON_EXP_REWARD },
          gold: { increment: GOLD_PER_PRISON },
          inPrison: false, // ОСВОБОЖДЁН. currentRegion остаётся "prison" — стоит на клетке.
        },
      });

      const levelInfoPrison = await recomputeAndPersistLevel(player.id);

      return NextResponse.json({
        success: true,
        releasedFromPrison: true,
        pointsEarned: total,
        breakdown,
        cappedAt25: false,
        levelInfo: levelInfoPrison,
      });
    }

    // Текущий сезон — для определения дня сезона
    const season = await prisma.season.findFirst({
      where: { endedAt: null },
      orderBy: { startedAt: "desc" },
    });
    const seasonDay = getSeasonDay(season?.startedAt ?? null);

    // Тип условий берётся из БД — определён при ролле, не при засчёте
    const conditionType =
      game.conditionType === "genre" || game.conditionType === "special"
        ? game.conditionType
        : "basic";

    // Загружаем активные баффы и пассивную экипировку
    const buffs = parseActiveBuffs(player.activeBuffs);
    const activeBuffKeys: string[] = [];
    const activeTrapKeys: string[] = [];
    if (hasBuff(buffs, "triple_points")) activeBuffKeys.push("heart_of_dark");
    if (hasBuff(buffs, "class_fury")) activeBuffKeys.push("class_fury");
    if (hasBuff(buffs, "class_self_flag")) activeBuffKeys.push("class_self_flag");
    if (hasBuff(buffs, "class_hype")) {
      // Бард: либо +5, либо −3, в зависимости от bardHonored
      activeBuffKeys.push(bardHonored ? "class_hype_success" : "class_hype_fail");
    }
    // Ловушка Тухлая Шаурма — −2 поинта
    if (hasBuff(buffs, "trap_points")) activeTrapKeys.push("rotten_shawarma");
    // Пассивная Кольцо Жадности — даёт +1 поинт за игру
    if (await hasPassiveEffect(player.id, "greed")) activeBuffKeys.push("greed_ring");
    // Баффы-расходники «+поинты / ×множитель следующей игре»
    for (const key of ["points_next_2", "points_next_3", "points_next_5", "points_mult_next"]) {
      if (hasBuff(buffs, key)) activeBuffKeys.push(key);
    }

    // +2 если это ПЕРВОЕ прохождение этой игры в текущем сезоне (кем-либо).
    // Сравниваем по title без регистра.
    let firstInSeasonBonus = 0;
    if (season) {
      const alreadyDone = await prisma.game.findFirst({
        where: {
          status: "COMPLETED",
          completedAt: { gte: season.startedAt },
          title: { equals: game.title, mode: "insensitive" },
          id: { not: game.id },
        },
      });
      if (!alreadyDone) firstInSeasonBonus = 2;
    }

    // Рассчитываем поинты по формуле
    const result = calculatePoints({
      region: game.region,
      hours: typeof hours === "number" ? hours : null,
      rating: typeof rating === "number" ? rating : null,
      isMaxDifficulty: Boolean(isMaxDifficulty),
      conditionType,
      playerClass: player.class,
      strength: player.strength,
      patience: player.patience,
      luck: player.luck,
      charisma: player.charisma,
      seasonDay,
      activeBuffs: activeBuffKeys,
      activeTraps: activeTrapKeys,
      firstInSeasonBonus,
    });

    // Сжигаем разовые баффы — Сердце Тьмы только при сработавшем max diff,
    // классовые баффы (fury/self_flag/hype) — всегда после complete,
    // ловушку Шаурмы — после complete (она уже снижала поинты).
    let updatedBuffs = buffs;
    if (hasBuff(buffs, "triple_points") && isMaxDifficulty) {
      updatedBuffs = removeBuff(updatedBuffs, "triple_points");
    }
    if (hasBuff(buffs, "class_fury")) {
      updatedBuffs = removeBuff(updatedBuffs, "class_fury");
    }
    if (hasBuff(buffs, "class_self_flag")) {
      updatedBuffs = removeBuff(updatedBuffs, "class_self_flag");
    }
    if (hasBuff(buffs, "class_hype")) {
      updatedBuffs = removeBuff(updatedBuffs, "class_hype");
    }
    if (hasBuff(buffs, "trap_points")) {
      updatedBuffs = removeBuff(updatedBuffs, "trap_points");
    }
    for (const key of ["points_next_2", "points_next_3", "points_next_5", "points_mult_next"]) {
      if (hasBuff(buffs, key)) updatedBuffs = removeBuff(updatedBuffs, key);
    }
    // Бафф ×2 Злата на следующую игру — сжигаем здесь, эффект применяется ниже
    const goldDoubleActive = hasBuff(buffs, "gold_double_next");
    if (goldDoubleActive) updatedBuffs = removeBuff(updatedBuffs, "gold_double_next");
    const buffsJson =
      updatedBuffs.length !== buffs.length
        ? serializeActiveBuffs(updatedBuffs)
        : null; // null = не обновляем

    // Сохраняем описание (в нём может быть [wheel:spun] флаг, не трогаем его)
    const desc = description?.trim()
      ? description.trim()
      : null;

    await prisma.game.update({
      where: { id: game.id },
      data: {
        status: "COMPLETED",
        hours: typeof hours === "number" ? hours : null,
        rating: typeof rating === "number" ? rating : null,
        description: desc,
        pointsEarned: result.total,
        completedAt: new Date(),
      },
    });

    // Пассивка «находит Злато» — +2 Злата за игру.
    // Пассивка Базара — +2 Злата если игрок засчитал игру стоя в Базаре.
    const hasGoldFind = await hasPassiveEffect(player.id, "passive_gold_find");
    const bazarBonus = player.currentRegion === "bazar" ? 2 : 0;
    let goldGain = GOLD_PER_COMPLETION + (hasGoldFind ? 2 : 0) + bazarBonus;
    if (goldDoubleActive) goldGain *= 2; // Чизкейк Нью-Йорк

    await prisma.player.update({
      where: { id: player.id },
      data: {
        activeGameId: null,
        points: { increment: result.total },
        exp: { increment: EXP_PER_COMPLETION },
        gold: { increment: goldGain },
        ...(buffsJson !== null ? { activeBuffs: buffsJson } : {}),
      },
    });

    // Прогресс по активным квестам игрока. Прокидываем параметры засчитываемой игры.
    const questUpdates = await applyQuestProgress(player.id, {
      region: game.region,
      hours: typeof hours === "number" ? hours : null,
      rating: typeof rating === "number" ? rating : null,
      isMaxDifficulty: Boolean(isMaxDifficulty),
    });

    // Пересчитываем уровень после всех EXP-начислений (игра + завершённые квесты)
    const levelInfo = await recomputeAndPersistLevel(player.id);

    return NextResponse.json({
      success: true,
      pointsEarned: result.total,
      goldEarned: goldGain,
      breakdown: result.breakdown,
      cappedAt25: result.cappedAt25,
      questUpdates,
      levelInfo, // { level, leveledUp, previousLevel }
    });
  }

  // ======== ДРОП ========
  if (action === "drop") {
    const wasInPrison = game.region === PRISON_REGION_ID;

    // Проверяем Шлем Сурвайвора — отменяет дроп
    const buffs = parseActiveBuffs(player.activeBuffs);
    if (hasBuff(buffs, "prevent_drop")) {
      const updatedBuffs = removeBuff(buffs, "prevent_drop");

      await prisma.game.update({
        where: { id: game.id },
        data: {
          status: "COMPLETED",
          description: (description?.trim() || "") + " [Шлем Сурвайвора отменил дроп]",
          pointsEarned: 0,
          completedAt: new Date(),
        },
      });

      await prisma.player.update({
        where: { id: player.id },
        data: {
          activeGameId: null,
          activeBuffs: serializeActiveBuffs(updatedBuffs),
        },
      });

      return NextResponse.json({
        success: true,
        helmetSaved: true,
        message:
          "Шлем Сурвайвора отменил дроп. Игра засчитана как пройденная, но без поинтов.",
      });
    }

    await prisma.game.update({
      where: { id: game.id },
      data: {
        status: "DROPPED",
        description: description?.trim() || null,
        pointsEarned: POINTS_DROP_PENALTY,
        completedAt: new Date(),
      },
    });

    await prisma.player.update({
      where: { id: player.id },
      data: {
        activeGameId: null,
        points: { increment: POINTS_DROP_PENALTY },
        currentRegion: PRISON_REGION_ID,
        inPrison: true, // в любом случае — арест активен
      },
    });

    return NextResponse.json({
      success: true,
      sentToPrison: true,
      stayedInPrison: wasInPrison,
      pointsLost: Math.abs(POINTS_DROP_PENALTY),
    });
  }
}

// ===== ПРОГРЕСС КВЕСТОВ =====
// Для каждого активного квеста — проверяем условие. Если игра подходит → +1 прогресс.
// При достижении target — закрываем квест, начисляем награды.
// LORE-квесты не трекаются автоматически — пропускаем.

interface GameContext {
  region: string;
  hours: number | null;
  rating: number | null;
  isMaxDifficulty: boolean;
}

interface QuestUpdateLog {
  questId: string;
  title: string;
  progressNow: number;
  target: number;
  completed: boolean;
  pointsEarned?: number;
  expEarned?: number;
  itemReward?: { id: string; name: string };
}

async function applyQuestProgress(
  playerId: string,
  ctx: GameContext,
): Promise<QuestUpdateLog[]> {
  const activeQuests = await prisma.quest.findMany({
    where: { playerId, status: "ACTIVE" },
  });
  if (activeQuests.length === 0) return [];

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) return [];

  // Бафф «следующий квест ×2 поинтов» — Лирика. Сжигается на ПЕРВОМ выполненном квесте.
  let questDoubleAvailable = hasBuff(parseActiveBuffs(player.activeBuffs), "quest_double_next");

  const logs: QuestUpdateLog[] = [];

  for (const quest of activeQuests) {
    if (quest.type === "LORE" || quest.type === "IRL") continue; // лорные и ИРЛ — только вручную
    if (!gameMatchesQuest(quest, ctx)) continue;

    const newProgress = quest.progress + 1;
    const isCompleted = newProgress >= quest.targetCount;

    if (!isCompleted) {
      await prisma.quest.update({
        where: { id: quest.id },
        data: { progress: newProgress },
      });
      logs.push({
        questId: quest.id,
        title: quest.title,
        progressNow: newProgress,
        target: quest.targetCount,
        completed: false,
      });
    } else {
      // Закрываем квест + начисляем награды
      const rewards = parseQuestRewards(quest.rewards);
      const bardBonus = player.class === "bard" ? 2 : 0;
      const charismaBonus = Math.floor(player.charisma / 6);
      let totalPoints = rewards.points + bardBonus + charismaBonus;

      // Если активен бафф quest_double_next — удваиваем (один раз)
      if (questDoubleAvailable) {
        totalPoints *= 2;
        questDoubleAvailable = false;
        // Сжигаем бафф в БД
        const freshBuffs = parseActiveBuffs(
          (await prisma.player.findUnique({ where: { id: playerId }, select: { activeBuffs: true } }))
            ?.activeBuffs ?? null,
        );
        const after = removeBuff(freshBuffs, "quest_double_next");
        await prisma.player.update({
          where: { id: playerId },
          data: { activeBuffs: serializeActiveBuffs(after) },
        });
      }

      // Выдаём предмет, если он есть в наградах.
      // Особый случай: Сосуд Перова уникален — если уже есть, даём +10 поинтов компенсации.
      let itemReward: { id: string; name: string } | null = null;
      let bonusInsteadOfDuplicate = 0;
      if (rewards.itemId) {
        if (rewards.itemId === "perov_vessel") {
          const alreadyHas = await prisma.inventoryItem.findFirst({
            where: { playerId, itemId: "perov_vessel" },
          });
          if (alreadyHas) {
            // Уже есть Сосуд — даём +10 поинтов вместо второго
            bonusInsteadOfDuplicate = 10;
          } else {
            const itemDef = await prisma.item.findUnique({ where: { id: rewards.itemId } });
            if (itemDef) {
              await prisma.inventoryItem.create({
                data: { playerId, itemId: itemDef.id, charges: itemDef.charges },
              });
              itemReward = { id: itemDef.id, name: itemDef.name };
            }
          }
        } else {
          const itemDef = await prisma.item.findUnique({ where: { id: rewards.itemId } });
          if (itemDef) {
            await prisma.inventoryItem.create({
              data: { playerId, itemId: itemDef.id, charges: itemDef.charges },
            });
            itemReward = { id: itemDef.id, name: itemDef.name };
          }
        }
      }
      const finalPoints = totalPoints + bonusInsteadOfDuplicate;

      await prisma.$transaction([
        prisma.quest.update({
          where: { id: quest.id },
          data: {
            status: "COMPLETED",
            progress: newProgress,
            completedAt: new Date(),
          },
        }),
        prisma.player.update({
          where: { id: playerId },
          data: {
            points: { increment: finalPoints },
            exp: { increment: rewards.exp },
            gold: { increment: GOLD_PER_QUEST },
          },
        }),
      ]);

      logs.push({
        questId: quest.id,
        title: quest.title,
        progressNow: newProgress,
        target: quest.targetCount,
        completed: true,
        pointsEarned: finalPoints,
        expEarned: rewards.exp,
        itemReward: itemReward ?? undefined,
      });
    }
  }

  return logs;
}

// Подходит ли игра под условие квеста?
function gameMatchesQuest(quest: Quest, ctx: GameContext): boolean {
  const params = parseQuestParams(quest.params);

  switch (quest.type) {
    case "GENRE":
      // Игра должна быть из требуемого региона
      if (params.region && ctx.region !== params.region) return false;
      return true;

    case "DURATION":
      if (ctx.hours === null) return false;
      if (params.minHours !== undefined && ctx.hours < params.minHours) return false;
      if (params.maxHours !== undefined && ctx.hours > params.maxHours) return false;
      return true;

    case "RATING":
      if (ctx.rating === null) return false;
      if (params.minRating !== undefined && ctx.rating < params.minRating) return false;
      if (params.maxRating !== undefined && ctx.rating > params.maxRating) return false;
      return true;

    case "CHALLENGE":
      if (params.region && ctx.region !== params.region) return false;
      if (params.requireMaxDifficulty && !ctx.isMaxDifficulty) return false;
      return true;

    case "LORE":
    case "IRL":
      return false;
  }
}
