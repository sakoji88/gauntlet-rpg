"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Target, X, Loader2, Skull } from "lucide-react";
import { getTrapByItemId } from "@/lib/trap-effects";

export interface TargetPlayer {
  id: string;
  nickname: string;
  className: string | null;
  level: number;
}

interface ThrowTrapModalProps {
  inventoryItemId: string;
  itemId: string;
  itemName: string;
  itemDescription: string;
  targets: TargetPlayer[];
  isUrka: boolean;
  onClose: () => void;
}

export default function ThrowTrapModal({
  inventoryItemId,
  itemId,
  itemName,
  itemDescription,
  targets,
  isUrka,
  onClose,
}: ThrowTrapModalProps) {
  const router = useRouter();
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [forcedGameTitle, setForcedGameTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const trap = getTrapByItemId(itemId);
  const requiresGameTitle = trap?.requiresGameTitle === true;

  async function confirm() {
    if (!pickedId) return;
    if (requiresGameTitle && forcedGameTitle.trim().length < 2) {
      alert("Впиши название игры для жертвы (минимум 2 символа)");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/player/trap/throw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inventoryItemId,
          targetPlayerId: pickedId,
          ...(requiresGameTitle ? { forcedGameTitle: forcedGameTitle.trim() } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Ошибка");
        setLoading(false);
        return;
      }
      alert(data.message ?? "Ловушка брошена");
      router.refresh();
      onClose();
    } catch (e) {
      console.error(e);
      alert("Ошибка соединения");
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.88)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        style={{
          background: "var(--color-bg-secondary)",
          border: "2px solid var(--color-blood-bright)",
          boxShadow: "0 0 40px rgba(184, 90, 90, 0.4)",
          maxWidth: "520px",
          width: "100%",
          padding: "1.5rem",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Target size={18} color="var(--color-blood-bright)" />
            <h2
              style={{
                fontSize: "1.15rem",
                color: "var(--color-blood-bright)",
                margin: 0,
                fontFamily: "var(--font-cinzel)",
              }}
            >
              Бросить «{itemName}»
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--color-text-dim)",
              cursor: "pointer",
              padding: 0,
            }}
            aria-label="Закрыть"
          >
            <X size={20} />
          </button>
        </div>

        <p
          style={{
            fontSize: "0.9rem",
            color: "var(--color-text)",
            lineHeight: 1.5,
            marginBottom: "1rem",
          }}
        >
          {itemDescription}
        </p>

        <div
          style={{
            padding: "0.6rem 0.8rem",
            background: isUrka
              ? "rgba(218, 165, 32, 0.08)"
              : "rgba(184, 90, 90, 0.08)",
            border: `1px solid ${isUrka ? "var(--color-gold-dim)" : "var(--color-blood-bright)"}`,
            color: isUrka ? "var(--color-gold)" : "var(--color-blood-bright)",
            fontSize: "0.8rem",
            marginBottom: "1rem",
            fontFamily: "var(--font-cinzel)",
            letterSpacing: "0.05em",
          }}
        >
          {isUrka
            ? "🜂 Урка: бесплатно (Ловкие Пальцы)"
            : "⚡ Стоимость: 1 ход"}
        </div>

        {requiresGameTitle && (
          <div style={{ marginBottom: "1rem" }}>
            <div
              style={{
                fontSize: "0.75rem",
                color: "var(--color-blood-bright)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: "0.4rem",
              }}
            >
              Какую игру задать жертве?
            </div>
            <input
              type="text"
              value={forcedGameTitle}
              onChange={(e) => setForcedGameTitle(e.target.value)}
              placeholder="например: Pathologic 2"
              style={{
                width: "100%",
                padding: "0.55rem 0.75rem",
                background: "var(--color-bg)",
                border: "1px solid var(--color-blood-bright)",
                color: "var(--color-text-bright)",
                fontSize: "0.9rem",
                fontFamily: "inherit",
                outline: "none",
              }}
            />
            <div
              style={{
                marginTop: "0.4rem",
                fontSize: "0.72rem",
                color: "var(--color-text-dim)",
                fontStyle: "italic",
                lineHeight: 1.4,
              }}
            >
              Игра встанет жертве в актив бесплатно. Она обязана её пройти
              или дропнуть в Тюрьму (−2 поинта, как обычный дроп).
            </div>
          </div>
        )}

        <div
          style={{
            fontSize: "0.75rem",
            color: "var(--color-text-dim)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: "0.5rem",
          }}
        >
          Цель
        </div>

        {targets.length === 0 ? (
          <div
            style={{
              padding: "1rem",
              textAlign: "center",
              color: "var(--color-text-dim)",
              fontStyle: "italic",
              border: "1px dashed var(--color-border)",
              marginBottom: "1rem",
            }}
          >
            Нет других игроков для броска
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.4rem",
              marginBottom: "1rem",
              maxHeight: "260px",
              overflowY: "auto",
            }}
          >
            {targets.map((t) => (
              <button
                key={t.id}
                onClick={() => setPickedId(t.id)}
                disabled={loading}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.6rem 0.8rem",
                  background:
                    pickedId === t.id
                      ? "rgba(184, 90, 90, 0.15)"
                      : "var(--color-bg)",
                  border: `1px solid ${
                    pickedId === t.id
                      ? "var(--color-blood-bright)"
                      : "var(--color-border-bright)"
                  }`,
                  color:
                    pickedId === t.id
                      ? "var(--color-blood-bright)"
                      : "var(--color-text)",
                  fontSize: "0.9rem",
                  fontFamily: "inherit",
                  cursor: loading ? "wait" : "pointer",
                  textAlign: "left",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Skull size={14} />
                  <span>{t.nickname}</span>
                </span>
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--color-text-dim)",
                  }}
                >
                  {t.className ?? "—"} · ур. {t.level}
                </span>
              </button>
            ))}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              padding: "0.7rem",
              background: "transparent",
              border: "1px solid var(--color-border-bright)",
              color: "var(--color-text-dim)",
              fontFamily: "var(--font-cinzel)",
              letterSpacing: "0.1em",
              fontSize: "0.8rem",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Отмена
          </button>
          <button
            onClick={confirm}
            disabled={loading || !pickedId}
            style={{
              padding: "0.7rem",
              background: "transparent",
              border: "1px solid var(--color-blood-bright)",
              color: "var(--color-blood-bright)",
              fontFamily: "var(--font-cinzel)",
              letterSpacing: "0.1em",
              fontSize: "0.8rem",
              textTransform: "uppercase",
              cursor: loading || !pickedId ? "not-allowed" : "pointer",
              opacity: loading || !pickedId ? 0.5 : 1,
            }}
          >
            {loading ? (
              <>
                <Loader2 size={12} className="spin" style={{ marginRight: "0.4rem" }} />
                Бросаю
              </>
            ) : (
              "Бросить"
            )}
          </button>
        </div>

        <style>{`
          .spin { animation: spin 1s linear infinite; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </div>
  );
}
