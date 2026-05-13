import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Swords, Crown } from "lucide-react";
import { getCrownHolderId } from "@/lib/crown";
import DuelChallengePanel from "./DuelChallengePanel";
import DuelCard from "./DuelCard";

export default async function DuelsPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const userId = (session.user as any).id;
  const me = await prisma.player.findUnique({ where: { userId } });
  if (!me) redirect("/");

  const duels = await prisma.duel.findMany({
    where: {
      OR: [{ challengerId: me.id }, { defenderId: me.id }],
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      challenger: { select: { id: true, nickname: true, class: true } },
      defender: { select: { id: true, nickname: true, class: true } },
    },
  });

  const otherPlayers = await prisma.player.findMany({
    where: { id: { not: me.id }, class: { not: null } },
    select: { id: true, nickname: true, class: true, level: true, points: true },
    orderBy: { points: "desc" },
  });

  const crownHolderId = await getCrownHolderId();

  const incoming = duels.filter(
    (d: typeof duels[number]) => d.defenderId === me.id && d.status === "PROPOSED",
  );
  const active = duels.filter(
    (d: typeof duels[number]) => d.status === "ACCEPTED",
  );
  const outgoing = duels.filter(
    (d: typeof duels[number]) => d.challengerId === me.id && d.status === "PROPOSED",
  );
  const finished = duels.filter(
    (d: typeof duels[number]) =>
      d.status === "COMPLETED" || d.status === "DECLINED" || d.status === "CANCELLED" || d.status === "EXPIRED",
  );

  return (
    <main style={{
      position: "relative",
      zIndex: 2,
      minHeight: "100vh",
      padding: "1.5rem",
      maxWidth: "1100px",
      margin: "0 auto",
    }}>
      <Link
        href="/profile"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          color: "var(--color-text-dim)",
          textDecoration: "none",
          marginBottom: "1.5rem",
          fontSize: "0.9rem",
        }}
      >
        <ChevronLeft size={16} />
        Профиль
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <Swords size={28} color="var(--color-blood-bright)" />
        <h1 style={{
          fontSize: "2rem",
          color: "var(--color-blood-bright)",
          margin: 0,
          letterSpacing: "0.05em",
        }}>
          Арена дуэлей
        </h1>
        {crownHolderId === me.id && (
          <Crown size={22} color="var(--color-gold)" title="Корона Короля Стрима" />
        )}
      </div>

      <DuelChallengePanel targets={otherPlayers} crownHolderId={crownHolderId} />

      {incoming.length > 0 && (
        <Section title={`Тебе бросили вызов (${incoming.length})`} color="var(--color-blood-bright)">
          {incoming.map((d: typeof duels[number]) => (
            <DuelCard key={d.id} duel={d} myId={me.id} crownHolderId={crownHolderId} />
          ))}
        </Section>
      )}

      {active.length > 0 && (
        <Section title={`Активные (${active.length})`} color="var(--color-gold)">
          {active.map((d: typeof duels[number]) => (
            <DuelCard key={d.id} duel={d} myId={me.id} crownHolderId={crownHolderId} />
          ))}
        </Section>
      )}

      {outgoing.length > 0 && (
        <Section title={`Твои вызовы в ожидании (${outgoing.length})`} color="var(--color-text-dim)">
          {outgoing.map((d: typeof duels[number]) => (
            <DuelCard key={d.id} duel={d} myId={me.id} crownHolderId={crownHolderId} />
          ))}
        </Section>
      )}

      {finished.length > 0 && (
        <Section title={`История (${finished.length})`} color="var(--color-text-dim)">
          {finished.slice(0, 20).map((d: typeof duels[number]) => (
            <DuelCard key={d.id} duel={d} myId={me.id} crownHolderId={crownHolderId} />
          ))}
        </Section>
      )}

      {duels.length === 0 && (
        <p style={{
          textAlign: "center",
          color: "var(--color-text-dim)",
          fontStyle: "italic",
          padding: "2rem",
        }}>
          Пока никаких дуэлей. Брось вызов сверху.
        </p>
      )}
    </main>
  );
}

function Section({
  title,
  color,
  children,
}: {
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: "2rem" }}>
      <h2 style={{
        fontSize: "0.95rem",
        color,
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        margin: "0 0 0.75rem 0",
        paddingBottom: "0.4rem",
        borderBottom: `1px solid ${color}33`,
        fontFamily: "var(--font-cinzel)",
      }}>
        {title}
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {children}
      </div>
    </div>
  );
}
