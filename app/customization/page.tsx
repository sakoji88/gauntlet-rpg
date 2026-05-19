import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import PageBackdrop from "@/app/components/PageBackdrop";
import BackLink from "@/app/components/BackLink";
import Avatar from "@/app/components/Avatar";
import EquipButton from "@/app/inventory/EquipButton";
import { isFrameItem, isTitleItem, getTitleText } from "@/lib/cosmetics";
import { RARITY_COLORS, RARITY_NAMES, ItemRarity } from "@/lib/items";

// Кастомизация у Пенькова — примерка рамок аватара и титулов.
export default async function CustomizationPage() {
  const session = await auth();
  if (!session?.user) redirect("/");
  const userId = (session.user as any).id;

  const player = await prisma.player.findUnique({ where: { userId } });
  if (!player) redirect("/");
  if (!player.class) redirect("/select-class");

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { image: true },
  });

  // Косметика в инвентаре
  const cosmetics = await prisma.inventoryItem.findMany({
    where: { playerId: player.id, item: { category: "COSMETIC" } },
    include: { item: true },
  });
  // Уникальные по itemId (косметику не стакаем в показе)
  const seen = new Set<string>();
  const unique = cosmetics.filter((c: typeof cosmetics[number]) => {
    if (seen.has(c.itemId)) return false;
    seen.add(c.itemId);
    return true;
  });
  const frames = unique.filter((c: typeof unique[number]) => isFrameItem(c.itemId));
  const titles = unique.filter((c: typeof unique[number]) => isTitleItem(c.itemId));

  return (
    <>
      <PageBackdrop image="profile.jpg" accent="#a8588a" />
      <main
        style={{
          position: "relative",
          zIndex: 2,
          minHeight: "100vh",
          padding: "2rem",
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        <BackLink fallback="/region/atelye" />

        <h1 style={{ fontSize: "2rem", color: "#c98ab8", marginBottom: "0.25rem" }}>
          Ателье Пенькова
        </h1>
        <p style={{ color: "var(--color-text-dim)", fontStyle: "italic", marginBottom: "2rem" }}>
          «Образ — это всё, дорогуша. Примерь — и стань хоть немного менее безвкусным.»
        </p>

        {/* Превью аватара */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1.5rem",
            padding: "1.5rem",
            background: "var(--color-bg-secondary)",
            border: "1px solid var(--color-border)",
            marginBottom: "2rem",
          }}
        >
          <Avatar src={dbUser?.image} size={110} frameId={player.equippedFrameId} alt="" />
          <div>
            <div style={{ fontSize: "1.4rem", color: "var(--color-text-bright)" }}>
              {player.nickname}
            </div>
            {getTitleText(player.equippedTitleId) && (
              <div
                style={{
                  color: "var(--color-gold)",
                  fontFamily: "var(--font-cinzel)",
                  fontSize: "0.85rem",
                  letterSpacing: "0.08em",
                }}
              >
                ◈ {getTitleText(player.equippedTitleId)}
              </div>
            )}
            <div style={{ color: "var(--color-text-dim)", fontSize: "0.8rem", marginTop: "0.35rem" }}>
              Так тебя видят остальные.
            </div>
          </div>
        </div>

        <Section title="Рамки">
          {frames.length === 0 ? (
            <Empty text="Рамок пока нет. Их дают за квесты и особые свершения." />
          ) : (
            <Grid>
              {frames.map((c: typeof frames[number]) => (
                <CosmeticCard
                  key={c.id}
                  itemId={c.itemId}
                  name={c.item.name}
                  description={c.item.description}
                  rarity={c.item.rarity as string}
                  slot="frame"
                  equipped={player.equippedFrameId === c.itemId}
                />
              ))}
            </Grid>
          )}
        </Section>

        <Section title="Титулы">
          {titles.length === 0 ? (
            <Empty text="Титулов пока нет. Заслужи имя себе." />
          ) : (
            <Grid>
              {titles.map((c: typeof titles[number]) => (
                <CosmeticCard
                  key={c.id}
                  itemId={c.itemId}
                  name={c.item.name}
                  description={c.item.description}
                  rarity={c.item.rarity as string}
                  slot="title"
                  equipped={player.equippedTitleId === c.itemId}
                />
              ))}
            </Grid>
          )}
        </Section>
      </main>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "2rem" }}>
      <h2
        style={{
          fontSize: "1.1rem",
          color: "#c98ab8",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          marginBottom: "1rem",
        }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
        gap: "0.85rem",
      }}
    >
      {children}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p style={{ color: "var(--color-text-dim)", fontStyle: "italic" }}>{text}</p>;
}

function CosmeticCard({
  itemId,
  name,
  description,
  rarity,
  slot,
  equipped,
}: {
  itemId: string;
  name: string;
  description: string;
  rarity: string;
  slot: "frame" | "title";
  equipped: boolean;
}) {
  const colors = RARITY_COLORS[rarity as ItemRarity];
  return (
    <div
      style={{
        padding: "1rem",
        background: "var(--color-bg-secondary)",
        border: `1px solid ${equipped ? "var(--color-gold)" : colors.border}`,
        display: "flex",
        flexDirection: "column",
        gap: "0.4rem",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: "0.4rem" }}>
        <span style={{ color: colors.text, fontWeight: 600 }}>{name}</span>
        <span
          style={{
            fontSize: "0.58rem",
            color: colors.text,
            opacity: 0.7,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          {RARITY_NAMES[rarity as ItemRarity]}
        </span>
      </div>
      <p style={{ fontSize: "0.8rem", color: "var(--color-text)", margin: 0, lineHeight: 1.4 }}>
        {description}
      </p>
      <div style={{ marginTop: "0.4rem" }}>
        <EquipButton itemId={itemId} slot={slot} isEquipped={equipped} color={colors.text} />
      </div>
    </div>
  );
}
