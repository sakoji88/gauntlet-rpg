import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ITEMS } from "@/lib/items";
import PageBackdrop from "@/app/components/PageBackdrop";
import CodexView from "./CodexView";

// Кодекс — правила игры + полный каталог предметов.
export default async function CodexPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  // ITEMS — статичный каталог, безопасно отдать клиенту.
  const items = ITEMS.map((i) => ({
    id: i.id,
    name: i.name,
    description: i.description,
    category: i.category,
    rarity: i.rarity,
    iconKey: i.iconKey,
    isTrap: Boolean(i.isTrap),
    rollWeight: i.rollWeight,
  }));

  return (
    <>
      <PageBackdrop image="quests.jpg" accent="#d4a574" />
      <CodexView items={items} />
    </>
  );
}
