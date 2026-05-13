import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  parseActiveBuffs,
  hasBuff,
  removeBuff,
  serializeActiveBuffs,
} from "@/lib/active-buffs";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const player = await prisma.player.findUnique({ where: { userId } });
  if (!player) return NextResponse.json({ error: "Профиль не найден" }, { status: 404 });

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Кривое тело" }, { status: 400 });
  }

  const { gameId, itemId } = body;
  if (!gameId || !itemId) {
    return NextResponse.json({ error: "Не указана игра или предмет" }, { status: 400 });
  }

  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game || game.playerId !== player.id) {
    return NextResponse.json({ error: "Игра не найдена" }, { status: 404 });
  }
  if (game.description?.includes("[wheel:spun]")) {
    return NextResponse.json({ error: "Уже выбрано" }, { status: 400 });
  }

  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) return NextResponse.json({ error: "Предмет не существует" }, { status: 400 });

  await prisma.inventoryItem.create({
    data: {
      playerId: player.id,
      itemId: item.id,
      charges: item.charges,
    },
  });

  await prisma.game.update({
    where: { id: game.id },
    data: { description: (game.description ? game.description + " " : "") + "[wheel:spun]" },
  });

  // Сжигаем разовые баффы колеса (если были) — выбор подтверждён, бафф отработал.
  // Алхимику choose_of_three не выдают (он и без него видит 3), но если как-то взял —
  // тоже сжигаем, чтобы не было аномалий.
  const buffs = parseActiveBuffs(player.activeBuffs);
  let updated = buffs;
  if (hasBuff(updated, "lucky_roll")) updated = removeBuff(updated, "lucky_roll");
  if (hasBuff(updated, "choose_of_three")) updated = removeBuff(updated, "choose_of_three");
  if (updated.length !== buffs.length) {
    await prisma.player.update({
      where: { id: player.id },
      data: { activeBuffs: serializeActiveBuffs(updated) },
    });
  }

  return NextResponse.json({
    success: true,
    item: {
      id: item.id,
      name: item.name,
      description: item.description,
      rarity: item.rarity,
      iconKey: item.iconKey,
    },
  });
}
