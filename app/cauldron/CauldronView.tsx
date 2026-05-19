"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FlaskRound, Loader2 } from "lucide-react";
import { RARITY_COLORS, RARITY_NAMES, ItemRarity } from "@/lib/items";
import { MIN_INGREDIENTS, MAX_INGREDIENTS } from "@/lib/cauldron";
import BackLink from "@/app/components/BackLink";
import { playSfx } from "@/lib/sound";

interface CraftItem {
  inventoryItemId: string;
  name: string;
  rarity: string;
}

interface BrewResult {
  outcome: "success" | "ok" | "fail";
  item: { id: string; name: string; description: string; rarity: string } | null;
  message: string;
}

export default function CauldronView({
  items,
  luck,
}: {
  items: CraftItem[];
  luck: number;
}) {
  const router = useRouter();
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<BrewResult | null>(null);

  function toggle(id: string) {
    setResult(null);
    setPicked((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_INGREDIENTS) return prev;
      return [...prev, id];
    });
  }

  async function brew() {
    if (busy || picked.length < MIN_INGREDIENTS) return;
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/player/craft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inventoryItemIds: picked }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Ошибка");
        return;
      }
      playSfx(data.outcome === "fail" ? "fail" : "wheel");
      setResult(data);
      setPicked([]);
      router.refresh();
    } catch {
      alert("Котёл потух");
    } finally {
      setBusy(false);
    }
  }

  // примерные шансы для подсказки
  const fail = Math.max(8, Math.round(32 - luck));
  const success = Math.min(58, Math.round(18 + luck * 1.4));
  const ok = Math.max(0, 100 - fail - success);

  return (
    <main
      style={{
        position: "relative",
        zIndex: 2,
        minHeight: "100vh",
        padding: "2rem",
        maxWidth: "760px",
        margin: "0 auto",
      }}
    >
      <BackLink fallback="/region/kukhnya" />

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
        <FlaskRound size={28} color="#8fb87a" className="flicker" />
        <h1 style={{ fontSize: "2rem", color: "#8fb87a", margin: 0 }}>Котёл Гнилостня</h1>
      </div>
      <p style={{ color: "var(--color-text-dim)", fontStyle: "italic", marginBottom: "1.25rem" }}>
        «¡Vamos! Кинь {MIN_INGREDIENTS}–{MAX_INGREDIENTS} предмета в котёл — сварю что выйдет.
        Может, дам лучше. Может, всё сгорит. Это кухня, amigo.»
      </p>

      {/* Шансы */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "1.25rem",
          flexWrap: "wrap",
          fontSize: "0.8rem",
        }}
      >
        <Chance label="Удача (ранг выше)" value={success} color="#8fb87a" />
        <Chance label="Норма (тот же ранг)" value={ok} color="var(--color-gold)" />
        <Chance label="Провал (сгорит)" value={fail} color="var(--color-blood-bright)" />
        <span style={{ color: "var(--color-text-dim)", alignSelf: "center" }}>
          · твоя Удача: {luck}
        </span>
      </div>

      {items.length === 0 ? (
        <p style={{ color: "var(--color-text-dim)", fontStyle: "italic" }}>
          Нечего варить — в инвентаре нет подходящих предметов.
        </p>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "0.5rem",
              marginBottom: "1.25rem",
            }}
          >
            {items.map((it) => {
              const colors = RARITY_COLORS[it.rarity as ItemRarity];
              const sel = picked.includes(it.inventoryItemId);
              return (
                <button
                  key={it.inventoryItemId}
                  onClick={() => toggle(it.inventoryItemId)}
                  style={{
                    textAlign: "left",
                    padding: "0.6rem 0.75rem",
                    background: sel ? "rgba(143,184,122,0.15)" : "var(--color-bg-secondary)",
                    border: `1px solid ${sel ? "#8fb87a" : colors.border}`,
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.15rem",
                  }}
                >
                  <span style={{ color: colors.text, fontSize: "0.9rem" }}>{it.name}</span>
                  <span
                    style={{
                      fontSize: "0.6rem",
                      color: colors.text,
                      opacity: 0.7,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                    }}
                  >
                    {RARITY_NAMES[it.rarity as ItemRarity]}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={brew}
            disabled={busy || picked.length < MIN_INGREDIENTS}
            style={{
              padding: "0.85rem 1.75rem",
              background: "transparent",
              border: `1px solid ${picked.length >= MIN_INGREDIENTS ? "#8fb87a" : "var(--color-border)"}`,
              color: picked.length >= MIN_INGREDIENTS ? "#8fb87a" : "var(--color-text-dim)",
              cursor: busy || picked.length < MIN_INGREDIENTS ? "not-allowed" : "pointer",
              opacity: busy ? 0.6 : 1,
              fontFamily: "var(--font-cinzel)",
              fontSize: "0.95rem",
              letterSpacing: "0.05em",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            {busy ? <Loader2 size={16} className="spin" /> : <FlaskRound size={16} />}
            Сварить ({picked.length}/{MAX_INGREDIENTS})
          </button>
        </>
      )}

      {result && (
        <div
          style={{
            marginTop: "1.5rem",
            padding: "1.25rem",
            background: "var(--color-bg-secondary)",
            border: `1px solid ${
              result.outcome === "fail"
                ? "var(--color-blood-bright)"
                : result.item
                  ? RARITY_COLORS[result.item.rarity as ItemRarity].border
                  : "var(--color-border)"
            }`,
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-cinzel)",
              fontSize: "0.85rem",
              color:
                result.outcome === "success"
                  ? "#8fb87a"
                  : result.outcome === "fail"
                    ? "var(--color-blood-bright)"
                    : "var(--color-gold)",
              marginBottom: result.item ? "0.5rem" : 0,
            }}
          >
            {result.message}
          </div>
          {result.item && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
                <span
                  style={{
                    color: RARITY_COLORS[result.item.rarity as ItemRarity].text,
                    fontWeight: 700,
                    fontSize: "1.05rem",
                  }}
                >
                  {result.item.name}
                </span>
                <span
                  style={{
                    fontSize: "0.6rem",
                    color: RARITY_COLORS[result.item.rarity as ItemRarity].text,
                    opacity: 0.7,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  {RARITY_NAMES[result.item.rarity as ItemRarity]}
                </span>
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--color-text)", margin: "0.35rem 0 0" }}>
                {result.item.description}
              </p>
            </>
          )}
        </div>
      )}
    </main>
  );
}

function Chance({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <span
      style={{
        padding: "0.3rem 0.6rem",
        background: "var(--color-bg-secondary)",
        border: `1px solid ${color}`,
        color,
      }}
    >
      {label}: {value}%
    </span>
  );
}
