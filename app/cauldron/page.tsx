import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import PageBackdrop from "@/app/components/PageBackdrop";
import CauldronView from "./CauldronView";

// Котёл Гнилостня — крафт предметов из предметов в Гнилой Кухне.
export default async function CauldronPage() {
  const session = await auth();
  if (!session?.user) redirect("/");
  const userId = (session.user as any).id;

  const player = await prisma.player.findUnique({ where: { userId } });
  if (!player) redirect("/");
  if (!player.class) redirect("/select-class");
  if (player.currentRegion !== "kukhnya") redirect("/map");

  // Предметы, которые можно кинуть в котёл (не косметика, не легендарки)
  const inventory = await prisma.inventoryItem.findMany({
    where: {
      playerId: player.id,
      item: { category: { not: "COSMETIC" }, rarity: { not: "LEGENDARY" } },
    },
    include: { item: true },
    orderBy: { obtainedAt: "desc" },
  });

  const items = inventory.map((i: typeof inventory[number]) => ({
    inventoryItemId: i.id,
    name: i.item.name,
    rarity: i.item.rarity as string,
  }));

  return (
    <>
      <PageBackdrop image="quests.jpg" accent="#5a7a4a" />
      <CauldronView items={items} luck={player.luck} />
    </>
  );
}
