"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Shirt, Check } from "lucide-react";

// Кнопка надеть/снять косметику (рамка или титул).
export default function EquipButton({
  itemId,
  slot,
  isEquipped,
  color,
}: {
  itemId: string;
  slot: "frame" | "title";
  isEquipped: boolean;
  color: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/player/equip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot, itemId: isEquipped ? null : itemId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Ошибка");
        return;
      }
      router.refresh();
    } catch {
      alert("Не удалось");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      style={{
        width: "100%",
        padding: "0.5rem",
        background: isEquipped ? "rgba(212,165,116,0.12)" : "transparent",
        border: `1px solid ${color}`,
        color,
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.6 : 1,
        fontFamily: "var(--font-cinzel)",
        fontSize: "0.78rem",
        letterSpacing: "0.05em",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.4rem",
      }}
    >
      {loading ? (
        <Loader2 size={13} className="spin" />
      ) : isEquipped ? (
        <>
          <Check size={13} /> Надето — снять
        </>
      ) : (
        <>
          <Shirt size={13} /> Надеть
        </>
      )}
    </button>
  );
}
