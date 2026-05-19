// Серверная логика появления случайных диалогов.
// Выбирает доступный (не использованный) диалог для NPC, если выпал шанс.
// Мержит статичные диалоги (lib/dialogues.ts) с пользовательскими из БД.

import { prisma } from "./prisma";
import { getDialoguesForNpc } from "./dialogues";
import type { DialogueTemplate, DialogueChoice } from "./dialogues";

const DIALOGUE_CHANCE_PERCENT = 12;

function parseChoices(raw: string): DialogueChoice[] {
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter(
      (c): c is DialogueChoice =>
        c && typeof c.text === "string" && typeof c.attitudeDelta === "number",
    );
  } catch {
    return [];
  }
}

/**
 * Детерминированно решает, появится ли диалог сегодня, и какой именно.
 * Возвращает null если шанс не выпал, или все диалоги уже пройдены.
 */
export async function pickDialogueForVisit(
  playerId: string,
  regionId: string,
  seenDialogueIds: string[],
  now: Date = new Date(),
): Promise<DialogueTemplate | null> {
  // Статика + пользовательские диалоги из БД
  const custom = await prisma.customDialogue.findMany({ where: { npcRegion: regionId } });
  const customTemplates: DialogueTemplate[] = custom
    .map((c) => ({
      id: c.id,
      npcRegion: regionId as DialogueTemplate["npcRegion"],
      prompt: c.prompt,
      choices: parseChoices(c.choices),
    }))
    .filter((d) => d.choices.length > 0);

  const all = [...getDialoguesForNpc(regionId), ...customTemplates];
  const available = all.filter((d) => !seenDialogueIds.includes(d.id));
  if (available.length === 0) return null;

  // Дневной детерминированный бросок шанса
  const day = now.toISOString().slice(0, 10);
  const seed = `dialogue:${playerId}:${regionId}:${day}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  const bucket = Math.abs(hash % 100);
  if (bucket >= DIALOGUE_CHANCE_PERCENT) return null;

  return available[Math.abs(hash) % available.length];
}
