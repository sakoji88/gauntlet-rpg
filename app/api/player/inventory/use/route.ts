import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getEffectMeta, isPassive } from "@/lib/item-effects";

// Использовать предмет из инвентаря.
// Все мутации внутри транзакции:
//   1. Декремент charges (или удаление если был последний).
//   2. Применение эффекта (apply из item-effects.ts).
// При любой ошибке транзакция откатывается → никаких полу-применённых эффектов.

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
  const { inventoryItemId } = body as { inventoryItemId?: string };
  if (!inventoryItemId) {
    return NextResponse.json({ error: "Не указан предмет" }, { status: 400 });
  }

  const player = await prisma.player.findUnique({ where: { userId } });
  if (!player) {
    return NextResponse.json({ error: "Профиль не найден" }, { status: 404 });
  }

  const invItem = await prisma.inventoryItem.findUnique({
    where: { id: inventoryItemId },
    include: { item: true },
  });
  if (!invItem || invItem.playerId !== player.id) {
    return NextResponse.json({ error: "Предмет не найден" }, { status: 404 });
  }
  if (invItem.charges <= 0) {
    return NextResponse.json({ error: "Заряды исчерпаны" }, { status: 400 });
  }

  const effectKey = invItem.item.effectKey;
  if (!effectKey) {
    return NextResponse.json(
      { error: "У предмета нет активного эффекта" },
      { status: 400 },
    );
  }
  if (isPassive(effectKey)) {
    return NextResponse.json(
      { error: "Этот предмет работает пассивно — активировать не нужно" },
      { status: 400 },
    );
  }

  const meta = getEffectMeta(effectKey);
  if (!meta) {
    return NextResponse.json(
      { error: `Эффект "${effectKey}" не реализован` },
      { status: 400 },
    );
  }

  // Текущий сезон — для контекста (например, prevent_drop проверяет сезонный сброс)
  const activeSeason = await prisma.season.findFirst({
    where: { endedAt: null },
    orderBy: { startedAt: "desc" },
  });
  const activeSeasonId = activeSeason?.id ?? null;

  // 1) Проверка пригодности
  if (meta.isUsable) {
    const check = meta.isUsable({ player, invItem, activeSeasonId });
    if (!check.ok) {
      return NextResponse.json({ error: check.reason }, { status: 400 });
    }
  }

  // 2) Применение в транзакции
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 2a. Применить эффект (мутации БД через tx)
      const applyResult = await meta.apply({
        tx,
        player,
        invItem,
        activeSeasonId,
      });

      // 2b. Декремент charges / удаление предмета.
      // WEEKLY эффекты (Половник) сами обновляют lastUsedAt в apply, поэтому charges
      // декрементим только если предмет НЕ weekly или его charges > 1 (для WEEKLY с charges=3).
      if (meta.class !== "WEEKLY") {
        // Все остальные: -1 charge, удалить если 0
        if (invItem.charges <= 1) {
          await tx.inventoryItem.delete({ where: { id: invItem.id } });
        } else {
          await tx.inventoryItem.update({
            where: { id: invItem.id },
            data: { charges: { decrement: 1 } },
          });
        }
      } else {
        // WEEKLY: декремент charges (но lastUsedAt уже выставлен в apply)
        if (invItem.charges <= 1) {
          await tx.inventoryItem.delete({ where: { id: invItem.id } });
        } else {
          await tx.inventoryItem.update({
            where: { id: invItem.id },
            data: { charges: { decrement: 1 } },
          });
        }
      }

      // 2c. Для prevent_drop помечаем сезон
      if (effectKey === "prevent_drop" && activeSeasonId) {
        await tx.player.update({
          where: { id: player.id },
          data: { helmetUsedSeasonId: activeSeasonId },
        });
      }

      return applyResult;
    });

    return NextResponse.json({ success: true, ...result });
  } catch (e: any) {
    console.error("[inventory/use] error:", e);
    return NextResponse.json(
      { error: e?.message ?? "Ошибка применения эффекта" },
      { status: 500 },
    );
  }
}
