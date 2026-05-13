import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Кража предмета (только для Урки).
// Тело: { targetPlayerId: string, targetInventoryItemId: string }
//
// Логика:
//   - Только класс "urka"
//   - Cooldown 24ч (lastStealAt)
//   - Стоит 1 ход
//   - Бросок: 50% + (luckUrka - luckTarget) × 3%, clamp 10..90
//   - Успех — предмет переходит к Урке (если у него < 6 слотов)
//   - Провал — −1 поинт (засветился), Урка остаётся без предмета

const COOLDOWN_MS = 24 * 60 * 60 * 1000;
const INVENTORY_LIMIT = 6;
const FAIL_PENALTY = 1;

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
  const { targetPlayerId, targetInventoryItemId } = body as {
    targetPlayerId?: string;
    targetInventoryItemId?: string;
  };
  if (!targetPlayerId || !targetInventoryItemId) {
    return NextResponse.json(
      { error: "targetPlayerId и targetInventoryItemId обязательны" },
      { status: 400 },
    );
  }

  const urka = await prisma.player.findUnique({ where: { userId } });
  if (!urka) {
    return NextResponse.json({ error: "Профиль не найден" }, { status: 404 });
  }
  if (urka.class !== "urka") {
    return NextResponse.json(
      { error: "Кража доступна только Урке-Ассасину" },
      { status: 403 },
    );
  }
  if (urka.energy < 1) {
    return NextResponse.json(
      { error: "Не хватает ходов (нужно 1)" },
      { status: 400 },
    );
  }
  if (urka.lastStealAt && Date.now() - urka.lastStealAt.getTime() < COOLDOWN_MS) {
    const hoursLeft = Math.ceil(
      (COOLDOWN_MS - (Date.now() - urka.lastStealAt.getTime())) / (60 * 60 * 1000),
    );
    return NextResponse.json(
      { error: `Кража на кулдауне (~${hoursLeft}ч)` },
      { status: 400 },
    );
  }
  if (targetPlayerId === urka.id) {
    return NextResponse.json({ error: "У себя не крадут" }, { status: 400 });
  }

  const target = await prisma.player.findUnique({ where: { id: targetPlayerId } });
  if (!target) {
    return NextResponse.json({ error: "Цель не найдена" }, { status: 404 });
  }

  const invItem = await prisma.inventoryItem.findUnique({
    where: { id: targetInventoryItemId },
    include: { item: true },
  });
  if (!invItem || invItem.playerId !== targetPlayerId) {
    return NextResponse.json({ error: "Предмет у цели не найден" }, { status: 404 });
  }
  // Косметика и легендарки не крадутся (легендарки — балансное решение)
  if (invItem.item.category === "COSMETIC") {
    return NextResponse.json(
      { error: "Косметику не украсть — это часть личности" },
      { status: 400 },
    );
  }
  if (invItem.item.rarity === "LEGENDARY") {
    return NextResponse.json(
      { error: "Легендарные артефакты слишком крепко привязаны" },
      { status: 400 },
    );
  }

  // Бросок успеха
  const baseChance = 50;
  const luckDelta = (urka.luck - target.luck) * 3;
  const successChance = Math.max(10, Math.min(90, baseChance + luckDelta));
  const roll = Math.random() * 100;
  const success = roll < successChance;

  if (!success) {
    // Провал — −1 поинт + cooldown + −1 ход
    await prisma.player.update({
      where: { id: urka.id },
      data: {
        energy: { decrement: 1 },
        points: { decrement: FAIL_PENALTY },
        lastStealAt: new Date(),
      },
    });
    return NextResponse.json({
      success: true,
      stolen: false,
      message: `Провалился! ${target.nickname} тебя заметил. −${FAIL_PENALTY} поинт, кулдаун 24ч.`,
      roll: Math.round(roll),
      threshold: successChance,
    });
  }

  // Успех — нужно убедиться, что у Урки есть слот
  const urkaInvCount = await prisma.inventoryItem.count({
    where: { playerId: urka.id },
  });
  if (urkaInvCount >= INVENTORY_LIMIT) {
    return NextResponse.json(
      { error: "У тебя инвентарь полный — некуда положить добычу" },
      { status: 400 },
    );
  }

  // Перемещение в транзакции
  await prisma.$transaction([
    prisma.inventoryItem.update({
      where: { id: invItem.id },
      data: { playerId: urka.id },
    }),
    prisma.player.update({
      where: { id: urka.id },
      data: {
        energy: { decrement: 1 },
        lastStealAt: new Date(),
      },
    }),
  ]);

  return NextResponse.json({
    success: true,
    stolen: true,
    message: `Украл «${invItem.item.name}» у ${target.nickname}!`,
    item: { id: invItem.item.id, name: invItem.item.name },
    roll: Math.round(roll),
    threshold: successChance,
  });
}
