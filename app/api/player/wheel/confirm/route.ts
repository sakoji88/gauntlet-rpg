import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  parseActiveBuffs,
  hasBuff,
  removeBuff,
  serializeActiveBuffs,
} from "@/lib/active-buffs";

const INVENTORY_LIMIT = 6;

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

  // Сжигаем разовые баффы колеса (если были) — выбор подтверждён.
  const buffs = parseActiveBuffs(player.activeBuffs);
  let updated = buffs;
  if (hasBuff(updated, "lucky_roll")) updated = removeBuff(updated, "lucky_roll");
  if (hasBuff(updated, "choose_of_three")) updated = removeBuff(updated, "choose_of_three");

  // === Шар Всезнания — вторая крутка после подтверждения выбора ===
  // Раньше эта ветка не работала для Алхимика (он всегда идёт в режим
  // "выбор из 3"), и бафф wheel_double_next тихо залипал. Теперь — выдаём
  // бонусный случайный предмет тут (если хватает места в инвентаре),
  // сжигаем бафф в любом случае.
  let bonusItem: { id: string; name: string; description: string; category: string; rarity: string; iconKey: string } | null = null;
  const hasWheelDouble = hasBuff(updated, "wheel_double_next");
  if (hasWheelDouble) {
    updated = removeBuff(updated, "wheel_double_next");

    const invCountNow = await prisma.inventoryItem.count({
      where: { playerId: player.id },
    });
    if (invCountNow < INVENTORY_LIMIT) {
      // Тянем случайный не-проклятый предмет.
      // Учитываем удачу игрока, как в основном колесе.
      const allItems = await prisma.item.findMany({
        where: {
          rollWeight: { gt: 0 },
          category: { not: "COSMETIC" },
        },
      });
      const hasPerovDisdain = hasBuff(updated, "perov_disdain");
      const effectiveLuck = Math.max(0, player.luck - (hasPerovDisdain ? 1 : 0));
      const luckMultiplier = 1 + Math.floor(effectiveLuck / 4) * 0.05;
      const weighted = allItems.map((it: typeof allItems[number]) => {
        let weight = it.rollWeight;
        if (it.rarity === "RARE") weight *= luckMultiplier;
        if (it.rarity === "EPIC") weight *= luckMultiplier * 1.2;
        if (it.rarity === "LEGENDARY") weight *= luckMultiplier * 1.5;
        return { item: it, weight };
      });
      const total = weighted.reduce((s: number, w: { weight: number }) => s + w.weight, 0);

      function rollOne() {
        const r = Math.random() * total;
        let acc = 0;
        for (const { item, weight } of weighted) {
          acc += weight;
          if (r <= acc) return item;
        }
        return weighted[weighted.length - 1].item;
      }

      let second = rollOne();
      let tries = 0;
      while (second.effectKey?.startsWith("curse_") && tries < 30) {
        second = rollOne();
        tries++;
      }
      if (!second.effectKey?.startsWith("curse_")) {
        await prisma.inventoryItem.create({
          data: {
            playerId: player.id,
            itemId: second.id,
            charges: second.charges,
          },
        });
        bonusItem = {
          id: second.id,
          name: second.name,
          description: second.description,
          category: second.category,
          rarity: second.rarity,
          iconKey: second.iconKey,
        };
      }
    }
  }

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
    bonusItem,
  });
}
