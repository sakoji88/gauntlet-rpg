import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PEROV_NPC_REGION } from "@/lib/perov";
import {
  parseActiveBuffs,
  serializeActiveBuffs,
  addBuff,
} from "@/lib/active-buffs";

// Отказ от испытания Перова:
//   -3 поинта
//   debuff "perov_disdain" на 3 дня (-1 удача — учитывается в колесе предметов и формуле)
//   квест → DECLINED
const PEROV_DECLINE_PENALTY = -3;
const DISDAIN_DAYS = 3;

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
  const { questId } = body as { questId?: string };
  if (!questId) {
    return NextResponse.json({ error: "Не указан квест" }, { status: 400 });
  }

  const player = await prisma.player.findUnique({ where: { userId } });
  if (!player) {
    return NextResponse.json({ error: "Профиль не найден" }, { status: 404 });
  }

  const quest = await prisma.quest.findUnique({ where: { id: questId } });
  if (!quest || quest.playerId !== player.id) {
    return NextResponse.json({ error: "Испытание не найдено" }, { status: 404 });
  }
  if (quest.npcRegion !== PEROV_NPC_REGION) {
    return NextResponse.json({ error: "Это не испытание Перова" }, { status: 400 });
  }
  if (quest.status !== "OFFERED") {
    return NextResponse.json({ error: "Это испытание уже не предложено" }, { status: 400 });
  }

  // Дебафф "Презрение Перова" на 3 дня
  const buffs = parseActiveBuffs(player.activeBuffs);
  const expiresAt = new Date(Date.now() + DISDAIN_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const updated = addBuff(buffs, {
    effectKey: "perov_disdain",
    sourceItemId: "perov",
    activatedAt: new Date().toISOString(),
    expiresAt,
    payload: { luckPenalty: 1 },
  });

  await prisma.$transaction([
    prisma.quest.update({
      where: { id: quest.id },
      data: { status: "DECLINED" },
    }),
    prisma.player.update({
      where: { id: player.id },
      data: {
        points: { increment: PEROV_DECLINE_PENALTY },
        activeBuffs: serializeActiveBuffs(updated),
      },
    }),
  ]);

  return NextResponse.json({
    success: true,
    pointsLost: Math.abs(PEROV_DECLINE_PENALTY),
    disdainDays: DISDAIN_DAYS,
    message:
      "Перов смеётся в темноте. 3 поинта ушли в Бездну. Удача ослаблена на 3 дня.",
  });
}
