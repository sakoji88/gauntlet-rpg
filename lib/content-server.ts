// Серверные хелперы для редактируемого админом контента (тексты условий NPC).
// НЕ импортировать в "use client"-файлы.

import { prisma } from "./prisma";
import type { RegionData } from "./regions";

/**
 * Накладывает админские правки текста условий на регион.
 * Перекрывает только description/flavor — требования (жанры/часы) не трогаются.
 */
export async function applyConditionTextOverrides(
  region: RegionData,
): Promise<RegionData> {
  if (!region.conditions) return region;

  const overrides = await prisma.conditionTextOverride.findMany({
    where: { regionId: region.id },
  });
  if (overrides.length === 0) return region;

  const conditions = { ...region.conditions };
  for (const o of overrides) {
    const key = o.conditionType as "basic" | "genre" | "special";
    const cond = conditions[key];
    if (cond) {
      conditions[key] = { ...cond, description: o.description, flavor: o.flavor };
    }
  }
  return { ...region, conditions };
}
