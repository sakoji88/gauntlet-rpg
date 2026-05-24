"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2 } from "lucide-react";

interface Props {
  questId: string;
  mode: "offer" | "self-complete";
}

// Маленький клиентский остров на свитке квестов.
// "offer"          — кнопки «Принять» / «Отказать» прямо в карточке
//                    (для IRL/админ-квестов, у которых нет NPC, в регион идти не нужно).
// "self-complete"  — кнопка «Отметить выполненным» для обычных админ-квестов
//                    (тип IRL + selfComplete=true): админ не вмешивается.
export default function QuestInlineActions({ questId, mode }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function call(endpoint: string, label: string) {
    setLoading(label);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Ошибка");
        setLoading(null);
        return;
      }
      if (data.success && data.pointsEarned !== undefined) {
        alert(`Готово! +${data.pointsEarned} поинтов · +${data.expEarned ?? 0} EXP`);
      }
      router.refresh();
    } catch (e) {
      console.error(e);
      alert("Ошибка соединения");
    } finally {
      setLoading(null);
    }
  }

  if (mode === "offer") {
    return (
      <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem" }}>
        <button
          onClick={() => call("/api/player/quest/accept", "accept")}
          disabled={!!loading}
          style={btn("var(--color-gold)")}
        >
          {loading === "accept" ? (
            <Loader2 size={13} className="spin" />
          ) : (
            <Check size={13} />
          )}
          Принять
        </button>
        <button
          onClick={() => call("/api/player/quest/decline", "decline")}
          disabled={!!loading}
          style={btn("var(--color-blood-bright)")}
        >
          {loading === "decline" ? (
            <Loader2 size={13} className="spin" />
          ) : (
            <X size={13} />
          )}
          Отказаться
        </button>
        <style>{`
          .spin { animation: spin 1s linear infinite; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ marginTop: "0.75rem" }}>
      <button
        onClick={() => call("/api/player/quest/self-complete", "self")}
        disabled={!!loading}
        style={{ ...btn("var(--color-gold)"), width: "100%", justifyContent: "center" }}
      >
        {loading === "self" ? (
          <Loader2 size={13} className="spin" />
        ) : (
          <Check size={13} />
        )}
        Отметить выполненным
      </button>
      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function btn(color: string): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.4rem",
    padding: "0.45rem 0.85rem",
    background: "transparent",
    border: `1px solid ${color}`,
    color,
    cursor: "pointer",
    fontFamily: "var(--font-cinzel)",
    fontSize: "0.78rem",
    letterSpacing: "0.05em",
  };
}
