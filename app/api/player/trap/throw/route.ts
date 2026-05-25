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
import { getTrapByItemId, type TrapDef } from "@/lib/trap-effects";

// Бросить ловушку в другого игрока.
// Тело: { inventoryItemId: string, targetPlayerId: string }
//
// Логика:
//   1. У броска́ющего есть этот предмет в инвентаре, он — TRAP.
//   2. Цель — другой игрок (не сам себе).
//   3. Для buff-ловушек: у цели не должно быть уже активной такой же.
//   4. Для instant-ловушек: ограничение не нужно — эффект применяется сразу.
//   5. У Урки активка "Подкидыш" бесплатная (0 ходов) — для других классов 1 ход.

const TELEPORT_HOME_PRIMARY = "khutor";
const TELEPORT_HOME_FALLBACK = "chakhly-bor";

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
  const { inventoryItemId, targetPlayerId, forcedGameTitle } = body as {
    inventoryItemId?: string;
    targetPlayerId?: string;
    forcedGameTitle?: string; // только для Скальпа Говяды
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

  let target = await prisma.player.findUnique({ where: { id: targetPlayerId } });
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

  // Скальп Говяды и другие ловушки с requiresGameTitle — нужен title от бросающего.
  const cleanForcedTitle = (forcedGameTitle ?? "").trim();
  if (trap.requiresGameTitle && cleanForcedTitle.length < 2) {
    return NextResponse.json(
      { error: "Для этой ловушки нужно вписать название игры (минимум 2 символа)" },
      { status: 400 },
    );
  }

  let targetBuffs = parseActiveBuffs(target.activeBuffs);

  // === ОТРАЖЕНИЕ (Чупа чупс Душика) ===
  // Если у цели висит trap_reflect — ловушка летит обратно в нападавшего.
  // Бафф сжигается у изначальной цели. Дальше код выполняется так, будто
  // цель = бросающий (target переопределяется). Защитные баффы у нового
  // «получателя» (Балкон, ещё одна Чупа чупс) НЕ перепроверяются — это
  // разовая «карма».
  let reflected = false;
  let originalTargetNickname = target.nickname;
  if (hasBuff(targetBuffs, "trap_reflect")) {
    reflected = true;
    const cleanedReflectBuffs = removeBuff(targetBuffs, "trap_reflect");
    await prisma.player.update({
      where: { id: target.id },
      data: { activeBuffs: serializeActiveBuffs(cleanedReflectBuffs) },
    });
    target = player;
    targetBuffs = parseActiveBuffs(player.activeBuffs);
  }

  // Для buff-ловушек: проверка дубля (на ЭФФЕКТИВНОЙ цели — с учётом отражения)
  if (trap.mode === "buff" && trap.buffKey && hasBuff(targetBuffs, trap.buffKey)) {
    return NextResponse.json(
      { error: "У цели уже висит такая ловушка" },
      { status: 400 },
    );
  }

  // Защита «Разьёбанный балкон Попова» — гасит первую брошенную ловушку.
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

  // Скальп Говяды: цель не должна иметь активной игры (иначе её нельзя
  // принудительно поставить). Проверка делается ПОСЛЕ возможного отражения —
  // target к этому моменту уже указывает на реальную цель.
  if (trap.instantKind === "force_game" && target.activeGameId) {
    return NextResponse.json(
      {
        error: `У ${target.nickname} уже есть активная игра — Скальп Говяды не сработает. Дождись, пока она освободится.`,
      },
      { status: 400 },
    );
  }

  // ===== Развилка по режиму =====
  if (trap.mode === "buff") {
    const message = await applyBuffTrap({
      trap,
      targetBuffs,
      targetId: target.id,
      targetNickname: target.nickname,
      throwerId: player.id,
      throwerNickname: player.nickname,
      invItemId: invItem.id,
      invItemCharges: invItem.charges,
      energyCost,
    });
    return NextResponse.json({
      success: true,
      message: reflected
        ? `🔄 Отражение! ${originalTargetNickname} отбил ловушку обратно. ${message}`
        : message,
      cost: energyCost,
      free: energyCost === 0,
      reflected,
    });
  }

  // mode === "instant"
  const result = await applyInstantTrap({
    trap,
    target,
    thrower: player,
    forcedGameTitle: cleanForcedTitle,
    invItemId: invItem.id,
    invItemCharges: invItem.charges,
    energyCost,
  });
  return NextResponse.json({
    success: true,
    message: reflected
      ? `🔄 Отражение! ${originalTargetNickname} отбил ловушку — ${result.message}`
      : result.message,
    cost: energyCost,
    free: energyCost === 0,
    reflected,
    ...result.extra,
  });
}

