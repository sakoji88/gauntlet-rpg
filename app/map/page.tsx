import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { REGIONS, getRegionById } from "@/lib/regions";
import { getClassById } from "@/lib/classes";
import { getOrCreatePerovTrial } from "@/lib/perov-server";
import { parseQuestRewards } from "@/lib/quest-types";
import { ensureEnergyReset } from "@/lib/energy";
import MapView from "./MapView";

export default async function MapPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  const userId = (session.user as any).id;

  let player = await prisma.player.findUnique({
    where: { userId },
  });

  if (!player) {
    redirect("/");
  }

  // Если не выбрал класс — туда
  if (!player.class) {
    redirect("/select-class");
  }

  // Автосброс энергии при заходе на карту
  player = await ensureEnergyReset(player);

  const classData = getClassById(player.class);
  const currentRegion = getRegionById(player.currentRegion);
  // "Сидит" = именно арест активен. Если currentRegion=prison, но inPrison=false —
  // игрок свободен, просто стоит на клетке, и должен видеть инфо о других регионах.
  const isInPrison = player.inPrison;

  // Карта статуса квестов по регионам — для маркеров на карте
  const playerQuests = await prisma.quest.findMany({
    where: {
      playerId: player.id,
      status: { in: ["OFFERED", "ACTIVE"] },
    },
    select: { npcRegion: true, status: true },
  });
  const regionQuestStatus: Record<string, "OFFERED" | "ACTIVE"> = {};
  for (const q of playerQuests) {
    // ACTIVE приоритетнее OFFERED (хотя по бизнес-логике их и не может быть одновременно)
    if (regionQuestStatus[q.npcRegion] !== "ACTIVE") {
      regionQuestStatus[q.npcRegion] = q.status as "OFFERED" | "ACTIVE";
    }
  }

  // === ДУХ ГОМОДРИЛА ПЕРОВА ===
  // Серверный триггер: если у Перова есть OFFERED-квест к этому игроку — показываем модалку.
  // Если триггеры сошлись и квеста ещё нет — создаём.
  const perovQuest = await getOrCreatePerovTrial(player.id);
  const perovTrial =
    perovQuest && perovQuest.status === "OFFERED"
      ? {
          questId: perovQuest.id,
          title: perovQuest.title,
          description: perovQuest.description,
          flavor: perovQuest.flavor,
          rewardPoints: parseQuestRewards(perovQuest.rewards).points,
          rewardItemId: parseQuestRewards(perovQuest.rewards).itemId ?? null,
        }
      : null;

  return (
    <MapView
      regions={REGIONS}
      player={{
        nickname: player.nickname,
        class: classData?.name ?? "Неизвестный",
        level: player.level,
        points: player.points,
        energy: player.energy,
        currentRegionId: player.currentRegion,
        isAdmin: player.isAdmin,
      }}
      currentRegion={currentRegion}
      isInPrison={isInPrison}
      regionQuestStatus={regionQuestStatus}
      perovTrial={perovTrial}
    />
  );
}