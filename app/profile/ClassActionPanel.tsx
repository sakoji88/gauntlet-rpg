"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, Loader2, X } from "lucide-react";
import type { ClassActionDef } from "@/lib/class-actions";

interface FuseItem {
  itemId: string;
  itemName: string;
  count: number;
}

interface ClassActionPanelProps {
  action: ClassActionDef;
  cooldownLeftMs: number;
  fusableItems?: FuseItem[]; // для Алхимика — список доступных к слиянию
}

export default function ClassActionPanel({
  action,
  cooldownLeftMs,
  fusableItems = [],
}: ClassActionPanelProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [pickedItemId, setPickedItemId] = useState<string | null>(null);

  const onCooldown = cooldownLeftMs > 0;
  const hoursLeft = Math.ceil(cooldownLeftMs / (60 * 60 * 1000));
  const unavailable = action.unavailable;

  async function activate() {
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {};
      if (action.requiresInput) {
        payload.input = { [action.requiresInput.field]: inputValue.trim() };
      }
      if (action.requiresItemPick && pickedItemId) {
        payload.fuseItemId = pickedItemId;
      }
      const res = await fetch("/api/player/class-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Ошибка");
        setLoading(false);
        return;
      }
      alert(data.message ?? "Активировано");
      setModalOpen(false);
      setInputValue("");
      setPickedItemId(null);
      router.refresh();
      setLoading(false);
    } catch (e) {
      console.error(e);
      alert("Ошибка соединения");
      setLoading(false);
    }
  }

  return (
    <>
      <div
        className="parchment"
        style={{
          padding: "1rem 1.25rem",
          marginBottom: "1.5rem",
          borderColor: onCooldown || unavailable ? "var(--color-border)" : "var(--color-gold)",
          opacity: unavailable ? 0.6 : 1,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem" }}>
          <Zap size={16} color={onCooldown || unavailable ? "var(--color-text-dim)" : "var(--color-gold)"} />
          <div
            style={{
              fontSize: "0.75rem",
              color: "var(--color-text-dim)",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            Классовая активка
          </div>
          {onCooldown && (
            <span
              style={{
                marginLeft: "auto",
                fontSize: "0.75rem",
                color: "var(--color-text-dim)",
                fontFamily: "var(--font-cinzel)",
              }}
            >
              ~{hoursLeft}ч
            </span>
          )}
        </div>

        <h3
          style={{
            fontSize: "1.1rem",
            color: unavailable
              ? "var(--color-text-dim)"
              : onCooldown
              ? "var(--color-text)"
              : "var(--color-gold)",
            margin: "0 0 0.4rem 0",
            fontFamily: "var(--font-cinzel)",
          }}
        >
          {action.name}
        </h3>

        <p
          style={{
            fontSize: "0.85rem",
            color: "var(--color-text)",
            margin: "0 0 0.6rem 0",
            lineHeight: 1.5,
          }}
        >
          {action.shortDescription}
        </p>

        <button
          onClick={() => setModalOpen(true)}
          disabled={onCooldown || unavailable}
          className="btn-dark"
          style={{
            width: "100%",
            opacity: onCooldown || unavailable ? 0.5 : 1,
            cursor: onCooldown || unavailable ? "not-allowed" : "pointer",
          }}
        >
          {unavailable
            ? "Доступна позже"
            : onCooldown
            ? `Кулдаун ~${hoursLeft}ч`
            : "Активировать"}
        </button>
      </div>

      {modalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.88)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div
            style={{
              background: "var(--color-bg-secondary)",
              border: "2px solid var(--color-gold)",
              boxShadow: "0 0 40px rgba(212,165,116,0.4)",
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
              <h2
                style={{
                  fontSize: "1.2rem",
                  color: "var(--color-gold)",
                  margin: 0,
                  fontFamily: "var(--font-cinzel)",
                }}
              >
                {action.name}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
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
                marginBottom: "0.5rem",
              }}
            >
              {action.longDescription}
            </p>

            <p
              style={{
                fontSize: "0.8rem",
                color: "var(--color-text-dim)",
                fontStyle: "italic",
                marginBottom: "1.25rem",
                paddingLeft: "0.75rem",
                borderLeft: "2px solid var(--color-gold-dim)",
              }}
            >
              «{action.flavor}»
            </p>

            {action.requiresInput && (
              <label style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginBottom: "1rem" }}>
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--color-text-dim)",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  {action.requiresInput.label}
                </span>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={action.requiresInput.placeholder}
                  style={{
                    padding: "0.6rem 0.75rem",
                    background: "var(--color-bg)",
                    border: "1px solid var(--color-border-bright)",
                    color: "var(--color-text-bright)",
                    fontSize: "0.9rem",
                    fontFamily: "inherit",
                    outline: "none",
                  }}
                />
              </label>
            )}

            {action.requiresItemPick && (
              <div style={{ marginBottom: "1rem" }}>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--color-text-dim)",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    marginBottom: "0.5rem",
                  }}
                >
                  Выбери что слить (нужно ≥3 одинаковых)
                </div>
                {fusableItems.length === 0 ? (
                  <div
                    style={{
                      padding: "0.75rem",
                      border: "1px dashed var(--color-border)",
                      color: "var(--color-text-dim)",
                      fontSize: "0.85rem",
                      textAlign: "center",
                      fontStyle: "italic",
                    }}
                  >
                    У тебя нет 3 одинаковых расходников/экипировки
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    {fusableItems.map((it) => (
                      <button
                        key={it.itemId}
                        onClick={() => setPickedItemId(it.itemId)}
                        style={{
                          padding: "0.6rem 0.8rem",
                          background:
                            pickedItemId === it.itemId
                              ? "rgba(212,165,116,0.15)"
                              : "var(--color-bg)",
                          border: `1px solid ${
                            pickedItemId === it.itemId ? "var(--color-gold)" : "var(--color-border-bright)"
                          }`,
                          color:
                            pickedItemId === it.itemId ? "var(--color-gold)" : "var(--color-text)",
                          fontSize: "0.85rem",
                          fontFamily: "inherit",
                          cursor: "pointer",
                          textAlign: "left",
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span>{it.itemName}</span>
                        <span style={{ color: "var(--color-text-dim)" }}>×{it.count}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
              <button
                onClick={() => setModalOpen(false)}
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
                onClick={activate}
                disabled={
                  loading ||
                  (!!action.requiresInput && inputValue.trim().length < 3) ||
                  (!!action.requiresItemPick && !pickedItemId)
                }
                className="btn-dark"
                style={{
                  opacity:
                    loading ||
                    (!!action.requiresInput && inputValue.trim().length < 3) ||
                    (!!action.requiresItemPick && !pickedItemId)
                      ? 0.5
                      : 1,
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="spin" style={{ marginRight: "0.4rem" }} />
                    Применяю
                  </>
                ) : (
                  "Активировать"
                )}
              </button>
            </div>

            <style>{`
              .spin { animation: spin 1s linear infinite; }
              @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
          </div>
        </div>
      )}
    </>
  );
}
