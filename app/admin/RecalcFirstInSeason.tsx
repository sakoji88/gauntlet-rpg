"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Loader2 } from "lucide-react";

// Полный перерасчёт поинтов всех завершённых игр текущего сезона
// по новой формуле (sqrt(hours)×3 + множители + cap 50/75).
// Endpoint оставлен под старым именем для обратной совместимости.
//
// Flow: dry-run → confirm с разбором по игрокам → apply.
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
      const playerDeltas: Array<{ nickname: string; delta: number; games: number }> =
        dryData.playerDeltas ?? [];

      if (playerDeltas.length === 0) {
        alert(
          `Перерасчёт: все ${dryData.totalGames} игр уже корректны по новой формуле.`,
        );
        return;
      }

      const lines = playerDeltas
        .sort((a, b) => b.delta - a.delta) // сверху те кто плюсанёт, снизу кто минусанёт
        .map(
          (d) =>
            `  ${d.nickname}: ${d.delta > 0 ? "+" : ""}${d.delta} (${d.games} ${d.games === 1 ? "игра" : "игр"})`,
        )
        .join("\n");

      const ok = confirm(
        `ПОЛНЫЙ ПЕРЕРАСЧЁТ ПОИНТОВ СЕЗОНА\n\n` +
          `Игр в сезоне: ${dryData.totalGames}\n` +
          `Изменится поинтов: ${dryData.affectedGames}\n` +
          `Игроков затронуто: ${playerDeltas.length}\n\n` +
          `Дельты по игрокам:\n${lines}\n\n` +
          `Также обновится game.pointsEarned у каждой изменённой игры.\n\n` +
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
      alert(
        `Готово.\n` +
          `Обновлено игр: ${applyData.appliedToGames}\n` +
          `Затронуто игроков: ${applyData.appliedToPlayers}`,
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
      title="Полный пересчёт поинтов всех завершённых игр сезона по новой формуле"
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
      Перерасчёт поинтов сезона
      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </button>
  );
}
