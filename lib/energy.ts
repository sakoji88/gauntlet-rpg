// Автосброс энергии до 3 ходов на новый день (UTC).
// Вызывается в начале каждого роута, который требует энергию или просто грузит игрока.

import { prisma } from "./prisma";
import type { Player } from "@prisma/client";

const ENERGY_PER_DAY = 3;

/**
 * Проверяет, наступил ли новый UTC-день относительно lastEnergyResetAt,
 * и если да — сбрасывает энергию до 3. Возвращает обновлённую запись игрока (или ту же).
 */
export async function ensureEnergyReset(player: Player): Promise<Player> {
  const todayKey = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
  const lastKey = player.lastEnergyResetAt
    ? player.lastEnergyResetAt.toISOString().slice(0, 10)
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
