import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import AdminDashboard from "./AdminDashboard";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const userId = (session.user as any).id;
  const me = await prisma.player.findUnique({ where: { userId } });
  if (!me?.isAdmin) redirect("/profile");

  // === ДАННЫЕ ДЛЯ АДМИНКИ ===

  const players = await prisma.player.findMany({
    orderBy: { points: "desc" },
    include: {
      user: { select: { name: true, image: true } },
      inventory: { include: { item: true } },
    },
  });

  const whitelist = await prisma.allowedDiscordId.findMany({
    orderBy: { createdAt: "desc" },
  });

  const accounts = await prisma.account.findMany({
    where: { provider: "discord" },
    select: {
      providerAccountId: true,
      user: { select: { id: true, name: true } },
    },
  });

  const games = await prisma.game.findMany({
    orderBy: { rolledAt: "desc" },
    take: 100,
    include: {
      player: { select: { nickname: true } },
    },
  });

  const items = await prisma.item.findMany({
    orderBy: { name: "asc" },
  });

  const currentSeason = await prisma.season.findFirst({
    where: { endedAt: null },
    orderBy: { startedAt: "desc" },
  });

  const allSeasons = await prisma.season.findMany({
    orderBy: { number: "desc" },
    take: 10,
  });

  // Квесты всех игроков (для утилит)
  const allQuests = await prisma.quest.findMany({
    orderBy: { offeredAt: "desc" },
    select: {
      id: true,
      playerId: true,
      title: true,
      status: true,
      npcRegion: true,
    },
  });
  const questsByPlayer: Record<string, typeof allQuests> = {};
  for (const q of allQuests) {
    if (!questsByPlayer[q.playerId]) questsByPlayer[q.playerId] = [];
    questsByPlayer[q.playerId].push(q);
  }

  const stats = {
    totalPlayers: players.length,
    totalPlayersWithClass: players.filter((p: typeof players[number]) => p.class).length,
    totalAllowed: whitelist.length,
    activeGames: games.filter((g: typeof games[number]) => g.status === "ACTIVE").length,
    totalGames: games.length,
    totalPoints: players.reduce((s: number, p: typeof players[number]) => s + p.points, 0),
    totalQuests: allQuests.length,
  };

  return (
    <AdminDashboard
      players={players}
      whitelist={whitelist}
      accounts={accounts}
      games={games}
      items={items}
      currentSeason={currentSeason}
      allSeasons={allSeasons}
      stats={stats}
      questsByPlayer={questsByPlayer}
    />
  );
}
