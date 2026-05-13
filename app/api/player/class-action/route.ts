import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  parseActiveBuffs,
  serializeActiveBuffs,
  addBuff,
  hasBuff,
} from "@/lib/active-buffs";
import {
  CLASS_ACTIONS,
  CLASS_ACTION_COOLDOWN_MS,
  classActionCooldownLeft,
} from "@/lib/class-actions";

// Универсальный endpoint активации классовой активки.
// Тело: { input?: { restriction?, promise? }, fuseItemId? }
//
// Авто-определяет активку по player.class. Проверяет cooldown (24ч),
// применяет эффект, обновляет lastClassActionAt.

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }
  const userId = (session.user as any).id;

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    // тело необязательно
  }

  const player = await prisma.player.findUnique({ where: { userId } });
  if (!player) {
    return NextResponse.json({ error: "Профиль не найден" }, { status: 404 });
  }
  if (!player.class) {
    return NextResponse.json({ error: "Класс не выбран" }, { status: 400 });
  }

  const action = CLASS_ACTIONS[player.class];
  if (!action) {
    return NextResponse.json({ error: "У твоего класса нет активки" }, { status: 400 });
  }
  if (action.unavailable) {
    return NextResponse.json(
      { error: "Эта активка ещё не доступна (ждёт следующих этапов)" },
      { status: 400 },
    );
  }

  // Cooldown
  const cdLeft = classActionCooldownLeft(player.lastClassActionAt);
  if (cdLeft > 0) {
    const hoursLeft = Math.ceil(cdLeft / (60 * 60 * 1000));
    return NextResponse.json(
      { error: `Активка остыла. Ждать ещё ~${hoursLeft}ч` },
      { status: 400 },
    );
  }

  const buffs = parseActiveBuffs(player.activeBuffs);

  // ===== Берсерк — Ярость Бати =====
  if (action.key === "fury") {
    if (hasBuff(buffs, "class_fury")) {
      return NextResponse.json({ error: "Уже в ярости" }, { status: 400 });
    }
    const next = addBuff(buffs, {
      effectKey: "class_fury",
      sourceItemId: "class_action",
      activatedAt: new Date().toISOString(),
    });
    await prisma.player.update({
      where: { id: player.id },
      data: {
        activeBuffs: serializeActiveBuffs(next),
        lastClassActionAt: new Date(),
      },
    });
    return NextResponse.json({
      success: true,
      message: "ХУУУУХ! Поставь галку «Макс. сложность» на следующей завершённой игре — будет ×2.",
    });
  }

  // ===== Лороман — Древнее Знание =====
  if (action.key === "ancient") {
    if (hasBuff(buffs, "class_ancient")) {
      return NextResponse.json({ error: "Видение уже активно" }, { status: 400 });
    }
    const next = addBuff(buffs, {
      effectKey: "class_ancient",
      sourceItemId: "class_action",
      activatedAt: new Date().toISOString(),
    });
    await prisma.player.update({
      where: { id: player.id },
      data: {
        activeBuffs: serializeActiveBuffs(next),
        lastClassActionAt: new Date(),
      },
    });
    return NextResponse.json({
      success: true,
      message:
        "Видение принято. На следующем ролле игры покрути колесо дважды и впиши то, что больше нравится.",
    });
  }

  // ===== Страдалец — Самобичевание =====
  if (action.key === "self_flag") {
    if (hasBuff(buffs, "class_self_flag")) {
      return NextResponse.json({ error: "Бичевание уже наложено" }, { status: 400 });
    }
    const restriction = (body?.input?.restriction ?? "").toString().trim();
    if (restriction.length < 3) {
      return NextResponse.json(
        { error: "Опиши, какое ограничение берёшь (минимум 3 символа)" },
        { status: 400 },
      );
    }
    const next = addBuff(buffs, {
      effectKey: "class_self_flag",
      sourceItemId: "class_action",
      activatedAt: new Date().toISOString(),
      payload: { restriction },
    });
    await prisma.player.update({
      where: { id: player.id },
      data: {
        activeBuffs: serializeActiveBuffs(next),
        lastClassActionAt: new Date(),
      },
    });
    return NextResponse.json({
      success: true,
      message: `Самоштраф принят: «${restriction}». Следующая «прошёл» даст ×2 поинтов.`,
    });
  }

  // ===== Бард — Хайп =====
  if (action.key === "hype") {
    if (hasBuff(buffs, "class_hype")) {
      return NextResponse.json({ error: "Хайп уже на сцене" }, { status: 400 });
    }
    const promise = (body?.input?.promise ?? "").toString().trim();
    if (promise.length < 3) {
      return NextResponse.json(
        { error: "Впиши свой анонс (минимум 3 символа)" },
        { status: 400 },
      );
    }
    const next = addBuff(buffs, {
      effectKey: "class_hype",
      sourceItemId: "class_action",
      activatedAt: new Date().toISOString(),
      payload: { promise },
    });
    await prisma.player.update({
      where: { id: player.id },
      data: {
        activeBuffs: serializeActiveBuffs(next),
        lastClassActionAt: new Date(),
      },
    });
    return NextResponse.json({
      success: true,
      message: `Хайп пошёл: «${promise}». На следующей «прошёл» отметишь — выполнил или нет.`,
    });
  }

  // ===== Алхимик — Алхимия =====
  if (action.key === "alchemy") {
    const fuseItemId = (body?.fuseItemId ?? "").toString().trim();
    if (!fuseItemId) {
      return NextResponse.json(
        { error: "Не указан предмет для слияния" },
        { status: 400 },
      );
    }

    // Найдём у игрока 3 одинаковых
    const stash = await prisma.inventoryItem.findMany({
      where: { playerId: player.id, itemId: fuseItemId, charges: { gt: 0 } },
      include: { item: true },
      orderBy: { obtainedAt: "asc" },
    });
    if (stash.length < 3) {
      return NextResponse.json(
        { error: "Нужно 3 одинаковых предмета в инвентаре" },
        { status: 400 },
      );
    }

    const sample = stash[0].item;
    if (sample.category !== "CONSUMABLE" && sample.category !== "EQUIPMENT") {
      return NextResponse.json(
        { error: "Сливать можно только расходники или экипировку" },
        { status: 400 },
      );
    }

    // Тянем случайный артефакт (rollWeight > 0)
    const artifacts = await prisma.item.findMany({
      where: { category: "ARTIFACT", rollWeight: { gt: 0 } },
    });
    if (artifacts.length === 0) {
      return NextResponse.json({ error: "Артефактов нет в каталоге" }, { status: 500 });
    }
    const totalW = artifacts.reduce((s: number, a: typeof artifacts[number]) => s + a.rollWeight, 0);
    let r = Math.random() * totalW;
    let chosen = artifacts[0];
    for (const a of artifacts) {
      r -= a.rollWeight;
      if (r <= 0) { chosen = a; break; }
    }

    // Транзакция: убрать 3, добавить артефакт, обновить cooldown
    const toRemove = stash.slice(0, 3);
    await prisma.$transaction([
      ...toRemove.map((inv: typeof toRemove[number]) =>
        prisma.inventoryItem.delete({ where: { id: inv.id } }),
      ),
      prisma.inventoryItem.create({
        data: {
          playerId: player.id,
          itemId: chosen.id,
          charges: chosen.charges,
        },
      }),
      prisma.player.update({
        where: { id: player.id },
        data: { lastClassActionAt: new Date() },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: `Котёл закипел. Слилось 3× «${sample.name}» → выпал «${chosen.name}» (${chosen.rarity}).`,
      artifact: {
        id: chosen.id,
        name: chosen.name,
        rarity: chosen.rarity,
      },
    });
  }

  return NextResponse.json({ error: "Неизвестная активка" }, { status: 400 });
}
