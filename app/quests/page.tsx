import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import PageBackdrop from "@/app/components/PageBackdrop";
import { ChevronLeft, Scroll, Trophy, Hourglass, X as XIcon, Check, CircleSlash } from "lucide-react";
import { getRegionById } from "@/lib/regions";
import { parseQuestRewards } from "@/lib/quest-types";
import { getTemplateById } from "@/lib/quest-templates";

export default async function QuestsPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const userId = (session.user as any).id;
  const player = await prisma.player.findUnique({ where: { userId } });
  if (!player) redirect("/");

  const quests = await prisma.quest.findMany({
    where: { playerId: player.id },
    orderBy: [
      { status: "asc" }, // ACTIVE/OFFERED первыми (примерно)
      { offeredAt: "desc" },
    ],
  });

  const active = quests.filter((q) => q.status === "ACTIVE" || q.status === "OFFERED");
  const completed = quests.filter((q) => q.status === "COMPLETED");
  const failed = quests.filter((q) => q.status === "DECLINED" || q.status === "EXPIRED");

  return (
    <>
      <PageBackdrop image="quests.jpg" accent="#d4a574" />
      <main style={{
      position: "relative",
      zIndex: 2,
      minHeight: "100vh",
      padding: "1.5rem",
      maxWidth: "900px",
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
        <Scroll size={28} color="var(--color-gold)" />
        <h1 style={{
          fontSize: "2rem",
          color: "var(--color-gold)",
          margin: 0,
          letterSpacing: "0.05em",
        }}>
          Свиток Квестов
        </h1>
      </div>

      <Section
        title="Активные"
        icon={<Hourglass size={16} color="var(--color-gold)" />}
        empty="Нет активных квестов. Зайди к NPC — может, что-то предложат."
        quests={active}
      />

      <Section
        title="Завершённые"
        icon={<Check size={16} color="var(--color-gold)" />}
        empty="Пока ни одного. Принимай и выполняй."
        quests={completed}
      />

      {failed.length > 0 && (
        <Section
          title="Отказы и провалы"
          icon={<CircleSlash size={16} color="var(--color-blood-bright)" />}
          empty=""
          quests={failed}
        />
      )}
      </main>
    </>
  );
}

type QuestRow = {
  id: string;
  templateId: string;
  npcRegion: string;
  type: string;
  title: string;
  description: string;
  status: string;
  targetCount: number;
  progress: number;
  expiresAt: Date | null;
  completedAt: Date | null;
  rewards: string;
};

function Section({
  title,
  icon,
  empty,
  quests,
}: {
  title: string;
  icon: React.ReactNode;
  empty: string;
  quests: QuestRow[];
}) {
  return (
    <div style={{ marginBottom: "2rem" }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        marginBottom: "0.75rem",
        paddingBottom: "0.5rem",
        borderBottom: "1px solid var(--color-border)",
      }}>
        {icon}
        <h2 style={{
          fontSize: "1rem",
          color: "var(--color-text-bright)",
          margin: 0,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}>
          {title} <span style={{ color: "var(--color-text-dim)" }}>({quests.length})</span>
        </h2>
      </div>

      {quests.length === 0 ? (
        empty && (
          <p style={{
            color: "var(--color-text-dim)",
            fontStyle: "italic",
            fontSize: "0.9rem",
            padding: "1rem",
            border: "1px dashed var(--color-border)",
            textAlign: "center",
          }}>
            {empty}
          </p>
        )
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {quests.map((q) => (
            <QuestCard key={q.id} quest={q} />
          ))}
        </div>
      )}
    </div>
  );
}

function QuestCard({ quest }: { quest: QuestRow }) {
  const region = getRegionById(quest.npcRegion);
  const accent = region?.accentColor ?? "var(--color-gold)";
  const rewards = parseQuestRewards(quest.rewards);
  const tpl = getTemplateById(quest.templateId);
  const tierLabel = tpl
    ? tpl.tier === "STARTER"
      ? "Стартовый"
      : tpl.tier === "STORY"
      ? `Глава ${tpl.chapterIndex ?? 1}`
      : "Побочный"
    : "—";
  const tierColor =
    tpl?.tier === "STARTER"
      ? "#7a8d4a"
      : tpl?.tier === "STORY"
      ? "#d4a574"
      : "#9aa39b";

  const daysLeft =
    quest.expiresAt && quest.status === "ACTIVE"
      ? Math.max(0, Math.ceil((quest.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : null;

  const statusColors: Record<string, string> = {
    OFFERED: "var(--color-gold)",
    ACTIVE: "var(--color-gold)",
    COMPLETED: "#7a8d4a",
    DECLINED: "var(--color-blood-bright)",
    EXPIRED: "var(--color-blood-bright)",
  };

  return (
    <div
      style={{
        padding: "1rem 1.25rem",
        background: "var(--color-bg-secondary)",
        border: `1px solid ${quest.status === "COMPLETED" || quest.status === "ACTIVE" || quest.status === "OFFERED" ? accent : "var(--color-border)"}`,
        opacity: quest.status === "DECLINED" || quest.status === "EXPIRED" ? 0.55 : 1,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem", flexWrap: "wrap" }}>
        <div style={{
          fontSize: "0.7rem",
          color: "var(--color-text-dim)",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
        }}>
          {region?.npcName ?? quest.npcRegion}
        </div>
        <span style={{
          fontSize: "0.65rem",
          padding: "0.1rem 0.45rem",
          background: `${tierColor}22`,
          border: `1px solid ${tierColor}66`,
          color: tierColor,
          fontFamily: "var(--font-cinzel)",
          letterSpacing: "0.05em",
        }}>
          {tierLabel}
        </span>
        <div style={{
          marginLeft: "auto",
          fontSize: "0.7rem",
          color: statusColors[quest.status],
          fontFamily: "var(--font-cinzel)",
          letterSpacing: "0.1em",
        }}>
          {STATUS_LABELS[quest.status] ?? quest.status}
        </div>
      </div>

      <h3 style={{
        fontSize: "1rem",
        color: accent,
        margin: "0 0 0.4rem 0",
        fontFamily: "var(--font-cinzel)",
      }}>
        {quest.title}
      </h3>

      <p style={{
        fontSize: "0.85rem",
        color: "var(--color-text)",
        margin: "0 0 0.6rem 0",
        lineHeight: 1.5,
      }}>
        {quest.description}
      </p>

      <div style={{
        display: "flex",
        gap: "0.75rem",
        fontSize: "0.75rem",
        color: "var(--color-text-dim)",
        flexWrap: "wrap",
      }}>
        {quest.status === "ACTIVE" && (
          <span>
            Прогресс:{" "}
            <strong style={{ color: accent }}>
              {quest.progress}/{quest.targetCount}
            </strong>
          </span>
        )}
        {daysLeft !== null && (
          <span>
            Осталось:{" "}
            <strong style={{ color: "var(--color-gold)" }}>{daysLeft}д</strong>
          </span>
        )}
        <span style={{ marginLeft: "auto" }}>
          <Trophy size={10} style={{ display: "inline", marginRight: "0.25rem" }} />
          +{rewards.points} поинтов · +{rewards.exp} EXP
        </span>
      </div>

      {quest.status === "OFFERED" && (
        <div style={{
          marginTop: "0.6rem",
          fontSize: "0.8rem",
          color: "var(--color-text-dim)",
          fontStyle: "italic",
        }}>
          Зайди в регион «{region?.shortName ?? quest.npcRegion}» — там примешь или откажешься.
          <br />
          <Link
            href={`/region/${quest.npcRegion}`}
            style={{
              color: accent,
              textDecoration: "underline",
              textUnderlineOffset: "3px",
            }}
          >
            Перейти в регион →
          </Link>
        </div>
      )}
    </div>
  );
}

const STATUS_LABELS: Record<string, string> = {
  OFFERED: "Предложен",
  ACTIVE: "Активен",
  COMPLETED: "Выполнен",
  DECLINED: "Отказ",
  EXPIRED: "Просрочен",
};
