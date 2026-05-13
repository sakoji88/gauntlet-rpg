"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";

interface UseItemButtonProps {
  inventoryItemId: string;
  isPassive: boolean;
  hint?: string; // напр. "Эффект работает пассивно"
  color: string;
}

export default function UseItemButton({
  inventoryItemId,
  isPassive,
  hint,
  color,
}: UseItemButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (isPassive) {
    return (
      <div
        style={{
          width: "100%",
          padding: "0.5rem",
          background: `${color}15`,
          color,
          border: `1px solid ${color}55`,
          fontSize: "0.75rem",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          fontFamily: "var(--font-cinzel)",
          textAlign: "center",
        }}
      >
        🜂 {hint ?? "Работает пассивно"}
      </div>
    );
  }

  async function handleUse() {
    if (!confirm("Использовать предмет?")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/player/inventory/use", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inventoryItemId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Ошибка");
        setLoading(false);
        return;
      }
      alert(data.message ?? "Применено");
      router.refresh();
      setLoading(false);
    } catch (e) {
      console.error(e);
      alert("Ошибка соединения");
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleUse}
      disabled={loading}
      style={{
        width: "100%",
        padding: "0.5rem",
        background: "transparent",
        color,
        border: `1px solid ${color}`,
        fontSize: "0.75rem",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        fontFamily: "var(--font-cinzel)",
        cursor: loading ? "wait" : "pointer",
        opacity: loading ? 0.6 : 1,
        transition: "all 0.2s",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.4rem",
      }}
    >
      {loading ? (
        <>
          <Loader2 size={12} className="spin" />
          Применяю
        </>
      ) : (
        <>
          <Sparkles size={12} />
          Использовать
        </>
      )}
      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </button>
  );
}
