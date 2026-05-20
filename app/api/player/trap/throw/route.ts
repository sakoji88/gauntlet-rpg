import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  parseActiveBuffs,
  serializeActiveBuffs,
  addBuff,
  removeBuff,
  hasBuff,
} from "@/lib/active-buffs";
import { getTrapByItemId } from "@/lib/trap-effects";

// Бросить ловушку в другого игрока.
// Тело: { inventoryItemId: string, targetPlayerId: string }
//
// Логика:
//   1. У броска́ющего есть этот предмет в инвентаре, он — TRAP.
//   2. Цель — другой игрок (не сам себе).
//   3. Цель не имеет уже активной такой же ловушки (одна ловушка одного типа за раз).
//   4. У Урки активка "Подкидыш" бесплатная (0 ходов) — для других классов −1 ход.
//
// Транзакция:
//   - Декремент charges (удалить если 0)
//   - Добавить bafa цели
//   - У броска́ющего списать 1 ход (если не Урка)

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
  const { inventoryItemId, targetPlayerId } = body as {
    inventoryItemId?: string;
    targetPlayerId?: string;
  };
  if (!inventoryItemId || !targetPlayerId) {
    return NextResponse.json(
      { error: "inventoryItemId и targetPlayerId обязательны" },
      { status: 400 },
    );
  }

  const player = await prisma.player.findUnique({ where: { userId } });
  if (!player) {
    return NextResponse.json({ error: "Профиль не найден" }, { status: 404 });
  }

  if (targetPlayerId === player.id) {
    return NextResponse.json({ error: "В себя нельзя" }, { status: 400 });
  }

  const target = await prisma.player.findUnique({ where: { id: targetPlayerId } });
  if (!target) {
    return NextResponse.json({ error: "Цель не найдена" }, { status: 404 });
  }

  // Проверяем предмет
  const invItem = await prisma.inventoryItem.findUnique({
    where: { id: inventoryItemId },
    include: { item: true },
  });
  if (!invItem || invItem.playerId !== player.id) {
    return NextResponse.json({ error: "Предмет не найден" }, { status: 404 });
  }
  if (invItem.item.category !== "TRAP") {
    return NextResponse.json({ error: "Это не ловушка" }, { status: 400 });
  }
  if (invItem.charges <= 0) {
    return NextResponse.json({ error: "Заряды исчерпаны" }, { status: 400 });
  }

  const trap = getTrapByItemId(invItem.item.id);
  if (!trap) {
    return NextResponse.json(
      { error: `Эта ловушка пока не реализована (${invItem.item.id})` },
      { status: 400 },
    );
  }

  // Проверяем что у цели нет уже такой ловушки
  const targetBuffs = parseActiveBuffs(target.activeBuffs);
  if (hasBuff(targetBuffs, trap.buffKey)) {
    return NextResponse.json(
      { error: "У цели уже висит такая ловушка" },
      { status: 400 },
    );
  }

  // Защита «Разьёбанный балкон Попова» — гасит первую брошенную ловушку.
  // Предмет-ловушка у атакующего тратится, у цели сжигается защитный бафф,
  // но саму ловушку не вешаем.
  const protectedByBalcony = hasBuff(targetBuffs, "protect_from_trap");
  if (protectedByBalcony) {
    await prisma.$transaction(async (tx) => {
      if (invItem.charges <= 1) {
        await tx.inventoryItem.delete({ where: { id: invItem.id } });
      } else {
        await tx.inventoryItem.update({
          where: { id: invItem.id },
          data: { charges: { decrement: 1 } },
        });
      }
      const cleanedBuffs = removeBuff(targetBuffs, "protect_from_trap");
      await tx.player.update({
        where: { id: target.id },
        data: { activeBuffs: serializeActiveBuffs(cleanedBuffs) },
      });
      const energyCostPre = player.class === "urka" ? 0 : 1;
      if (energyCostPre > 0) {
        await tx.player.update({
          where: { id: player.id },
          data: { energy: { decrement: energyCostPre } },
        });
      }
    });
    return NextResponse.json({
      success: true,
      message: `«${trap.name}» отскочила от защиты ${target.nickname}.`,
      blocked: true,
    });
  }

  // Цена в ходах: 0 для Урки (Ловкие Пальцы), 1 для остальных
  const isUrka = player.class === "urka";
  const energyCost = isUrka ? 0 : 1;
  if (player.energy < energyCost) {
    return NextResponse.json(
      { error: `Не хватает ходов (нужно ${energyCost})` },
      { status: 400 },
    );
  }

  // Готовим обновлённый список баффов цели
  const newTargetBuffs = addBuff(targetBuffs, {
    effectKey: trap.buffKey,
    sourceItemId: trap.itemId,
    activatedAt: new Date().toISOString(),
    payload: {
      thrower: player.id,
      throwerNickname: player.nickname,
      magnitude: trap.magnitude,
    },
  });

  // Транзакция
  await prisma.$transaction(async (tx) => {
    // Декремент / удаление предмета
    if (invItem.charges <= 1) {
      await tx.inventoryItem.delete({ where: { id: invItem.id } });
    } else {
      await tx.inventoryItem.update({
        where: { id: invItem.id },
        data: { charges: { decrement: 1 } },
      });
    }
    // Бафф на цель
    await tx.player.update({
      where: { id: target.id },
      data: { activeBuffs: serializeActiveBuffs(newTargetBuffs) },
    });
    // Списать ход с броска́ющего (если не Урка)
    if (energyCost > 0) {
      await tx.player.update({
        where: { id: player.id },
        data: { energy: { decrement: energyCost } },
      });
    }
  });

  return NextResponse.json({
    success: true,
    message: `«${trap.name}» — летит в ${target.nickname}!`,
    cost: energyCost,
    free: energyCost === 0,
  });
}
