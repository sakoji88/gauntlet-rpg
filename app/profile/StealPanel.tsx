"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Skull, Loader2, X, ChevronRight } from "lucide-react";

interface TargetItem {
  inventoryItemId: string;
  itemName: string;
  rarity: string;
  category: string;
}

interface TargetPlayer {
  id: string;
  nickname: string;
  level: number;
  luck: number;
  items: TargetItem[];
}

interface StealPanelProps {
  targets: TargetPlayer[];
  cooldownLeftMs: number;
  myLuck: number;
}

export default function StealPanel({ targets, cooldownLeftMs, myLuck }: StealPanelProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pickedPlayerId, setPickedPlayerId] = useState<string | null>(null);
  const [pickedItemId, setPickedItemId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onCooldown = cooldownLeftMs > 0;
  const hoursLeft = Math.ceil(cooldownLeftMs / (60 * 60 * 1000));

  const picked = targets.find((t) => t.id === pickedPlayerId);

  async function steal() {
    if (!pickedPlayerId || !pickedItemId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/player/steal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetPlayerId: pickedPlayerId,
          targetInventoryItemId: pickedItemId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Ошибка");
        setLoading(false);
        return;
      }
      alert(`${data.message}\n\nБросок: ${data.roll} / ${data.threshold}`);
      setOpen(false);
      setPickedPlayerId(null);
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
    <div
      className="parchment"
      style={{
        padding: "1rem 1.25rem",
        marginBottom: "1.5rem",
        borderColor: onCooldown ? "var(--color-border)" : "var(--color-blood-bright)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.4rem" }}>
        <Skull size={16} color="var(--color-blood-bright)" />
        <div
          style={{
            fontSize: "0.75rem",
            color: "var(--color-text-dim)",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}
        >
          Кража (Урка)
        </div>
        {onCooldown && (
          <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "var(--color-text-dim)" }}>
            ~{hoursLeft}ч
          </span>
        )}
      </div>

      <p style={{ fontSize: "0.85rem", color: "var(--color-text)", margin: "0 0 0.6rem 0", lineHeight: 1.4 }}>
        Бросок: 50% + (твоя Удача − Удача жертвы) × 3%. Провал → −1 поинт.
        <br />
        Твоя удача: <strong style={{ color: "var(--color-gold)" }}>{myLuck}</strong> · кулдаун: 24ч
      </p>

      <button
        onClick={() => setOpen(true)}
        disabled={onCooldown}
        className="btn-dark"
        style={{
          width: "100%",
          borderColor: "var(--color-blood-bright)",
          color: "var(--color-blood-bright)",
          opacity: onCooldown ? 0.5 : 1,
          cursor: onCooldown ? "not-allowed" : "pointer",
        }}
      >
        {onCooldown ? `Кулдаун ~${hoursLeft}ч` : "Совершить кражу (1 ход)"}
      </button>

      {open && (
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
              maxWidth: "640px",
              width: "100%",
              maxHeight: "90vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{
              padding: "1rem 1.25rem",
              borderBottom: "1px solid var(--color-blood-bright)44",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Skull size={18} color="var(--color-blood-bright)" />
                <h2 style={{ margin: 0, color: "var(--color-blood-bright)", fontSize: "1.05rem", fontFamily: "var(--font-cinzel)" }}>
                  Кого обчищаем?
                </h2>
              </div>
              <button onClick={() => setOpen(false)} style={{ background: "transparent", border: "none", color: "var(--color-text-dim)", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "200px 1fr",
              flex: 1,
              overflow: "hidden",
            }}>
              {/* Список игроков */}
              <div style={{
                borderRight: "1px solid var(--color-border)",
                overflowY: "auto",
                padding: "0.5rem",
              }}>
                {targets.length === 0 ? (
                  <p style={{ color: "var(--color-text-dim)", fontStyle: "italic", padding: "0.5rem", fontSize: "0.85rem" }}>
                    Нет игроков с предметами
                  </p>
                ) : (
                  targets.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setPickedPlayerId(t.id);
                        setPickedItemId(null);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        width: "100%",
                        padding: "0.5rem 0.6rem",
                        background: pickedPlayerId === t.id ? "var(--color-bg-tertiary)" : "transparent",
                        border: "none",
                        color: pickedPlayerId === t.id ? "var(--color-blood-bright)" : "var(--color-text)",
                        cursor: "pointer",
                        textAlign: "left",
                        fontFamily: "inherit",
                        fontSize: "0.85rem",
                      }}
                    >
                      <ChevronRight size={12} style={{ opacity: pickedPlayerId === t.id ? 1 : 0 }} />
                      <span style={{ flex: 1 }}>
                        {t.nickname}
                        <div style={{ fontSize: "0.7rem", color: "var(--color-text-dim)" }}>
                          ур. {t.level} · удача {t.luck}
                        </div>
                      </span>
                    </button>
                  ))
                )}
              </div>

              {/* Предметы выбранной цели */}
              <div style={{ padding: "0.75rem", overflowY: "auto" }}>
                {!picked ? (
                  <p style={{ color: "var(--color-text-dim)", fontStyle: "italic" }}>
                    Выбери цель слева
                  </p>
                ) : picked.items.length === 0 ? (
                  <p style={{ color: "var(--color-text-dim)", fontStyle: "italic" }}>
                    У этой жертвы нет крадоспособных предметов (косметика и легендарки не считаются)
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    {picked.items.map((it) => (
                      <button
                        key={it.inventoryItemId}
                        onClick={() => setPickedItemId(it.inventoryItemId)}
                        style={{
                          padding: "0.55rem 0.75rem",
                          background:
                            pickedItemId === it.inventoryItemId
                              ? "rgba(184,90,90,0.15)"
                              : "var(--color-bg)",
                          border: `1px solid ${
                            pickedItemId === it.inventoryItemId
                              ? "var(--color-blood-bright)"
                              : "var(--color-border-bright)"
                          }`,
                          color:
                            pickedItemId === it.inventoryItemId
                              ? "var(--color-blood-bright)"
                              : "var(--color-text)",
                          fontSize: "0.85rem",
                          fontFamily: "inherit",
                          cursor: "pointer",
                          textAlign: "left",
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span>{it.itemName}</span>
                        <span style={{ color: "var(--color-text-dim)", fontSize: "0.7rem" }}>
                          {it.rarity}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{
              padding: "1rem 1.25rem",
              borderTop: "1px solid var(--color-border)",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.5rem",
            }}>
              <button onClick={() => setOpen(false)} disabled={loading} style={{
                padding: "0.7rem",
                background: "transparent",
                border: "1px solid var(--color-border-bright)",
                color: "var(--color-text-dim)",
                fontFamily: "var(--font-cinzel)",
                letterSpacing: "0.1em",
                fontSize: "0.8rem",
                textTransform: "uppercase",
                cursor: "pointer",
              }}>
                Отмена
              </button>
              <button
                onClick={steal}
                disabled={loading || !pickedPlayerId || !pickedItemId}
                className="btn-dark"
                style={{
                  borderColor: "var(--color-blood-bright)",
                  color: "var(--color-blood-bright)",
                  opacity: loading || !pickedPlayerId || !pickedItemId ? 0.5 : 1,
                }}
              >
                {loading ? <Loader2 size={12} className="spin" style={{ marginRight: "0.4rem" }} /> : null}
                Красть
              </button>
            </div>

            <style>{`
              .spin { animation: spin 1s linear infinite; }
              @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
          </div>
        </div>
      )}
    </div>
  );
}
