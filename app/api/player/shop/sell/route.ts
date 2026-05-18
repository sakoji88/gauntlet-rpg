import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getShopEntry } from "@/lib/shop";

// Продать предмет Романалу. Возвращает Злато (sellPrice из каталога магазина).
// Тело: { inventoryItemId: string }

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
  const inventoryItemId =
    typeof body.inventoryItemId === "string" ? body.inventoryItemId : null;
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

  const entry = getShopEntry(invItem.itemId);
  if (!entry || entry.sellPrice <= 0) {
    return NextResponse.json(
      { error: "Романал не выкупает это." },
      { status: 400 },
    );
  }

  const refund = entry.sellPrice;

  await prisma.$transaction([
    prisma.inventoryItem.delete({ where: { id: invItem.id } }),
    prisma.player.update({
      where: { id: player.id },
      data: { gold: { increment: refund } },
    }),
  ]);

  return NextResponse.json({
    success: true,
    message: `Продано: ${invItem.item.name}. +${refund} Злата.`,
  });
}
