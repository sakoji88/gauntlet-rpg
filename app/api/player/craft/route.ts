import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CAULDRON_PRICE, pickCauldronItem } from "@/lib/cauldron";

// Сварить расходник в Котле Гнилостня. Стоит Злато, даёт случайный предмет.

const INVENTORY_LIMIT = 6;

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
  if (player.currentRegion !== "kukhnya") {
    return NextResponse.json(
      { error: "Котёл — только в Гнилой Кухне. Дойди туда." },
      { status: 400 },
    );
  }
  if (player.gold < CAULDRON_PRICE) {
    return NextResponse.json(
      { error: `Не хватает Злата: нужно ${CAULDRON_PRICE}, есть ${player.gold}.` },
      { status: 400 },
    );
  }

  const invCount = await prisma.inventoryItem.count({
    where: { playerId: player.id, item: { category: { not: "COSMETIC" } } },
  });
  if (invCount >= INVENTORY_LIMIT) {
    return NextResponse.json(
      { error: `Инвентарь полон (${INVENTORY_LIMIT}/${INVENTORY_LIMIT}).` },
      { status: 400 },
    );
  }

  const itemId = pickCauldronItem();
  const itemDef = await prisma.item.findUnique({ where: { id: itemId } });
  if (!itemDef) {
    return NextResponse.json({ error: "Рецепт не сошёлся — попробуй ещё" }, { status: 500 });
  }

  await prisma.$transaction([
    prisma.player.update({
      where: { id: player.id },
      data: { gold: { decrement: CAULDRON_PRICE } },
    }),
    prisma.inventoryItem.create({
      data: { playerId: player.id, itemId: itemDef.id, charges: itemDef.charges },
    }),
  ]);

  return NextResponse.json({
    success: true,
    item: {
      id: itemDef.id,
      name: itemDef.name,
      description: itemDef.description,
      rarity: itemDef.rarity,
    },
    message: `Из котла выловлено: ${itemDef.name}!`,
  });
}
