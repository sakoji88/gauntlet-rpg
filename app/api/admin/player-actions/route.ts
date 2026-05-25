import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { pickPerovTrialForDay, PEROV_NPC_REGION } from "@/lib/perov";
import { recomputeAndPersistLevel } from "@/lib/level-formula";

// POST /api/admin/player-actions
// Универсальный endpoint админских утилит на игрока.
// Тело: { playerId: string, action: string, ...params }

type Action =
  | "reset_buffs"
  | "reset_quest_cooldowns"
  | "reset_class_action_cooldown"
  | "reset_declined_specials"
  | "release_from_prison"
  | "summon_perov"
  | "clear_active_game"
  | "reset_helmet"
  | "reset_inventory"
  | "force_recompute_level"
  | "add_exp"
  | "force_complete_quest"
  | "force_decline_quest";

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Кривое тело" }, { status: 400 });
  }

  const { playerId, action } = body as { playerId?: string; action?: Action };
  if (!playerId || !action) {
    return NextResponse.json({ error: "playerId и action обязательны" }, { status: 400 });
  }

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) {
    return NextResponse.json({ error: "Игрок не найден" }, { status: 404 });
  }

  switch (action) {
    case "reset_buffs":
      await prisma.player.update({
        where: { id: playerId },
        data: { activeBuffs: null },
      });
      return NextResponse.json({ success: true, message: "Все активные баффы сброшены" });

    case "reset_quest_cooldowns":
      await prisma.player.update({
        where: { id: playerId },
        data: { declinedQuestCooldowns: null },
      });
      return NextResponse.json({ success: true, message: "Cooldowns отказов от квестов сброшены" });

    case "reset_class_action_cooldown":
      await prisma.player.update({
        where: { id: playerId },
        data: { lastClassActionAt: null },
      });
      return NextResponse.json({ success: true, message: "Cooldown активки класса сброшен" });

    case "reset_declined_specials":
      await prisma.player.update({
        where: { id: playerId },
        data: { declinedSpecials: null },
      });
      return NextResponse.json({ success: true, message: "Отказы от special-условий сброшены" });

    case "release_from_prison":
      await prisma.player.update({
        where: { id: playerId },
        data: { inPrison: false },
      });
      return NextResponse.json({ success: true, message: "Освобождён из тюрьмы" });

    case "reset_helmet":
      await prisma.player.update({
        where: { id: playerId },
        data: { helmetUsedSeasonId: null },
      });
      return NextResponse.json({ success: true, message: "Шлем сурвайвора готов к использованию" });

    case "clear_active_game": {
      if (!player.activeGameId) {
        return NextResponse.json({ error: "Нет активной игры" }, { status: 400 });
      }
      await prisma.$transaction([
        prisma.game.update({
          where: { id: player.activeGameId },
          data: {
            status: "DROPPED",
            description: "[Admin: очищена]",
            completedAt: new Date(),
          },
        }),
        prisma.player.update({
          where: { id: playerId },
          data: { activeGameId: null },
        }),
      ]);
      return NextResponse.json({ success: true, message: "Активная игра очищена" });
    }

    case "reset_inventory":
      await prisma.inventoryItem.deleteMany({ where: { playerId } });
      return NextResponse.json({ success: true, message: "Инвентарь очищен" });

    case "force_recompute_level": {
      const info = await recomputeAndPersistLevel(playerId);
      return NextResponse.json({
        success: true,
        message: `Уровень пересчитан: ${info.previousLevel} → ${info.level}`,
        info,
      });
    }

    case "add_exp": {
      const amount = Number(body.amount);
      if (!isFinite(amount) || amount === 0) {
        return NextResponse.json({ error: "amount должен быть числом ≠0" }, { status: 400 });
      }
      await prisma.player.update({
        where: { id: playerId },
        data: { exp: { increment: amount } },
      });
      const info = await recomputeAndPersistLevel(playerId);
      return NextResponse.json({
        success: true,
        message: `+${amount} EXP. Уровень: ${info.previousLevel} → ${info.level}`,
      });
    }

    case "summon_perov": {
      // Принудительно создаём OFFERED-квест от Перова игнорируя обычные триггеры.
      // Если уже есть активный/предложенный — отдаём его.
      const existing = await prisma.quest.findFirst({
        where: {
          playerId,
          npcRegion: PEROV_NPC_REGION,
          status: { in: ["OFFERED", "ACTIVE"] },
        },
      });
      if (existing) {
        return NextResponse.json({
          success: true,
          message: `У игрока уже есть Perov-квест: "${existing.title}" (${existing.status})`,
        });
      }
      const trial = pickPerovTrialForDay(playerId);
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
        message: `Перов вызван — испытание "${created.title}"`,
      });
    }

    case "force_complete_quest": {
      const { questId } = body as { questId?: string };
      if (!questId) {
        return NextResponse.json({ error: "questId обязателен" }, { status: 400 });
      }
      const quest = await prisma.quest.findUnique({ where: { id: questId } });
      if (!quest || quest.playerId !== playerId) {
        return NextResponse.json({ error: "Квест не найден" }, { status: 404 });
      }
      if (quest.status === "COMPLETED") {
        return NextResponse.json({ error: "Квест уже завершён" }, { status: 400 });
      }

      // Разбираем награды и считаем классовые/харизматические бонусы — как для
      // обычного засчёта (lore-complete / applyQuestProgress).
      let baseRewards = { points: 0, exp: 0, itemId: undefined as string | undefined };
      try {
        const parsed = JSON.parse(quest.rewards);
        if (typeof parsed?.points === "number") baseRewards.points = parsed.points;
        if (typeof parsed?.exp === "number") baseRewards.exp = parsed.exp;
        if (typeof parsed?.itemId === "string") baseRewards.itemId = parsed.itemId;
      } catch {
        // ignore
      }
      const bardBonus = player.class === "bard" ? 2 : 0;
      const charismaBonus = Math.floor(player.charisma / 6);
      const totalPoints = baseRewards.points + bardBonus + charismaBonus;

      // Выдаём предмет, если он есть в наградах. Сосуд Перова — уникальный:
      // если уже есть — конвертируется в +10 поинтов вместо дубля.
      let itemReward: { id: string; name: string } | null = null;
      let duplicateBonus = 0;
      if (baseRewards.itemId) {
        if (baseRewards.itemId === "perov_vessel") {
          const already = await prisma.inventoryItem.findFirst({
            where: { playerId, itemId: "perov_vessel" },
          });
          if (already) {
            duplicateBonus = 10;
          } else {
            const itemDef = await prisma.item.findUnique({ where: { id: baseRewards.itemId } });
            if (itemDef) {
              await prisma.inventoryItem.create({
                data: { playerId, itemId: itemDef.id, charges: itemDef.charges },
              });
              itemReward = { id: itemDef.id, name: itemDef.name };
            }
          }
        } else {
          const itemDef = await prisma.item.findUnique({ where: { id: baseRewards.itemId } });
          if (itemDef) {
            await prisma.inventoryItem.create({
              data: { playerId, itemId: itemDef.id, charges: itemDef.charges },
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
          where: { id: playerId },
          data: {
            points: { increment: finalPoints },
            exp: { increment: baseRewards.exp },
            gold: { increment: 5 }, // Злато за квест — как везде
          },
        }),
      ]);
      await recomputeAndPersistLevel(playerId);

      const parts = [`+${finalPoints} поинтов`, `+${baseRewards.exp} EXP`, "+5 Злата"];
      if (itemReward) parts.push(`предмет «${itemReward.name}»`);
      if (duplicateBonus > 0) parts.push(`+${duplicateBonus} компенсация за дубль Сосуда`);
      return NextResponse.json({
        success: true,
        message: `Квест "${quest.title}" засчитан: ${parts.join(", ")}`,
      });
    }

    case "force_decline_quest": {
      const { questId } = body as { questId?: string };
      if (!questId) {
        return NextResponse.json({ error: "questId обязателен" }, { status: 400 });
      }
      const quest = await prisma.quest.findUnique({ where: { id: questId } });
      if (!quest || quest.playerId !== playerId) {
        return NextResponse.json({ error: "Квест не найден" }, { status: 404 });
      }
      await prisma.quest.update({
        where: { id: questId },
        data: { status: "DECLINED" },
      });
      return NextResponse.json({
        success: true,
        message: `Квест "${quest.title}" принудительно отклонён`,
      });
    }

    default:
      return NextResponse.json({ error: `Неизвестное действие: ${action}` }, { status: 400 });
  }
}
