import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Технический реролл активной игры.
// Для случая, когда выпавшая игра не работает / недоступна, а тайтл уже вписан.
// Отменяет активную игру БЕЗ штрафа и тюрьмы и возвращает 1 ход (роллил не зря).

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }
  const userId = (session.user as any).id;

  const player = await prisma.player.findUnique({ where: { userId } });
  if (!player) {
    return NextResponse.json({ error: "Профиль не найден" }, { status: 404 });
  }
  if (!player.activeGameId) {
    return NextResponse.json({ error: "Нет активной игры" }, { status: 400 });
  }

  const game = await prisma.game.findUnique({ where: { id: player.activeGameId } });
  if (!game) {
    return NextResponse.json({ error: "Игра не найдена" }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.game.update({
      where: { id: game.id },
      data: {
        status: "DROPPED",
        description:
          (game.description ? game.description + " " : "") + "[тех. реролл — игра не работала]",
        pointsEarned: 0,
        completedAt: new Date(),
      },
    }),
    prisma.player.update({
      where: { id: player.id },
      data: {
        activeGameId: null,
        // Возвращаем ход — ролл сорвался не по вине игрока
        energy: { increment: 1 },
      },
    }),
  ]);

  return NextResponse.json({
    success: true,
    message: "Игра снята без штрафа, ход возвращён. Роллни заново.",
  });
}
