"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, Sword, Hourglass, Clover, Drama } from "lucide-react";

interface StatDistributionPanelProps {
  strength: number;
  patience: number;
  luck: number;
  charisma: number;
  unspentStatPoints: number;
}

type StatKey = "strength" | "patience" | "luck" | "charisma";

const STATS: { key: StatKey; label: string; short: string; icon: React.ReactNode; hint: string }[] = [
  { key: "strength", label: "Сила", short: "СИЛ", icon: <Sword size={16} />, hint: "+1 поинт за hardcore-игры на каждые 4 очка" },
  { key: "patience", label: "Терпение", short: "ТЕР", icon: <Hourglass size={16} />, hint: "+1 поинт за длинные игры (15+ ч) на каждые 4 очка" },
  { key: "luck", label: "Удача", short: "УДЧ", icon: <Clover size={16} />, hint: "+5% шанс редкого предмета на колесе на каждые 4 очка" },
  { key: "charisma", label: "Харизма", short: "ХАР", icon: <Drama size={16} />, hint: "+1 поинт за квесты NPC на каждые 6 очков" },
];

export default function StatDistributionPanel({
  strength,
  patience,
  luck,
  charisma,
  unspentStatPoints,
}: StatDistributionPanelProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<StatKey | null>(null);

  const values: Record<StatKey, number> = { strength, patience, luck, charisma };

  async function spend(stat: StatKey) {
    if (loading || unspentStatPoints <= 0) return;
    setLoading(stat);
    try {
      const res = await fetch("/api/player/spend-stat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stat }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Ошибка");
        setLoading(null);
        return;
      }
      router.refresh();
    } catch {
      alert("Не удалось распределить очко");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div
      className="flicker"
      style={{
        padding: "1.25rem 1.5rem",
        background: "var(--color-bg-secondary)",
        border: "1px solid var(--color-gold)",
        boxShadow: "0 0 24px rgba(212,165,116,0.18)",
        marginBottom: "1.5rem",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
          marginBottom: "1rem",
        }}
      >
        <Sparkles size={18} color="var(--color-gold)" />
        <span
          style={{
            fontFamily: "var(--font-cinzel)",
            color: "var(--color-gold)",
            letterSpacing: "0.1em",
            fontSize: "0.95rem",
          }}
        >
          Нераспределённые очки: {unspentStatPoints}
        </span>
      </div>
      <p
        style={{
          fontSize: "0.85rem",
          color: "var(--color-text-dim)",
          fontStyle: "italic",
          margin: "0 0 1rem",
        }}
      >
        За каждый уровень — 3 очка. Вложи их в статы. Назад не отыграть — думай.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "0.75rem",
        }}
      >
        {STATS.map((s) => (
          <div
            key={s.key}
            style={{
              padding: "0.75rem",
              background: "var(--color-bg-tertiary)",
              border: "1px solid var(--color-border)",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                color: "var(--color-text-bright)",
              }}
            >
              {s.icon}
              <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.9rem" }}>
                {s.label}
              </span>
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: "1.1rem",
                  color: "var(--color-gold)",
                  fontWeight: 700,
                }}
              >
                {values[s.key]}
              </span>
            </div>
            <p
              style={{
                fontSize: "0.72rem",
                color: "var(--color-text-dim)",
                margin: 0,
                lineHeight: 1.4,
                minHeight: "2.6em",
              }}
            >
              {s.hint}
            </p>
            <button
              onClick={() => spend(s.key)}
              disabled={loading !== null || unspentStatPoints <= 0}
              style={{
                padding: "0.4rem",
                background: "transparent",
                border: "1px solid var(--color-gold-dim)",
                color: "var(--color-gold)",
                cursor: loading !== null || unspentStatPoints <= 0 ? "not-allowed" : "pointer",
                opacity: loading !== null || unspentStatPoints <= 0 ? 0.5 : 1,
                fontFamily: "var(--font-cinzel)",
                letterSpacing: "0.05em",
                fontSize: "0.8rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.35rem",
              }}
            >
              {loading === s.key ? (
                <Loader2 size={14} className="spin" />
              ) : (
                `+1 ${s.short}`
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