// ===== BUFF-ЛОВУШКИ =====
async function applyBuffTrap(args: {
  trap: TrapDef;
  targetBuffs: ReturnType<typeof parseActiveBuffs>;
  targetId: string;
  targetNickname: string;
  throwerId: string;
  throwerNickname: string;
  invItemId: string;
  invItemCharges: number;
  energyCost: number;
}): Promise<string> {
  const {
    trap, targetBuffs, targetId, targetNickname, throwerId, throwerNickname,
    invItemId, invItemCharges, energyCost,
  } = args;
  if (!trap.buffKey) throw new Error("buffKey is required for buff trap");

  // Для эффектов со счётчиком (Зловоние, Двойное Проклятье) кладём remaining в payload.
  const payload: Record<string, unknown> = {
    thrower: throwerId,
    throwerNickname,
    magnitude: trap.magnitude,
  };
  if (trap.appliesTo === "stink" || trap.appliesTo === "curse_x2") {
    payload.remaining = trap.magnitude;
  }

  const newTargetBuffs = addBuff(targetBuffs, {
    effectKey: trap.buffKey,
    sourceItemId: trap.itemId,
    activatedAt: new Date().toISOString(),
    payload,
  });

  await prisma.$transaction(async (tx) => {
    if (invItemCharges <= 1) {
      await tx.inventoryItem.delete({ where: { id: invItemId } });
    } else {
      await tx.inventoryItem.update({
        where: { id: invItemId },
        data: { charges: { decrement: 1 } },
      });
    }
    await tx.player.update({
      where: { id: targetId },
      data: { activeBuffs: serializeActiveBuffs(newTargetBuffs) },
    });
    if (energyCost > 0) {
      await tx.player.update({
        where: { id: throwerId },
        data: { energy: { decrement: energyCost } },
      });
    }
  });

  return `«${trap.name}» — летит в ${targetNickname}!`;
}

