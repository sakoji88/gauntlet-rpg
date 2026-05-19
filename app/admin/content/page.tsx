import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { REGIONS } from "@/lib/regions";
import ContentAdminView from "./ContentAdminView";

export default async function AdminContentPage() {
  const session = await auth();
  if (!session?.user) redirect("/");
  const userId = (session.user as any).id;
  const me = await prisma.player.findUnique({ where: { userId } });
  if (!me?.isAdmin) redirect("/profile");

  // Регионы с условиями + базовые тексты из кода
  const regions = REGIONS.filter((r) => r.conditions && r.id !== "prison").map((r) => {
    const c = r.conditions!;
    const pack = (cond?: { description: string; flavor: string }) =>
      cond ? { description: cond.description, flavor: cond.flavor } : null;
    return {
      id: r.id,
      name: r.name,
      conditions: {
        basic: pack(c.basic),
        genre: pack(c.genre),
        special: pack(c.special),
      },
    };
  });

  const overrides = await prisma.conditionTextOverride.findMany();
  const dialogues = await prisma.customDialogue.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <ContentAdminView
      regions={regions}
      overrides={overrides.map((o) => ({
        regionId: o.regionId,
        conditionType: o.conditionType,
        description: o.description,
        flavor: o.flavor,
      }))}
      dialogues={dialogues.map((d) => ({
        id: d.id,
        npcRegion: d.npcRegion,
        prompt: d.prompt,
      }))}
    />
  );
}
