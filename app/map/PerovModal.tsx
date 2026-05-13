"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Skull, Sparkles } from "lucide-react";

export interface PerovTrialData {
  questId: string;
  title: string;
  description: string;
  flavor: string;
  rewardPoints: number;
  rewardItemId: string | null;
}

export default function PerovModal({ trial }: { trial: PerovTrialData }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"accept" | "decline" | null>(null);

  async function call(action: "accept" | "decline") {
    if (action === "decline") {
      if (!confirm("Отказаться от испытания Перова? Цена: −3 поинта + дебафф удачи на 3 дня.")) {
        return;
      }
    }
    setLoading(action);
    try {
      const res = await fetch(`/api/player/perov/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questId: trial.questId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Ошибка");
        setLoading(null);
        return;
      }
      if (action === "decline") {
        alert(data.message ?? "Отказ принят");
      }
      router.refresh();
      setLoading(null);
    } catch (e) {
      console.error(e);
      alert("Ошибка соединения");
      setLoading(null);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background:
          "radial-gradient(ellipse at center, rgba(76,90,140,0.35) 0%, rgba(0,0,0,0.96) 70%)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        animation: "perovFadeIn 0.6s ease",
      }}
    >
      <div
        style={{
          background: "linear-gradient(to bottom, #15161e 0%, #0a0a14 100%)",
          border: "2px solid #6b7ec4",
          boxShadow: "0 0 80px rgba(107, 126, 196, 0.5), inset 0 0 40px rgba(107, 126, 196, 0.15)",
          maxWidth: "640px",
          width: "100%",
          padding: "2rem",
          position: "relative",
        }}
      >
        {/* Призрачный декор */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: -2,
            border: "1px solid rgba(107, 126, 196, 0.3)",
            pointerEvents: "none",
            animation: "perovGhostPulse 3s ease-in-out infinite",
          }}
        />

        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <Skull
            size={48}
            color="#8ba0e3"
            style={{
              marginBottom: "1rem",
              filter: "drop-shadow(0 0 12px rgba(139, 160, 227, 0.7))",
              animation: "perovGhostPulse 2.5s ease-in-out infinite",
            }}
          />
          <div
            style={{
              fontSize: "0.75rem",
              color: "#8ba0e3",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              marginBottom: "0.5rem",
              opacity: 0.7,
            }}
          >
            из Бездны явился
          </div>
          <h2
            style={{
              fontSize: "1.5rem",
              color: "#b3c0e8",
              margin: 0,
              fontFamily: "var(--font-cinzel)",
              letterSpacing: "0.15em",
              textShadow: "0 0 16px rgba(139, 160, 227, 0.6)",
            }}
          >
            Дух Гомодрила Перова
          </h2>
        </div>

        <div
          style={{
            padding: "1rem",
            background: "rgba(107, 126, 196, 0.08)",
            border: "1px solid rgba(107, 126, 196, 0.3)",
            marginBottom: "1rem",
            color: "#c4d0ea",
            fontStyle: "italic",
            fontSize: "0.95rem",
            lineHeight: 1.6,
            textAlign: "center",
          }}
        >
          «{trial.flavor}»
        </div>

        <h3
          style={{
            fontSize: "1.2rem",
            color: "#b3c0e8",
            marginBottom: "0.5rem",
            fontFamily: "var(--font-cinzel)",
            letterSpacing: "0.08em",
            textAlign: "center",
          }}
        >
          ✦ {trial.title} ✦
        </h3>

        <p
          style={{
            fontSize: "0.95rem",
            color: "var(--color-text-bright)",
            lineHeight: 1.6,
            marginBottom: "1.25rem",
            textAlign: "center",
          }}
        >
          {trial.description}
        </p>

        <div
          style={{
            padding: "0.75rem",
            background: "rgba(212, 165, 116, 0.08)",
            border: "1px solid var(--color-gold-dim)",
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            color: "var(--color-gold)",
            fontSize: "0.9rem",
          }}
        >
          <Sparkles size={14} />
          Награда: +{trial.rewardPoints} поинтов, +50 EXP
          {trial.rewardItemId === "perov_vessel" ? " · Сосуд Перова (легендарный)" : ""}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
          <button
            onClick={() => call("decline")}
            disabled={loading !== null}
            style={{
              padding: "0.8rem",
              background: "transparent",
              border: "1px solid var(--color-blood-bright)",
              color: "var(--color-blood-bright)",
              fontFamily: "var(--font-cinzel)",
              letterSpacing: "0.1em",
              fontSize: "0.85rem",
              textTransform: "uppercase",
              cursor: loading ? "wait" : "pointer",
              opacity: loading ? 0.5 : 1,
            }}
          >
            {loading === "decline" ? (
              <>
                <Loader2 size={14} className="spin" style={{ marginRight: "0.4rem" }} />
                Отказ...
              </>
            ) : (
              "Отказаться (−3 + дебафф)"
            )}
          </button>
          <button
            onClick={() => call("accept")}
            disabled={loading !== null}
            style={{
              padding: "0.8rem",
              background: "rgba(107, 126, 196, 0.2)",
              border: "1px solid #8ba0e3",
              color: "#b3c0e8",
              fontFamily: "var(--font-cinzel)",
              letterSpacing: "0.1em",
              fontSize: "0.85rem",
              textTransform: "uppercase",
              cursor: loading ? "wait" : "pointer",
              boxShadow: "0 0 16px rgba(107, 126, 196, 0.4)",
              opacity: loading ? 0.5 : 1,
            }}
          >
            {loading === "accept" ? (
              <>
                <Loader2 size={14} className="spin" style={{ marginRight: "0.4rem" }} />
                Принимаю...
              </>
            ) : (
              "Принять испытание"
            )}
          </button>
        </div>

        <style>{`
          .spin { animation: spin 1s linear infinite; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          @keyframes perovFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes perovGhostPulse {
            0%, 100% { box-shadow: 0 0 24px rgba(107, 126, 196, 0.3); }
            50% { box-shadow: 0 0 48px rgba(107, 126, 196, 0.7); }
          }
        `}</style>
      </div>
    </div>
  );
}
