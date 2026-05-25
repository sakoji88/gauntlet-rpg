"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Database, Loader2 } from "lucide-react";

// Кнопка «Применить схему» — выполняет идемпотентные ALTER TABLE
// (ADD COLUMN IF NOT EXISTS) для новых полей схемы. Используется когда
// в коде уже есть новые поля, а БД ещё не догнала (вместо `prisma db push`).
export default function ApplySchemaButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function run() {
    if (
      !confirm(
        "Применить SQL-патчи схемы к БД?\n\n" +
          "Это идемпотентно — добавляет недостающие колонки и игнорирует уже существующие. " +
          "Безопасно жать многократно.",
      )
    )
      return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/apply-schema-patches", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Ошибка");
        return;
      }
      const lines = (data.results ?? []).map(
        (r: any) =>
          `${r.ok ? "✓" : "✗"} ${r.description}${r.error ? `\n    error: ${r.error}` : ""}`,
      );
      alert(
        `Применено: ${data.applied}/${data.total}.\n\n${lines.join("\n")}`,
      );
      router.refresh();
    } catch (e) {
      console.error(e);
      alert("Ошибка соединения");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={run}
      disabled={busy}
      title="Выполнить ALTER TABLE ADD COLUMN IF NOT EXISTS для новых полей схемы (заменяет prisma db push)"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.4rem",
        padding: "0.4rem 0.75rem",
        background: "transparent",
        border: "1px solid #7a4ab0",
        color: "#b88be3",
        fontSize: "0.78rem",
        fontFamily: "var(--font-cinzel)",
        letterSpacing: "0.05em",
        cursor: busy ? "wait" : "pointer",
        opacity: busy ? 0.6 : 1,
      }}
    >
      {busy ? <Loader2 size={13} className="spin" /> : <Database size={13} />}
      Применить схему
      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </button>
  );
}
