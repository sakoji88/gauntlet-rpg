import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parseDeclinedQuestCooldowns } from "@/lib/quest-types";
import { getDeclineCooldownDays } from "@/lib/quest-server";

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
  if (quest.status !== "OFFERED") {
    return NextResponse.json(
      { error: "Отказаться можно только от предложенного квеста" },
      { status: 400 },
    );
  }

  // Cooldown зависит от тира (STARTER/STORY возвращаются быстрее, SIDE — позже)
  const cooldownDays = getDeclineCooldownDays(quest.templateId);

  // Помечаем квест как DECLINED + ставим cooldown НА ШАБЛОН (а не на NPC)
  const cooldowns = parseDeclinedQuestCooldowns(player.declinedQuestCooldowns);
  cooldowns[quest.templateId] = new Date(
    Date.now() + cooldownDays * 24 * 60 * 60 * 1000,
  ).toISOString();

  await prisma.$transaction([
    prisma.quest.update({
      where: { id: quest.id },
      data: { status: "DECLINED" },
    }),
    prisma.player.update({
      where: { id: player.id },
      data: { declinedQuestCooldowns: JSON.stringify(cooldowns) },
    }),
  ]);

  return NextResponse.json({
    success: true,
    cooldownDays,
  });
}
