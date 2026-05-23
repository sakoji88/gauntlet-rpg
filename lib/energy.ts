// Автосброс энергии до 3 ходов на новый день (МСК, UTC+3, без DST).
// Вызывается в начале каждого роута, который требует энергию или просто грузит игрока.

import { prisma } from "./prisma";
import type { Player } from "@prisma/client";

const ENERGY_PER_DAY = 3;
const MSK_OFFSET_MS = 3 * 60 * 60 * 1000;

// Ключ дня в МСК: сдвигаем момент на +3 часа и берём YYYY-MM-DD от UTC-представления.
function mskDayKey(date: Date): string {
  return new Date(date.getTime() + MSK_OFFSET_MS).toISOString().slice(0, 10);
}

/**
 * Проверяет, наступил ли новый МСК-день относительно lastEnergyResetAt,
 * и если да — сбрасывает энергию до 3. Возвращает обновлённую запись игрока (или ту же).
 */
export async function ensureEnergyReset(player: Player): Promise<Player> {
  const todayKey = mskDayKey(new Date());
  const lastKey = player.lastEnergyResetAt
    ? mskDayKey(player.lastEnergyResetAt)
    : null;

  if (lastKey === todayKey) return player; // уже сегодня сбрасывали

  const updated = await prisma.player.update({
    where: { id: player.id },
    data: {
      energy: ENERGY_PER_DAY,
      lastEnergyResetAt: new Date(),
    },
  });
  return updated;
}
