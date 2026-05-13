import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getTemplateById } from "@/lib/quest-templates";

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
      { error: "Этот квест уже не предложен" },
      { status: 400 },
    );
  }

  // Рассчитываем дедлайн из шаблона
  const template = getTemplateById(quest.templateId);
  const days = template?.durationDays ?? 7;
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  const updated = await prisma.quest.update({
    where: { id: quest.id },
    data: {
      status: "ACTIVE",
      acceptedAt: new Date(),
      expiresAt,
    },
  });

  return NextResponse.json({ success: true, quest: updated });
}
