"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Loader2 } from "lucide-react";

// Кнопка перерасчёта бонуса «+2 первым прошёл» в текущем сезоне.
// 1) Делает dry-run, показывает список затронутых игр и дельты по игрокам.
// 2) Спрашивает подтверждение.
// 3) Применяет (POST с dryRun=false).
export default function RecalcFirstInSeason() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    try {
      // 1) dry-run
      const dry = await fetch("/api/admin/recalc-first-in-season", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun: true }),
      });
      const dryData = await dry.json();
      if (!dry.ok) {
        alert(dryData.error ?? "Ошибка при dry-run");
        return;
      }
      const adj: Array<{ playerNickname: string; delta: number }> =
        dryData.playerDeltas?.map((d: any) => {
          const a = dryData.adjustments.find((x: any) => x.playerId === d.playerId);
          return { playerNickname: a?.playerNickname ?? d.playerId, delta: d.delta };
        }) ?? [];

      if (adj.length === 0) {
        alert(
          `Перерасчёт: нечего править. Игр в сезоне: ${dryData.totalGames}. ` +
            `Дубликатов нет.`,
        );
        return;
      }

      const lines = adj
        .sort((a, b) => a.delta - b.delta)
        .map((d) => `  ${d.playerNickname}: ${d.delta}`)
        .join("\n");

      const ok = confirm(
        `Перерасчёт «первым прошёл» — затронуто игроков: ${adj.length}\n\n` +
          `Изменения:\n${lines}\n\n` +
          `Применить?`,
      );
      if (!ok) return;

      // 2) apply
      const apply = await fetch("/api/admin/recalc-first-in-season", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun: false }),
      });
      const applyData = await apply.json();
      if (!apply.ok) {
        alert(applyData.error ?? "Ошибка применения");
        return;
      }
      alert(`Готово. Перерасчёт применён к ${applyData.appliedTo} игрокам.`);
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
      title="Снять +2 «первым прошёл» с тех, кому он начислился по ошибке (дубликаты по нормализованному названию)"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.4rem",
        padding: "0.4rem 0.75rem",
        background: "transparent",
        border: "1px solid var(--color-blood-bright)",
        color: "var(--color-blood-bright)",
        fontSize: "0.78rem",
        fontFamily: "var(--font-cinzel)",
        letterSpacing: "0.05em",
        cursor: busy ? "wait" : "pointer",
        opacity: busy ? 0.6 : 1,
      }}
    >
      {busy ? <Loader2 size={13} className="spin" /> : <RotateCcw size={13} />}
      Перерасчёт «первым прошёл»
      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </button>
  );
}
