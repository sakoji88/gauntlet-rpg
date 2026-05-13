// Корона Короля Стрима — носится текущим лидером сезона.
// Не хранится в БД — вычисляется live из лидерборда.
// Бонус: если победил в дуэли носителя короны → +2 поинта сверху (всего 5 вместо 3).

import { prisma } from "./prisma";

// Возвращает ID лидера сезона (по очкам), или null если игроков нет
export async function getCrownHolderId(): Promise<string | null> {
  const top = await prisma.player.findFirst({
    where: { class: { not: null }, points: { gt: 0 } },
    orderBy: [{ points: "desc" }, { createdAt: "asc" }], // tiebreaker — кто раньше
    select: { id: true },
  });
  return top?.id ?? null;
}

export const CROWN_DUEL_BONUS = 2;
export const BASE_DUEL_REWARD = 3;
