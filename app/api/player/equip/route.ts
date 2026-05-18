import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isFrameItem, isTitleItem } from "@/lib/cosmetics";

// Надеть/снять косметику.
// Тело: { slot: "frame" | "title", itemId: string | null }
//   itemId === null → снять косметику с этого слота.

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
  const slot = body.slot;
  const itemId: string | null = typeof body.itemId === "string" ? body.itemId : null;

  if (slot !== "frame" && slot !== "title") {
    return NextResponse.json({ error: "slot должен быть frame или title" }, { status: 400 });
  }

  const player = await prisma.player.findUnique({ where: { userId } });
  if (!player) {
    return NextResponse.json({ error: "Профиль не найден" }, { status: 404 });
  }

  // Снятие
  if (itemId === null) {
    await prisma.player.update({
      where: { id: player.id },
      data: slot === "frame" ? { equippedFrameId: null } : { equippedTitleId: null },
    });
    return NextResponse.json({ success: true, equipped: null });
  }

  // Тип предмета должен совпадать со слотом
  const typeOk = slot === "frame" ? isFrameItem(itemId) : isTitleItem(itemId);
  if (!typeOk) {
    return NextResponse.json(
      { error: `Этот предмет нельзя надеть в слот «${slot === "frame" ? "рамка" : "титул"}»` },
      { status: 400 },
    );
  }

  // Игрок должен владеть этим косметическим предметом
  const owned = await prisma.inventoryItem.findFirst({
    where: { playerId: player.id, itemId },
  });
  if (!owned) {
    return NextResponse.json({ error: "У тебя нет этого предмета" }, { status: 400 });
  }

  await prisma.player.update({
    where: { id: player.id },
    data: slot === "frame" ? { equippedFrameId: itemId } : { equippedTitleId: itemId },
  });

  return NextResponse.json({ success: true, equipped: itemId });
}
