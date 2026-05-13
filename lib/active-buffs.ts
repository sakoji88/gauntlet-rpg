// Активные баффы игрока — типы и сериализация.
// Хранятся в Player.activeBuffs как JSON-массив.

export interface ActiveBuff {
  effectKey: string;        // ключ эффекта (см. item-effects.ts), напр. "triple_points"
  sourceItemId: string;     // ID предмета, от которого взялся бафф (напр. "heart_of_dark")
  activatedAt: string;      // ISO дата активации
  expiresAt?: string;       // ISO дата истечения (опционально — для дебаффов со сроком)
  payload?: Record<string, unknown>; // для эффектов с параметрами
}

/**
 * Отфильтровать просроченные баффы. Использовать перед чтением активных эффектов.
 */
export function pruneExpiredBuffs(buffs: ActiveBuff[], now: Date = new Date()): {
  active: ActiveBuff[];
  changed: boolean;
} {
  const nowMs = now.getTime();
  const active = buffs.filter((b) => {
    if (!b.expiresAt) return true;
    const t = new Date(b.expiresAt).getTime();
    return !isNaN(t) && t > nowMs;
  });
  return { active, changed: active.length !== buffs.length };
}

export function parseActiveBuffs(raw: string | null): ActiveBuff[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (b: unknown): b is ActiveBuff =>
        typeof b === "object" &&
        b !== null &&
        typeof (b as ActiveBuff).effectKey === "string" &&
        typeof (b as ActiveBuff).sourceItemId === "string" &&
        typeof (b as ActiveBuff).activatedAt === "string",
    );
  } catch {
    return [];
  }
}

export function serializeActiveBuffs(buffs: ActiveBuff[]): string {
  return JSON.stringify(buffs);
}

export function hasBuff(buffs: ActiveBuff[], effectKey: string): boolean {
  return buffs.some((b) => b.effectKey === effectKey);
}

export function findBuff(buffs: ActiveBuff[], effectKey: string): ActiveBuff | null {
  return buffs.find((b) => b.effectKey === effectKey) ?? null;
}

export function removeBuff(buffs: ActiveBuff[], effectKey: string): ActiveBuff[] {
  return buffs.filter((b) => b.effectKey !== effectKey);
}

export function addBuff(buffs: ActiveBuff[], buff: ActiveBuff): ActiveBuff[] {
  return [...removeBuff(buffs, buff.effectKey), buff];
}
