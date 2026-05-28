import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getRegionById } from "@/lib/regions";
import {
  parseActiveBuffs,
  hasBuff,
  removeBuff,
  serializeActiveBuffs,
} from "@/lib/active-buffs";
import { ensureEnergyReset } from "@/lib/energy";

type ConditionType = "basic" | "genre" | "special";

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
    return NextResponse.json({ error: "Кривое тело" }, { status: 400 });
  }

  const { title, link, conditionType } = body as {
    title?: string;
    link?: string;
    conditionType?: ConditionType;
  };

  if (!title || typeof title !== "string" || title.trim().length < 2) {
    return NextResponse.json(
      { error: "Название игры должно быть минимум 2 символа" },
      { status: 400 },
    );
  }

  if (
    conditionType !== "basic" &&
    conditionType !== "genre" &&
    conditionType !== "special"
  ) {
    return NextResponse.json(
      { error: "Неизвестный тип условий" },
      { status: 400 },
    );
  }

  let player = await prisma.player.findUnique({
    where: { userId },
  });

  if (!player) {
    return NextResponse.json({ error: "Профиль не найден" }, { status: 404 });
  }

  // Авто-сброс энергии если наступил новый UTC-день
  player = await ensureEnergyReset(player);

  // У игрока уже есть активная игра?
  if (player.activeGameId) {
    return NextResponse.json(
      { error: "У тебя уже есть активная игра. Заверши её или дропни перед роллом новой." },
      { status: 400 },
    );
  }

  // Стоимость ролла (1 ход + бафы ловушек)
  let rollCost = 1;
  const rollBuffs = parseActiveBuffs(player.activeBuffs);
  const slimeActive = hasBuff(rollBuffs, "trap_extra_cost");
  if (slimeActive) rollCost += 1;
  // Похмелье от Рвотничков — следующий ролл стоит +1
  const hangoverActive = hasBuff(rollBuffs, "trap_roll_extra");
  if (hangoverActive) rollCost += 1;

  if (player.energy < rollCost) {
    return NextResponse.json(
      { error: `Нет ходов на ролл (нужно ${rollCost})` },
      { status: 400 },
    );
  }

  // В каком регионе игрок (для записи)
  const regionId = player.currentRegion;
  if (!regionId) {
    return NextResponse.json({ error: "Ты вне регионов" }, { status: 400 });
  }

  const region = getRegionById(regionId);
  if (!region || !region.conditions) {
    return NextResponse.json(
      { error: "В этом регионе нельзя роллить" },
      { status: 400 },
    );
  }

  // Проверяем, что выбранный тип условий доступен
  const condition =
    conditionType === "basic"
      ? region.conditions.basic
      : conditionType === "genre"
      ? region.conditions.genre
      : region.conditions.special;

  if (!condition) {
    return NextResponse.json(
      { error: "Этот тип условий недоступен в регионе" },
      { status: 400 },
    );
  }

  // Если special — проверяем что игрок не отказывался от него
  if (conditionType === "special") {
    const declined: string[] = player.declinedSpecials
      ? safeParseJsonArray(player.declinedSpecials)
      : [];
    if (declined.includes(regionId)) {
      return NextResponse.json(
        { error: "Ты уже отказался от особого условия в этом регионе" },
        { status: 400 },
      );
    }
  }

  // Создаём запись игры + списываем ход + ставим её активной
  const game = await prisma.game.create({
    data: {
      playerId: player.id,
      title: title.trim(),
      link: link?.trim() || null,
      region: regionId,
      status: "ACTIVE",
      conditionType,
      conditionsSnapshot: JSON.stringify(condition),
    },
  });

  // Сжигаем разовый бафф Лоромана "class_ancient" если был активен.
  // Это просто маркер для UI; на сервере мы лишь убираем его, чтобы не висел.
  // Также сжигаем ловушку "trap_extra_cost" (Жижу) если была.
  let updatedBuffs = rollBuffs;
  const ancientUsed = hasBuff(updatedBuffs, "class_ancient");
  if (ancientUsed) updatedBuffs = removeBuff(updatedBuffs, "class_ancient");
  if (slimeActive) updatedBuffs = removeBuff(updatedBuffs, "trap_extra_cost");
  if (hangoverActive) updatedBuffs = removeBuff(updatedBuffs, "trap_roll_extra");
  const buffsChanged = updatedBuffs.length !== rollBuffs.length;

  await prisma.player.update({
    where: { id: player.id },
    data: {
      activeGameId: game.id,
      energy: { decrement: rollCost },
      ...(buffsChanged ? { activeBuffs: serializeActiveBuffs(updatedBuffs) } : {}),
      // Лороман: «Древнее Знание» сгорает на ролле → CD активки стартует
      // именно от этого момента (а не от активации). Так длинные перерывы
      // между роллами не делают CD бесплатным.
      ...(ancientUsed ? { lastClassActionAt: new Date() } : {}),
    },
  });

  return NextResponse.json({
    success: true,
    game,
    ancientUsed,
    cost: rollCost,
    slimeApplied: slimeActive,
    hangoverApplied: hangoverActive,
  });
}

function safeParseJsonArray(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}
