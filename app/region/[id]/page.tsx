import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getRegionById, shouldOfferSpecial } from "@/lib/regions";
import { NPC_DIALOGUES } from "@/lib/npc-dialogues";
import { getOrCreateQuestForRegion } from "@/lib/quest-server";
import { getTemplateById } from "@/lib/quest-templates";
import { pickDialogueForVisit } from "@/lib/dialogue-server";
import { applyConditionTextOverrides } from "@/lib/content-server";
import { parseAttitudes, parseSeenDialogues, attitudeLevel, ATTITUDE_LABELS, ATTITUDE_COLORS } from "@/lib/dialogues";
import RegionView from "./RegionView";

export default async function RegionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/");

  const userId = (session.user as any).id;
  const player = await prisma.player.findUnique({ where: { userId } });
  if (!player) redirect("/");
  if (!player.class) redirect("/select-class");

  const baseRegion = getRegionById(id);
  if (!baseRegion) redirect("/map");
  // Накладываем админские правки текста условий NPC
  const region = await applyConditionTextOverrides(baseRegion);

  if (player.currentRegion !== region.id) {
    redirect("/map");
  }

  const isBlocked = player.class === "alchemist" && region.id === "terem";
  const dialogue = NPC_DIALOGUES[region.id];
  const hasActiveGame = !!player.activeGameId;

  // Парсим declinedSpecials из JSON (на случай мусора — fallback []).
  let declinedSpecials: string[] = [];
  if (player.declinedSpecials) {
    try {
      const parsed = JSON.parse(player.declinedSpecials);
      if (Array.isArray(parsed)) {
        declinedSpecials = parsed.filter((x: unknown): x is string => typeof x === "string");
      }
    } catch {
      declinedSpecials = [];
    }
  }

  // Решаем здесь, доступно ли особое условие в этом регионе.
  // Детерминированно по дню — перезаход в регион не даёт нового шанса.
  const specialAvailable =
    !!region.conditions?.special &&
    !declinedSpecials.includes(region.id) &&
    shouldOfferSpecial(player.id, region.id);

  // Квест от NPC этого региона (OFFERED / ACTIVE / null). Создаётся лениво при первом заходе в день.
  // Тюрьма и регионы без шаблонов вернут null.
  let currentQuest = null;
  if (region.id !== "prison" && !isBlocked) {
    currentQuest = await getOrCreateQuestForRegion(
      player.id,
      region.id,
      player.declinedQuestCooldowns,
    );
  }

  // === Случайный диалог + отношение NPC ===
  const attitudes = parseAttitudes(player.npcAttitudes);
  const seenDialogues = parseSeenDialogues(player.seenDialogues);

  let dialogueForRegion = null;
  if (region.id !== "prison" && !isBlocked) {
    const dlg = await pickDialogueForVisit(player.id, region.id, seenDialogues);
    if (dlg) {
      dialogueForRegion = {
        id: dlg.id,
        prompt: dlg.prompt,
        choices: dlg.choices.map((c) => ({ text: c.text, attitudeDelta: c.attitudeDelta })),
      };
    }
  }

  const attitudeValue = attitudes[region.id] ?? 0;
  const level = attitudeLevel(attitudeValue);
  const attitudeInfo = {
    value: attitudeValue,
    label: ATTITUDE_LABELS[level],
    color: ATTITUDE_COLORS[level],
  };

  return (
    <RegionView
      region={region}
      dialogue={dialogue}
      isBlocked={isBlocked}
      playerClass={player.class}
      playerEnergy={player.energy}
      hasActiveGame={hasActiveGame}
      specialAvailable={specialAvailable}
      inPrison={player.inPrison}
      currentQuest={
        currentQuest
          ? (() => {
              const tpl = getTemplateById(currentQuest.templateId);
              return {
                id: currentQuest.id,
                type: currentQuest.type,
                title: currentQuest.title,
                description: currentQuest.description,
                flavor: currentQuest.flavor,
                status: currentQuest.status,
                targetCount: currentQuest.targetCount,
                progress: currentQuest.progress,
                expiresAt: currentQuest.expiresAt?.toISOString() ?? null,
                rewards: currentQuest.rewards,
                tier: tpl?.tier ?? "SIDE",
                chapterIndex: tpl?.chapterIndex ?? null,
              };
            })()
          : null
      }
      randomDialogue={dialogueForRegion}
      attitude={attitudeInfo}
    />
  );
}
