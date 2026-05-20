import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canMoveBetween, getRegionById } from "@/lib/regions";
import { hasPassiveEffect } from "@/lib/item-effects";
import { ensureEnergyReset } from "@/lib/energy";
import {
  parseActiveBuffs,
  serializeActiveBuffs,
  removeBuff,
  hasBuff,
} from "@/lib/active-buffs";

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
    return NextResponse.json({ error: "Кривое тело запроса" }, { status: 400 });
  }

  const { regionId } = body;

  if (!regionId || !getRegionById(regionId)) {
    return NextResponse.json({ error: "Регион не найден" }, { status: 400 });
  }

  let player = await prisma.player.findUnique({
    where: { userId },
  });

  if (!player) {
    return NextResponse.json({ error: "Профиль не найден" }, { status: 404 });
  }

  // Авто-сброс энергии если наступил новый UTC-день
  player = await ensureEnergyReset(player);

  // Если игрок ещё не выбрал ни одной локации — установить стартовую
  if (!player.currentRegion) {
    const updated = await prisma.player.update({
      where: { userId },
      data: { currentRegion: regionId },
    });
    return NextResponse.json({ success: true, player: updated, isInitial: true });
  }

  // Сидит ли игрок в тюрьме?
  if (player.inPrison) {
    return NextResponse.json(
      { error: "Сидишь в тюрьме. Выйти можно только пройдя тюремную игру." },
      { status: 400 },
    );
  }

  // Проверяем возможность перехода
  const moveCheck = canMoveBetween(player.currentRegion, regionId);

  if (!moveCheck.canMove) {
    return NextResponse.json(
      { error: moveCheck.reason ?? "Сюда нельзя" },
      { status: 400 },
    );
  }

  // Сапоги Спидраннера: пассивный -1 ход (мин. 1)
  const hasBoots = await hasPassiveEffect(player.id, "cheap_move");
  let finalCost = hasBoots ? Math.max(1, moveCheck.cost - 1) : moveCheck.cost;

  // Ловушки, влияющие на перемещение:
  //   trap_slow (Грабли) — +1
  //   trap_strong_slow (Крыса) — +2
  //   trap_extra_cost (Жижа) — +1 на любое действие
  const buffs = parseActiveBuffs(player.activeBuffs);
  let updatedBuffs = buffs;
  const trapsApplied: string[] = [];
  if (hasBuff(buffs, "trap_slow")) {
    finalCost += 1;
    updatedBuffs = removeBuff(updatedBuffs, "trap_slow");
    trapsApplied.push("Грабли");
  }
  if (hasBuff(buffs, "trap_strong_slow")) {
    finalCost += 2;
    updatedBuffs = removeBuff(updatedBuffs, "trap_strong_slow");
    trapsApplied.push("Крыса");
  }
  if (hasBuff(buffs, "trap_extra_cost")) {
    finalCost += 1;
    updatedBuffs = removeBuff(updatedBuffs, "trap_extra_cost");
    trapsApplied.push("Липкая Жижа");
  }

  // Бафф «Баскет 24 крыльев» — следующее перемещение бесплатное (после всех штрафов)
  const usedFreeMove = hasBuff(buffs, "free_move");
  if (usedFreeMove) {
    finalCost = 0;
    updatedBuffs = removeBuff(updatedBuffs, "free_move");
  }

  const buffsChanged = updatedBuffs.length !== buffs.length;

  if (player.energy < finalCost) {
    return NextResponse.json(
      { error: `Не хватает ходов (нужно ${finalCost}, есть ${player.energy})` },
      { status: 400 },
    );
  }

  // Совершаем переход — тратим ходы, обновляем локацию + сжигаем ловушки
  const updated = await prisma.player.update({
    where: { userId },
    data: {
      currentRegion: regionId,
      energy: { decrement: finalCost },
      ...(buffsChanged ? { activeBuffs: serializeActiveBuffs(updatedBuffs) } : {}),
    },
  });

  return NextResponse.json({
    success: true,
    player: updated,
    cost: finalCost,
    bootsDiscount: hasBoots,
    trapsApplied,
  });
}