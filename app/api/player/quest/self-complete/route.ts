import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parseQuestRewards } from "@/lib/quest-types";
import { recomputeAndPersistLevel } from "@/lib/level-formula";

// Самоотметка выполнения для "обычных" админ-квестов (type=IRL + selfComplete=true).
// Игрок жмёт «Выполнено» в свитке квестов, награды начисляются сразу. Админ не вмешивается.
//
// Отдельно от lore-complete — там жёсткая проверка type=LORE.

const GOLD_PER_QUEST = 5;

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
  if (!quest.selfComplete) {
    return NextResponse.json(
      { error: "Этот квест нельзя отметить самому — его засчитывает админ (для ИРЛ) или он трекается автоматически" },
      { status: 400 },
    );
  }
  if (quest.status !== "ACTIVE") {
    return NextResponse.json(
      { error: "Квест не активен — сначала прими его" },
      { status: 400 },
    );
  }

  const rewards = parseQuestRewards(quest.rewards);
  const bardBonus = player.class === "bard" ? 2 : 0;
  const charismaBonus = Math.floor(player.charisma / 6);
  const totalPoints = rewards.points + bardBonus + charismaBonus;

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
        points: { increment: totalPoints },
        exp: { increment: rewards.exp },
        gold: { increment: GOLD_PER_QUEST },
      },
    }),
  ]);

  const levelInfo = await recomputeAndPersistLevel(player.id);

  return NextResponse.json({
    success: true,
    pointsEarned: totalPoints,
    expEarned: rewards.exp,
    breakdown: { base: rewards.points, bardBonus, charismaBonus },
    levelInfo,
  });
}
