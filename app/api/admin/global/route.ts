import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

// === ОБЩИЕ ДЕЙСТВИЯ С ВСЕМИ ИГРОКАМИ ===

// POST /api/admin/global
// Тело: { action: "reset_energy" | "give_energy_all" | "start_season" | "end_season" }
export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Кривое тело" }, { status: 400 });
  }

  const { action } = body;

  // === Сбросить энергию всем до 3 (имитация полуночи) ===
  if (action === "reset_energy") {
    const res = await prisma.player.updateMany({
      data: { energy: 3 },
    });
    return NextResponse.json({ success: true, affected: res.count });
  }

  // === Выдать +N энергии всем ===
  if (action === "give_energy_all") {
    const amount = parseInt(body.amount, 10) || 1;
    const res = await prisma.player.updateMany({
      data: { energy: { increment: amount } },
    });
    return NextResponse.json({ success: true, affected: res.count });
  }

  // === НАЧАТЬ СЕЗОН ===
  // Сбрасывает поинты, инвентарь, активные игры, регион всем.
  // Класс и уровень сохраняются (но EXP делится на 2).
  if (action === "start_season") {
    const seasonName = (body.name as string)?.trim() || "Новый сезон";
    const theme = (body.theme as string)?.trim() || null;

    // Закрываем все предыдущие активные
    await prisma.season.updateMany({
      where: { endedAt: null },
      data: { endedAt: new Date() },
    });

    // Узнаём номер нового сезона
    const last = await prisma.season.findFirst({ orderBy: { number: "desc" } });
    const nextNumber = (last?.number ?? 0) + 1;

    const season = await prisma.season.create({
      data: {
        number: nextNumber,
        name: seasonName,
        theme,
      },
    });

    // Сброс игроков
    await prisma.inventoryItem.deleteMany({});
    await prisma.game.deleteMany({});
    await prisma.player.updateMany({
      data: {
        points: 0,
        energy: 3,
        activeGameId: null,
        currentRegion: "bazar",
        // EXP делится пополам
      },
    });
    // EXP делим вручную (updateMany не умеет читать-писать)
    const players = await prisma.player.findMany();
    for (const p of players) {
      await prisma.player.update({
        where: { id: p.id },
        data: { exp: Math.floor(p.exp / 2) },
      });
    }

    return NextResponse.json({ success: true, season });
  }

  // === ЗАКРЫТЬ СЕЗОН ===
  if (action === "end_season") {
    const active = await prisma.season.findFirst({ where: { endedAt: null } });
    if (!active) {
      return NextResponse.json({ error: "Нет активного сезона" }, { status: 400 });
    }
    // Определяем победителя
    const winner = await prisma.player.findFirst({
      orderBy: { points: "desc" },
    });

    const updated = await prisma.season.update({
      where: { id: active.id },
      data: {
        endedAt: new Date(),
        winnerId: winner?.id ?? null,
      },
    });

    return NextResponse.json({ success: true, season: updated, winner });
  }

  return NextResponse.json({ error: "Неизвестное действие" }, { status: 400 });
}
