"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  ExternalLink,
  Loader2,
  Dice5,
  AlertTriangle,
  ChevronLeft,
  Scroll,
  Flame,
  Gem,
} from "lucide-react";
import type { RegionData, RegionCondition } from "@/lib/regions";

type ConditionType = "basic" | "genre" | "special";

interface RollGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  region: RegionData;
  specialAvailable: boolean;            // Выпало ли 15% в этом заходе
  onSpecialDeclined?: () => void;       // Колбэк когда игрок отказался от special
}

export default function RollGameModal({
  isOpen,
  onClose,
  region,
  specialAvailable,
  onSpecialDeclined,
}: RollGameModalProps) {
  const router = useRouter();
  const [chosenType, setChosenType] = useState<ConditionType | null>(null);
  const [iframeBlocked, setIframeBlocked] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);

  // Сбрасываем состояние при открытии.
  // Если у региона только basic (например, Тюрьма) — пропускаем пикер и сразу идём в форму.
  useEffect(() => {
    if (isOpen) {
      const conditions = region.conditions;
      const hasOnlyBasic =
        !!conditions?.basic &&
        !conditions.genre &&
        (!conditions.special || !specialAvailable);
      setChosenType(hasOnlyBasic ? "basic" : null);
      setTitle("");
      setLink("");
      setIframeBlocked(false);
      setIframeLoading(true);
    }
  }, [isOpen, region.conditions, specialAvailable]);

  // Детектируем блокировку iframe через таймаут
  useEffect(() => {
    if (!isOpen || !chosenType) return;
    const timer = setTimeout(() => {
      if (iframeLoading) setIframeBlocked(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, [isOpen, chosenType, iframeLoading]);

  if (!isOpen) return null;

  const conditions = region.conditions;
  if (!conditions) {
    return null; // В этом регионе нельзя роллить (Ателье)
  }

  const chosenCondition: RegionCondition | null =
    chosenType === "basic"
      ? conditions.basic ?? null
      : chosenType === "genre"
      ? conditions.genre ?? null
      : chosenType === "special"
      ? conditions.special ?? null
      : null;

  async function handleSubmit() {
    if (!chosenType) return;
    if (title.trim().length < 2) {
      alert("Впиши название игры (минимум 2 символа)");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/player/roll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          link: link.trim() || null,
          conditionType: chosenType,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Ошибка");
        setIsSaving(false);
        return;
      }
      router.refresh();
      onClose();
    } catch (e) {
      console.error(e);
      alert("Ошибка соединения");
      setIsSaving(false);
    }
  }

  async function handleDeclineSpecial() {
    if (!confirm(
      "Отказаться от особого условия НАВСЕГДА (до конца сезона)?\n\n" +
      "Этот NPC больше не предложит тебе свой челлендж в этом сезоне.",
    )) {
      return;
    }
    setIsDeclining(true);
    try {
      const res = await fetch("/api/player/decline-special", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regionId: region.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Ошибка");
        setIsDeclining(false);
        return;
      }
      onSpecialDeclined?.();
      // Остаёмся на экране выбора, но special-карточка исчезнет
      router.refresh();
      setIsDeclining(false);
    } catch (e) {
      console.error(e);
      alert("Ошибка соединения");
      setIsDeclining(false);
    }
  }

  return (
    <div style={overlayStyle}>
      <div
        style={{
          background: "var(--color-bg-secondary)",
          border: `2px solid ${region.accentColor}`,
          boxShadow: `0 0 60px ${region.accentColor}44`,
          width: "100%",
          maxWidth: chosenType ? "1200px" : "900px",
          maxHeight: "92vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Заголовок */}
        <div
          style={{
            padding: "1rem 1.5rem",
            borderBottom: `1px solid ${region.accentColor}66`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {chosenType && hasPickerChoices(region, specialAvailable) && (
              <button
                onClick={() => setChosenType(null)}
                style={backBtnStyle}
                aria-label="Назад к выбору условий"
                title="Назад к выбору"
              >
                <ChevronLeft size={18} />
              </button>
            )}
            <Dice5 size={20} color={region.accentColor} />
            <h2
              style={{
                fontSize: "1.1rem",
                color: region.accentColor,
                margin: 0,
                letterSpacing: "0.05em",
              }}
            >
              {chosenType ? `Ролл: ${labelFor(chosenType)} — ${region.name}` : `Выбор условий — ${region.name}`}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--color-text-dim)",
              cursor: "pointer",
              padding: "0.25rem",
              display: "flex",
            }}
            aria-label="Закрыть"
          >
            <X size={20} />
          </button>
        </div>

        {/* ФАЗА 1 — Выбор условий */}
        {!chosenType && (
          <ConditionPicker
            region={region}
            specialAvailable={specialAvailable}
            isDeclining={isDeclining}
            onPick={(type) => setChosenType(type)}
            onDeclineSpecial={handleDeclineSpecial}
          />
        )}

        {/* ФАЗА 2 — iframe + форма */}
        {chosenType && chosenCondition && (
          <RollForm
            region={region}
            conditionType={chosenType}
            condition={chosenCondition}
            iframeBlocked={iframeBlocked}
            iframeLoading={iframeLoading}
            onIframeLoad={() => setIframeLoading(false)}
            title={title}
            setTitle={setTitle}
            link={link}
            setLink={setLink}
            isSaving={isSaving}
            onSubmit={handleSubmit}
          />
        )}
      </div>

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes specialPulse {
          0%, 100% { box-shadow: 0 0 18px rgba(212,165,116,0.4); }
          50% { box-shadow: 0 0 36px rgba(212,165,116,0.85); }
        }
      `}</style>
    </div>
  );
}

// Есть ли у региона хотя бы 2 типа условий — иначе показывать пикер бессмысленно
function hasPickerChoices(region: RegionData, specialAvailable: boolean): boolean {
  const c = region.conditions;
  if (!c) return false;
  const count =
    (c.basic ? 1 : 0) + (c.genre ? 1 : 0) + (c.special && specialAvailable ? 1 : 0);
  return count >= 2;
}

// ===== ФАЗА 1: ВЫБОР УСЛОВИЙ =====
function ConditionPicker({
  region,
  specialAvailable,
  isDeclining,
  onPick,
  onDeclineSpecial,
}: {
  region: RegionData;
  specialAvailable: boolean;
  isDeclining: boolean;
  onPick: (type: ConditionType) => void;
  onDeclineSpecial: () => void;
}) {
  const conditions = region.conditions!;
  const showSpecial = specialAvailable && !!conditions.special;

  return (
    <div style={{ padding: "1.5rem", overflow: "auto" }}>
      <p
        style={{
          color: "var(--color-text-dim)",
          fontSize: "0.85rem",
          marginBottom: "1.25rem",
          lineHeight: 1.5,
          textAlign: "center",
        }}
      >
        Выбери, под какие условия будешь ролить. Чем сложнее — тем больше поинтов за прохождение.
        <br />
        <span style={{ color: "var(--color-text-dim)", fontSize: "0.75rem", fontStyle: "italic" }}>
          (Тип условий фиксируется при ролле — позже не сменить.)
        </span>
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: showSpecial
            ? "repeat(auto-fit, minmax(260px, 1fr))"
            : "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1rem",
        }}
      >
        {conditions.basic && (
          <ConditionCard
            type="basic"
            condition={conditions.basic}
            accentColor={region.accentColor}
            onPick={() => onPick("basic")}
          />
        )}
        {conditions.genre && (
          <ConditionCard
            type="genre"
            condition={conditions.genre}
            accentColor={region.accentColor}
            onPick={() => onPick("genre")}
          />
        )}
        {showSpecial && conditions.special && (
          <ConditionCard
            type="special"
            condition={conditions.special}
            accentColor="#d4a574" // золото для special
            onPick={() => onPick("special")}
            onDecline={onDeclineSpecial}
            isDeclining={isDeclining}
            pulse
          />
        )}
      </div>

      <p
        style={{
          color: "var(--color-text-dim)",
          fontSize: "0.75rem",
          fontStyle: "italic",
          textAlign: "center",
          marginTop: "1.25rem",
        }}
      >
        Регион «{region.name}» — жанры: {region.genres.join(", ") || "—"}
      </p>
    </div>
  );
}

function ConditionCard({
  type,
  condition,
  accentColor,
  onPick,
  onDecline,
  isDeclining,
  pulse,
}: {
  type: ConditionType;
  condition: RegionCondition;
  accentColor: string;
  onPick: () => void;
  onDecline?: () => void;
  isDeclining?: boolean;
  pulse?: boolean;
}) {
  const meta = META[type];

  return (
    <div
      style={{
        background: "var(--color-bg)",
        border: `2px solid ${accentColor}`,
        padding: "1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        animation: pulse ? "specialPulse 2.4s ease-in-out infinite" : "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        {meta.icon}
        <div
          style={{
            fontSize: "0.95rem",
            color: accentColor,
            fontFamily: "var(--font-cinzel)",
            letterSpacing: "0.05em",
          }}
        >
          {meta.label}
        </div>
        <div
          style={{
            marginLeft: "auto",
            fontSize: "0.75rem",
            color: "var(--color-gold)",
            fontFamily: "var(--font-cinzel)",
            background: "rgba(212,165,116,0.1)",
            border: "1px solid var(--color-gold-dim)",
            padding: "0.15rem 0.5rem",
          }}
        >
          {meta.bonusLabel}
        </div>
      </div>

      <div
        style={{
          fontSize: "0.85rem",
          color: "var(--color-text-bright)",
          lineHeight: 1.5,
        }}
      >
        {condition.description}
      </div>

      <div
        style={{
          fontSize: "0.8rem",
          color: "var(--color-text-dim)",
          fontStyle: "italic",
          lineHeight: 1.5,
          minHeight: "2.4em",
        }}
      >
        «{condition.flavor}»
      </div>

      <button onClick={onPick} className="btn-dark" style={{ marginTop: "auto" }}>
        Взять
      </button>

      {onDecline && (
        <button
          onClick={onDecline}
          disabled={isDeclining}
          style={{
            background: "transparent",
            border: "1px solid var(--color-blood-bright)",
            color: "var(--color-blood-bright)",
            padding: "0.5rem",
            fontSize: "0.75rem",
            cursor: isDeclining ? "wait" : "pointer",
            fontFamily: "var(--font-cinzel)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            opacity: isDeclining ? 0.6 : 1,
          }}
        >
          {isDeclining ? "..." : "Отказаться навсегда"}
        </button>
      )}
    </div>
  );
}

// ===== ФАЗА 2: iframe + ФОРМА =====
function RollForm({
  region,
  conditionType,
  condition,
  iframeBlocked,
  iframeLoading,
  onIframeLoad,
  title,
  setTitle,
  link,
  setLink,
  isSaving,
  onSubmit,
}: {
  region: RegionData;
  conditionType: ConditionType;
  condition: RegionCondition;
  iframeBlocked: boolean;
  iframeLoading: boolean;
  onIframeLoad: () => void;
  title: string;
  setTitle: (v: string) => void;
  link: string;
  setLink: (v: string) => void;
  isSaving: boolean;
  onSubmit: () => void;
}) {
  const meta = META[conditionType];
  const accentColor = conditionType === "special" ? "#d4a574" : region.accentColor;

  return (
    <div
      style={{
        flex: 1,
        display: "grid",
        gridTemplateColumns: "1fr 380px",
        overflow: "hidden",
      }}
    >
      {/* iframe или fallback */}
      <div
        style={{
          background: "#000",
          position: "relative",
          minHeight: "500px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {!iframeBlocked ? (
          <>
            <iframe
              src="https://pickaga.me/"
              onLoad={onIframeLoad}
              style={{ width: "100%", height: "100%", border: "none" }}
            />
            {iframeLoading && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "var(--color-bg)",
                  color: "var(--color-text-dim)",
                  gap: "1rem",
                }}
              >
                <Loader2 size={32} className="spin" />
                <span style={{ fontSize: "0.85rem" }}>Открываем колесо судьбы...</span>
              </div>
            )}
          </>
        ) : (
          <div
            style={{
              padding: "3rem 2rem",
              textAlign: "center",
              color: "var(--color-text)",
              maxWidth: "500px",
            }}
          >
            <AlertTriangle size={48} color="var(--color-gold)" style={{ marginBottom: "1.5rem" }} />
            <h3
              style={{
                fontSize: "1.2rem",
                color: "var(--color-gold)",
                marginBottom: "1rem",
              }}
            >
              Колесо отказывается жить в окне
            </h3>
            <p
              style={{
                color: "var(--color-text-dim)",
                marginBottom: "1.5rem",
                fontSize: "0.95rem",
                lineHeight: 1.5,
              }}
            >
              pickaga.me защищён от встраивания. Открой его в новой вкладке, крутни колесо,
              потом вернись и впиши что выпало в форме справа.
            </p>
            <a
              href="https://pickaga.me/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-dark"
              style={{ textDecoration: "none", display: "inline-flex" }}
            >
              Открыть в новой вкладке
              <ExternalLink size={14} style={{ marginLeft: "0.5rem" }} />
            </a>
          </div>
        )}
      </div>

      {/* Форма */}
      <div
        style={{
          padding: "1.5rem",
          borderLeft: `1px solid ${accentColor}44`,
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          overflow: "auto",
        }}
      >
        {/* Шапка типа условий */}
        <div
          style={{
            padding: "0.75rem",
            background: `${accentColor}11`,
            border: `1px solid ${accentColor}55`,
            display: "flex",
            flexDirection: "column",
            gap: "0.4rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {meta.icon}
            <span
              style={{
                fontSize: "0.85rem",
                color: accentColor,
                fontFamily: "var(--font-cinzel)",
                letterSpacing: "0.05em",
              }}
            >
              {meta.label}
            </span>
            <span
              style={{
                marginLeft: "auto",
                fontSize: "0.7rem",
                color: "var(--color-gold)",
                fontFamily: "var(--font-cinzel)",
              }}
            >
              {meta.bonusLabel}
            </span>
          </div>
          <div
            style={{
              fontSize: "0.8rem",
              color: "var(--color-text-bright)",
              lineHeight: 1.4,
            }}
          >
            {condition.description}
          </div>
        </div>

        <div
          style={{
            padding: "0.75rem",
            background: "var(--color-bg-tertiary)",
            border: "1px solid var(--color-border)",
            fontSize: "0.8rem",
            color: "var(--color-text-dim)",
            lineHeight: 1.5,
          }}
        >
          <strong style={{ color: "var(--color-gold)" }}>1.</strong> Крути колесо слева
          <br />
          <strong style={{ color: "var(--color-gold)" }}>2.</strong> Впиши название и ссылку
          <br />
          <strong style={{ color: "var(--color-gold)" }}>3.</strong> Жми «Засчитать ролл» — 1 ход
        </div>

        {/* Поле название */}
        <label style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          <span style={labelStyle}>Название игры *</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Bloodborne / Cuphead / Тетрис..."
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = accentColor)}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border-bright)")}
          />
        </label>

        {/* Поле ссылка */}
        <label style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          <span style={labelStyle}>Ссылка (HLTB / Metacritic)</span>
          <input
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://howlongtobeat.com/..."
            style={{ ...inputStyle, fontSize: "0.85rem" }}
            onFocus={(e) => (e.currentTarget.style.borderColor = accentColor)}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border-bright)")}
          />
        </label>

        <button
          onClick={onSubmit}
          disabled={isSaving || title.trim().length < 2}
          className="btn-dark"
          style={{
            marginTop: "auto",
            opacity: isSaving || title.trim().length < 2 ? 0.5 : 1,
            cursor: isSaving || title.trim().length < 2 ? "not-allowed" : "pointer",
          }}
        >
          {isSaving ? (
            <>
              <Loader2 size={14} className="spin" style={{ marginRight: "0.5rem" }} />
              Закрепляем судьбу...
            </>
          ) : (
            "Засчитать ролл (1 ход)"
          )}
        </button>
      </div>
    </div>
  );
}

// ===== СТИЛИ И МЕТА =====
const META: Record<
  ConditionType,
  { icon: React.ReactNode; label: string; bonusLabel: string }
> = {
  basic: {
    icon: <Scroll size={16} color="#9aa39b" />,
    label: "Основное",
    bonusLabel: "+0",
  },
  genre: {
    icon: <Flame size={16} color="#c97a3a" />,
    label: "Жанровое",
    bonusLabel: "+3",
  },
  special: {
    icon: <Gem size={16} color="#d4a574" />,
    label: "Особое",
    bonusLabel: "+7",
  },
};

function labelFor(type: ConditionType): string {
  return META[type].label;
}

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0, 0, 0, 0.88)",
  zIndex: 100,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "1rem",
};

const backBtnStyle: React.CSSProperties = {
  background: "transparent",
  border: "1px solid var(--color-border-bright)",
  color: "var(--color-text-dim)",
  cursor: "pointer",
  padding: "0.2rem 0.35rem",
  display: "flex",
  alignItems: "center",
};

const inputStyle: React.CSSProperties = {
  padding: "0.6rem 0.75rem",
  background: "var(--color-bg)",
  border: "1px solid var(--color-border-bright)",
  color: "var(--color-text-bright)",
  fontSize: "0.9rem",
  fontFamily: "inherit",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  fontSize: "0.75rem",
  color: "var(--color-text-dim)",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
};
