// Серверная логика выдачи квестов NPC.
// Используется в region/[id]/page.tsx и других server-компонентах.
// НЕ импортировать в "use client"-файлы.

import { prisma } from "./prisma";
import { shouldOfferQuest } from "./regions";
import { QUEST_TEMPLATES, getTemplatesForNpc } from "./quest-templates";
import { parseDeclinedQuestCooldowns } from "./quest-types";
import { getUnlockedNpcs } from "./quest-unlock";
import type { Quest } from "@prisma/client";
import type { QuestTemplate, QuestTier } from "./quest-types";
import type { RegionId } from "./regions";

// Шанс выпадения побочного квеста, если основной линии нет (в процентах).
const SIDE_QUEST_CHANCE = 20;

// Cooldown'ы отказов (в днях). Сюжетные возвращаются быстрее, побочки — дольше.
const DECLINE_COOLDOWNS_BY_TIER: Record<QuestTier, number> = {
  STARTER: 1,
  STORY: 1,
  SIDE: 2,
  PEROV: 7, // Перов появляется не чаще раза в неделю
};

// Cooldown отказа, который мы возвращаем во внешний мир (для UI и устаревшего использования)
export const DECLINE_COOLDOWN_DAYS = 2;

/**
 * Получить актуальный квест для NPC в этом регионе.
 * Возвращает существующий OFFERED/ACTIVE, либо создаёт новый OFFERED по логике RPG-цепочки.
 * Возвращает null если ничего недоступно (нет шаблонов / уровень не добит / всё в кулдауне).
 */
export async function getOrCreateQuestForRegion(
  playerId: string,
  regionId: string,
  declinedQuestCooldownsRaw: string | null,
): Promise<Quest | null> {
  // 1) Уже есть активный/предложенный квест от этого NPC?
  const existing = await prisma.quest.findFirst({
    where: {
      playerId,
      npcRegion: regionId,
      status: { in: ["OFFERED", "ACTIVE"] },
    },
    orderBy: { offeredAt: "desc" },
  });
  if (existing) return existing;

  // 2) Загружаем игрока (для уровня) и историю квестов от этого NPC
  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) return null;

  // 2.1) Этот NPC уже "познакомился" с игроком? (класс-affinity + раскрытие по уровням)
  const unlocked = getUnlockedNpcs(player.level, player.class, playerId);
  if (!unlocked.has(regionId as RegionId)) {
    return null; // NPC ещё не открыт для этого игрока
  }

  const allQuests = await prisma.quest.findMany({
    where: { playerId, npcRegion: regionId },
  });
  const completedTemplateIds = new Set(
    allQuests.filter((q) => q.status === "COMPLETED").map((q) => q.templateId),
  );

  // 3) Cooldowns (по шаблону)
  const cooldowns = parseDeclinedQuestCooldowns(declinedQuestCooldownsRaw);
  const now = new Date();
  const isCooldownActive = (templateId: string): boolean => {
    const until = cooldowns[templateId];
    if (!until) return false;
    const date = new Date(until);
    return !isNaN(date.getTime()) && date > now;
  };

  // 4) Подбираем шаблон по приоритету: STARTER → STORY → SIDE
  const template = selectNextTemplate(
    regionId,
    player.level,
    completedTemplateIds,
    isCooldownActive,
    playerId,
  );
  if (!template) return null;

  // 5) Создаём OFFERED квест
  const created = await prisma.quest.create({
    data: {
      playerId,
      templateId: template.id,
      npcRegion: regionId,
      type: template.type,
      title: template.title,
      description: template.description,
      flavor: template.flavor,
      targetCount: template.targetCount,
      progress: 0,
      params: JSON.stringify(template.params),
      rewards: JSON.stringify(template.rewards),
      status: "OFFERED",
    },
  });
  return created;
}

/**
 * Выбор следующего квеста для NPC по RPG-логике.
 *
 * Приоритеты:
 *  1. STARTER  — если ни один стартер ещё не завершён.
 *  2. STORY    — следующая глава, у которой выполнен requires + уровень добит.
 *  3. SIDE     — рандомный из пула, если выпал 20% дневной бросок.
 */
function selectNextTemplate(
  regionId: string,
  playerLevel: number,
  completedTemplateIds: Set<string>,
  isCooldownActive: (templateId: string) => boolean,
  playerId: string,
): QuestTemplate | null {
  const all = getTemplatesForNpc(regionId);
  if (all.length === 0) return null;

  // === 1. STARTER ===
  const completedStarter = all.some(
    (t) => t.tier === "STARTER" && completedTemplateIds.has(t.id),
  );
  if (!completedStarter) {
    const starter = all.find(
      (t) =>
        t.tier === "STARTER" &&
        (t.minLevel ?? 1) <= playerLevel &&
        !isCooldownActive(t.id),
    );
    if (starter) return starter;
    // Если стартер ещё в кулдауне после отказа — ждём, не предлагаем другие.
    if (all.some((t) => t.tier === "STARTER" && isCooldownActive(t.id))) {
      return null;
    }
  }

  // === 2. STORY (в порядке глав) ===
  const storyTemplates = all
    .filter((t) => t.tier === "STORY")
    .sort((a, b) => (a.chapterIndex ?? 0) - (b.chapterIndex ?? 0));

  for (const story of storyTemplates) {
    if (completedTemplateIds.has(story.id)) continue;
    if ((story.minLevel ?? 1) > playerLevel) continue;
    if (story.requiresTemplateId && !completedTemplateIds.has(story.requiresTemplateId)) continue;
    if (isCooldownActive(story.id)) {
      // Эта глава в кулдауне — следующие гэйтят на ней, выходим.
      return null;
    }
    return story;
  }

  // === 3. SIDE (рандом из пула) ===
  if (!shouldOfferQuest(playerId, regionId, SIDE_QUEST_CHANCE)) return null;

  const sides = all.filter(
    (t) =>
      t.tier === "SIDE" &&
      (t.minLevel ?? 1) <= playerLevel &&
      !completedTemplateIds.has(t.id) &&
      !isCooldownActive(t.id),
  );
  if (sides.length === 0) return null;

  // Детерминированный выбор по дню (тот же побочный возвращается при перезаходе)
  return pickDeterministic(sides, playerId, regionId);
}

function pickDeterministic(
  templates: QuestTemplate[],
  playerId: string,
  regionId: string,
): QuestTemplate {
  const day = new Date().toISOString().slice(0, 10);
  const seed = `tmpl:${playerId}:${regionId}:${day}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  return templates[Math.abs(hash) % templates.length];
}

/**
 * Длительность cooldown'а для отказа от конкретного шаблона.
 * Используется в /api/player/quest/decline.
 */
export function getDeclineCooldownDays(templateId: string): number {
  const template = QUEST_TEMPLATES.find((t) => t.id === templateId);
  if (!template) return 2;
  return DECLINE_COOLDOWNS_BY_TIER[template.tier];
}
