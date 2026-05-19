import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import PageBackdrop from "@/app/components/PageBackdrop";
import CauldronView from "./CauldronView";

// Котёл Гнилостня — крафт в Гнилой Кухне.
export default async function CauldronPage() {
  const session = await auth();
  if (!session?.user) redirect("/");
  const userId = (session.user as any).id;

  const player = await prisma.player.findUnique({ where: { userId } });
  if (!player) redirect("/");
  if (!player.class) redirect("/select-class");
  // Котёл доступен только из Гнилой Кухни
  if (player.currentRegion !== "kukhnya") redirect("/map");

  return (
    <>
      <PageBackdrop image="quests.jpg" accent="#5a7a4a" />
      <CauldronView gold={player.gold} />
    </>
  );
}
