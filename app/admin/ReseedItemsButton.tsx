"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Package, Loader2 } from "lucide-react";

// Кнопка «Пересеять предметы» — заливает каталог из lib/items.ts в БД.
// Используется после правок названий/описаний/эффектов предметов.
// Безопасно жать многократно — это upsert по id.
export default function ReseedItemsButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function run() {
    if (!confirm("Залить актуальный каталог предметов в БД? Безопасно — это upsert по id.")) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/reseed-items", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Ошибка");
        return;
      }
      const errs = data.errors ?? [];
      alert(
        `Готово: обновлено ${data.upserted} из ${data.total} предметов.` +
          (errs.length > 0
            ? `\n\nОшибки:\n${errs.slice(0, 5).map((e: any) => `  ${e.id}: ${e.error}`).join("\n")}`
            : ""),
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
      title="Перезалить каталог предметов из lib/items.ts в БД (upsert по id, безопасно)"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.4rem",
        padding: "0.4rem 0.75rem",
        background: "transparent",
        border: "1px solid var(--color-gold-dim)",
        color: "var(--color-gold)",
        fontSize: "0.78rem",
        fontFamily: "var(--font-cinzel)",
        letterSpacing: "0.05em",
        cursor: busy ? "wait" : "pointer",
        opacity: busy ? 0.6 : 1,
      }}
    >
      {busy ? <Loader2 size={13} className="spin" /> : <Package size={13} />}
      Пересеять предметы
      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </button>
  );
}
