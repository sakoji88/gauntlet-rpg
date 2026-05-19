import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { rollCraft, MIN_INGREDIENTS, MAX_INGREDIENTS } from "@/lib/cauldron";

// Сварить предмет из предметов в Котле Гнилостня.
// Тело: { inventoryItemIds: string[] }  — 2..3 предмета-ингредиента.

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
  const rawIds: unknown[] = Array.isArray(body.inventoryItemIds)
    ? body.inventoryItemIds
    : [];
  const ids: string[] = [
    ...new Set(rawIds.filter((x): x is string => typeof x === "string")),
  ];

  if (ids.length < MIN_INGREDIENTS || ids.length > MAX_INGREDIENTS) {
    return NextResponse.json(
      { error: `В котёл нужно кинуть ${MIN_INGREDIENTS}–${MAX_INGREDIENTS} предмета.` },
      { status: 400 },
    );
  }

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

  // Загружаем предметы-ингредиенты и проверяем владение/пригодность
  const ingredients = await prisma.inventoryItem.findMany({
    where: { id: { in: ids } },
    include: { item: true },
  });
  if (ingredients.length !== ids.length) {
    return NextResponse.json({ error: "Какой-то предмет не найден" }, { status: 400 });
  }
  for (const inv of ingredients) {
    if (inv.playerId !== player.id) {
      return NextResponse.json({ error: "Это не твой предмет" }, { status: 400 });
    }
    if (inv.item.category === "COSMETIC") {
      return NextResponse.json({ error: "Косметику в котёл кидать нельзя" }, { status: 400 });
    }
    if (inv.item.rarity === "LEGENDARY") {
      return NextResponse.json({ error: "Легендарку в котёл — кощунство" }, { status: 400 });
    }
  }

  // Бросок исхода
  const result = rollCraft(
    ingredients.map((i: typeof ingredients[number]) => i.item.rarity as string),
    player.luck,
  );

  // Подбираем результат до транзакции (если не провал)
  let resultItem: { id: string; name: string; description: string; rarity: string } | null = null;
  if (result.resultRarity) {
    const pool = await prisma.item.findMany({
      where: {
        rarity: result.resultRarity as any,
        rollWeight: { gt: 0 },
        category: { not: "COSMETIC" },
      },
    });
    // не варим проклятья
    const clean = pool.filter((i: typeof pool[number]) => !i.effectKey?.startsWith("curse_"));
    if (clean.length > 0) {
      const picked = clean[Math.floor(Math.random() * clean.length)];
      resultItem = {
        id: picked.id,
        name: picked.name,
        description: picked.description,
        rarity: picked.rarity as string,
      };
    }
  }

  // Транзакция: сжигаем ингредиенты, выдаём результат (если есть)
  await prisma.$transaction(async (tx) => {
    for (const inv of ingredients) {
      if (inv.charges > 1) {
        await tx.inventoryItem.update({
          where: { id: inv.id },
          data: { charges: { decrement: 1 } },
        });
      } else {
        await tx.inventoryItem.delete({ where: { id: inv.id } });
      }
    }
    if (resultItem) {
      const def = await tx.item.findUnique({ where: { id: resultItem.id } });
      await tx.inventoryItem.create({
        data: { playerId: player.id, itemId: resultItem.id, charges: def?.charges ?? 1 },
      });
    }
  });

  const messages: Record<string, string> = {
    success: resultItem ? `Удача! Котёл выдал: ${resultItem.name}!` : "Удача!",
    ok: resultItem ? `Сварилось: ${resultItem.name}.` : "Сварилось.",
    fail: "Котёл забулькал и плюнул паром. Ингредиенты сгорели зря.",
  };

  return NextResponse.json({
    success: true,
    outcome: result.outcome,
    item: resultItem,
    message: messages[result.outcome],
  });
}
