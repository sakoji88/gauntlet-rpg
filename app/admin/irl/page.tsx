import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import IrlAdminView from "./IrlAdminView";

export default async function AdminIrlPage() {
  const session = await auth();
  if (!session?.user) redirect("/");
  const userId = (session.user as any).id;
  const me = await prisma.player.findUnique({ where: { userId } });
  if (!me?.isAdmin) redirect("/profile");

  const templates = await prisma.irlQuestTemplate.findMany({
    orderBy: { createdAt: "desc" },
  });

  // Сколько раз каждый шаблон уже выдан
  const givenCounts: Record<string, number> = {};
  const allIrlQuests = await prisma.quest.findMany({
    where: { type: "IRL" },
    select: { templateId: true },
  });
  for (const q of allIrlQuests) {
    givenCounts[q.templateId] = (givenCounts[q.templateId] ?? 0) + 1;
  }

  const players = await prisma.player.findMany({
    where: { class: { not: null } },
    select: { id: true, nickname: true },
    orderBy: { nickname: "asc" },
  });

  // Для "ждут проверки" — ТОЛЬКО ИРЛ (selfComplete=false). Обычные/анонимные
  // админу не видны: игрок отмечает их сам.
  const activeQuests = await prisma.quest.findMany({
    where: { type: "IRL", status: "ACTIVE", selfComplete: false },
    orderBy: { offeredAt: "desc" },
    include: { player: { select: { nickname: true } } },
  });

  return (
    <IrlAdminView
      templates={templates.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        flavor: t.flavor,
        npcRegion: t.npcRegion,
        rewardPoints: t.rewardPoints,
        rewardExp: t.rewardExp,
        selfComplete: t.selfComplete,
        givenCount: givenCounts[t.id] ?? 0,
      }))}
      players={players}
      activeQuests={activeQuests.map((q) => ({
        id: q.id,
        title: q.title,
        nickname: q.player.nickname,
        rewards: q.rewards,
      }))}
    />
  );
}
