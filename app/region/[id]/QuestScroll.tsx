"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Scroll,
  Check,
  X,
  Loader2,
  Trophy,
  Hourglass,
  BookOpen,
} from "lucide-react";
import { parseQuestRewards } from "@/lib/quest-types";

export interface QuestProps {
  id: string;
  type: "GENRE" | "DURATION" | "RATING" | "CHALLENGE" | "LORE";
  title: string;
  description: string;
  flavor: string;
  status: "OFFERED" | "ACTIVE" | "COMPLETED" | "DECLINED" | "EXPIRED";
  targetCount: number;
  progress: number;
  expiresAt: string | null;
  rewards: string; // JSON
  tier: "STARTER" | "STORY" | "SIDE";
  chapterIndex?: number | null;
}

export default function QuestScroll({
  quest,
  npcName,
  accentColor,
}: {
  quest: QuestProps;
  npcName: string;
  accentColor: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<"accept" | "decline" | "lore" | null>(null);

  const rewards = parseQuestRewards(quest.rewards);

  async function call(action: "accept" | "decline" | "lore") {
    setLoading(action);
    const endpoint =
      action === "accept"
        ? "/api/player/quest/accept"
        : action === "decline"
        ? "/api/player/quest/decline"
        : "/api/player/quest/lore-complete";
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questId: quest.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Ошибка");
        setLoading(null);
        return;
      }
      if (action === "lore" && data.success) {
        alert(`Квест завершён! +${data.pointsEarned} поинтов · +${data.expEarned} EXP`);
      }
      router.refresh();
      setLoading(null);
    } catch (e) {
      console.error(e);
      alert("Ошибка соединения");
      setLoading(null);
    }
  }

  // Дедлайн до...
  const deadline = quest.expiresAt ? new Date(quest.expiresAt) : null;
  const daysLeft = deadline
    ? Math.max(0, Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const typeLabel = TYPE_LABELS[quest.type];
  const tierLabel =
    quest.tier === "STARTER"
      ? "Стартовый"
      : quest.tier === "STORY"
      ? `Глава ${quest.chapterIndex ?? 1}`
      : "Побочный";
  const tierColor =
    quest.tier === "STARTER"
      ? "#7a8d4a"
      : quest.tier === "STORY"
      ? "#d4a574"
      : "#9aa39b";

  return (
    <div
      className="parchment"
      style={{
        padding: "1.25rem 1.5rem",
        borderColor: accentColor,
        boxShadow: `0 0 20px ${accentColor}33`,
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
        <Scroll size={18} color={accentColor} />
        <div
          style={{
            fontSize: "0.7rem",
            color: "var(--color-text-dim)",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
          }}
        >
          {quest.status === "OFFERED" ? `Новый квест от ${npcName}` : `Квест от ${npcName}`}
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          <Pill color={tierColor}>{tierLabel}</Pill>
          <Pill color={accentColor}>{typeLabel}</Pill>
          {quest.status === "ACTIVE" && daysLeft !== null && (
            <Pill color="var(--color-gold)">
              <Hourglass size={10} style={{ marginRight: "0.25rem" }} />
              {daysLeft}д
            </Pill>
          )}
        </div>
      </div>

      <h3
        style={{
          fontSize: "1.15rem",
          color: accentColor,
          margin: 0,
          fontFamily: "var(--font-cinzel)",
          letterSpacing: "0.05em",
        }}
      >
        {quest.title}
      </h3>

      <p
        style={{
          fontSize: "0.95rem",
          color: "var(--color-text-bright)",
          lineHeight: 1.5,
          margin: 0,
        }}
      >
        {quest.description}
      </p>

      {quest.status === "OFFERED" && (
        <p
          style={{
            fontSize: "0.85rem",
            color: "var(--color-text-dim)",
            fontStyle: "italic",
            lineHeight: 1.6,
            margin: 0,
            padding: "0.6rem 0.8rem",
            borderLeft: `2px solid ${accentColor}`,
            background: `${accentColor}11`,
          }}
        >
          «{quest.flavor}»
        </p>
      )}

      {/* Прогресс */}
      {quest.status === "ACTIVE" && quest.type !== "LORE" && (
        <ProgressBar
          progress={quest.progress}
          target={quest.targetCount}
          color={accentColor}
        />
      )}

      {/* Награды */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          alignItems: "center",
          fontSize: "0.8rem",
          color: "var(--color-text-dim)",
        }}
      >
        <Trophy size={12} color="var(--color-gold)" />
        <span>
          Награда:{" "}
          <strong style={{ color: "var(--color-gold)" }}>+{rewards.points}</strong> поинтов,{" "}
          <strong style={{ color: "var(--color-gold)" }}>+{rewards.exp}</strong> EXP
        </span>
      </div>

      {/* Кнопки */}
      {quest.status === "OFFERED" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
          <button
            onClick={() => call("accept")}
            disabled={loading !== null}
            className="btn-dark"
            style={{
              borderColor: accentColor,
              color: accentColor,
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading === "accept" ? (
              <>
                <Loader2 size={14} className="spin" style={{ marginRight: "0.4rem" }} />
                Принимаю
              </>
            ) : (
              <>
                <Check size={14} style={{ marginRight: "0.4rem" }} />
                Принять
              </>
            )}
          </button>
          <button
            onClick={() => call("decline")}
            disabled={loading !== null}
            style={{
              padding: "0.6rem",
              background: "transparent",
              border: "1px solid var(--color-border-bright)",
              color: "var(--color-text-dim)",
              cursor: loading ? "wait" : "pointer",
              fontFamily: "var(--font-cinzel)",
              letterSpacing: "0.1em",
              fontSize: "0.8rem",
              textTransform: "uppercase",
            }}
          >
            {loading === "decline" ? (
              <>
                <Loader2 size={12} className="spin" style={{ marginRight: "0.4rem" }} />
                Отказ...
              </>
            ) : (
              <>
                <X size={12} style={{ marginRight: "0.4rem" }} />
                Отказаться
              </>
            )}
          </button>
        </div>
      )}

      {/* LORE — кнопка "Отметить выполнено" */}
      {quest.status === "ACTIVE" && quest.type === "LORE" && (
        <button
          onClick={() => call("lore")}
          disabled={loading !== null}
          className="btn-dark"
          style={{
            borderColor: accentColor,
            color: accentColor,
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading === "lore" ? (
            <>
              <Loader2 size={14} className="spin" style={{ marginRight: "0.4rem" }} />
              Закрываю
            </>
          ) : (
            <>
              <BookOpen size={14} style={{ marginRight: "0.4rem" }} />
              Отметить выполнено
            </>
          )}
        </button>
      )}

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

const TYPE_LABELS: Record<QuestProps["type"], string> = {
  GENRE: "Жанровый",
  DURATION: "Длительный",
  RATING: "Рейтинг",
  CHALLENGE: "Челлендж",
  LORE: "Лорный",
};

function Pill({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span
      style={{
        fontSize: "0.7rem",
        padding: "0.15rem 0.5rem",
        background: `${color}22`,
        border: `1px solid ${color}55`,
        color,
        fontFamily: "var(--font-cinzel)",
        letterSpacing: "0.05em",
        display: "inline-flex",
        alignItems: "center",
      }}
    >
      {children}
    </span>
  );
}

function ProgressBar({
  progress,
  target,
  color,
}: {
  progress: number;
  target: number;
  color: string;
}) {
  const pct = Math.min(100, Math.round((progress / target) * 100));
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "0.75rem",
          color: "var(--color-text-dim)",
          marginBottom: "0.3rem",
        }}
      >
        <span>Прогресс</span>
        <span style={{ color, fontFamily: "var(--font-cinzel)" }}>
          {progress} / {target}
        </span>
      </div>
      <div
        style={{
          width: "100%",
          height: "8px",
          background: "var(--color-bg)",
          border: "1px solid var(--color-border)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: color,
            transition: "width 0.4s",
          }}
        />
      </div>
    </div>
  );
}
