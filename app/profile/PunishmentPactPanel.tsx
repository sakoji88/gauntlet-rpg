"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Skull, Loader2, Check } from "lucide-react";

interface PunishmentPactPanelProps {
  initialText: string | null;
}

const MAX_LEN = 400;

export default function PunishmentPactPanel({ initialText }: PunishmentPactPanelProps) {
  const router = useRouter();
  const [text, setText] = useState(initialText ?? "");
  const [saved, setSaved] = useState(initialText ?? "");
  const [loading, setLoading] = useState(false);

  const dirty = text.trim() !== (saved ?? "").trim();

  async function save() {
    if (loading || !dirty) return;
    setLoading(true);
    try {
      const res = await fetch("/api/player/punishment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Ошибка");
        setLoading(false);
        return;
      }
      setSaved(data.punishmentPact ?? "");
      router.refresh();
    } catch {
      alert("Не удалось сохранить");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        padding: "1.25rem 1.5rem",
        background: "var(--color-bg-secondary)",
        border: "1px solid var(--color-blood-bright)",
        marginBottom: "1.5rem",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
          marginBottom: "0.5rem",
        }}
      >
        <Skull size={18} color="var(--color-blood-bright)" />
        <span
          style={{
            fontFamily: "var(--font-cinzel)",
            color: "var(--color-blood-bright)",
            letterSpacing: "0.1em",
            fontSize: "0.95rem",
          }}
        >
          Личное Наказание
        </span>
      </div>
      <p
        style={{
          fontSize: "0.85rem",
          color: "var(--color-text-dim)",
          fontStyle: "italic",
          margin: "0 0 0.85rem",
          lineHeight: 1.5,
        }}
      >
        Если займёшь последнее место в сезоне — обязуешься это исполнить. Видно всем.
        Впиши до старта сезона. Должно быть проверяемо (видео/скрин) и не унизительно физически.
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, MAX_LEN))}
        rows={3}
        placeholder="Если я займу последнее место, я обязуюсь..."
        style={{
          width: "100%",
          resize: "vertical",
          padding: "0.6rem 0.75rem",
          background: "var(--color-bg-tertiary)",
          border: "1px solid var(--color-border)",
          color: "var(--color-text-bright)",
          fontFamily: "var(--font-cormorant)",
          fontSize: "0.95rem",
          lineHeight: 1.5,
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: "0.6rem",
          gap: "1rem",
        }}
      >
        <span style={{ fontSize: "0.72rem", color: "var(--color-text-dim)" }}>
          {text.length}/{MAX_LEN}
        </span>
        <button
          onClick={save}
          disabled={loading || !dirty}
          style={{
            padding: "0.45rem 1.1rem",
            background: "transparent",
            border: "1px solid var(--color-blood-bright)",
            color: "var(--color-blood-bright)",
            cursor: loading || !dirty ? "not-allowed" : "pointer",
            opacity: loading || !dirty ? 0.5 : 1,
            fontFamily: "var(--font-cinzel)",
            letterSpacing: "0.05em",
            fontSize: "0.8rem",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
        >
          {loading ? (
            <Loader2 size={14} className="spin" />
          ) : (
            <Check size={14} />
          )}
          {dirty ? "Сохранить" : "Сохранено"}
        </button>
      </div>
    </div>
  );
}
