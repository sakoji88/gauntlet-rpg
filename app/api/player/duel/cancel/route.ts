import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Челленджер отзывает свой вызов (только если ещё PROPOSED).
// Тело: { duelId: string }
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
  const { duelId } = body as { duelId?: string };
  if (!duelId) {
    return NextResponse.json({ error: "duelId обязателен" }, { status: 400 });
  }

  const player = await prisma.player.findUnique({ where: { userId } });
  if (!player) {
    return NextResponse.json({ error: "Профиль не найден" }, { status: 404 });
  }

  const duel = await prisma.duel.findUnique({ where: { id: duelId } });
  if (!duel) {
    return NextResponse.json({ error: "Дуэль не найдена" }, { status: 404 });
  }
  if (duel.challengerId !== player.id) {
    return NextResponse.json(
      { error: "Отозвать может только челленджер" },
      { status: 403 },
    );
  }
  if (duel.status !== "PROPOSED") {
    return NextResponse.json(
      { error: "Отозвать можно только пока вызов не принят" },
      { status: 400 },
    );
  }

  await prisma.duel.update({
    where: { id: duelId },
    data: { status: "CANCELLED" },
  });

  return NextResponse.json({ success: true, message: "Вызов отозван" });
}
