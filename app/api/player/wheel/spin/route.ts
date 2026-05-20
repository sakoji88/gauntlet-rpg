import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  parseActiveBuffs,
  hasBuff,
  removeBuff,
  addBuff,
  serializeActiveBuffs,
  pruneExpiredBuffs,
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

  // Проверка: у игрока должна быть хотя бы одна пройденная/дропнутая игра,
  // у которой ещё не было крутки колеса.
  // Чтобы не усложнять схему, используем простой флаг — храним в Game поле "spunWheel"?
  // На MVP: каждая завершённая игра даёт право на одну крутку.
  // Но чтобы не плодить ботов, проверим что у Player есть пройденная игра БЕЗ предмета в инвентаре от неё.
  // Упрощение: просто разрешаем крутку 1 раз в день за крайнюю пройденную игру.

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Кривое тело" }, { status: 400 });
  }
  const { gameId } = body;

  if (!gameId) {
    return NextResponse.json({ error: "Не указана игра" }, { status: 400 });
  }

  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game || game.playerId !== player.id) {
    return NextResponse.json({ error: "Игра не найдена" }, { status: 404 });
  }
  if (game.status !== "COMPLETED") {
    return NextResponse.json({ error: "Колесо крутится только за пройденные игры" }, { status: 400 });
  }

  // Проверим, не было ли уже крутки за эту игру (по обладанию итемом, привязанным через obtainedAt)
  // Упрощённо: сравним rolledAt игры с inventoryItem.obtainedAt — если есть итем у игрока, обретённый
  // ПОСЛЕ completedAt этой игры и ДО completedAt следующей игры — значит уже было.
  // Это сложно. Для MVP: один флаг хватит. Добавим в Game поле wheelSpun (см. далее).

  // ВРЕМЕННО: проверка по полю game.description, что мы туда вписали "[wheel:spun]"
  if (game.description?.includes("[wheel:spun]")) {
    return NextResponse.json({ error: "Колесо за эту игру уже крутилось" }, { status: 400 });
  }

  // Проверка инвентаря
  const inventoryCount = await prisma.inventoryItem.count({ where: { playerId: player.id } });
  if (inventoryCount >= INVENTORY_LIMIT) {
    return NextResponse.json({
      error: `Инвентарь полон (${INVENTORY_LIMIT}/6). Освободи слот, потом возвращайся.`
    }, { status: 400 });
  }

  // Активные баффы (с очисткой просроченных)
  const rawBuffs = parseActiveBuffs(player.activeBuffs);
  const { active: playerBuffs, changed: prunedBuffs } = pruneExpiredBuffs(rawBuffs);
  if (prunedBuffs) {
    await prisma.player.update({
      where: { id: player.id },
      data: { activeBuffs: serializeActiveBuffs(playerBuffs) },
    });
  }
  const hasLuckyRoll = hasBuff(playerBuffs, "lucky_roll");
  const hasChooseOfThree = hasBuff(playerBuffs, "choose_of_three");
  const hasPerovDisdain = hasBuff(playerBuffs, "perov_disdain");

  // Загружаем все ролл-доступные предметы (rollWeight > 0).
  // Что НЕ выпадает — имеет rollWeight 0 (старая косметика-награды, особые
  // предметы магазина, Сосуд Перова). Одёжная косметика с rollWeight > 0 — выпадает.
  // Если активно Зелье Удачи — фильтруем до RARE+.
  const allItems = await prisma.item.findMany({
    where: {
      rollWeight: { gt: 0 },
      category: { not: "COSMETIC" }, // косметика (рамки/титулы) с колеса не падает
      ...(hasLuckyRoll
        ? { rarity: { in: ["RARE", "EPIC", "LEGENDARY"] } }
        : {}),
    },
  });
  if (allItems.length === 0) {
    return NextResponse.json({ error: "Каталог пуст — обратись к админу" }, { status: 500 });
  }

  // Применяем удачу игрока (каждые 4 очка Удачи = +5% к редким).
  // Дебафф "Презрение Перова" режет 1 очко удачи (минимум 0).
  const effectiveLuck = Math.max(0, player.luck - (hasPerovDisdain ? 1 : 0));
  const luckMultiplier = 1 + Math.floor(effectiveLuck / 4) * 0.05;

  const weighted = allItems.map((item: typeof allItems[number]) => {
    let weight = item.rollWeight;
    if (item.rarity === "RARE") weight = weight * luckMultiplier;
    if (item.rarity === "EPIC") weight = weight * luckMultiplier * 1.2;
    if (item.rarity === "LEGENDARY") weight = weight * luckMultiplier * 1.5;
    return { item, weight };
  });

  const totalWeight = weighted.reduce((s: number, w: { weight: number }) => s + w.weight, 0);

  // Пассивка Алхимика ИЛИ Зелье Мудрости → "выбор из 3"
  const isAlchemist = player.class === "alchemist";
  const useChooseMode = isAlchemist || hasChooseOfThree;

  function rollOne() {
    const r = Math.random() * totalWeight;
    let acc = 0;
    for (const { item, weight } of weighted) {
      acc += weight;
      if (r <= acc) return item;
    }
    return weighted[weighted.length - 1].item;
  }

  let chosen;
  let alternatives: any[] = [];

  if (useChooseMode) {
    // Выбираем 3 уникальных
    const seen = new Set<string>();
    const drawn: any[] = [];
    let attempts = 0;
    while (drawn.length < 3 && attempts < 80) {
      const i = rollOne();
      // Проклятья (дебаффы) в режиме «выбор из 3» не предлагаем — только в обычном ролле.
      if (!seen.has(i.id) && !i.effectKey?.startsWith("curse_")) {
        seen.add(i.id);
        drawn.push(i);
      }
      attempts++;
    }

    // Сжигаем разовые баффы (lucky_roll и choose_of_three) до подтверждения выбора —
    // это делает /confirm. Здесь только если пользуем Алхимика — баффы не трогаем.
    // Для не-Алхимика с баффами — оставляем тут активными, /confirm их сожжёт.
    return NextResponse.json({
      success: true,
      mode: "choose",
      gameId,
      choices: drawn.map((i) => ({
        id: i.id,
        name: i.name,
        description: i.description,
        category: i.category,
        rarity: i.rarity,
        iconKey: i.iconKey,
      })),
      buffsUsed: {
        lucky_roll: hasLuckyRoll,
        choose_of_three: hasChooseOfThree,
      },
    });
  }

  chosen = rollOne();

  // Иммунитет к проклятьям — Накладная борода Чахлона. Если выпало проклятье и
  // на игроке висит curse_immunity — сжигаем иммунитет и переролим до НЕ-проклятья.
  const hasCurseImmunity = hasBuff(playerBuffs, "curse_immunity");
  if (chosen.effectKey?.startsWith("curse_") && hasCurseImmunity) {
    let tries = 0;
    while (chosen.effectKey?.startsWith("curse_") && tries < 30) {
      chosen = rollOne();
      tries++;
    }
    const consumed = removeBuff(playerBuffs, "curse_immunity");
    await prisma.player.update({
      where: { id: player.id },
      data: { activeBuffs: serializeActiveBuffs(consumed) },
    });
    // обновляем локальный список баффов чтобы дальнейшие проверки видели актуальное
    playerBuffs.length = 0;
    playerBuffs.push(...consumed);
  }

  // ПРОКЛЯТЬЕ — предмет в инвентарь НЕ попадает, дебафф применяется сразу.
  if (chosen.effectKey?.startsWith("curse_")) {
    let cursedBuffs = playerBuffs;
    if (hasLuckyRoll) cursedBuffs = removeBuff(cursedBuffs, "lucky_roll");
    if (hasChooseOfThree) cursedBuffs = removeBuff(cursedBuffs, "choose_of_three");

    // Самобафы дебаффов — кладём ловушечные buffKey на самого себя
    const selfBuff = (key: string, magnitude: number) => {
      cursedBuffs = addBuff(cursedBuffs, {
        effectKey: key,
        sourceItemId: chosen.id,
        activatedAt: new Date().toISOString(),
        payload: { magnitude },
      });
    };
    if (chosen.effectKey === "curse_points") selfBuff("trap_points", 2);
    if (chosen.effectKey === "curse_slow") selfBuff("trap_slow", 1);
    if (chosen.effectKey === "curse_extra_cost") selfBuff("trap_extra_cost", 1);

    // Прямые правки счётчиков
    const directUpdates: Record<string, unknown> = {
      activeBuffs: serializeActiveBuffs(cursedBuffs),
    };
    if (chosen.effectKey === "curse_energy") {
      directUpdates.energy = Math.max(0, player.energy - 1);
    }
    if (chosen.effectKey === "curse_gold") {
      directUpdates.gold = Math.max(0, player.gold - 10);
    }

    await prisma.player.update({
      where: { id: player.id },
      data: directUpdates,
    });
    await prisma.game.update({
      where: { id: game.id },
      data: { description: (game.description ? game.description + " " : "") + "[wheel:spun]" },
    });
    return NextResponse.json({
      success: true,
      mode: "single",
      cursed: true,
      item: {
        id: chosen.id,
        name: chosen.name,
        description: chosen.description,
        category: chosen.category,
        rarity: chosen.rarity,
        iconKey: chosen.iconKey,
      },
    });
  }

  // Если активны разовые баффы — сжигаем (single mode = ролл состоялся)
  if (hasLuckyRoll || hasChooseOfThree) {
    let updated = playerBuffs;
    if (hasLuckyRoll) updated = removeBuff(updated, "lucky_roll");
    if (hasChooseOfThree) updated = removeBuff(updated, "choose_of_three");
    await prisma.player.update({
      where: { id: player.id },
      data: { activeBuffs: serializeActiveBuffs(updated) },
    });
  }

  // Выдаём предмет
  await prisma.inventoryItem.create({
    data: {
      playerId: player.id,
      itemId: chosen.id,
      charges: chosen.charges,
    },
  });

  // Шар Всезнания — вторая крутка одной кнопкой, если есть место в инвентаре.
  // Проклятья на второй крутке не выдаём.
  let bonusItem: typeof chosen | null = null;
  const hasWheelDouble = hasBuff(playerBuffs, "wheel_double_next");
  if (hasWheelDouble) {
    const invCountNow = await prisma.inventoryItem.count({ where: { playerId: player.id } });
    let consumedBuffs = removeBuff(playerBuffs, "wheel_double_next");
    if (invCountNow < INVENTORY_LIMIT) {
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
        bonusItem = second;
      }
    }
    await prisma.player.update({
      where: { id: player.id },
      data: { activeBuffs: serializeActiveBuffs(consumedBuffs) },
    });
  }

  // Помечаем игру как "колесо крутилось"
  await prisma.game.update({
    where: { id: game.id },
    data: { description: (game.description ? game.description + " " : "") + "[wheel:spun]" },
  });

  return NextResponse.json({
    success: true,
    mode: "single",
    item: {
      id: chosen.id,
      name: chosen.name,
      description: chosen.description,
      category: chosen.category,
      rarity: chosen.rarity,
      iconKey: chosen.iconKey,
    },
    bonusItem: bonusItem
      ? {
          id: bonusItem.id,
          name: bonusItem.name,
          description: bonusItem.description,
          category: bonusItem.category,
          rarity: bonusItem.rarity,
          iconKey: bonusItem.iconKey,
        }
      : null,
  });
}
