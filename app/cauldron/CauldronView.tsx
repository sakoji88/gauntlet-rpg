"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FlaskRound, Loader2, Coins } from "lucide-react";
import { RARITY_COLORS, RARITY_NAMES, ItemRarity } from "@/lib/items";
import { CAULDRON_PRICE } from "@/lib/cauldron";
import BackLink from "@/app/components/BackLink";
import { playSfx } from "@/lib/sound";

interface Brewed {
  id: string;
  name: string;
  description: string;
  rarity: string;
}

export default function CauldronView({ gold }: { gold: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Brewed | null>(null);

  async function brew() {
    if (busy) return;
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/player/craft", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Ошибка");
        return;
      }
      playSfx("wheel");
      setResult(data.item);
      router.refresh();
    } catch {
      alert("Котёл забулькал и потух");
    } finally {
      setBusy(false);
    }
  }

  const canAfford = gold >= CAULDRON_PRICE;

  return (
    <main
      style={{
        position: "relative",
        zIndex: 2,
        minHeight: "100vh",
        padding: "2rem",
        maxWidth: "640px",
        margin: "0 auto",
      }}
    >
      <BackLink fallback="/region/kukhnya" />

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
        <FlaskRound size={28} color="#8fb87a" className="flicker" />
        <h1 style={{ fontSize: "2rem", color: "#8fb87a", margin: 0 }}>Котёл Гнилостня</h1>
      </div>
      <p style={{ color: "var(--color-text-dim)", fontStyle: "italic", marginBottom: "1.5rem" }}>
        «¡Vamos! Кинь Злато в котёл — выловишь, что сварится. Рецепт? Какой ещё рецепт!»
      </p>

      <div
        style={{
          padding: "1.5rem",
          background: "var(--color-bg-secondary)",
          border: "1px solid var(--color-border)",
          marginBottom: "1.5rem",
          textAlign: "center",
        }}
      >
        <div style={{ color: "var(--color-text-dim)", marginBottom: "1rem" }}>
          Злата в кошеле:{" "}
          <span style={{ color: "var(--color-gold)", fontWeight: 700 }}>{gold}</span>
        </div>

        <button
          onClick={brew}
          disabled={busy || !canAfford}
          style={{
            padding: "0.85rem 1.75rem",
            background: "transparent",
            border: `1px solid ${canAfford ? "#8fb87a" : "var(--color-border)"}`,
            color: canAfford ? "#8fb87a" : "var(--color-text-dim)",
            cursor: busy || !canAfford ? "not-allowed" : "pointer",
            opacity: busy ? 0.6 : 1,
            fontFamily: "var(--font-cinzel)",
            fontSize: "0.95rem",
            letterSpacing: "0.05em",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          {busy ? (
            <Loader2 size={16} className="spin" />
          ) : (
            <Coins size={16} />
          )}
          Сварить · {CAULDRON_PRICE} Злата
        </button>

        {!canAfford && (
          <div style={{ color: "var(--color-blood-bright)", fontSize: "0.8rem", marginTop: "0.75rem" }}>
            Не хватает Злата.
          </div>
        )}
      </div>

      {result && (
        <div
          style={{
            padding: "1.25rem",
            background: "var(--color-bg-secondary)",
            border: `1px solid ${RARITY_COLORS[result.rarity as ItemRarity].border}`,
            boxShadow: `0 0 24px ${RARITY_COLORS[result.rarity as ItemRarity].glow}`,
          }}
        >
          <div style={{ fontSize: "0.72rem", color: "var(--color-text-dim)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.35rem" }}>
            Из котла выловлено
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
            <span style={{ color: RARITY_COLORS[result.rarity as ItemRarity].text, fontWeight: 700, fontSize: "1.1rem" }}>
              {result.name}
            </span>
            <span style={{ fontSize: "0.62rem", color: RARITY_COLORS[result.rarity as ItemRarity].text, opacity: 0.7, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              {RARITY_NAMES[result.rarity as ItemRarity]}
            </span>
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text)", margin: "0.4rem 0 0", lineHeight: 1.5 }}>
            {result.description}
          </p>
        </div>
      )}
    </main>
  );
}
