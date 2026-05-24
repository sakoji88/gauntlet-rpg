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
  // Принимает либо новый формат { fuseItemIds: string[] } (3 любых разных inventoryItem.id),
  // либо старый { fuseItemId: string } (тогда возьмём 3 одинаковых) — обратная совместимость.
  if (action.key === "alchemy") {
    const rawIds = Array.isArray(body?.fuseItemIds) ? body.fuseItemIds : null;
    const legacyId = (body?.fuseItemId ?? "").toString().trim();

    // --- Резолвим список из 3 inventoryItem ---
    // Включаем relation item — нужны name/category/rarity ингредиентов.
    type StashRow = Awaited<
      ReturnType<typeof prisma.inventoryItem.findMany<{ include: { item: true } }>>
    >[number];
    let stash: StashRow[] = [];

    if (rawIds) {
      // Новый формат: 3 inventoryItem.id (разные).
      const ids: string[] = rawIds
        .filter((x: unknown): x is string => typeof x === "string")
        .map((x: string) => x.trim())
        .filter((x: string) => x.length > 0);
      if (ids.length !== 3) {
        return NextResponse.json(
          { error: "Нужно выбрать ровно 3 предмета" },
          { status: 400 },
        );
      }
      if (new Set(ids).size !== 3) {
        return NextResponse.json(
          { error: "Слоты должны быть разными (нельзя положить один предмет дважды)" },
          { status: 400 },
        );
      }
      stash = await prisma.inventoryItem.findMany({
        where: { id: { in: ids }, playerId: player.id, charges: { gt: 0 } },
        include: { item: true },
      });
      if (stash.length !== 3) {
        return NextResponse.json(
          { error: "Не все выбранные предметы найдены в твоём инвентаре" },
          { status: 400 },
        );
      }
    } else if (legacyId) {
      // Старый формат: 3 одинаковых.
      stash = await prisma.inventoryItem.findMany({
        where: { playerId: player.id, itemId: legacyId, charges: { gt: 0 } },
        include: { item: true },
        orderBy: { obtainedAt: "asc" },
      });
      if (stash.length < 3) {
        return NextResponse.json(
          { error: "Нужно 3 предмета. Старый формат требовал 3 одинаковых — но теперь можно выбрать 3 любых." },
          { status: 400 },
        );
      }
      stash = stash.slice(0, 3);
    } else {
      return NextResponse.json(
        { error: "Не указаны предметы для слияния (передай fuseItemIds: string[] из 3 inventoryItem.id)" },
        { status: 400 },
      );
    }

    // --- Проверяем категории/редкости (каждого ингредиента) ---
    for (const inv of stash) {
      if (inv.item.category !== "CONSUMABLE" && inv.item.category !== "EQUIPMENT") {
        return NextResponse.json(
          { error: `Сливать можно только расходники или экипировку — «${inv.item.name}» не подходит` },
          { status: 400 },
        );
      }
      if (inv.item.rarity === "LEGENDARY") {
        return NextResponse.json(
          { error: `Легендарки в котёл не лезут — «${inv.item.name}»` },
          { status: 400 },
        );
      }
    }

    // --- Тянем случайный артефакт ---
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

    // --- Транзакция: удалить 3, выдать артефакт, обновить cooldown ---
    await prisma.$transaction([
      ...stash.map((inv: typeof stash[number]) =>
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

    const ingredientList = stash.map((inv: typeof stash[number]) => `«${inv.item.name}»`).join(", ");
    return NextResponse.json({
      success: true,
      message: `Котёл закипел. Слилось ${ingredientList} → выпал «${chosen.name}» (${chosen.rarity}).`,
      artifact: {
        id: chosen.id,
        name: chosen.name,
        rarity: chosen.rarity,
      },
    });
  }

  return NextResponse.json({ error: "Неизвестная активка" }, { status: 400 });
}
