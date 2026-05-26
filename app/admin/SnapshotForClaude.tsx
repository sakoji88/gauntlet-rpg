"use client";

import { useState } from "react";
import { Brain, Copy, Check, X, Loader2 } from "lucide-react";

// Кнопка «Сводка для Клода» — собирает текущее состояние игры в большой
// markdown-блок и показывает в модалке, откуда удобно скопировать и
// вставить Claude в чат для анализа баланса.
export default function SnapshotForClaude() {
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [markdown, setMarkdown] = useState<string>("");
  const [copied, setCopied] = useState(false);

  async function run() {
    setBusy(true);
    setMarkdown("");
    setCopied(false);
    try {
      const res = await fetch("/api/admin/snapshot");
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Ошибка");
        return;
      }
      setMarkdown(data.markdown ?? "");
      setOpen(true);
    } catch (e) {
      console.error(e);
      alert("Ошибка соединения");
    } finally {
      setBusy(false);
    }
  }

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback — выделение текста
      const ta = document.getElementById("snapshot-textarea") as HTMLTextAreaElement | null;
      if (ta) {
        ta.select();
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  }

  return (
    <>
      <button
        onClick={run}
        disabled={busy}
        title="Собрать сводку состояния игры в markdown и открыть для копирования"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.4rem",
          padding: "0.4rem 0.75rem",
          background: "transparent",
          border: "1px solid #4a6ba8",
          color: "#8baee3",
          fontSize: "0.78rem",
          fontFamily: "var(--font-cinzel)",
          letterSpacing: "0.05em",
          cursor: busy ? "wait" : "pointer",
          opacity: busy ? 0.6 : 1,
        }}
      >
        {busy ? <Loader2 size={13} className="spin" /> : <Brain size={13} />}
        Сводка для Клода
        <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </button>

      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.92)",
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
          }}
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--color-bg-secondary)",
              border: "2px solid #4a6ba8",
              boxShadow: "0 0 40px rgba(74,107,168,0.3)",
              maxWidth: "1000px",
              width: "100%",
              maxHeight: "90vh",
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2
                style={{
                  fontSize: "1.2rem",
                  color: "#8baee3",
                  margin: 0,
                  fontFamily: "var(--font-cinzel)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <Brain size={18} />
                Сводка состояния для Клода
              </h2>
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--color-text-dim)",
                  cursor: "pointer",
                  padding: 0,
                }}
                aria-label="Закрыть"
              >
                <X size={20} />
              </button>
            </div>

            <p
              style={{
                fontSize: "0.85rem",
                color: "var(--color-text-dim)",
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              Скопируй markdown ниже и вставь в чат с Клодом. Можно дописать
              свои наблюдения сверху — он учтёт и то и то.
            </p>

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={copyToClipboard}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.5rem 1rem",
                  background: "transparent",
                  border: `1px solid ${copied ? "var(--color-gold)" : "#4a6ba8"}`,
                  color: copied ? "var(--color-gold)" : "#8baee3",
                  fontSize: "0.85rem",
                  fontFamily: "var(--font-cinzel)",
                  cursor: "pointer",
                }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Скопировано" : "Скопировать в буфер"}
              </button>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "var(--color-text-dim)",
                  alignSelf: "center",
                }}
              >
                {markdown.length} символов
              </div>
            </div>

            <textarea
              id="snapshot-textarea"
              readOnly
              value={markdown}
              style={{
                flex: 1,
                width: "100%",
                minHeight: "400px",
                background: "var(--color-bg)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text)",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: "0.78rem",
                lineHeight: 1.5,
                padding: "0.75rem",
                resize: "vertical",
                outline: "none",
              }}
              onClick={(e) => (e.target as HTMLTextAreaElement).select()}
            />
          </div>
        </div>
      )}
    </>
  );
}
