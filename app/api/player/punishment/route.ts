import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Вписать Личное Наказание игрока (Punishment Pact).
// Одноразово: вписывается ОДИН раз (после выбора класса). Изменить потом нельзя.
// Тело: { text: string }

const MAX_LEN = 400;
const MIN_LEN = 8;

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
  if (raw.length < MIN_LEN) {
    return NextResponse.json(
      { error: `Впиши наказание (минимум ${MIN_LEN} символов)` },
      { status: 400 },
    );
  }
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

  // Наказание вписывается ОДИН раз и навсегда
  if (player.punishmentPact && player.punishmentPact.trim().length > 0) {
    return NextResponse.json(
      { error: "Наказание уже вписано — изменить его нельзя." },
      { status: 400 },
    );
  }

  const updated = await prisma.player.update({
    where: { id: player.id },
    data: { punishmentPact: raw },
  });

  return NextResponse.json({ success: true, punishmentPact: updated.punishmentPact });
}
