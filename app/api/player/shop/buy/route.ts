import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getShopEntry } from "@/lib/shop";

// Купить предмет в магазине Романала.
// Тело: { itemId: string }

const INVENTORY_LIMIT = 6;

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
  const itemId = typeof body.itemId === "string" ? body.itemId : null;
  if (!itemId) {
    return NextResponse.json({ error: "Не указан предмет" }, { status: 400 });
  }

  const entry = getShopEntry(itemId);
  if (!entry) {
    return NextResponse.json({ error: "Романал этим не торгует" }, { status: 400 });
  }

  const player = await prisma.player.findUnique({ where: { userId } });
  if (!player) {
    return NextResponse.json({ error: "Профиль не найден" }, { status: 404 });
  }

  const itemDef = await prisma.item.findUnique({ where: { id: itemId } });
  if (!itemDef) {
    return NextResponse.json({ error: "Предмет не найден в каталоге" }, { status: 404 });
  }

  // Лимит инвентаря (косметика не занимает слот — она «в коллекции»)
  const invCount = await prisma.inventoryItem.count({
    where: { playerId: player.id, item: { category: { not: "COSMETIC" } } },
  });
  if (itemDef.category !== "COSMETIC" && invCount >= INVENTORY_LIMIT) {
    return NextResponse.json(
      { error: `Инвентарь полон (${INVENTORY_LIMIT}/${INVENTORY_LIMIT}). Освободи слот.` },
      { status: 400 },
    );
  }

  // Проверка остатка на сезон (глобальный сток)
  if (entry.stockLimit !== null) {
    const sold = await prisma.inventoryItem.count({ where: { itemId } });
    if (sold >= entry.stockLimit) {
      return NextResponse.json(
        { error: "Товар закончился — раскупили в этом сезоне." },
        { status: 400 },
      );
    }
  }

  // Проверка кошелька
  const balance = entry.currency === "gold" ? player.gold : player.points;
  const curName = entry.currency === "gold" ? "Злата" : "поинтов";
  if (balance < entry.price) {
    return NextResponse.json(
      { error: `Не хватает ${curName}: нужно ${entry.price}, есть ${balance}.` },
      { status: 400 },
    );
  }

  // Покупка в транзакции
  try {
    await prisma.$transaction(async (tx) => {
      // Перепроверяем сток внутри транзакции — анти-гонка
      if (entry.stockLimit !== null) {
        const sold = await tx.inventoryItem.count({ where: { itemId } });
        if (sold >= entry.stockLimit) {
          throw new Error("Товар только что закончился.");
        }
      }
      await tx.player.update({
        where: { id: player.id },
        data:
          entry.currency === "gold"
            ? { gold: { decrement: entry.price } }
            : { points: { decrement: entry.price } },
      });
      await tx.inventoryItem.create({
        data: { playerId: player.id, itemId, charges: itemDef.charges },
      });
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Не удалось купить" },
      { status: 400 },
    );
  }

  return NextResponse.json({
    success: true,
    message: `Куплено: ${itemDef.name}. −${entry.price} ${curName}.`,
  });
}
