"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClassData } from "@/lib/classes";
import { Swords, BookOpen, Flame, Skull, FlaskConical, Music, AlertTriangle, Loader2 } from "lucide-react";

// Карта иконок для классов
const CLASS_ICONS = {
  berserker: Swords,
  loreman: BookOpen,
  sufferer: Flame,
  urka: Skull,
  alchemist: FlaskConical,
  bard: Music,
};

export default function ClassCard({ classData }: { classData: ClassData }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const router = useRouter();

  const Icon = CLASS_ICONS[classData.id];

  async function handleConfirm() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/player/select-class", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId: classData.id }),
      });

      if (!res.ok) {
        throw new Error("Не удалось сохранить класс");
      }

      // Успех — переход на профиль
      router.push("/profile");
      router.refresh();
    } catch (e) {
      console.error(e);
      alert("Не удалось выбрать класс. Попробуй ещё раз.");
      setIsLoading(false);
      setIsConfirming(false);
    }
  }

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: "var(--color-bg-secondary)",
        border: `1px solid ${isHovered ? classData.accentColor : "var(--color-border)"}`,
        padding: "1.5rem",
        display: "flex",
        flexDirection: "column",
        transition: "all 0.3s ease",
        boxShadow: isHovered ? `0 0 30px ${classData.accentColor}33` : "none",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Декоративный угол в стиле класса */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "3px",
        background: `linear-gradient(to right, transparent, ${classData.accentColor}, transparent)`,
        opacity: isHovered ? 1 : 0.4,
        transition: "opacity 0.3s",
      }} />

      {/* Портрет или плейсхолдер */}
      <div style={{
        position: "relative",
        width: "100%",
        aspectRatio: "3 / 4",
        background: "var(--color-bg-tertiary)",
        marginBottom: "1rem",
        border: "1px solid var(--color-border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}>
        {!imageError ? (
          <img
            src={classData.imageUrl}
            alt={classData.name}
            onError={() => setImageError(true)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: isHovered ? "brightness(1.1)" : "brightness(0.85)",
              transition: "filter 0.3s",
            }}
          />
        ) : (
          // Плейсхолдер пока нет картинки
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: classData.accentColor,
            opacity: 0.4,
          }}>
            <Icon size={80} strokeWidth={1} />
            <p style={{
              marginTop: "1rem",
              fontSize: "0.75rem",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "var(--color-text-dim)",
            }}>
              {classData.id}.png
            </p>
          </div>
        )}
      </div>

      {/* Имя и слоган */}
      <div style={{ marginBottom: "1rem" }}>
        <h2 style={{
          fontSize: "1.4rem",
          color: classData.accentColor,
          marginBottom: "0.25rem",
        }}>
          {classData.name}
        </h2>
        <p style={{
          fontSize: "0.85rem",
          fontStyle: "italic",
          color: "var(--color-text-dim)",
        }}>
          {classData.tagline}
        </p>
      </div>

      {/* Описание */}
      <p style={{
        fontSize: "0.9rem",
        color: "var(--color-text)",
        marginBottom: "1.25rem",
        lineHeight: "1.5",
      }}>
        {classData.description}
      </p>

      {/* Статы */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "0.5rem",
        marginBottom: "1.25rem",
        padding: "0.75rem",
        background: "var(--color-bg-tertiary)",
        border: "1px solid var(--color-border)",
      }}>
        <Stat label="СИЛ" value={classData.startStats.strength} />
        <Stat label="ТЕР" value={classData.startStats.patience} />
        <Stat label="УДЧ" value={classData.startStats.luck} />
        <Stat label="ХАР" value={classData.startStats.charisma} />
      </div>

      {/* Пассивка / Активка / Слабость */}
      <div style={{ fontSize: "0.85rem", lineHeight: "1.5", marginBottom: "1rem" }}>
        <Ability
          color="var(--color-gold)"
          label="Пассивка"
          name={classData.passive.name}
          text={classData.passive.text}
        />
        <Ability
          color="#7a9bb8"
          label="Активка"
          name={classData.active.name}
          text={classData.active.text}
        />
        <Ability
          color="#b85a5a"
          label="Слабость"
          name={classData.weakness.name}
          text={classData.weakness.text}
        />
      </div>

      {/* Предупреждение (если есть) */}
      {classData.warning && (
        <div style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "0.5rem",
          padding: "0.75rem",
          background: "rgba(184, 90, 90, 0.08)",
          border: "1px solid rgba(184, 90, 90, 0.3)",
          marginBottom: "1rem",
          fontSize: "0.8rem",
          color: "#d49a9a",
        }}>
          <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
          <span>{classData.warning}</span>
        </div>
      )}

      {/* Кнопка / подтверждение */}
      <div style={{ marginTop: "auto" }}>
        {!isConfirming ? (
          <button
            className="btn-dark"
            onClick={() => setIsConfirming(true)}
            style={{ width: "100%" }}
          >
            Выбрать путь
          </button>
        ) : (
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}>
            <p style={{
              textAlign: "center",
              fontSize: "0.85rem",
              color: "var(--color-text-dim)",
              fontStyle: "italic",
              marginBottom: "0.25rem",
            }}>
              Уверен? Назад дороги не будет.
            </p>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={() => setIsConfirming(false)}
                disabled={isLoading}
                style={{
                  flex: 1,
                  padding: "0.6rem",
                  background: "transparent",
                  color: "var(--color-text-dim)",
                  border: "1px solid var(--color-border)",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  fontFamily: "var(--font-cinzel)",
                  letterSpacing: "0.1em",
                  fontSize: "0.8rem",
                  textTransform: "uppercase",
                  transition: "all 0.2s",
                }}
              >
                Отмена
              </button>
              <button
                onClick={handleConfirm}
                disabled={isLoading}
                style={{
                  flex: 1,
                  padding: "0.6rem",
                  background: classData.accentColor,
                  color: "white",
                  border: `1px solid ${classData.accentColor}`,
                  cursor: isLoading ? "wait" : "pointer",
                  fontFamily: "var(--font-cinzel)",
                  letterSpacing: "0.1em",
                  fontSize: "0.8rem",
                  textTransform: "uppercase",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={14} className="spin" />
                    Принятие...
                  </>
                ) : (
                  "Принять"
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{
        fontSize: "0.65rem",
        color: "var(--color-text-dim)",
        letterSpacing: "0.1em",
        marginBottom: "0.25rem",
      }}>
        {label}
      </div>
      <div style={{
        fontSize: "1.1rem",
        color: "var(--color-gold)",
        fontFamily: "var(--font-cinzel)",
      }}>
        {value}
      </div>
    </div>
  );
}

function Ability({
  color,
  label,
  name,
  text,
}: {
  color: string;
  label: string;
  name: string;
  text: string;
}) {
  return (
    <div style={{ marginBottom: "0.75rem" }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        marginBottom: "0.15rem",
      }}>
        <div style={{
          width: "8px",
          height: "8px",
          background: color,
          borderRadius: "50%",
        }} />
        <span style={{
          fontSize: "0.7rem",
          color: "var(--color-text-dim)",
          textTransform: "uppercase",
          letterSpacing: "0.15em",
        }}>
          {label}
        </span>
        <span style={{ color, fontWeight: 600 }}>{name}</span>
      </div>
      <p style={{
        color: "var(--color-text)",
        marginLeft: "1rem",
        fontSize: "0.8rem",
        lineHeight: "1.5",
      }}>
        {text}
      </p>
    </div>
  );
}