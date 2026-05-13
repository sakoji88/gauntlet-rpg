import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getClassById } from "@/lib/classes";

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  // Парсим тело запроса
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Кривое тело запроса" }, { status: 400 });
  }

  const { classId } = body;

  // Проверяем что класс существует
  const classData = getClassById(classId);
  if (!classData) {
    return NextResponse.json({ error: "Класс не найден" }, { status: 400 });
  }

  // Проверяем что игрок ещё не выбрал класс
  const player = await prisma.player.findUnique({
    where: { userId },
  });

  if (!player) {
    return NextResponse.json({ error: "Профиль игрока не найден" }, { status: 404 });
  }

  if (player.class) {
    return NextResponse.json(
      { error: "Класс уже выбран. Сменить его можно только в следующем сезоне." },
      { status: 400 },
    );
  }

  // Сохраняем класс и стартовые статы
  const updated = await prisma.player.update({
    where: { userId },
    data: {
      class: classData.id,
      strength: classData.startStats.strength,
      patience: classData.startStats.patience,
      luck: classData.startStats.luck,
      charisma: classData.startStats.charisma,
      currentRegion: "bazar", // ← стартовая локация — Базар Романала (центр)
    },
  });

  return NextResponse.json({ success: true, player: updated });
}