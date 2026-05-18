import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SHOP } from "@/lib/shop";
import { ITEMS } from "@/lib/items";
import PageBackdrop from "@/app/components/PageBackdrop";
import ShopView from "./ShopView";

export default async function ShopPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const userId = (session.user as any).id;
  const player = await prisma.player.findUnique({ where: { userId } });
  if (!player) redirect("/");
  if (!player.class) redirect("/select-class");
  // Лавка доступна только из региона Романала — туда надо физически дойти.
  if (player.currentRegion !== "bazar") redirect("/map");

  // Глобальный сток для лимитированных товаров
  const limitedIds = SHOP.filter((e) => e.stockLimit !== null).map((e) => e.itemId);
  const stockCounts: Record<string, number> = {};
  if (limitedIds.length > 0) {
    const grouped = await prisma.inventoryItem.groupBy({
      by: ["itemId"],
      where: { itemId: { in: limitedIds } },
      _count: { _all: true },
    });
    for (const g of grouped) {
      stockCounts[g.itemId] = (g as { _count: { _all: number } })._count._all;
    }
  }

  // Витрина покупки
  const buyList = SHOP.map((entry) => {
    const def = ITEMS.find((i) => i.id === entry.itemId);
    const stockLeft =
      entry.stockLimit === null
        ? null
        : Math.max(0, entry.stockLimit - (stockCounts[entry.itemId] ?? 0));
    return {
      itemId: entry.itemId,
      name: def?.name ?? entry.itemId,
      description: def?.description ?? "",
      rarity: def?.rarity ?? "COMMON",
      category: def?.category ?? "CONSUMABLE",
      currency: entry.currency,
      price: entry.price,
      stockLeft,
    };
  });

  // Что игрок может продать
  const inventory = await prisma.inventoryItem.findMany({
    where: { playerId: player.id },
    include: { item: true },
    orderBy: { obtainedAt: "desc" },
  });
  const sellList = inventory
    .map((inv: typeof inventory[number]) => {
      const entry = SHOP.find((e) => e.itemId === inv.itemId);
      if (!entry || entry.sellPrice <= 0) return null;
      return {
        inventoryItemId: inv.id,
        itemId: inv.itemId,
        name: inv.item.name,
        rarity: inv.item.rarity as string,
        sellPrice: entry.sellPrice,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  return (
    <>
      <PageBackdrop image="shop.jpg" accent="#d4a574" />
      <ShopView
        gold={player.gold}
        points={player.points}
        buyList={buyList}
        sellList={sellList}
      />
    </>
  );
}
