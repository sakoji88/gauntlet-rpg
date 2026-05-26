"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Gamepad2, ExternalLink, Check, X, Loader2, Sparkles, Sword, Scroll, Flame, Gem, RotateCcw } from "lucide-react";
import ItemWheelModal from "./ItemWheelModal";
import { playSfx } from "@/lib/sound";

type ConditionType = "basic" | "genre" | "special";

interface ActiveGameProps {
  game: {
    id: string;
    title: string;
    link: string | null;
    region: string;
    rolledAt: Date;
    conditionType: ConditionType;
    conditionsSnapshot: string | null;
  };
  activeHype?: string | null; // текст обещания Барда, если бафф активен
  playerClass?: string | null; // нужно для специфики Страдальца (доп. поле Metacritic)
}

interface BreakdownEntry {
  label: string;
  value: number;
  type: "base" | "bonus" | "penalty" | "multiplier";
}

export default function ActiveGamePanel({ game, activeHype }: ActiveGameProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState<"complete" | "drop" | null>(null);
  const [hours, setHours] = useState<string>("");
  // HLTB Main Story — для бонуса «спидран/тупняк». Опционально.
  const [hltbHours, setHltbHours] = useState<string>("");
  const [rating, setRating] = useState<string>("");
  // Metacritic — отдельная объективная шкала 0–100. Нужна для RATING-квестов NPC
  // и пассивки Страдальца. Личная rating 0–10 — для лора и отображения.
  const [metacriticRating, setMetacriticRating] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [isMaxDifficulty, setIsMaxDifficulty] = useState(false);
  const [bardHonored, setBardHonored] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [wheelGameId, setWheelGameId] = useState<string | null>(null);

  // Показ разбора поинтов после завершения
  const [breakdownData, setBreakdownData] = useState<{
    total: number;
    breakdown: BreakdownEntry[];
    cappedAt25: boolean;
  } | null>(null);

  async function handleFinish(action: "complete" | "drop") {
    setIsLoading(true);
    try {
      const res = await fetch("/api/player/game/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          hours: hours ? parseFloat(hours) : null,
          hltbHours: hltbHours ? parseFloat(hltbHours) : null,
          rating: rating ? parseInt(rating, 10) : null,
          metacriticRating: metacriticRating ? parseInt(metacriticRating, 10) : null,
          description: description.trim() || null,
          isMaxDifficulty,
          bardHonored: activeHype ? bardHonored : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Ошибка");
        setIsLoading(false);
        return;
      }
      if (data.sentToPrison) {
        playSfx("fail");
        alert(`Дроп! -${data.pointsLost} поинтов. Ты отправлен в Тюрьму.`);
        router.refresh();
      } else {
        playSfx("complete");
        // Показываем красивый разбор перед колесом
        setBreakdownData({
          total: data.pointsEarned,
          breakdown: data.breakdown,
          cappedAt25: data.cappedAt25,
        });
        setIsLoading(false);
      }
    } catch (e) {
      console.error(e);
      alert("Ошибка соединения");
      setIsLoading(false);
    }
  }

  async function handleTechReroll() {
    if (
      !confirm(
        "Тех-реролл: игра не работает или недоступна? Снимем её без штрафа и вернём ход — роллнёшь заново.",
      )
    ) {
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/player/reroll-tech", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Ошибка");
        setIsLoading(false);
        return;
      }
      router.refresh();
    } catch {
      alert("Ошибка соединения");
      setIsLoading(false);
    }
  }

  return (
    <>
      <div className="parchment" style={{
        padding: "1.5rem",
        marginBottom: "1.5rem",
        borderColor: "var(--color-gold-dim)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
          <Gamepad2 size={20} color="var(--color-gold)" />
          <h2 style={{
            fontSize: "1.1rem",
            color: "var(--color-gold)",
            margin: 0,
            letterSpacing: "0.05em",
          }}>
            Текущая игра
          </h2>
        </div>

        <div style={{
          padding: "1rem",
          background: "var(--color-bg-tertiary)",
          border: "1px solid var(--color-border)",
          marginBottom: "1rem",
        }}>
          <div style={{
            fontSize: "1.05rem",
            color: "var(--color-text-bright)",
            marginBottom: "0.4rem",
            fontFamily: "var(--font-cinzel)",
          }}>
            {game.title}
          </div>
          {game.link && (
            <a
              href={game.link}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                color: "var(--color-gold)",
                fontSize: "0.8rem",
                textDecoration: "none",
              }}
            >
              <ExternalLink size={12} />
              Открыть HLTB / Metacritic
            </a>
          )}
        </div>

        {/* Бейдж типа условий + краткое описание */}
        <ConditionBadge
          conditionType={game.conditionType}
          snapshot={game.conditionsSnapshot}
        />

        {!confirming && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <button
              onClick={() => setConfirming("complete")}
              className="btn-dark"
              style={{ borderColor: "var(--color-gold)", color: "var(--color-gold)" }}
            >
              <Check size={14} style={{ marginRight: "0.5rem" }} />
              Прошёл
            </button>
            <button
              onClick={() => setConfirming("drop")}
              className="btn-dark"
              style={{ borderColor: "var(--color-blood-bright)", color: "var(--color-blood-bright)" }}
            >
              <X size={14} style={{ marginRight: "0.5rem" }} />
              Дропнуть
            </button>
          </div>
        )}

        {/* Тех-реролл — на случай, если выпавшая игра не работает */}
        {!confirming && (
          <button
            onClick={handleTechReroll}
            disabled={isLoading}
            title="Игра не работает или недоступна — снять без штрафа и роллнуть заново"
            style={{
              marginTop: "0.6rem",
              width: "100%",
              padding: "0.4rem",
              background: "transparent",
              border: "1px solid var(--color-gold-dim)",
              color: "var(--color-gold-dim)",
              cursor: isLoading ? "not-allowed" : "pointer",
              fontFamily: "var(--font-cinzel)",
              fontSize: "0.7rem",
              letterSpacing: "0.05em",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.35rem",
              boxShadow: "0 0 10px rgba(212,165,116,0.18)",
            }}
          >
            <RotateCcw size={12} />
            Тех-реролл (игра не работает)
          </button>
        )}

        {confirming === "complete" && (
          <div style={{
            padding: "1rem",
            background: "rgba(212, 165, 116, 0.05)",
            border: "1px solid var(--color-gold-dim)",
          }}>
            <h3 style={{ fontSize: "1rem", color: "var(--color-gold)", marginBottom: "1rem" }}>
              Игра пройдена
            </h3>

            <div style={{ display: "grid", gap: "0.75rem", marginBottom: "1rem" }}>
              <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                <span style={labelStyle}>Часов потрачено</span>
                <input
                  type="number" step="0.1"
                  value={hours} onChange={(e) => setHours(e.target.value)}
                  placeholder="например: 12.5" style={inputStyle}
                />
              </label>

              {/* HowLongToBeat — эталон. По нему даём бонус «спидран/тупняк»
                  (+0..3) и трекаем что ты реально страдал или летал. Опционально. */}
              <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                <span style={labelStyle}>Часов по HLTB (Main Story) — необязательно</span>
                <input
                  type="number" step="0.1"
                  value={hltbHours}
                  onChange={(e) => setHltbHours(e.target.value)}
                  placeholder="например: 10"
                  style={inputStyle}
                />
                <span
                  style={{
                    fontSize: "0.7rem",
                    color: "var(--color-text-dim)",
                    fontStyle: "italic",
                  }}
                >
                  Если ты прошёл сильно быстрее или сильно дольше эталона —
                  получишь +1..+3 поинта (спидран или тупняк). Если близко
                  к эталону — без бонуса. Если оставить пустым — без бонуса.
                </span>
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                <span style={labelStyle}>Оценка игры (0–10)</span>
                <input
                  type="number" min="0" max="10"
                  value={rating} onChange={(e) => setRating(e.target.value)}
                  placeholder="например: 5" style={inputStyle}
                />
              </label>

              {/* Оценка Metacritic — для квестов RATING и пассивки Страдальца.
                  Поле нужно ВСЕМ, не только Страдальцу: NPC выдают квесты вида
                  «пройди игру с Metacritic 80+» — без этого поля они не засчитаются. */}
              <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                <span style={labelStyle}>Оценка Metacritic (0–100, по объективной шкале)</span>
                <input
                  type="number" min="0" max="100"
                  value={metacriticRating}
                  onChange={(e) => setMetacriticRating(e.target.value)}
                  placeholder="например: 78"
                  style={inputStyle}
                />
                <span
                  style={{
                    fontSize: "0.7rem",
                    color: "var(--color-text-dim)",
                    fontStyle: "italic",
                  }}
                >
                  Нужно для квестов «рейтинг N+» и для пассивки Страдальца
                  («Сладость Страдания» / «Презрение к Успеху»). Можно оставить
                  пустым — тогда такие квесты не зачтутся, а пассивка
                  Страдальца не сработает.
                </span>
              </label>

              {/* Чекбокс — макс сложность */}
              <CheckBox
                checked={isMaxDifficulty}
                onChange={setIsMaxDifficulty}
                icon={<Sword size={14} />}
                label="Пройдено на максимальной сложности"
                hint="Включает бонусы Берсерка и Сердца Тьмы"
              />

              {/* Чекбокс — Бард выполнил хайп */}
              {activeHype && (
                <CheckBox
                  checked={bardHonored}
                  onChange={setBardHonored}
                  icon={<Sparkles size={14} />}
                  label={`Хайп выполнен: «${activeHype}»`}
                  hint="+5 если да, −3 если нет (отметь честно)"
                />
              )}

              <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                <span style={labelStyle}>Личное описание (опционально)</span>
                <textarea
                  value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="что думаешь об игре..." rows={3}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              <button onClick={() => setConfirming(null)} disabled={isLoading} style={cancelBtnStyle}>
                Отмена
              </button>
              <button
                onClick={() => handleFinish("complete")}
                disabled={isLoading}
                className="btn-dark"
                style={{
                  borderColor: "var(--color-gold)", color: "var(--color-gold)",
                  opacity: isLoading ? 0.6 : 1,
                }}
              >
                {isLoading ? (
                  <><Loader2 size={14} className="spin" style={{ marginRight: "0.4rem" }} />Принимаем</>
                ) : "Засчитать"}
              </button>
            </div>
          </div>
        )}

        {confirming === "drop" && (
          <div style={{
            padding: "1rem",
            background: "rgba(184, 90, 90, 0.05)",
            border: "1px solid var(--color-blood-bright)",
          }}>
            <h3 style={{ fontSize: "1rem", color: "var(--color-blood-bright)", marginBottom: "0.5rem" }}>
              Сдаёшься?
            </h3>
            <p style={{
              fontSize: "0.85rem", color: "var(--color-text-dim)",
              fontStyle: "italic", marginBottom: "1rem", lineHeight: 1.5,
            }}>
              -2 поинта и принудительное перемещение в Тюрьму.
              Чтобы выйти — пройди игру 6+ ч с оценкой 1–60.
            </p>
            <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem", marginBottom: "1rem" }}>
              <span style={labelStyle}>Что случилось (опционально)</span>
              <textarea
                value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="хуйня полная..." rows={2}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              <button onClick={() => setConfirming(null)} disabled={isLoading} style={cancelBtnStyle}>
                Передумать
              </button>
              <button
                onClick={() => handleFinish("drop")}
                disabled={isLoading}
                className="btn-dark"
                style={{
                  borderColor: "var(--color-blood-bright)", color: "var(--color-blood-bright)",
                  opacity: isLoading ? 0.6 : 1,
                }}
              >
                {isLoading ? (
                  <><Loader2 size={14} className="spin" style={{ marginRight: "0.4rem" }} />Сдаёмся</>
                ) : "Дропнуть"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Окно разбора поинтов */}
      {breakdownData && (
        <PointsBreakdownModal
          data={breakdownData}
          onContinue={() => {
            setBreakdownData(null);
            setWheelGameId(game.id);
          }}
        />
      )}

      {/* Колесо предметов */}
      {wheelGameId && (
        <ItemWheelModal
          gameId={wheelGameId}
          onClose={() => {
            setWheelGameId(null);
            router.refresh();
          }}
        />
      )}

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}

// ===== БЕЙДЖ ТИПА УСЛОВИЙ =====
function ConditionBadge({
  conditionType,
  snapshot,
}: {
  conditionType: ConditionType;
  snapshot: string | null;
}) {
  const meta = CONDITION_META[conditionType];

  let description = "";
  if (snapshot) {
    try {
      const parsed = JSON.parse(snapshot);
      if (parsed && typeof parsed.description === "string") {
        description = parsed.description;
      }
    } catch {
      // молча игнорим
    }
  }

  return (
    <div
      style={{
        padding: "0.75rem 1rem",
        background: `${meta.color}11`,
        border: `1px solid ${meta.color}55`,
        marginBottom: "1rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.35rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        {meta.icon}
        <span
          style={{
            fontSize: "0.8rem",
            color: meta.color,
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
      {description && (
        <div style={{ fontSize: "0.78rem", color: "var(--color-text-dim)", lineHeight: 1.4 }}>
          {description}
        </div>
      )}
    </div>
  );
}

const CONDITION_META: Record<
  ConditionType,
  { icon: React.ReactNode; label: string; bonusLabel: string; color: string }
> = {
  basic: {
    icon: <Scroll size={14} color="#9aa39b" />,
    label: "Основное условие",
    bonusLabel: "+0",
    color: "#9aa39b",
  },
  genre: {
    icon: <Flame size={14} color="#c97a3a" />,
    label: "Жанровое условие",
    bonusLabel: "+3",
    color: "#c97a3a",
  },
  special: {
    icon: <Gem size={14} color="#d4a574" />,
    label: "Особое условие 💎",
    bonusLabel: "+7",
    color: "#d4a574",
  },
};

// ===== ЧЕКБОКС =====
function CheckBox({
  checked, onChange, icon, label, hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  icon: React.ReactNode;
  label: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "0.6rem",
        padding: "0.7rem 0.8rem",
        background: checked ? "rgba(212, 165, 116, 0.1)" : "var(--color-bg)",
        border: `1px solid ${checked ? "var(--color-gold)" : "var(--color-border-bright)"}`,
        color: checked ? "var(--color-gold)" : "var(--color-text-dim)",
        cursor: "pointer",
        textAlign: "left",
        fontFamily: "inherit",
        transition: "all 0.2s",
      }}
    >
      <div style={{
        width: "18px",
        height: "18px",
        flexShrink: 0,
        border: `1.5px solid ${checked ? "var(--color-gold)" : "var(--color-border-bright)"}`,
        background: checked ? "var(--color-gold)" : "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        {checked && <Check size={12} color="var(--color-bg)" strokeWidth={3} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          fontSize: "0.85rem",
          marginBottom: hint ? "0.2rem" : 0,
        }}>
          {icon}
          {label}
        </div>
        {hint && (
          <div style={{
            fontSize: "0.75rem",
            color: "var(--color-text-dim)",
            fontStyle: "italic",
          }}>
            {hint}
          </div>
        )}
      </div>
    </button>
  );
}

// ===== РАЗБОР ПОИНТОВ =====
function PointsBreakdownModal({
  data,
  onContinue,
}: {
  data: { total: number; breakdown: BreakdownEntry[]; cappedAt25: boolean };
  onContinue: () => void;
}) {
  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(0,0,0,0.92)", zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "1rem",
    }}>
      <div style={{
        background: "var(--color-bg-secondary)",
        border: "2px solid var(--color-gold)",
        boxShadow: "0 0 60px rgba(212,165,116,0.4)",
        maxWidth: "560px",
        width: "100%",
        padding: "2rem",
      }}>
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <Sparkles size={36} color="var(--color-gold)" className="flicker" style={{ marginBottom: "1rem" }} />
          <h2 style={{
            color: "var(--color-gold)",
            marginBottom: "0.5rem",
            fontSize: "1.6rem",
          }}>
            Игра пройдена
          </h2>
          <div style={{
            fontSize: "3rem",
            color: "var(--color-gold)",
            fontFamily: "var(--font-cinzel)",
            lineHeight: 1,
            marginBottom: "0.25rem",
          }}>
            +{data.total}
          </div>
          <div style={{
            color: "var(--color-text-dim)",
            fontSize: "0.85rem",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}>
            поинтов в копилку
          </div>
        </div>

        <div style={{
          background: "var(--color-bg-tertiary)",
          border: "1px solid var(--color-border)",
          padding: "1rem",
          marginBottom: "1.5rem",
        }}>
          <div style={{
            fontSize: "0.7rem",
            color: "var(--color-text-dim)",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            marginBottom: "0.6rem",
          }}>
            Разбор начислений
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {data.breakdown.filter(b => b.label).map((b, idx) => (
              <div key={idx} style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.85rem",
                paddingBottom: "0.4rem",
                borderBottom: idx < data.breakdown.length - 1 ? "1px solid var(--color-border)" : "none",
              }}>
                <span style={{
                  color: b.type === "penalty" ? "var(--color-blood-bright)" :
                         b.type === "multiplier" ? "#b88be3" :
                         "var(--color-text)",
                }}>
                  {b.label}
                </span>
                <span style={{
                  color: b.value >= 0 ? "var(--color-gold)" : "var(--color-blood-bright)",
                  fontFamily: "var(--font-cinzel)",
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                  marginLeft: "1rem",
                }}>
                  {b.value > 0 ? "+" : ""}{b.value}
                </span>
              </div>
            ))}
          </div>
          {data.cappedAt25 && (
            <p style={{
              marginTop: "0.6rem",
              fontSize: "0.75rem",
              color: "var(--color-blood-bright)",
              fontStyle: "italic",
              textAlign: "center",
            }}>
              ⚠ Сработал лимит — нельзя получить больше 25 поинтов за одну игру
            </p>
          )}
        </div>

        <button onClick={onContinue} className="btn-dark" style={{ width: "100%" }}>
          К колесу предметов →
        </button>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "0.5rem 0.75rem",
  background: "var(--color-bg)",
  border: "1px solid var(--color-border-bright)",
  color: "var(--color-text-bright)",
  fontSize: "0.9rem",
  fontFamily: "inherit",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  fontSize: "0.7rem",
  color: "var(--color-text-dim)",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
};

const cancelBtnStyle: React.CSSProperties = {
  padding: "0.6rem",
  background: "transparent",
  color: "var(--color-text-dim)",
  border: "1px solid var(--color-border)",
  cursor: "pointer",
  fontFamily: "var(--font-cinzel)",
  letterSpacing: "0.1em",
  fontSize: "0.8rem",
  textTransform: "uppercase",
};
