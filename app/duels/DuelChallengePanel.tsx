"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Swords, Crown, Loader2 } from "lucide-react";

interface TargetPlayer {
  id: string;
  nickname: string;
  class: string | null;
  level: number;
  points: number;
}

export default function DuelChallengePanel({
  targets,
  crownHolderId,
}: {
  targets: TargetPlayer[];
  crownHolderId: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [defenderId, setDefenderId] = useState<string>("");
  const [gameTitle, setGameTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!defenderId) {
      alert("Выбери соперника");
      return;
    }
    if (gameTitle.trim().length < 2) {
      alert("Укажи игру");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/player/duel/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          defenderId,
          gameTitle: gameTitle.trim(),
          message: message.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Ошибка");
        setLoading(false);
        return;
      }
      alert(data.message ?? "Вызов брошен");
      setOpen(false);
      setDefenderId("");
      setGameTitle("");
      setMessage("");
      router.refresh();
      setLoading(false);
    } catch (e) {
      console.error(e);
      alert("Ошибка соединения");
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="btn-dark"
        style={{
          marginBottom: "1.5rem",
          borderColor: "var(--color-blood-bright)",
          color: "var(--color-blood-bright)",
          padding: "0.75rem 1.25rem",
        }}
      >
        <Swords size={14} style={{ marginRight: "0.5rem" }} />
        Бросить вызов
      </button>
    );
  }

  return (
    <div className="parchment" style={{
      padding: "1.25rem 1.5rem",
      borderColor: "var(--color-blood-bright)",
      marginBottom: "1.5rem",
    }}>
      <h3 style={{
        color: "var(--color-blood-bright)",
        margin: "0 0 1rem 0",
        fontSize: "1.05rem",
        fontFamily: "var(--font-cinzel)",
        letterSpacing: "0.1em",
      }}>
        Новый вызов
      </h3>

      <label style={{ display: "block", marginBottom: "0.75rem" }}>
        <div style={labelStyle}>Соперник</div>
        <select
          value={defenderId}
          onChange={(e) => setDefenderId(e.target.value)}
          style={inputStyle}
        >
          <option value="">— выбери —</option>
          {targets.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nickname}
              {t.id === crownHolderId ? " 👑" : ""}
              {" · "}
              ур. {t.level} · {t.points} поинтов
            </option>
          ))}
        </select>
      </label>

      <label style={{ display: "block", marginBottom: "0.75rem" }}>
        <div style={labelStyle}>Согласованная игра *</div>
        <input
          type="text"
          value={gameTitle}
          onChange={(e) => setGameTitle(e.target.value)}
          placeholder="Bloodborne / Cuphead / ..."
          style={inputStyle}
        />
      </label>

      <label style={{ display: "block", marginBottom: "1rem" }}>
        <div style={labelStyle}>Сообщение (опционально)</div>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Готов проиграть, пацан?"
          style={inputStyle}
        />
      </label>

      {defenderId === crownHolderId && crownHolderId && (
        <div style={{
          padding: "0.6rem",
          background: "rgba(212,165,116,0.1)",
          border: "1px solid var(--color-gold)",
          color: "var(--color-gold)",
          fontSize: "0.85rem",
          marginBottom: "1rem",
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
        }}>
          <Crown size={14} />
          У него Корона Стрима — победа даст 5 поинтов вместо 3
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
        <button
          onClick={() => setOpen(false)}
          disabled={loading}
          style={cancelBtn}
        >
          Отмена
        </button>
        <button
          onClick={send}
          disabled={loading || !defenderId || gameTitle.trim().length < 2}
          className="btn-dark"
          style={{
            borderColor: "var(--color-blood-bright)",
            color: "var(--color-blood-bright)",
            opacity: loading || !defenderId || gameTitle.trim().length < 2 ? 0.5 : 1,
          }}
        >
          {loading ? (
            <>
              <Loader2 size={12} className="spin" style={{ marginRight: "0.4rem" }} />
              Бросаю
            </>
          ) : (
            "Бросить вызов"
          )}
        </button>
      </div>

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: "0.7rem",
  color: "var(--color-text-dim)",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  marginBottom: "0.3rem",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.55rem 0.7rem",
  background: "var(--color-bg)",
  border: "1px solid var(--color-border-bright)",
  color: "var(--color-text-bright)",
  fontSize: "0.9rem",
  fontFamily: "inherit",
  outline: "none",
};

const cancelBtn: React.CSSProperties = {
  padding: "0.7rem",
  background: "transparent",
  border: "1px solid var(--color-border-bright)",
  color: "var(--color-text-dim)",
  fontFamily: "var(--font-cinzel)",
  letterSpacing: "0.1em",
  fontSize: "0.8rem",
  textTransform: "uppercase",
  cursor: "pointer",
};
