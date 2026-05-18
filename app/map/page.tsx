import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { REGIONS, getRegionById } from "@/lib/regions";
import { getClassById } from "@/lib/classes";
import { getOrCreatePerovTrial } from "@/lib/perov-server";
import { peekRegionQuestStatuses } from "@/lib/quest-server";
import { parseQuestRewards } from "@/lib/quest-types";
import { ensureEnergyReset } from "@/lib/energy";
import MapView from "./MapView";
import PageBackdrop from "@/app/components/PageBackdrop";

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

  // Личное Наказание ещё не вписано — обязательный экран
  if (!player.punishmentPact || !player.punishmentPact.trim()) {
    redirect("/punishment");
  }

  // Автосброс энергии при заходе на карту
  player = await ensureEnergyReset(player);

  const classData = getClassById(player.class);
  const currentRegion = getRegionById(player.currentRegion);
  // "Сидит" = именно арест активен. Если currentRegion=prison, но inPrison=false —
  // игрок свободен, просто стоит на клетке, и должен видеть инфо о других регионах.
  const isInPrison = player.inPrison;

  // Статус квестов по регионам — включая доступные, но ещё не взятые
  const regionQuestStatus = await peekRegionQuestStatuses(player.id);

  // Локации всех игроков — кто где стоит
  const allPlayers = await prisma.player.findMany({
    where: { class: { not: null } },
    select: { nickname: true, currentRegion: true },
  });
  const regionPlayers: Record<string, string[]> = {};
  for (const p of allPlayers) {
    if (!p.currentRegion) continue;
    if (!regionPlayers[p.currentRegion]) regionPlayers[p.currentRegion] = [];
    regionPlayers[p.currentRegion].push(p.nickname);
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
    <>
      <PageBackdrop image="map.jpg" accent="#8b2424" />
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
      regionPlayers={regionPlayers}
      perovTrial={perovTrial}
      />
    </>
  );
}