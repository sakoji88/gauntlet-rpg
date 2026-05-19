import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parseActiveBuffs } from "@/lib/active-buffs";
import { TRAP_BUFF_KEYS, getTrapByBuffKey } from "@/lib/trap-effects";

// Сводка уведомлений для колокольчика: ловушки на игроке, входящие дуэли,
// предложенные квесты. Лёгкий GET — дёргается клиентом.
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ traps: [], incomingDuels: 0, offeredQuests: 0 });
  }
  const userId = (session.user as any).id;
  const player = await prisma.player.findUnique({ where: { userId } });
  if (!player) {
    return NextResponse.json({ traps: [], incomingDuels: 0, offeredQuests: 0 });
  }

  // Ловушки на игроке
  const buffs = parseActiveBuffs(player.activeBuffs);
  const traps = buffs
    .filter((b) => TRAP_BUFF_KEYS.includes(b.effectKey))
    .map((b) => {
      const def = getTrapByBuffKey(b.effectKey);
      const from =
        typeof b.payload?.throwerNickname === "string"
          ? b.payload.throwerNickname
          : null;
      return { name: def?.name ?? "Ловушка", from };
    });

  // Входящие вызовы на дуэль
  const incomingDuels = await prisma.duel.count({
    where: { defenderId: player.id, status: "PROPOSED" },
  });

  // Предложенные (не принятые) квесты
  const offeredQuests = await prisma.quest.count({
    where: { playerId: player.id, status: "OFFERED" },
  });

  return NextResponse.json({ traps, incomingDuels, offeredQuests });
}
