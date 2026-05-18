import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parseQuestRewards } from "@/lib/quest-types";
import { recomputeAndPersistLevel } from "@/lib/level-formula";

// LORE-квесты не трекаются автоматически — игрок сам нажимает "выполнено".
// Этот роут начисляет награды и закрывает квест.
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
  const { questId } = body as { questId?: string };
  if (!questId) {
    return NextResponse.json({ error: "Не указан квест" }, { status: 400 });
  }

  const player = await prisma.player.findUnique({ where: { userId } });
  if (!player) {
    return NextResponse.json({ error: "Профиль не найден" }, { status: 404 });
  }

  const quest = await prisma.quest.findUnique({ where: { id: questId } });
  if (!quest || quest.playerId !== player.id) {
    return NextResponse.json({ error: "Квест не найден" }, { status: 404 });
  }
  if (quest.type !== "LORE") {
    return NextResponse.json(
      { error: "Этот квест не лорный — он трекается автоматически" },
      { status: 400 },
    );
  }
  if (quest.status !== "ACTIVE") {
    return NextResponse.json(
      { error: "Квест не активен" },
      { status: 400 },
    );
  }

  const rewards = parseQuestRewards(quest.rewards);

  // Бонус Барда — +2 поинта за каждый квест
  const bardBonus = player.class === "bard" ? 2 : 0;
  // Бонус харизмы — +1 за каждые 6
  const charismaBonus = Math.floor(player.charisma / 6);
  const totalPoints = rewards.points + bardBonus + charismaBonus;

  // Выдаём предмет, если есть. Сосуд Перова уникален — даём +10 поинтов вместо дубля.
  let itemReward: { id: string; name: string } | null = null;
  let bonusInsteadOfDuplicate = 0;
  if (rewards.itemId) {
    if (rewards.itemId === "perov_vessel") {
      const alreadyHas = await prisma.inventoryItem.findFirst({
        where: { playerId: player.id, itemId: "perov_vessel" },
      });
      if (alreadyHas) {
        bonusInsteadOfDuplicate = 10;
      } else {
        const itemDef = await prisma.item.findUnique({ where: { id: rewards.itemId } });
        if (itemDef) {
          await prisma.inventoryItem.create({
            data: { playerId: player.id, itemId: itemDef.id, charges: itemDef.charges },
          });
          itemReward = { id: itemDef.id, name: itemDef.name };
        }
      }
    } else {
      const itemDef = await prisma.item.findUnique({ where: { id: rewards.itemId } });
      if (itemDef) {
        await prisma.inventoryItem.create({
          data: { playerId: player.id, itemId: itemDef.id, charges: itemDef.charges },
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
        progress: quest.targetCount,
        completedAt: new Date(),
      },
    }),
    prisma.player.update({
      where: { id: player.id },
      data: {
        points: { increment: finalPoints },
        exp: { increment: rewards.exp },
        gold: { increment: 5 }, // Злато за выполненный квест
      },
    }),
  ]);

  const levelInfo = await recomputeAndPersistLevel(player.id);

  return NextResponse.json({
    success: true,
    pointsEarned: finalPoints,
    expEarned: rewards.exp,
    breakdown: {
      base: rewards.points,
      bardBonus,
      charismaBonus,
      bonusInsteadOfDuplicate,
    },
    itemReward,
    levelInfo,
  });
}
