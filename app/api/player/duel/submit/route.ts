import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getCrownHolderId, BASE_DUEL_REWARD, CROWN_DUEL_BONUS } from "@/lib/crown";

// Сдать результат своего прохождения для дуэли.
// Тело: { duelId: string, hours: number, rating?: number }
//
// Логика:
//   - Сохраняем результат стороны (challenger / defender).
//   - Если обе стороны сдали — определяем победителя (кто быстрее по hours),
//     переводим поинты, помечаем COMPLETED.
//   - Если защитник владеет Короной Стрима — бонус +2 (всего 5).

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
  const { duelId, hours, rating } = body as {
    duelId?: string;
    hours?: number;
    rating?: number;
  };
  if (!duelId || typeof hours !== "number" || hours <= 0) {
    return NextResponse.json(
      { error: "duelId и hours (>0) обязательны" },
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
  if (duel.status !== "ACCEPTED") {
    return NextResponse.json(
      { error: "Дуэль не в статусе ACCEPTED" },
      { status: 400 },
    );
  }

  const isChallenger = duel.challengerId === player.id;
  const isDefender = duel.defenderId === player.id;
  if (!isChallenger && !isDefender) {
    return NextResponse.json({ error: "Ты не участник дуэли" }, { status: 403 });
  }

  // Уже сдал?
  if (isChallenger && duel.challengerHours !== null) {
    return NextResponse.json({ error: "Ты уже сдал результат" }, { status: 400 });
  }
  if (isDefender && duel.defenderHours !== null) {
    return NextResponse.json({ error: "Ты уже сдал результат" }, { status: 400 });
  }

  // Записываем
  const updated = await prisma.duel.update({
    where: { id: duelId },
    data: isChallenger
      ? {
          challengerHours: hours,
          challengerRating: typeof rating === "number" ? rating : null,
        }
      : {
          defenderHours: hours,
          defenderRating: typeof rating === "number" ? rating : null,
        },
  });

  // Если оба сдали — резолвим
  const bothSubmitted =
    updated.challengerHours !== null && updated.defenderHours !== null;
  if (!bothSubmitted) {
    return NextResponse.json({
      success: true,
      duel: updated,
      message: "Результат принят. Ждём результат соперника.",
      waitingForOpponent: true,
    });
  }

  // Определяем победителя — кто быстрее
  // Tiebreaker: при равных часах — выше рейтинг победил. Иначе — ничья.
  const chHours = updated.challengerHours!;
  const dfHours = updated.defenderHours!;
  let winnerId: string | null = null;
  if (chHours < dfHours) winnerId = updated.challengerId;
  else if (dfHours < chHours) winnerId = updated.defenderId;
  else {
    // Равно по часам — смотрим рейтинг
    const chR = updated.challengerRating ?? 0;
    const dfR = updated.defenderRating ?? 0;
    if (chR > dfR) winnerId = updated.challengerId;
    else if (dfR > chR) winnerId = updated.defenderId;
    else winnerId = null; // полная ничья
  }

  // Бонус за Корону: если победитель победил носителя короны
  const crownHolderId = await getCrownHolderId();
  let reward = BASE_DUEL_REWARD;
  if (winnerId && crownHolderId) {
    const loserId = winnerId === updated.challengerId ? updated.defenderId : updated.challengerId;
    if (loserId === crownHolderId) {
      reward += CROWN_DUEL_BONUS;
    }
  }

  // Если ничья — резолвим без перевода
  if (!winnerId) {
    const result = await prisma.duel.update({
      where: { id: duelId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        winnerId: null,
        pointsTransferred: 0,
      },
    });
    return NextResponse.json({
      success: true,
      duel: result,
      tie: true,
      message: "Полная ничья. Поинты не переходят.",
    });
  }

  // Переводим поинты в транзакции
  const loserId =
    winnerId === updated.challengerId ? updated.defenderId : updated.challengerId;

  await prisma.$transaction([
    prisma.duel.update({
      where: { id: duelId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        winnerId,
        pointsTransferred: reward,
      },
    }),
    prisma.player.update({
      where: { id: winnerId },
      data: { points: { increment: reward } },
    }),
    prisma.player.update({
      where: { id: loserId },
      data: { points: { decrement: reward } },
    }),
  ]);

  const wonByYou = winnerId === player.id;
  return NextResponse.json({
    success: true,
    winnerId,
    crownBonus: reward > BASE_DUEL_REWARD,
    pointsTransferred: reward,
    message: wonByYou
      ? `Ты победил! +${reward} поинтов.${reward > BASE_DUEL_REWARD ? " (Бонус за Корону!)" : ""}`
      : `Ты проиграл. −${reward} поинтов.`,
  });
}