// ===== INSTANT-ЛОВУШКИ =====
async function applyInstantTrap(args: {
  trap: TrapDef;
  target: { id: string; nickname: string; gold: number; currentRegion: string | null; activeGameId: string | null };
  thrower: { id: string; nickname: string; class: string | null };
  forcedGameTitle: string;
  invItemId: string;
  invItemCharges: number;
  energyCost: number;
}): Promise<{ message: string; extra?: Record<string, unknown> }> {
  const { trap, target, thrower, forcedGameTitle, invItemId, invItemCharges, energyCost } = args;

  // Общие операции (декремент предмета, списание хода) — выполним внутри транзакции.
  return await prisma.$transaction(async (tx) => {
    // 1. Сжигаем ловушку у бросающего
    if (invItemCharges <= 1) {
      await tx.inventoryItem.delete({ where: { id: invItemId } });
    } else {
      await tx.inventoryItem.update({
        where: { id: invItemId },
        data: { charges: { decrement: 1 } },
      });
    }
    // 2. Списываем ход (если не Урка)
    if (energyCost > 0) {
      await tx.player.update({
        where: { id: thrower.id },
        data: { energy: { decrement: energyCost } },
      });
    }

    // 3. Применяем эффект
    switch (trap.instantKind) {
      case "steal_gold": {
        const amount = Math.min(trap.magnitude, target.gold);
        if (amount > 0) {
          await tx.player.update({
            where: { id: target.id },
            data: { gold: { decrement: amount } },
          });
          await tx.player.update({
            where: { id: thrower.id },
            data: { gold: { increment: amount } },
          });
        }
        const msg = amount > 0
          ? `«${trap.name}» — Крыса юркнула под ноги ${target.nickname} и принесла тебе ${amount} Злата!`
          : `«${trap.name}» — Крыса прибежала, но у ${target.nickname} в карманах пусто.`;
        return { message: msg, extra: { goldStolen: amount } };
      }

      case "drain_gold": {
        const amount = Math.min(trap.magnitude, target.gold);
        if (amount > 0) {
          await tx.player.update({
            where: { id: target.id },
            data: { gold: { decrement: amount } },
          });
        }
        const msg = amount > 0
          ? `«${trap.name}» — ${target.nickname} побежал срочно и обронил ${amount} Злата.`
          : `«${trap.name}» — ${target.nickname} побежал, но терять было нечего.`;
        return { message: msg, extra: { goldDrained: amount } };
      }

      case "burn_charge": {
        const candidates = await tx.inventoryItem.findMany({
          where: {
            playerId: target.id,
            charges: { gt: 0 },
            item: { category: { in: ["CONSUMABLE", "EQUIPMENT", "TRAP"] } },
          },
          include: { item: true },
        });
        if (candidates.length === 0) {
          return {
            message: `«${trap.name}» — у ${target.nickname} в инвентаре нечему гореть.`,
            extra: { burned: null },
          };
        }
        const victim = candidates[Math.floor(Math.random() * candidates.length)];
        if (victim.charges <= 1) {
          await tx.inventoryItem.delete({ where: { id: victim.id } });
        } else {
          await tx.inventoryItem.update({
            where: { id: victim.id },
            data: { charges: { decrement: 1 } },
          });
        }
        return {
          message: `«${trap.name}» — у ${target.nickname} обуглился предмет «${victim.item.name}» (заряд сгорел).`,
          extra: { burned: { id: victim.itemId, name: victim.item.name } },
        };
      }

      case "lose_random_item": {
        const candidates = await tx.inventoryItem.findMany({
          where: {
            playerId: target.id,
            charges: { gt: 0 },
            item: { category: "CONSUMABLE", rarity: { not: "LEGENDARY" } },
          },
          include: { item: true },
        });
        if (candidates.length === 0) {
          return {
            message: `«${trap.name}» — ${target.nickname} ушёл по ложному следу, но терять ему нечего (расходников нет).`,
            extra: { lost: null },
          };
        }
        const victim = candidates[Math.floor(Math.random() * candidates.length)];
        // Расходник просто пропадает целиком (вне зависимости от charges)
        await tx.inventoryItem.delete({ where: { id: victim.id } });
        return {
          message: `«${trap.name}» — ${target.nickname} ушёл по ложному следу и потерял «${victim.item.name}».`,
          extra: { lost: { id: victim.itemId, name: victim.item.name } },
        };
      }

      case "teleport_home": {
        const dest =
          target.currentRegion === TELEPORT_HOME_PRIMARY
            ? TELEPORT_HOME_FALLBACK
            : TELEPORT_HOME_PRIMARY;
        await tx.player.update({
          where: { id: target.id },
          data: { currentRegion: dest },
        });
        return {
          message: `«${trap.name}» — ${target.nickname} с грохотом улетел в ${dest === TELEPORT_HOME_PRIMARY ? "Хутор Душлендора" : "Чахлый Бор"}.`,
          extra: { teleportedTo: dest },
        };
      }

      case "force_game": {
        // Скальп Говяды: бросающий задаёт жертве конкретную игру.
        // Проверка target.activeGameId сделана в main handler.
        if (!forcedGameTitle) {
          throw new Error("Не указано название игры для Скальпа");
        }
        // Создаём Game напрямую: бесплатно, в текущем регионе жертвы (или khutor если нет).
        const regionId = target.currentRegion ?? "khutor";
        const created = await tx.game.create({
          data: {
            playerId: target.id,
            title: forcedGameTitle,
            link: null,
            region: regionId,
            status: "ACTIVE",
            conditionType: "basic",
            // в описание — пометка кто прислал. Игрок увидит в активной панели.
            description: `[Скальп Говяды от ${thrower.nickname}]`,
            // Слепок условий не пишем — это «голая» игра, основное условие
            // будет считаться обычно как basic.
            conditionsSnapshot: null,
          },
        });
        await tx.player.update({
          where: { id: target.id },
          data: { activeGameId: created.id },
        });
        return {
          message: `«${trap.name}» — ${target.nickname} обязан пройти «${forcedGameTitle}» (или дропнуть в Тюрьму).`,
          extra: { forcedGameId: created.id, forcedTitle: forcedGameTitle },
        };
      }

      default:
        throw new Error(`Неизвестный instantKind: ${trap.instantKind}`);
    }
  });
}
