"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Loader2, X } from "lucide-react";

export interface DialogueData {
  id: string;
  prompt: string;
  choices: { text: string; attitudeDelta: number }[];
}

export default function DialogueBox({
  dialogue,
  npcName,
  accentColor,
}: {
  dialogue: DialogueData;
  npcName: string;
  accentColor: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [closed, setClosed] = useState(false);
  const [result, setResult] = useState<{
    response: string;
    delta: number;
    after: number;
  } | null>(null);

  if (closed) return null;

  async function pick(idx: number) {
    setLoading(true);
    try {
      const res = await fetch("/api/player/dialogue/choose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dialogueId: dialogue.id, choiceIndex: idx }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Ошибка");
        setLoading(false);
        return;
      }
      setResult({
        response: data.response,
        delta: data.attitudeDelta,
        after: data.attitudeAfter,
      });
      setLoading(false);
      // Не рефрешим страницу до закрытия — пусть прочитает ответ
    } catch (e) {
      console.error(e);
      alert("Ошибка соединения");
      setLoading(false);
    }
  }

  function close() {
    setClosed(true);
    router.refresh();
  }

  return (
    <div
      style={{
        position: "relative",
        padding: "1.25rem 1.5rem",
        background: "linear-gradient(to right, rgba(20,18,30,0.95), rgba(15,14,22,0.95))",
        border: `1px solid ${accentColor}`,
        boxShadow: `0 0 24px ${accentColor}33`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
          marginBottom: "0.5rem",
        }}
      >
        <MessageCircle size={16} color={accentColor} />
        <div
          style={{
            fontSize: "0.7rem",
            color: "var(--color-text-dim)",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}
        >
          {npcName} говорит:
        </div>
        <button
          onClick={close}
          style={{
            marginLeft: "auto",
            background: "transparent",
            border: "none",
            color: "var(--color-text-dim)",
            cursor: "pointer",
            padding: "0.2rem",
            display: "flex",
          }}
          aria-label="Закрыть"
        >
          <X size={14} />
        </button>
      </div>

      <p
        style={{
          color: "var(--color-text-bright)",
          fontStyle: "italic",
          fontSize: "1.05rem",
          lineHeight: 1.5,
          margin: 0,
          marginBottom: "1rem",
        }}
      >
        «{dialogue.prompt}»
      </p>

      {!result ? (
        <div style={{ display: "grid", gap: "0.5rem" }}>
          {dialogue.choices.map((c, i) => (
            <button
              key={i}
              onClick={() => pick(i)}
              disabled={loading}
              style={{
                padding: "0.6rem 0.9rem",
                background: "var(--color-bg)",
                border: `1px solid ${accentColor}55`,
                color: "var(--color-text-bright)",
                cursor: loading ? "wait" : "pointer",
                textAlign: "left",
                fontFamily: "inherit",
                fontSize: "0.9rem",
                transition: "all 0.15s",
                opacity: loading ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = `${accentColor}11`;
                  e.currentTarget.style.borderColor = accentColor;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--color-bg)";
                e.currentTarget.style.borderColor = `${accentColor}55`;
              }}
            >
              {loading ? (
                <Loader2 size={14} className="spin" style={{ marginRight: "0.5rem" }} />
              ) : (
                "▸ "
              )}
              {c.text}
            </button>
          ))}
        </div>
      ) : (
        <div>
          <div
            style={{
              padding: "0.75rem 1rem",
              background: `${accentColor}11`,
              borderLeft: `2px solid ${accentColor}`,
              fontSize: "0.95rem",
              color: "var(--color-text-bright)",
              fontStyle: "italic",
              marginBottom: "0.75rem",
            }}
          >
            «{result.response}»
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "0.8rem",
            }}
          >
            <span
              style={{
                color:
                  result.delta > 0
                    ? "#9abf6e"
                    : result.delta < 0
                    ? "var(--color-blood-bright)"
                    : "var(--color-text-dim)",
                fontFamily: "var(--font-cinzel)",
                letterSpacing: "0.08em",
              }}
            >
              Отношение: {result.delta > 0 ? "+" : ""}
              {result.delta} (теперь {result.after})
            </span>
            <button
              onClick={close}
              style={{
                padding: "0.4rem 0.9rem",
                background: "transparent",
                border: `1px solid ${accentColor}`,
                color: accentColor,
                fontFamily: "var(--font-cinzel)",
                fontSize: "0.75rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
