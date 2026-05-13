import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Потратить 1 unspent stat point на стат.
// Тело: { stat: "strength" | "patience" | "luck" | "charisma" }

const ALLOWED = new Set(["strength", "patience", "luck", "charisma"]);

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
  const { stat } = body as { stat?: string };
  if (!stat || !ALLOWED.has(stat)) {
    return NextResponse.json(
      { error: "stat должен быть одним из: strength, patience, luck, charisma" },
      { status: 400 },
    );
  }

  const player = await prisma.player.findUnique({ where: { userId } });
  if (!player) {
    return NextResponse.json({ error: "Профиль не найден" }, { status: 404 });
  }
  if (player.unspentStatPoints <= 0) {
    return NextResponse.json(
      { error: "Нет нераспределённых очков статов" },
      { status: 400 },
    );
  }

  const updated = await prisma.player.update({
    where: { id: player.id },
    data: {
      [stat]: { increment: 1 } as any,
      unspentStatPoints: { decrement: 1 },
    },
  });

  return NextResponse.json({
    success: true,
    stat,
    newValue: (updated as any)[stat],
    remainingPoints: updated.unspentStatPoints,
  });
}
