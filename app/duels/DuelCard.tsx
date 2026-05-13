"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Crown, Check, X, Send, Loader2, Trophy, Skull } from "lucide-react";

interface DuelInfo {
  id: string;
  challengerId: string;
  defenderId: string;
  challenger: { id: string; nickname: string; class: string | null };
  defender: { id: string; nickname: string; class: string | null };
  gameTitle: string;
  message: string | null;
  challengerHours: number | null;
  defenderHours: number | null;
  status: string;
  winnerId: string | null;
  pointsTransferred: number;
  expiresAt: Date | null;
}

export default function DuelCard({
  duel,
  myId,
  crownHolderId,
}: {
  duel: DuelInfo;
  myId: string;
  crownHolderId: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [hours, setHours] = useState("");
  const [rating, setRating] = useState("");

  const isChallenger = duel.challengerId === myId;
  const isDefender = duel.defenderId === myId;
  const opponent = isChallenger ? duel.defender : duel.challenger;
  const opponentHasCrown = opponent.id === crownHolderId;

  const mySubmitted = isChallenger ? duel.challengerHours !== null : duel.defenderHours !== null;
  const oppSubmitted = isChallenger ? duel.defenderHours !== null : duel.challengerHours !== null;

  async function call(action: "respond" | "submit" | "cancel", payload: Record<string, unknown>) {
    setLoading(action);
    try {
      const res = await fetch(`/api/player/duel/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duelId: duel.id, ...payload }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Ошибка");
        setLoading(null);
        return;
      }
      alert(data.message ?? "Готово");
      router.refresh();
      setLoading(null);
    } catch (e) {
      console.error(e);
      alert("Ошибка соединения");
      setLoading(null);
    }
  }

  const statusColor =
    duel.status === "COMPLETED"
      ? duel.winnerId === myId
        ? "var(--color-gold)"
        : "var(--color-blood-bright)"
      : duel.status === "ACCEPTED"
      ? "var(--color-gold)"
      : "var(--color-text-dim)";

  return (
    <div style={{
      padding: "1rem 1.25rem",
      background: "var(--color-bg-secondary)",
      border: `1px solid ${statusColor}55`,
      borderLeft: `3px solid ${statusColor}`,
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "0.5rem",
      }}>
        <div>
          <div style={{
            fontSize: "0.7rem",
            color: "var(--color-text-dim)",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            marginBottom: "0.25rem",
          }}>
            {isChallenger ? "Ты vs" : "Тебя вызывает"} {opponent.nickname}
            {opponentHasCrown && (
              <Crown size={11} color="var(--color-gold)" style={{ marginLeft: "0.3rem", verticalAlign: "middle" }} />
            )}
          </div>
          <h3 style={{
            fontSize: "1.05rem",
            color: "var(--color-text-bright)",
            margin: "0 0 0.25rem 0",
            fontFamily: "var(--font-cinzel)",
          }}>
            «{duel.gameTitle}»
          </h3>
          {duel.message && (
            <p style={{ color: "var(--color-text-dim)", fontStyle: "italic", fontSize: "0.85rem", margin: "0.3rem 0" }}>
              «{duel.message}»
            </p>
          )}
        </div>
        <span style={{
          fontSize: "0.7rem",
          color: statusColor,
          fontFamily: "var(--font-cinzel)",
          letterSpacing: "0.1em",
        }}>
          {STATUS_LABELS[duel.status] ?? duel.status}
        </span>
      </div>

      {/* COMPLETED: показать итог */}
      {duel.status === "COMPLETED" && (
        <div style={{
          padding: "0.75rem",
          background: duel.winnerId === myId
            ? "rgba(212,165,116,0.1)"
            : duel.winnerId === null
            ? "rgba(160,160,160,0.1)"
            : "rgba(184,90,90,0.1)",
          border: `1px solid ${statusColor}55`,
          fontSize: "0.85rem",
          color: "var(--color-text)",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginTop: "0.5rem",
        }}>
          {duel.winnerId === myId ? (
            <>
              <Trophy size={16} color="var(--color-gold)" />
              Ты победил! +{duel.pointsTransferred} поинтов.
              {duel.pointsTransferred > 3 && " (бонус за Корону)"}
            </>
          ) : duel.winnerId === null ? (
            <span style={{ color: "var(--color-text-dim)" }}>Полная ничья. Поинты не перешли.</span>
          ) : (
            <>
              <Skull size={16} color="var(--color-blood-bright)" />
              Поражение. −{duel.pointsTransferred} поинтов.
            </>
          )}
          <span style={{ marginLeft: "auto", color: "var(--color-text-dim)", fontSize: "0.75rem" }}>
            Ты: {(isChallenger ? duel.challengerHours : duel.defenderHours) ?? "—"} ч ·
            Соперник: {(isChallenger ? duel.defenderHours : duel.challengerHours) ?? "—"} ч
          </span>
        </div>
      )}

      {/* PROPOSED для защитника — accept/decline */}
      {duel.status === "PROPOSED" && isDefender && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginTop: "0.75rem" }}>
          <button
            onClick={() => call("respond", { accept: true })}
            disabled={loading !== null}
            style={btnGold}
          >
            {loading === "respond" ? <Loader2 size={12} className="spin" /> : <Check size={12} />}
            Принять
          </button>
          <button
            onClick={() => call("respond", { accept: false })}
            disabled={loading !== null}
            style={btnBlood}
          >
            <X size={12} />
            Отклонить
          </button>
        </div>
      )}

      {/* PROPOSED для челленджера — cancel */}
      {duel.status === "PROPOSED" && isChallenger && (
        <button
          onClick={() => call("cancel", {})}
          disabled={loading !== null}
          style={{ ...btnBlood, width: "100%", marginTop: "0.5rem" }}
        >
          <X size={12} />
          Отозвать вызов
        </button>
      )}

      {/* ACCEPTED — форма сдачи результата */}
      {duel.status === "ACCEPTED" && !mySubmitted && (
        <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div style={{
            fontSize: "0.75rem",
            color: "var(--color-text-dim)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}>
            Сдать свой результат
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem" }}>
            <input
              type="number"
              step="0.1"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="Часов (HLTB)"
              style={inputStyle}
            />
            <input
              type="number"
              min="0"
              max="100"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              placeholder="Рейтинг (опц.)"
              style={inputStyle}
            />
          </div>
          <button
            onClick={() =>
              call("submit", {
                hours: parseFloat(hours),
                rating: rating ? parseInt(rating, 10) : null,
              })
            }
            disabled={loading !== null || !hours}
            className="btn-dark"
            style={{ opacity: !hours ? 0.5 : 1, borderColor: statusColor, color: statusColor }}
          >
            {loading === "submit" ? (
              <Loader2 size={12} className="spin" style={{ marginRight: "0.4rem" }} />
            ) : (
              <Send size={12} style={{ marginRight: "0.4rem" }} />
            )}
            Сдать
          </button>
          {oppSubmitted && (
            <p style={{ fontSize: "0.78rem", color: "var(--color-gold)", margin: 0, fontStyle: "italic" }}>
              ⚡ Соперник уже сдал — победитель определится после твоего хода
            </p>
          )}
        </div>
      )}

      {duel.status === "ACCEPTED" && mySubmitted && !oppSubmitted && (
        <div style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "var(--color-text-dim)", fontStyle: "italic" }}>
          Свой результат сдал. Ждём {opponent.nickname}.
        </div>
      )}
    </div>
  );
}

const STATUS_LABELS: Record<string, string> = {
  PROPOSED: "Предложен",
  ACCEPTED: "Активен",
  COMPLETED: "Завершён",
  DECLINED: "Отклонён",
  CANCELLED: "Отозван",
  EXPIRED: "Просрочен",
};

const btnGold: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.4rem",
  padding: "0.55rem",
  background: "transparent",
  border: "1px solid var(--color-gold)",
  color: "var(--color-gold)",
  fontSize: "0.8rem",
  letterSpacing: "0.05em",
  fontFamily: "var(--font-cinzel)",
  textTransform: "uppercase",
  cursor: "pointer",
};

const btnBlood: React.CSSProperties = {
  ...btnGold,
  border: "1px solid var(--color-blood-bright)",
  color: "var(--color-blood-bright)",
};

const inputStyle: React.CSSProperties = {
  padding: "0.5rem 0.65rem",
  background: "var(--color-bg)",
  border: "1px solid var(--color-border-bright)",
  color: "var(--color-text-bright)",
  fontSize: "0.85rem",
  fontFamily: "inherit",
  outline: "none",
};
