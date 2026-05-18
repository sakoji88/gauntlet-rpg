"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Coins, Trophy, Loader2, ShoppingBag, Tag } from "lucide-react";
import { RARITY_COLORS, RARITY_NAMES, CATEGORY_NAMES, ItemRarity, ItemCategory } from "@/lib/items";
import BackLink from "@/app/components/BackLink";

interface BuyItem {
  itemId: string;
  name: string;
  description: string;
  rarity: string;
  category: string;
  currency: "gold" | "points";
  price: number;
  stockLeft: number | null;
}

interface SellItem {
  inventoryItemId: string;
  itemId: string;
  name: string;
  rarity: string;
  sellPrice: number;
}

interface ShopViewProps {
  gold: number;
  points: number;
  buyList: BuyItem[];
  sellList: SellItem[];
}

export default function ShopView({ gold, points, buyList, sellList }: ShopViewProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function buy(itemId: string) {
    if (busy) return;
    setBusy(itemId);
    try {
      const res = await fetch("/api/player/shop/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Ошибка");
        return;
      }
      router.refresh();
    } catch {
      alert("Не удалось купить");
    } finally {
      setBusy(null);
    }
  }

  async function sell(inventoryItemId: string) {
    if (busy) return;
    if (!confirm("Продать предмет Романалу? Назад не выкупить за ту же цену.")) return;
    setBusy(inventoryItemId);
    try {
      const res = await fetch("/api/player/shop/sell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inventoryItemId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Ошибка");
        return;
      }
      router.refresh();
    } catch {
      alert("Не удалось продать");
    } finally {
      setBusy(null);
    }
  }

  return (
    <main
      style={{
        position: "relative",
        zIndex: 2,
        minHeight: "100vh",
        padding: "2rem",
        maxWidth: "1000px",
        margin: "0 auto",
      }}
    >
      <BackLink fallback="/region/bazar" />

      {/* Шапка */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          flexWrap: "wrap",
          marginBottom: "2rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <ShoppingBag size={32} color="var(--color-gold)" className="flicker" />
          <div>
            <h1 style={{ fontSize: "2rem", color: "var(--color-gold)", margin: 0 }}>
              Лавка Романала
            </h1>
            <p
              style={{
                color: "var(--color-text-dim)",
                fontStyle: "italic",
                fontSize: "0.95rem",
                marginTop: "0.25rem",
              }}
            >
              «Даром — только сглаз, дорогой. Остальное — за Злато.»
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Wallet icon={<Coins size={16} />} label="Злато" value={gold} color="var(--color-gold)" />
          <Wallet icon={<Trophy size={16} />} label="Поинты" value={points} color="var(--color-text-bright)" />
        </div>
      </div>

      {/* ПОКУПКА */}
      <SectionTitle text="Витрина" />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
          gap: "1rem",
          marginBottom: "2.5rem",
        }}
      >
        {buyList.map((it) => {
          const colors = RARITY_COLORS[it.rarity as ItemRarity];
          const soldOut = it.stockLeft !== null && it.stockLeft <= 0;
          const canAfford = it.currency === "gold" ? gold >= it.price : points >= it.price;
          const disabled = soldOut || !canAfford || busy !== null;
          return (
            <div
              key={it.itemId}
              style={{
                padding: "1.1rem 1.25rem",
                background: "var(--color-bg-secondary)",
                border: `1px solid ${colors.border}`,
                display: "flex",
                flexDirection: "column",
                gap: "0.4rem",
                opacity: soldOut ? 0.5 : 1,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
                <h3 style={{ fontSize: "1.05rem", color: colors.text, margin: 0, lineHeight: 1.2 }}>
                  {it.name}
                </h3>
                <span
                  style={{
                    fontSize: "0.62rem",
                    color: colors.text,
                    opacity: 0.7,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                  }}
                >
                  {RARITY_NAMES[it.rarity as ItemRarity]}
                </span>
              </div>
              <div
                style={{
                  fontSize: "0.68rem",
                  color: "var(--color-text-dim)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                {CATEGORY_NAMES[it.category as ItemCategory]}
                {it.stockLeft !== null && ` · осталось ${it.stockLeft}`}
              </div>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "var(--color-text)",
                  lineHeight: 1.5,
                  margin: "0.15rem 0 0.5rem",
                }}
              >
                {it.description}
              </p>
              <button
                onClick={() => buy(it.itemId)}
                disabled={disabled}
                style={{
                  marginTop: "auto",
                  padding: "0.55rem",
                  background: "transparent",
                  border: `1px solid ${it.currency === "gold" ? "var(--color-gold)" : "var(--color-blood-bright)"}`,
                  color: it.currency === "gold" ? "var(--color-gold)" : "var(--color-blood-bright)",
                  cursor: disabled ? "not-allowed" : "pointer",
                  opacity: disabled ? 0.45 : 1,
                  fontFamily: "var(--font-cinzel)",
                  letterSpacing: "0.05em",
                  fontSize: "0.82rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.4rem",
                }}
              >
                {busy === it.itemId ? (
                  <Loader2 size={14} className="spin" />
                ) : soldOut ? (
                  "Раскуплено"
                ) : (
                  <>
                    {it.currency === "gold" ? <Coins size={14} /> : <Trophy size={14} />}
                    {it.price} {it.currency === "gold" ? "Злата" : "поинтов"}
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* ПРОДАЖА */}
      <SectionTitle text="Скупка (Романал даёт Злато)" />
      {sellList.length === 0 ? (
        <p style={{ color: "var(--color-text-dim)", fontStyle: "italic" }}>
          Романалу нечего у тебя выкупить. Носи что подороже.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {sellList.map((it) => {
            const colors = RARITY_COLORS[it.rarity as ItemRarity];
            return (
              <div
                key={it.inventoryItemId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  padding: "0.7rem 1rem",
                  background: "var(--color-bg-secondary)",
                  border: `1px solid ${colors.border}`,
                }}
              >
                <Tag size={16} color={colors.text} />
                <span style={{ color: colors.text, flex: 1 }}>{it.name}</span>
                <button
                  onClick={() => sell(it.inventoryItemId)}
                  disabled={busy !== null}
                  style={{
                    padding: "0.4rem 0.9rem",
                    background: "transparent",
                    border: "1px solid var(--color-gold)",
                    color: "var(--color-gold)",
                    cursor: busy !== null ? "not-allowed" : "pointer",
                    opacity: busy !== null ? 0.5 : 1,
                    fontFamily: "var(--font-cinzel)",
                    fontSize: "0.78rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                  }}
                >
                  {busy === it.inventoryItemId ? (
                    <Loader2 size={13} className="spin" />
                  ) : (
                    <>
                      <Coins size={13} />+{it.sellPrice}
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

function Wallet({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.5rem 0.9rem",
        background: "var(--color-bg-secondary)",
        border: "1px solid var(--color-border)",
      }}
    >
      <span style={{ color }}>{icon}</span>
      <div style={{ lineHeight: 1.1 }}>
        <div style={{ fontSize: "1.1rem", color, fontWeight: 700 }}>{value}</div>
        <div
          style={{
            fontSize: "0.6rem",
            color: "var(--color-text-dim)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ text }: { text: string }) {
  return (
    <h2
      style={{
        fontSize: "1.1rem",
        color: "var(--color-gold)",
        letterSpacing: "0.1em",
        marginBottom: "1rem",
        textTransform: "uppercase",
      }}
    >
      {text}
    </h2>
  );
}
