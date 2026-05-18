"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Skull, Loader2 } from "lucide-react";

const MAX_LEN = 400;
const MIN_LEN = 8;

export default function PunishmentSetup() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function submit() {
    if (text.trim().length < MIN_LEN) {
      alert(`Впиши наказание — минимум ${MIN_LEN} символов.`);
      return;
    }
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
        setConfirming(false);
        return;
      }
      router.push("/profile");
      router.refresh();
    } catch {
      alert("Не удалось сохранить");
      setLoading(false);
      setConfirming(false);
    }
  }

  return (
    <main
      style={{
        position: "relative",
        zIndex: 2,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}
    >
      <div
        style={{
          maxWidth: "640px",
          width: "100%",
          background: "var(--color-bg-secondary)",
          border: "1px solid var(--color-blood-bright)",
          padding: "2rem",
          boxShadow: "0 0 40px rgba(139,36,36,0.25)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
          <Skull size={28} color="var(--color-blood-bright)" className="flicker" />
          <h1 style={{ fontSize: "1.8rem", color: "var(--color-blood-bright)", margin: 0 }}>
            Личное Наказание
          </h1>
        </div>

        <p style={{ color: "var(--color-text)", lineHeight: 1.6, marginBottom: "0.75rem" }}>
          Прежде чем войти в Темнодушное Лето, поклянись. Впиши, что ты обязуешься
          сделать, <b>если займёшь последнее место</b> в сезоне.
        </p>
        <p
          style={{
            color: "var(--color-text-dim)",
            fontStyle: "italic",
            fontSize: "0.9rem",
            lineHeight: 1.6,
            marginBottom: "1.25rem",
          }}
        >
          Это видят все. Должно быть проверяемо (видео/скрин) и не унизительно физически —
          это прикол, не пытка. ⚠️ Вписывается <b>один раз и навсегда</b> — изменить будет нельзя.
        </p>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_LEN))}
          rows={4}
          placeholder="Если я займу последнее место, я обязуюсь..."
          disabled={loading}
          style={{
            width: "100%",
            resize: "vertical",
            padding: "0.75rem",
            background: "var(--color-bg-tertiary)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-bright)",
            fontFamily: "var(--font-cormorant)",
            fontSize: "1rem",
            lineHeight: 1.5,
          }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "0.72rem",
            color: "var(--color-text-dim)",
            margin: "0.4rem 0 1.25rem",
          }}
        >
          <span>{text.length}/{MAX_LEN}</span>
        </div>

        {!confirming ? (
          <button
            onClick={() => {
              if (text.trim().length < MIN_LEN) {
                alert(`Впиши наказание — минимум ${MIN_LEN} символов.`);
                return;
              }
              setConfirming(true);
            }}
            className="btn-dark"
            style={{ width: "100%", borderColor: "var(--color-blood-bright)", color: "var(--color-blood-bright)" }}
          >
            Принести клятву
          </button>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            <p
              style={{
                textAlign: "center",
                color: "var(--color-text-dim)",
                fontStyle: "italic",
                fontSize: "0.85rem",
              }}
            >
              Уверен? Изменить наказание потом будет нельзя.
            </p>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={() => setConfirming(false)}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "0.7rem",
                  background: "transparent",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text-dim)",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontFamily: "var(--font-cinzel)",
                  fontSize: "0.8rem",
                }}
              >
                Передумать
              </button>
              <button
                onClick={submit}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "0.7rem",
                  background: "var(--color-blood)",
                  border: "1px solid var(--color-blood-bright)",
                  color: "var(--color-text-bright)",
                  cursor: loading ? "wait" : "pointer",
                  fontFamily: "var(--font-cinzel)",
                  fontSize: "0.8rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.4rem",
                }}
              >
                {loading ? <Loader2 size={14} className="spin" /> : null}
                Клянусь
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
