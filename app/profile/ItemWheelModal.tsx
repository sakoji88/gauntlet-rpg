"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, X } from "lucide-react";
import { RARITY_COLORS, RARITY_NAMES, CATEGORY_NAMES, ItemRarity, ItemCategory } from "@/lib/items";
import { getItemEmoji } from "@/lib/item-icons";

interface RolledItem {
  id: string;
  name: string;
  description: string;
  category: ItemCategory;
  rarity: ItemRarity;
  iconKey: string;
}

interface ItemWheelModalProps {
  gameId: string;
  onClose: () => void;
}

export default function ItemWheelModal({ gameId, onClose }: ItemWheelModalProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<"idle" | "spinning" | "result" | "choose">("idle");
  const [item, setItem] = useState<RolledItem | null>(null);
  const [choices, setChoices] = useState<RolledItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function spin() {
    setPhase("spinning");
    setError(null);
    try {
      const res = await fetch("/api/player/wheel/spin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Ошибка");
        setPhase("idle");
        return;
      }
      // Имитация крутки
      await new Promise((r) => setTimeout(r, 1800));
      if (data.mode === "choose") {
        setChoices(data.choices);
        setPhase("choose");
      } else {
        setItem(data.item);
        setPhase("result");
      }
    } catch (e) {
      console.error(e);
      setError("Ошибка соединения");
      setPhase("idle");
    }
  }

  async function chooseOne(itemId: string) {
    try {
      const res = await fetch("/api/player/wheel/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId, itemId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Ошибка");
        return;
      }
      setItem(data.item);
      setPhase("result");
    } catch (e) {
      console.error(e);
    }
  }

  function close() {
    router.refresh();
    onClose();
  }

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(0,0,0,0.92)", zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "1rem",
    }}>
      <div style={{
        background: "var(--color-bg-secondary)",
        border: "2px solid var(--color-gold-dim)",
        boxShadow: "0 0 60px rgba(212,165,116,0.3)",
        maxWidth: "560px", width: "100%",
        padding: "2rem",
        position: "relative",
      }}>
        <button onClick={close} style={{
          position: "absolute", top: "0.75rem", right: "0.75rem",
          background: "transparent", border: "none",
          color: "var(--color-text-dim)", cursor: "pointer",
        }} aria-label="Закрыть">
          <X size={20} />
        </button>

        {/* === IDLE === */}
        {phase === "idle" && (
          <div style={{ textAlign: "center" }}>
            <Sparkles size={48} color="var(--color-gold)" className="flicker" style={{ marginBottom: "1.5rem" }} />
            <h2 style={{ color: "var(--color-gold)", marginBottom: "1rem" }}>Колесо Предметов</h2>
            <p style={{ color: "var(--color-text)", marginBottom: "2rem", lineHeight: 1.6 }}>
              За прохождение игры тебе полагается дар Бездны.
              Крутни колесо — судьба решит.
            </p>
            {error && (
              <p style={{ color: "var(--color-blood-bright)", marginBottom: "1rem", fontSize: "0.9rem" }}>
                {error}
              </p>
            )}
            <button onClick={spin} className="btn-dark">
              Крутить колесо
            </button>
          </div>
        )}

        {/* === КРУТКА === */}
        {phase === "spinning" && (
          <div style={{ textAlign: "center", padding: "2rem 0" }}>
            <div style={{
              width: "120px", height: "120px",
              borderRadius: "50%",
              border: "4px solid var(--color-border)",
              borderTopColor: "var(--color-gold)",
              borderRightColor: "var(--color-gold)",
              margin: "0 auto 1.5rem",
              animation: "spin 0.6s linear infinite",
              boxShadow: "0 0 40px rgba(212,165,116,0.4)",
            }} />
            <p style={{
              color: "var(--color-text-dim)",
              fontStyle: "italic",
              letterSpacing: "0.1em",
            }}>
              Судьба плетёт нити...
            </p>
          </div>
        )}

        {/* === АЛХИМИК: выбор 1 из 3 === */}
        {phase === "choose" && (
          <div>
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ color: "var(--color-gold)", marginBottom: "0.5rem" }}>Острое Чутьё</h2>
              <p style={{ color: "var(--color-text-dim)", fontStyle: "italic", fontSize: "0.9rem" }}>
                Выпало три. Выбери один.
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {choices.map((c) => {
                const colors = RARITY_COLORS[c.rarity];
                return (
                  <button
                    key={c.id}
                    onClick={() => chooseOne(c.id)}
                    style={{
                      padding: "1rem",
                      background: "var(--color-bg)",
                      border: `1px solid ${colors.border}`,
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.2s",
                      fontFamily: "inherit",
                      color: "inherit",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = `0 0 16px ${colors.glow}`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <div style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "0.6rem",
                    }}>
                      <span
                        aria-hidden
                        style={{
                          fontSize: "2rem",
                          lineHeight: 1,
                          width: "44px",
                          textAlign: "center",
                          flexShrink: 0,
                        }}
                      >
                        {getItemEmoji(c.iconKey)}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "0.25rem",
                          gap: "0.5rem",
                        }}>
                          <span style={{ color: colors.text, fontWeight: 600 }}>{c.name}</span>
                          <span style={{
                            fontSize: "0.65rem",
                            color: colors.text,
                            opacity: 0.7,
                            letterSpacing: "0.15em",
                            textTransform: "uppercase",
                            whiteSpace: "nowrap",
                          }}>
                            {RARITY_NAMES[c.rarity]}
                          </span>
                        </div>
                        <p style={{
                          fontSize: "0.85rem",
                          color: "var(--color-text-dim)",
                          lineHeight: 1.5,
                          margin: 0,
                        }}>
                          {c.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* === РЕЗУЛЬТАТ === */}
        {phase === "result" && item && (
          <ResultView item={item} onClose={close} />
        )}

        <style>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          @keyframes glow {
            0%, 100% { box-shadow: 0 0 30px var(--glow-color); }
            50% { box-shadow: 0 0 60px var(--glow-color), 0 0 90px var(--glow-color); }
          }
        `}</style>
      </div>
    </div>
  );
}

function ResultView({ item, onClose }: { item: RolledItem; onClose: () => void }) {
  const colors = RARITY_COLORS[item.rarity];
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{
        display: "inline-block",
        padding: "2rem",
        background: "var(--color-bg)",
        border: `2px solid ${colors.border}`,
        marginBottom: "1.5rem",
        // @ts-ignore
        "--glow-color": colors.glow,
        animation: item.rarity === "LEGENDARY" ? "glow 2s ease-in-out infinite" : "none",
      }}>
        <div
          aria-hidden
          style={{
            fontSize: "5rem",
            lineHeight: 1,
            marginBottom: "0.75rem",
            filter: `drop-shadow(0 0 18px ${colors.glow})`,
          }}
        >
          {getItemEmoji(item.iconKey)}
        </div>
        <div style={{
          fontSize: "0.7rem",
          color: colors.text,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          marginBottom: "0.5rem",
        }}>
          {RARITY_NAMES[item.rarity]} · {CATEGORY_NAMES[item.category]}
        </div>
        <h2 style={{
          fontSize: "1.6rem",
          color: colors.text,
          marginBottom: "0.75rem",
        }}>
          {item.name}
        </h2>
        <p style={{
          color: "var(--color-text)",
          maxWidth: "380px",
          margin: "0 auto",
          lineHeight: 1.6,
          fontStyle: "italic",
        }}>
          {item.description}
        </p>
      </div>
      <button onClick={onClose} className="btn-dark">
        Принять в инвентарь
      </button>
    </div>
  );
}
