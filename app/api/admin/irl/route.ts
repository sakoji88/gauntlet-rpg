import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { recomputeAndPersistLevel } from "@/lib/level-formula";

// Управление ИРЛ- и обычными админ-квестами (только админ).
// Действия (поле action):
//   create          — создать шаблон в пул (флаг selfComplete: ИРЛ или "обычный")
//   delete_template — удалить шаблон
//   deliver         — выдать шаблон игроку (status=OFFERED, игрок принимает/отклоняет)
//   resolve         — засчитать / отклонить выданный ИРЛ-квест (только не-selfComplete)
//
// ИРЛ-квесты:        selfComplete=false. Админ потом подтверждает выполнение.
// "Обычные" квесты:  selfComplete=true.  Игрок сам отмечает выполнение, админ
//                    НЕ видит ни кому выдан, ни что выполнено.

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

  // ===== СОЗДАТЬ ШАБЛОН =====
  if (action === "create") {
    const title = String(body.title ?? "").trim();
    const description = String(body.description ?? "").trim();
    const flavor = String(body.flavor ?? "").trim();
    const npcRegion = String(body.npcRegion ?? "").trim() || "tabor";
    const rewardPoints = Number.isFinite(body.rewardPoints) ? Math.round(body.rewardPoints) : 15;
    const rewardExp = Number.isFinite(body.rewardExp) ? Math.round(body.rewardExp) : 30;
    const selfComplete = Boolean(body.selfComplete);

    if (!title || !description) {
      return NextResponse.json({ error: "Нужны название и описание" }, { status: 400 });
    }
    const tpl = await prisma.irlQuestTemplate.create({
      data: {
        title,
        description,
        flavor: flavor || null,
        npcRegion,
        rewardPoints: Math.max(0, rewardPoints),
        rewardExp: Math.max(0, rewardExp),
        selfComplete,
      },
    });
    return NextResponse.json({ success: true, template: tpl });
  }

  // ===== УДАЛИТЬ ШАБЛОН =====
  if (action === "delete_template") {
    const templateId = String(body.templateId ?? "");
    if (!templateId) {
      return NextResponse.json({ error: "Не указан шаблон" }, { status: 400 });
    }
    await prisma.irlQuestTemplate.delete({ where: { id: templateId } });
    return NextResponse.json({ success: true });
  }

  // ===== ВЫДАТЬ ШАБЛОН ИГРОКУ =====
  if (action === "deliver") {
    const templateId = String(body.templateId ?? "");
    const target = String(body.target ?? ""); // playerId | "random"
    const tpl = await prisma.irlQuestTemplate.findUnique({ where: { id: templateId } });
    if (!tpl) {
      return NextResponse.json({ error: "Шаблон не найден" }, { status: 404 });
    }

    // Кто уже получал этот шаблон — таким повторно не кидаем
    const alreadyGiven = await prisma.quest.findMany({
      where: { templateId },
      select: { playerId: true },
    });
    const excludeIds = new Set(alreadyGiven.map((q) => q.playerId));

    let playerId: string;
    if (target === "random") {
      const pool = await prisma.player.findMany({
        where: { class: { not: null }, id: { notIn: [...excludeIds] } },
        select: { id: true },
      });
      if (pool.length === 0) {
        return NextResponse.json(
          { error: "Некому выдавать — все уже получали этот квест." },
          { status: 400 },
        );
      }
      playerId = pool[Math.floor(Math.random() * pool.length)].id;
    } else {
      if (excludeIds.has(target)) {
        return NextResponse.json(
          { error: "Этот игрок уже получал этот квест." },
          { status: 400 },
        );
      }
      const p = await prisma.player.findUnique({ where: { id: target } });
      if (!p) {
        return NextResponse.json({ error: "Игрок не найден" }, { status: 404 });
      }
      playerId = p.id;
    }

    const quest = await prisma.quest.create({
      data: {
        playerId,
        templateId,
        npcRegion: tpl.npcRegion,
        type: "IRL",
        title: tpl.title,
        description: tpl.description,
        flavor: tpl.flavor ?? "Особое поручение.",
        targetCount: 1,
        rewards: JSON.stringify({ points: tpl.rewardPoints, exp: tpl.rewardExp }),
        // НОВЫЙ ФЛОУ: квест приходит как ПРЕДЛОЖЕНИЕ. Игрок жмёт «Принять/Отказать».
        // Не сбивает другие активные квесты — встаёт в ряд.
        status: "OFFERED",
        selfComplete: tpl.selfComplete,
      },
    });

    // Для "обычных" (selfComplete) — НЕ возвращаем ник, чтобы админ не знал.
    if (tpl.selfComplete) {
      return NextResponse.json({
        success: true,
        questId: quest.id,
        anonymous: true,
      });
    }
    const player = await prisma.player.findUnique({ where: { id: playerId } });
    return NextResponse.json({
      success: true,
      questId: quest.id,
      playerNickname: player?.nickname ?? playerId,
    });
  }

  // ===== ЗАСЧИТАТЬ / ОТКЛОНИТЬ (только не-selfComplete ИРЛ) =====
  if (action === "resolve") {
    const questId = String(body.questId ?? "");
    const result = body.result; // "complete" | "decline"
    const quest = await prisma.quest.findUnique({ where: { id: questId } });
    if (!quest || quest.type !== "IRL") {
      return NextResponse.json({ error: "ИРЛ-квест не найден" }, { status: 404 });
    }
    if (quest.selfComplete) {
      return NextResponse.json(
        { error: "Это обычное задание — его игрок отмечает сам, ты не вмешивайся." },
        { status: 400 },
      );
    }
    if (quest.status !== "ACTIVE") {
      return NextResponse.json({ error: "Квест не в активном состоянии" }, { status: 400 });
    }

    if (result === "decline") {
      await prisma.quest.update({
        where: { id: questId },
        data: { status: "DECLINED", completedAt: new Date() },
      });
      return NextResponse.json({ success: true, declined: true });
    }

    if (result === "complete") {
      let rewards = { points: 0, exp: 0 };
      try {
        const parsed = JSON.parse(quest.rewards);
        if (typeof parsed?.points === "number") rewards.points = parsed.points;
        if (typeof parsed?.exp === "number") rewards.exp = parsed.exp;
      } catch {
        // ignore
      }
      await prisma.$transaction([
        prisma.quest.update({
          where: { id: questId },
          data: { status: "COMPLETED", progress: 1, completedAt: new Date() },
        }),
        prisma.player.update({
          where: { id: quest.playerId },
          data: {
            points: { increment: rewards.points },
            exp: { increment: rewards.exp },
            gold: { increment: GOLD_PER_QUEST },
          },
        }),
      ]);
      await recomputeAndPersistLevel(quest.playerId);
      return NextResponse.json({ success: true, rewards });
    }

    return NextResponse.json({ error: "result должен быть complete или decline" }, { status: 400 });
  }

  return NextResponse.json({ error: "Неизвестное действие" }, { status: 400 });
}
