import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Сохранить/обновить Личное Наказание игрока (Punishment Pact).
// Тело: { text: string }  — пустая строка очищает наказание.

const MAX_LEN = 400;

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

  const raw = typeof body.text === "string" ? body.text.trim() : "";
  if (raw.length > MAX_LEN) {
    return NextResponse.json(
      { error: `Слишком длинно (максимум ${MAX_LEN} символов)` },
      { status: 400 },
    );
  }

  const player = await prisma.player.findUnique({ where: { userId } });
  if (!player) {
    return NextResponse.json({ error: "Профиль не найден" }, { status: 404 });
  }

  const updated = await prisma.player.update({
    where: { id: player.id },
    data: { punishmentPact: raw.length > 0 ? raw : null },
  });

  return NextResponse.json({ success: true, punishmentPact: updated.punishmentPact });
}
