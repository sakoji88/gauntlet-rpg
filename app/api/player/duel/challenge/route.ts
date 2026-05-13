import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Бросить вызов другому игроку.
// Тело: { defenderId: string, gameTitle: string, message?: string }
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }
  const userId = (session.user as any).id;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Кривое тело" }, { status: 400 });
  }
  const { defenderId, gameTitle, message } = body as {
    defenderId?: string;
    gameTitle?: string;
    message?: string;
  };

  if (!defenderId || !gameTitle || gameTitle.trim().length < 2) {
    return NextResponse.json(
      { error: "defenderId и gameTitle (≥2 символов) обязательны" },
      { status: 400 },
    );
  }

  const challenger = await prisma.player.findUnique({ where: { userId } });
  if (!challenger) {
    return NextResponse.json({ error: "Профиль не найден" }, { status: 404 });
  }
  if (challenger.id === defenderId) {
    return NextResponse.json({ error: "В себя нельзя" }, { status: 400 });
  }

  const defender = await prisma.player.findUnique({ where: { id: defenderId } });
  if (!defender) {
    return NextResponse.json({ error: "Противник не найден" }, { status: 404 });
  }

  // Проверяем что нет активной дуэли между этими игроками
  const activeBetween = await prisma.duel.findFirst({
    where: {
      OR: [
        { challengerId: challenger.id, defenderId, status: { in: ["PROPOSED", "ACCEPTED"] } },
        { challengerId: defenderId, defenderId: challenger.id, status: { in: ["PROPOSED", "ACCEPTED"] } },
      ],
    },
  });
  if (activeBetween) {
    return NextResponse.json(
      { error: "Между вами уже есть активная дуэль" },
      { status: 400 },
    );
  }

  const duel = await prisma.duel.create({
    data: {
      challengerId: challenger.id,
      defenderId,
      gameTitle: gameTitle.trim(),
      message: message?.trim() || null,
      status: "PROPOSED",
    },
  });

  return NextResponse.json({
    success: true,
    duel,
    message: `Вызов брошен ${defender.nickname}!`,
  });
}
