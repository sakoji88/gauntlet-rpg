import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { recomputeAndPersistLevel } from "@/lib/level-formula";
import {
  PEROV_NPC_REGION,
  PEROV_TRIALS,
  getPerovTrialById,
  pickPerovTrialForDay,
} from "@/lib/perov";

// Админская панель Перова.
//
// Действия (action):
//   list                — вернуть все Perov-квесты сезона с разбивкой по игрокам
//   give                — выдать конкретное испытание игроку (по trialId,
//                         либо случайное из дневной seed). Не отменяет существующее.
//   cancel              — отменить (DECLINED) текущий Perov-квест у игрока
//   force_complete      — засчитать испытание с наградой (поинты+EXP+Сосуд если не дубль)
//   reroll_trial        — заменить текущий OFFERED-квест на другой trialId
//                         (без штрафов, без потери даты выдачи)

const GOLD_PER_QUEST = 5;

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Кривое тело" }, { status: 400 });
  }
  const action = body.action;

  // ===== LIST =====
  if (action === "list") {
    const season = await prisma.season.findFirst({
      where: { endedAt: null },
      orderBy: { startedAt: "desc" },
    });
    const sinceDate = season?.startedAt ?? new Date(0);

    const quests = await prisma.quest.findMany({
      where: {
        npcRegion: PEROV_NPC_REGION,
        offeredAt: { gte: sinceDate },
      },
      include: { player: { select: { id: true, nickname: true } } },
      orderBy: [{ status: "asc" }, { offeredAt: "desc" }],
    });

    return NextResponse.json({
      success: true,
      seasonStartedAt: season?.startedAt,
      trials: PEROV_TRIALS.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        rewardPoints: t.rewards.points,
        rewardItemId: t.rewards.itemId ?? null,
        durationDays: t.durationDays,
      })),
      quests: quests.map((q) => ({
        id: q.id,
        playerId: q.player.id,
        playerNickname: q.player.nickname,
        templateId: q.templateId,
        title: q.title,
        description: q.description,
        flavor: q.flavor,
        rewards: q.rewards,
        status: q.status,
        offeredAt: q.offeredAt,
        acceptedAt: q.acceptedAt,
        completedAt: q.completedAt,
        expiresAt: q.expiresAt,
        progress: q.progress,
        targetCount: q.targetCount,
      })),
    });
  }

  // ===== GIVE =====
  if (action === "give") {
    const playerId = String(body.playerId ?? "");
    const trialId = String(body.trialId ?? "").trim();
    if (!playerId) {
      return NextResponse.json({ error: "playerId обязателен" }, { status: 400 });
    }
    const player = await prisma.player.findUnique({ where: { id: playerId } });
    if (!player) {
      return NextResponse.json({ error: "Игрок не найден" }, { status: 404 });
    }
    // Проверяем что нет активного Perov-квеста у игрока
    const active = await prisma.quest.findFirst({
      where: {
        playerId,
        npcRegion: PEROV_NPC_REGION,
        status: { in: ["OFFERED", "ACTIVE"] },
      },
    });
    if (active) {
      return NextResponse.json(
        {
          error: `У ${player.nickname} уже есть активное испытание Перова: «${active.title}». Сначала отмени или дождись завершения.`,
        },
        { status: 400 },
      );
    }

    const trial = trialId
      ? getPerovTrialById(trialId)
      : pickPerovTrialForDay(playerId);
    if (!trial) {
      return NextResponse.json({ error: "Испытание не найдено" }, { status: 400 });
    }

    const created = await prisma.quest.create({
      data: {
        playerId,
        templateId: trial.id,
        npcRegion: PEROV_NPC_REGION,
        type: trial.type,
        title: trial.title,
        description: trial.description,
        flavor: trial.flavor,
        targetCount: trial.targetCount,
        progress: 0,
        params: JSON.stringify(trial.params),
        rewards: JSON.stringify(trial.rewards),
        status: "OFFERED",
      },
    });
    return NextResponse.json({
      success: true,
      questId: created.id,
      message: `Перов явился к ${player.nickname}: «${trial.title}».`,
    });
  }

  // ===== CANCEL =====
  if (action === "cancel") {
    const questId = String(body.questId ?? "");
    const quest = await prisma.quest.findUnique({ where: { id: questId } });
    if (!quest || quest.npcRegion !== PEROV_NPC_REGION) {
      return NextResponse.json({ error: "Perov-квест не найден" }, { status: 404 });
    }
    if (quest.status === "COMPLETED") {
      return NextResponse.json(
        { error: "Квест уже завершён — отменять нечего." },
        { status: 400 },
      );
    }
    await prisma.quest.update({
      where: { id: questId },
      data: { status: "DECLINED", completedAt: new Date() },
    });
    return NextResponse.json({
      success: true,
      message: `Перов растворился. Испытание «${quest.title}» отменено.`,
    });
  }

  // ===== FORCE COMPLETE =====
  if (action === "force_complete") {
    const questId = String(body.questId ?? "");
    const quest = await prisma.quest.findUnique({ where: { id: questId } });
    if (!quest || quest.npcRegion !== PEROV_NPC_REGION) {
      return NextResponse.json({ error: "Perov-квест не найден" }, { status: 404 });
    }
    if (quest.status === "COMPLETED") {
      return NextResponse.json({ error: "Уже завершён" }, { status: 400 });
    }

    let baseRewards = { points: 0, exp: 0, itemId: undefined as string | undefined };
    try {
      const parsed = JSON.parse(quest.rewards);
      if (typeof parsed?.points === "number") baseRewards.points = parsed.points;
      if (typeof parsed?.exp === "number") baseRewards.exp = parsed.exp;
      if (typeof parsed?.itemId === "string") baseRewards.itemId = parsed.itemId;
    } catch {}

    const player = await prisma.player.findUnique({ where: { id: quest.playerId } });
    if (!player) {
      return NextResponse.json({ error: "Игрок не найден" }, { status: 404 });
    }
    const bardBonus = player.class === "bard" ? 2 : 0;
    const charismaBonus = Math.floor(player.charisma / 6);
    let totalPoints = baseRewards.points + bardBonus + charismaBonus;

    // Сосуд Перова — уникален: дубль = +10 поинтов
    let itemReward: { id: string; name: string } | null = null;
    let duplicateBonus = 0;
    if (baseRewards.itemId) {
      if (baseRewards.itemId === "perov_vessel") {
        const already = await prisma.inventoryItem.findFirst({
          where: { playerId: quest.playerId, itemId: "perov_vessel" },
        });
        if (already) {
          duplicateBonus = 10;
        } else {
          const itemDef = await prisma.item.findUnique({ where: { id: "perov_vessel" } });
          if (itemDef) {
            await prisma.inventoryItem.create({
              data: { playerId: quest.playerId, itemId: itemDef.id, charges: itemDef.charges },
            });
            itemReward = { id: itemDef.id, name: itemDef.name };
          }
        }
      } else {
        const itemDef = await prisma.item.findUnique({ where: { id: baseRewards.itemId } });
        if (itemDef) {
          await prisma.inventoryItem.create({
            data: { playerId: quest.playerId, itemId: itemDef.id, charges: itemDef.charges },
          });
          itemReward = { id: itemDef.id, name: itemDef.name };
        }
      }
    }
    const finalPoints = totalPoints + duplicateBonus;

    await prisma.$transaction([
      prisma.quest.update({
        where: { id: questId },
        data: {
          status: "COMPLETED",
          progress: quest.targetCount,
          completedAt: new Date(),
        },
      }),
      prisma.player.update({
        where: { id: quest.playerId },
        data: {
          points: { increment: finalPoints },
          exp: { increment: baseRewards.exp },
          gold: { increment: GOLD_PER_QUEST },
        },
      }),
    ]);
    await recomputeAndPersistLevel(quest.playerId);

    const parts = [`+${finalPoints} поинтов`, `+${baseRewards.exp} EXP`, `+${GOLD_PER_QUEST} Злата`];
    if (itemReward) parts.push(`«${itemReward.name}»`);
    if (duplicateBonus > 0) parts.push(`+${duplicateBonus} за дубль Сосуда`);
    return NextResponse.json({
      success: true,
      message: `Испытание «${quest.title}» засчитано: ${parts.join(", ")}.`,
    });
  }

  // ===== EDIT =====
  // Прямое редактирование текста/наград любого Perov-квеста (даже ACTIVE).
  // Меняем только переданные поля. rewards JSON собирается из rewardPoints/rewardItemId
  // если они переданы — иначе оставляем старые.
  if (action === "edit") {
    const questId = String(body.questId ?? "");
    const quest = await prisma.quest.findUnique({ where: { id: questId } });
    if (!quest || quest.npcRegion !== PEROV_NPC_REGION) {
      return NextResponse.json({ error: "Perov-квест не найден" }, { status: 404 });
    }
    if (quest.status === "COMPLETED") {
      return NextResponse.json({ error: "Завершённый квест не редактируем" }, { status: 400 });
    }

    const patch: Record<string, unknown> = {};
    if (typeof body.title === "string" && body.title.trim()) {
      patch.title = body.title.trim();
    }
    if (typeof body.description === "string" && body.description.trim()) {
      patch.description = body.description.trim();
    }
    if (typeof body.flavor === "string") {
      patch.flavor = body.flavor.trim();
    }
    // Rewards: разбираем старое, накладываем новое
    if (
      typeof body.rewardPoints === "number" ||
      typeof body.rewardExp === "number" ||
      "rewardItemId" in body
    ) {
      let rewards: Record<string, unknown> = {};
      try {
        rewards = JSON.parse(quest.rewards) ?? {};
      } catch {}
      if (typeof body.rewardPoints === "number") rewards.points = Math.max(0, Math.round(body.rewardPoints));
      if (typeof body.rewardExp === "number") rewards.exp = Math.max(0, Math.round(body.rewardExp));
      if ("rewardItemId" in body) {
        const v = body.rewardItemId;
        if (v === null || v === "") {
          delete rewards.itemId;
        } else if (typeof v === "string") {
          rewards.itemId = v.trim();
        }
      }
      patch.rewards = JSON.stringify(rewards);
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "Нечего обновлять — все поля пустые" }, { status: 400 });
    }
    const updated = await prisma.quest.update({
      where: { id: questId },
      data: patch,
    });
    return NextResponse.json({
      success: true,
      message: `Квест «${updated.title}» обновлён.`,
    });
  }

  // ===== REROLL TRIAL =====
  // Меняет templateId/title/description/flavor/params/rewards текущего
  // OFFERED-квеста на другой trial — без потери acceptedAt/offeredAt.
  if (action === "reroll_trial") {
    const questId = String(body.questId ?? "");
    const trialId = String(body.trialId ?? "").trim();
    const trial = getPerovTrialById(trialId);
    if (!trial) {
      return NextResponse.json({ error: "Испытание не найдено" }, { status: 400 });
    }
    const quest = await prisma.quest.findUnique({ where: { id: questId } });
    if (!quest || quest.npcRegion !== PEROV_NPC_REGION) {
      return NextResponse.json({ error: "Perov-квест не найден" }, { status: 404 });
    }
    if (quest.status !== "OFFERED") {
      return NextResponse.json(
        { error: "Заменить можно только OFFERED-испытание (до принятия)." },
        { status: 400 },
      );
    }
    await prisma.quest.update({
      where: { id: questId },
      data: {
        templateId: trial.id,
        type: trial.type,
        title: trial.title,
        description: trial.description,
        flavor: trial.flavor,
        targetCount: trial.targetCount,
        params: JSON.stringify(trial.params),
        rewards: JSON.stringify(trial.rewards),
      },
    });
    return NextResponse.json({
      success: true,
      message: `Перов перевернул карты. Новое испытание: «${trial.title}».`,
    });
  }

  return NextResponse.json({ error: "Неизвестное действие" }, { status: 400 });
}
