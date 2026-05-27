import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PEROV_NPC_REGION, PEROV_TRIALS } from "@/lib/perov";
import PerovAdminView from "./PerovAdminView";

export default async function AdminPerovPage() {
  const session = await auth();
  if (!session?.user) redirect("/");
  const userId = (session.user as any).id;
  const me = await prisma.player.findUnique({ where: { userId } });
  if (!me?.isAdmin) redirect("/profile");

  const season = await prisma.season.findFirst({
    where: { endedAt: null },
    orderBy: { startedAt: "desc" },
  });
  const sinceDate = season?.startedAt ?? new Date(0);

  const quests = await prisma.quest.findMany({
    where: {
      npcRegion: PEROV_NPC_REGION,
      offeredAt: { gte: sinceDate },
    },
    include: { player: { select: { id: true, nickname: true } } },
    orderBy: [{ status: "asc" }, { offeredAt: "desc" }],
  });

  const players = await prisma.player.findMany({
    where: { class: { not: null } },
    select: { id: true, nickname: true },
    orderBy: { nickname: "asc" },
  });

  return (
    <PerovAdminView
      players={players}
      trials={PEROV_TRIALS.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        flavor: t.flavor,
        rewardPoints: t.rewards.points,
        rewardItemId: t.rewards.itemId ?? null,
        durationDays: t.durationDays,
      }))}
      quests={quests.map((q) => ({
        id: q.id,
        playerId: q.player.id,
        playerNickname: q.player.nickname,
        templateId: q.templateId,
        title: q.title,
        description: q.description,
        flavor: q.flavor,
        rewards: q.rewards,
        status: q.status,
        offeredAt: q.offeredAt.toISOString(),
        acceptedAt: q.acceptedAt?.toISOString() ?? null,
        completedAt: q.completedAt?.toISOString() ?? null,
        expiresAt: q.expiresAt?.toISOString() ?? null,
        progress: q.progress,
        targetCount: q.targetCount,
      }))}
      seasonStartedAt={season?.startedAt?.toISOString() ?? null}
    />
  );
}
