import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  parseActiveBuffs,
  hasBuff,
  removeBuff,
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
  // Косметика никогда не выпадает с колеса — только за квесты / условия.
  // Если активно Зелье Удачи — фильтруем до RARE+.
  const allItems = await prisma.item.findMany({
    where: {
      rollWeight: { gt: 0 },
      category: { not: "COSMETIC" },
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
    while (drawn.length < 3 && attempts < 50) {
      const i = rollOne();
      if (!seen.has(i.id)) {
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
  const inv = await prisma.inventoryItem.create({
    data: {
      playerId: player.id,
      itemId: chosen.id,
      charges: chosen.charges,
    },
    include: { item: true },
  });

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
  });
}
