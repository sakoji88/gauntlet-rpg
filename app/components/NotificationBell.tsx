"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Swords, Skull, Scroll } from "lucide-react";

interface NotifData {
  traps: { name: string; from: string | null }[];
  incomingDuels: number;
  offeredQuests: number;
}

export default function NotificationBell() {
  const router = useRouter();
  const [data, setData] = useState<NotifData | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const res = await fetch("/api/player/notifications", { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        if (alive) setData(json);
      } catch {
        // тихо
      }
    }
    load();
    // лёгкий поллинг раз в 60 сек
    const id = setInterval(load, 60000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  if (!data) return null;

  const total = data.traps.length + data.incomingDuels + data.offeredQuests;
  const hot = data.traps.length + data.incomingDuels; // «горячие» — требуют внимания

  return (
    <div style={{ position: "fixed", top: "1rem", right: "1rem", zIndex: 60 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Уведомления"
        style={{
          position: "relative",
          width: "42px",
          height: "42px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--color-bg-secondary)",
          border: `1px solid ${hot > 0 ? "var(--color-blood-bright)" : total > 0 ? "var(--color-gold)" : "var(--color-border)"}`,
          color: hot > 0 ? "var(--color-blood-bright)" : total > 0 ? "var(--color-gold)" : "var(--color-text-dim)",
          cursor: "pointer",
          boxShadow: hot > 0
            ? "0 0 16px rgba(139,36,36,0.6)"
            : total > 0
              ? "0 0 14px rgba(212,165,116,0.45)"
              : "none",
          animation: hot > 0 ? "questPulse 1.6s ease-in-out infinite" : "none",
        }}
      >
        <Bell size={18} />
        {total > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-4px",
              right: "-4px",
              minWidth: "18px",
              height: "18px",
              padding: "0 4px",
              borderRadius: "9px",
              background: hot > 0 ? "var(--color-blood-bright)" : "var(--color-gold)",
              color: "var(--color-bg)",
              fontSize: "0.65rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {total}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "52px",
            right: 0,
            width: "270px",
            background: "var(--color-bg-secondary)",
            border: "1px solid var(--color-border-bright)",
            boxShadow: "0 8px 30px rgba(0,0,0,0.7)",
            padding: "0.75rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-cinzel)",
              color: "var(--color-gold)",
              fontSize: "0.8rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: "0.25rem",
            }}
          >
            Вести
          </div>

          {total === 0 && (
            <div style={{ color: "var(--color-text-dim)", fontStyle: "italic", fontSize: "0.85rem" }}>
              Тихо. Пока никто тебя не трогает.
            </div>
          )}

          {data.incomingDuels > 0 && (
            <Row
              icon={<Swords size={15} color="var(--color-blood-bright)" />}
              text={`Вызовов на дуэль: ${data.incomingDuels}`}
              onClick={() => {
                setOpen(false);
                router.push("/duels");
              }}
            />
          )}

          {data.traps.map((t, i) => (
            <Row
              key={`trap-${i}`}
              icon={<Skull size={15} color="var(--color-blood-bright)" />}
              text={`Ловушка «${t.name}»${t.from ? ` — от ${t.from}` : ""}`}
            />
          ))}

          {data.offeredQuests > 0 && (
            <Row
              icon={<Scroll size={15} color="var(--color-gold)" />}
              text={`Предложено квестов: ${data.offeredQuests}`}
              onClick={() => {
                setOpen(false);
                router.push("/quests");
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

function Row({
  icon,
  text,
  onClick,
}: {
  icon: React.ReactNode;
  text: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.4rem 0.5rem",
        background: "var(--color-bg-tertiary)",
        border: "1px solid var(--color-border)",
        cursor: onClick ? "pointer" : "default",
        fontSize: "0.82rem",
        color: "var(--color-text)",
      }}
    >
      {icon}
      <span>{text}</span>
    </div>
  );
}
