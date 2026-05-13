import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Защитник принимает или отклоняет вызов.
// Тело: { duelId: string, accept: boolean }
const ACCEPT_DURATION_DAYS = 7;

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
  const { duelId, accept } = body as { duelId?: string; accept?: boolean };
  if (!duelId || typeof accept !== "boolean") {
    return NextResponse.json(
      { error: "duelId и accept (boolean) обязательны" },
      { status: 400 },
    );
  }

  const player = await prisma.player.findUnique({ where: { userId } });
  if (!player) {
    return NextResponse.json({ error: "Профиль не найден" }, { status: 404 });
  }

  const duel = await prisma.duel.findUnique({ where: { id: duelId } });
  if (!duel) {
    return NextResponse.json({ error: "Дуэль не найдена" }, { status: 404 });
  }
  if (duel.defenderId !== player.id) {
    return NextResponse.json({ error: "Это вызов не к тебе" }, { status: 403 });
  }
  if (duel.status !== "PROPOSED") {
    return NextResponse.json(
      { error: "На этот вызов уже отвечено" },
      { status: 400 },
    );
  }

  const updated = await prisma.duel.update({
    where: { id: duelId },
    data: accept
      ? {
          status: "ACCEPTED",
          acceptedAt: new Date(),
          expiresAt: new Date(Date.now() + ACCEPT_DURATION_DAYS * 24 * 60 * 60 * 1000),
        }
      : { status: "DECLINED" },
  });

  return NextResponse.json({
    success: true,
    duel: updated,
    message: accept
      ? "Принял вызов. У вас 7 дней пройти игру и сдать результаты."
      : "Вызов отклонён.",
  });
}
