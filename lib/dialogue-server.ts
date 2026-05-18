// Серверная логика появления случайных диалогов.
// Выбирает доступный (не использованный) диалог для NPC, если выпал шанс.

import { getDialoguesForNpc } from "./dialogues";
import type { DialogueTemplate } from "./dialogues";

const DIALOGUE_CHANCE_PERCENT = 12;

/**
 * Детерминированно решает, появится ли диалог сегодня, и какой именно.
 * Возвращает null если шанс не выпал, или все диалоги уже пройдены.
 */
export function pickDialogueForVisit(
  playerId: string,
  regionId: string,
  seenDialogueIds: string[],
  now: Date = new Date(),
): DialogueTemplate | null {
  const all = getDialoguesForNpc(regionId);
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

  // Выбираем один из доступных детерминированно по дню
  return available[Math.abs(hash) % available.length];
}
