"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RegionData, canMoveBetween } from "@/lib/regions";
import PerovModal, { type PerovTrialData } from "./PerovModal";
import { playSfx } from "@/lib/sound";
import {
  Flame,
  User,
  Zap,
  Coins,
  MapPin,
  ArrowRight,
  Skull,
  Lock,
  Loader2,
  ChevronLeft,
  Move,
  Copy,
  Check,
} from "lucide-react";

interface PlayerInfo {
  nickname: string;
  class: string;
  level: number;
  points: number;
  energy: number;
  currentRegionId: string | null;
  isAdmin: boolean;
}

interface MapViewProps {
  regions: RegionData[];
  player: PlayerInfo;
  currentRegion: RegionData | null;
  isInPrison: boolean;
  regionQuestStatus: Record<string, "OFFERED" | "ACTIVE">;
  perovTrial: PerovTrialData | null;
}

export default function MapView({
  regions,
  player,
  currentRegion,
  isInPrison,
  regionQuestStatus,
  perovTrial,
}: MapViewProps) {
  const router = useRouter();
  const [hoveredRegion, setHoveredRegion] = useState<RegionData | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<RegionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Редактор позиций (виден только админу)
  const [editMode, setEditMode] = useState(false);
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>(
    Object.fromEntries(regions.map((r) => [r.id, r.position])),
  );
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  // === ЛОГИКА РЕДАКТОРА ===
  useEffect(() => {
    if (!editMode || !draggingId) return;

    function onMove(e: MouseEvent) {
      if (!mapRef.current || !draggingId) return;
      const rect = mapRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      const clampedX = Math.max(2, Math.min(98, x));
      const clampedY = Math.max(2, Math.min(98, y));
      setPositions((prev) => ({
        ...prev,
        [draggingId]: { x: Math.round(clampedX * 10) / 10, y: Math.round(clampedY * 10) / 10 },
      }));
    }

    function onUp() {
      setDraggingId(null);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [editMode, draggingId]);

  // Копирование готового кода с координатами в буфер
  function copyCoordinates() {
    const lines = regions.map((r) => {
      const p = positions[r.id];
      return `  // ${r.name}\n  ${r.id}: { x: ${p.x}, y: ${p.y} },`;
    });
    const text = `// Скопируй каждое значение в src/lib/regions.ts → REGIONS\n${lines.join("\n")}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function handleMove(regionId: string) {
    setIsLoading(true);
    try {
      const res = await fetch("/api/player/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regionId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Не удалось переместиться");
        setIsLoading(false);
        return;
      }
      playSfx("move");
      router.refresh();
      setSelectedRegion(null);
      setIsLoading(false);
    } catch (e) {
      console.error(e);
      alert("Ошибка соединения с Бездной");
      setIsLoading(false);
    }
  }

  const displayRegion = selectedRegion ?? hoveredRegion ?? currentRegion;

  return (
    <main style={{
      position: "relative",
      zIndex: 2,
      minHeight: "100vh",
      padding: "1.5rem",
      maxWidth: "1600px",
      margin: "0 auto",
    }}>
      {/* ===== ВЕРХНЯЯ ПАНЕЛЬ ===== */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "1.5rem",
        flexWrap: "wrap",
        gap: "1rem",
      }}>
        <Link
          href="/profile"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            color: "var(--color-text-dim)",
            textDecoration: "none",
            fontSize: "0.9rem",
          }}
        >
          <ChevronLeft size={16} />
          Профиль
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Flame size={24} color="var(--color-gold)" className="flicker" />
          <h1 style={{
            fontSize: "1.5rem",
            color: "var(--color-gold)",
            letterSpacing: "0.1em",
            margin: 0,
          }}>
            Бездна
          </h1>
        </div>

        <PlayerBar player={player} />
      </div>

      {/* === РЕЖИМ РЕДАКТИРОВАНИЯ (для админа) === */}
      {player.isAdmin && (
        <div style={{
          marginBottom: "1rem",
          padding: "0.75rem 1rem",
          background: editMode ? "rgba(212, 165, 116, 0.1)" : "var(--color-bg-secondary)",
          border: `1px solid ${editMode ? "var(--color-gold)" : "var(--color-border)"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Move size={16} color={editMode ? "var(--color-gold)" : "var(--color-text-dim)"} />
            <span style={{
              fontSize: "0.85rem",
              color: editMode ? "var(--color-gold)" : "var(--color-text-dim)",
            }}>
              {editMode
                ? "Редактор меток: тащи точки мышкой. Сохрани координаты по кнопке справа."
                : "Режим редактора меток (только для админа)"}
            </span>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {editMode && (
              <button
                onClick={copyCoordinates}
                style={{
                  padding: "0.4rem 0.8rem",
                  background: copied ? "var(--color-gold)" : "transparent",
                  color: copied ? "var(--color-bg)" : "var(--color-gold)",
                  border: "1px solid var(--color-gold)",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  transition: "all 0.2s",
                }}
              >
                {copied ? <><Check size={12} /> Скопировано</> : <><Copy size={12} /> Скопировать координаты</>}
              </button>
            )}
            <button
              onClick={() => {
                setEditMode((v) => !v);
                setSelectedRegion(null);
              }}
              style={{
                padding: "0.4rem 0.8rem",
                background: editMode ? "var(--color-gold)" : "transparent",
                color: editMode ? "var(--color-bg)" : "var(--color-text-dim)",
                border: `1px solid ${editMode ? "var(--color-gold)" : "var(--color-border-bright)"}`,
                cursor: "pointer",
                fontSize: "0.75rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                transition: "all 0.2s",
              }}
            >
              {editMode ? "Выйти" : "Редактировать"}
            </button>
          </div>
        </div>
      )}

      {/* ===== ОСНОВНАЯ СЕТКА: КАРТА + БОКОВАЯ ПАНЕЛЬ ===== */}
      <div style={{
        display: "grid",
        gridTemplateColumns: editMode ? "1fr" : "1fr 340px",
        gap: "1.5rem",
        alignItems: "start",
      }}>

        {/* === КАРТА === */}
        <div
          ref={mapRef}
          style={{
            position: "relative",
            aspectRatio: "16 / 10",
            background: "var(--color-bg-secondary)",
            border: "1px solid var(--color-border)",
            overflow: "hidden",
            userSelect: editMode ? "none" : "auto",
          }}>
          <MapBackground />

          <div style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.5) 100%)",
            pointerEvents: "none",
          }} />

          {regions.map((region) => (
            <RegionMarker
              key={region.id}
              region={region}
              position={positions[region.id]}
              isCurrent={region.id === player.currentRegionId}
              isHovered={hoveredRegion?.id === region.id}
              isSelected={selectedRegion?.id === region.id}
              isDragging={draggingId === region.id}
              editMode={editMode}
              questStatus={regionQuestStatus[region.id]}
              onHover={(r) => !editMode && setHoveredRegion(r)}
              onLeave={() => !editMode && setHoveredRegion(null)}
              onClick={(r) => !editMode && setSelectedRegion(r)}
              onDragStart={(id) => editMode && setDraggingId(id)}
            />
          ))}
        </div>

        {/* === БОКОВАЯ ПАНЕЛЬ (скрыта в edit mode) === */}
        {!editMode && (
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}>
            {isInPrison ? (
              <PrisonPanel />
            ) : (
              <RegionInfoPanel
                region={displayRegion}
                isCurrent={displayRegion?.id === player.currentRegionId}
                currentRegionId={player.currentRegionId}
                isLoading={isLoading}
                onMove={handleMove}
                onClose={() => setSelectedRegion(null)}
                isSelected={!!selectedRegion}
              />
            )}
          </div>
        )}

      </div>

      {/* Модалка Перова — показывается если триггеры сошлись на этот день */}
      {perovTrial && <PerovModal trial={perovTrial} />}
    </main>
  );
}

// ===== ПАНЕЛЬ ИГРОКА =====
function PlayerBar({ player }: { player: PlayerInfo }) {
  return (
    <div style={{
      display: "flex",
      gap: "1rem",
      alignItems: "center",
      padding: "0.5rem 1rem",
      background: "var(--color-bg-secondary)",
      border: "1px solid var(--color-border)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
        <User size={14} color="var(--color-text-dim)" />
        <span style={{ fontSize: "0.85rem", color: "var(--color-text-bright)" }}>
          {player.nickname}
        </span>
        <span style={{ fontSize: "0.75rem", color: "var(--color-text-dim)" }}>
          · ур. {player.level}
        </span>
      </div>
      <Divider />
      <Pill icon={<Zap size={14} />} value={`${player.energy}/3`} color="var(--color-gold)" />
      <Pill icon={<Coins size={14} />} value={`${player.points}`} color="var(--color-gold)" />
    </div>
  );
}

function Divider() {
  return <div style={{ width: "1px", height: "16px", background: "var(--color-border)" }} />;
}

function Pill({ icon, value, color }: { icon: React.ReactNode; value: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", color }}>
      {icon}
      <span style={{ fontSize: "0.85rem", fontFamily: "var(--font-cinzel)" }}>{value}</span>
    </div>
  );
}

// ===== ФОН КАРТЫ =====
function MapBackground() {
  return (
    <div style={{
      position: "absolute",
      inset: 0,
      backgroundImage: "url(/images/world/map.png)",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      backgroundColor: "#2a2520",
    }}>
      <div style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--color-text-dim)",
        fontSize: "0.85rem",
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        opacity: 0.3,
        pointerEvents: "none",
      }}>
        public/images/world/map.png
      </div>
    </div>
  );
}

// ===== МАРКЕР =====
function RegionMarker({
  region,
  position,
  isCurrent,
  isHovered,
  isSelected,
  isDragging,
  editMode,
  questStatus,
  onHover,
  onLeave,
  onClick,
  onDragStart,
}: {
  region: RegionData;
  position: { x: number; y: number };
  isCurrent: boolean;
  isHovered: boolean;
  isSelected: boolean;
  isDragging: boolean;
  editMode: boolean;
  questStatus?: "OFFERED" | "ACTIVE";
  onHover: (r: RegionData) => void;
  onLeave: () => void;
  onClick: (r: RegionData) => void;
  onDragStart: (id: string) => void;
}) {
  const isPrison = region.id === "prison";
  const isActive = isHovered || isSelected || isCurrent || isDragging;

  return (
    <div
      onMouseEnter={() => onHover(region)}
      onMouseLeave={onLeave}
      onClick={() => onClick(region)}
      onMouseDown={(e) => {
        if (editMode) {
          e.preventDefault();
          onDragStart(region.id);
        }
      }}
      style={{
        position: "absolute",
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: "translate(-50%, -50%)",
        cursor: editMode ? (isDragging ? "grabbing" : "grab") : "pointer",
        zIndex: isActive ? 20 : 10,
      }}
    >
      <div style={{
        width: isCurrent ? "44px" : "32px",
        height: isCurrent ? "44px" : "32px",
        borderRadius: "50%",
        background: isPrison
          ? "rgba(107, 26, 26, 0.9)"
          : isCurrent
            ? region.accentColor
            : `${region.accentColor}cc`,
        border: `2px solid ${editMode ? "var(--color-gold)" : isCurrent ? "var(--color-gold)" : region.accentColor}`,
        boxShadow: isActive
          ? `0 0 24px ${region.accentColor}, 0 0 8px ${region.accentColor}`
          : isCurrent
            ? `0 0 16px ${region.accentColor}`
            : "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: isDragging ? "none" : "all 0.2s",
        animation: isCurrent && !editMode ? "pulse 2s ease-in-out infinite" : "none",
      }}>
        {isPrison ? (
          <Lock size={16} color="white" />
        ) : (
          <MapPin size={isCurrent ? 20 : 14} color="white" />
        )}
      </div>

      {/* Маркер квеста — над меткой региона */}
      {questStatus && !editMode && (
        <div style={{
          position: "absolute",
          top: "-14px",
          right: "-14px",
          width: "22px",
          height: "22px",
          borderRadius: "50%",
          background: questStatus === "OFFERED" ? "var(--color-gold)" : "var(--color-bg-secondary)",
          border: `2px solid var(--color-gold)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: questStatus === "OFFERED" ? "var(--color-bg)" : "var(--color-gold)",
          fontSize: questStatus === "OFFERED" ? "0.85rem" : "0.7rem",
          fontWeight: "bold",
          fontFamily: "var(--font-cinzel)",
          boxShadow: "0 0 12px rgba(212,165,116,0.7)",
          animation: questStatus === "OFFERED" ? "questPulse 1.8s ease-in-out infinite" : "none",
          pointerEvents: "none",
          zIndex: 30,
        }}>
          {questStatus === "OFFERED" ? "!" : "✓"}
        </div>
      )}

      <div style={{
        position: "absolute",
        top: "100%",
        left: "50%",
        transform: "translate(-50%, 4px)",
        whiteSpace: "nowrap",
        fontSize: editMode ? "0.7rem" : "0.75rem",
        fontFamily: "var(--font-cinzel)",
        color: isActive ? "var(--color-gold)" : "var(--color-text)",
        textShadow: "0 0 8px rgba(0,0,0,0.9), 0 0 4px rgba(0,0,0,0.9)",
        letterSpacing: "0.08em",
        pointerEvents: "none",
        transition: "color 0.2s",
      }}>
        {editMode
          ? `${region.shortName} (${position.x}, ${position.y})`
          : region.shortName}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 16px ${region.accentColor}; }
          50% { box-shadow: 0 0 32px ${region.accentColor}, 0 0 8px ${region.accentColor}; }
        }
        @keyframes questPulse {
          0%, 100% { box-shadow: 0 0 12px rgba(212,165,116,0.7); transform: scale(1); }
          50% { box-shadow: 0 0 24px rgba(212,165,116,1); transform: scale(1.15); }
        }
      `}</style>
    </div>
  );
}

// ===== ПАНЕЛЬ ИНФО =====
function RegionInfoPanel({
  region,
  isCurrent,
  currentRegionId,
  isLoading,
  onMove,
  onClose,
  isSelected,
}: {
  region: RegionData | null;
  isCurrent: boolean;
  currentRegionId: string | null;
  isLoading: boolean;
  onMove: (id: string) => void;
  onClose: () => void;
  isSelected: boolean;
}) {
  if (!region) {
    return (
      <div className="parchment" style={{ padding: "1.5rem", textAlign: "center" }}>
        <p style={{ color: "var(--color-text-dim)", fontStyle: "italic" }}>
          Наведи на регион чтобы увидеть подробности
        </p>
      </div>
    );
  }

  const isPrison = region.id === "prison";
  const moveCheck = currentRegionId && !isCurrent && !isPrison
    ? canMoveBetween(currentRegionId, region.id)
    : null;

  return (
    <div className="parchment" style={{
      padding: "1.5rem",
      borderColor: region.accentColor,
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "0.5rem",
      }}>
        <div>
          <h2 style={{
            fontSize: "1.25rem",
            color: region.accentColor,
            marginBottom: "0.25rem",
            lineHeight: 1.2,
          }}>
            {region.name}
          </h2>
          {isCurrent && (
            <span style={{
              fontSize: "0.7rem",
              color: "var(--color-gold)",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}>
              ★ Ты здесь
            </span>
          )}
        </div>
        {isSelected && !isCurrent && (
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--color-text-dim)",
              cursor: "pointer",
              padding: 0,
              fontSize: "1.25rem",
              lineHeight: 1,
            }}
            aria-label="Закрыть"
          >
            ×
          </button>
        )}
      </div>

      <p style={{
        fontSize: "0.9rem",
        color: "var(--color-text)",
        fontStyle: "italic",
        lineHeight: 1.5,
        marginBottom: "1rem",
      }}>
        {region.description}
      </p>

      <div style={{
        padding: "0.75rem",
        background: "var(--color-bg-tertiary)",
        border: "1px solid var(--color-border)",
        marginBottom: "1rem",
      }}>
        <div style={{
          fontSize: "0.7rem",
          color: "var(--color-text-dim)",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          marginBottom: "0.25rem",
        }}>
          Хозяин
        </div>
        <div style={{ color: region.accentColor, fontWeight: 600, marginBottom: "0.15rem" }}>
          {region.npcName}
        </div>
        <div style={{ fontSize: "0.8rem", color: "var(--color-text-dim)", fontStyle: "italic" }}>
          {region.npcTitle}
        </div>
      </div>

      {region.genres.length > 0 && (
        <div style={{ marginBottom: "1rem" }}>
          <div style={{
            fontSize: "0.7rem",
            color: "var(--color-text-dim)",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            marginBottom: "0.5rem",
          }}>
            Жанры
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
            {region.genres.map((g) => (
              <span
                key={g}
                style={{
                  fontSize: "0.7rem",
                  padding: "0.25rem 0.5rem",
                  background: `${region.accentColor}22`,
                  border: `1px solid ${region.accentColor}55`,
                  color: region.accentColor,
                }}
              >
                {g}
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{
        fontSize: "0.8rem",
        color: "var(--color-gold)",
        padding: "0.5rem 0",
        borderTop: "1px solid var(--color-border)",
        marginBottom: "1rem",
      }}>
        🜂 {region.passiveBonus}
      </div>

      {isCurrent ? (
        <Link
          href={`/region/${region.id}`}
          className="btn-dark"
          style={{ width: "100%", textDecoration: "none", display: "flex" }}
        >
          К квестодателю
          <ArrowRight size={14} style={{ marginLeft: "0.5rem" }} />
        </Link>
      ) : moveCheck?.canMove ? (
        <button
          onClick={() => onMove(region.id)}
          disabled={isLoading}
          className="btn-dark"
          style={{
            width: "100%",
            cursor: isLoading ? "wait" : "pointer",
            opacity: isLoading ? 0.6 : 1,
          }}
        >
          {isLoading ? (
            <>
              <Loader2 size={14} className="spin" style={{ marginRight: "0.5rem" }} />
              Шагаешь...
            </>
          ) : (
            <>
              Переместиться ({moveCheck.cost} {moveCheck.cost === 1 ? "ход" : "хода"})
            </>
          )}
        </button>
      ) : (
        <div style={{
          padding: "0.75rem",
          textAlign: "center",
          color: "var(--color-text-dim)",
          fontSize: "0.85rem",
          fontStyle: "italic",
          border: "1px dashed var(--color-border)",
        }}>
          {moveCheck?.reason ?? "Сюда нельзя"}
        </div>
      )}

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ===== ТЮРЬМА =====
function PrisonPanel() {
  return (
    <div className="parchment" style={{
      padding: "1.5rem",
      borderColor: "var(--color-blood-bright)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
        <Skull size={24} color="var(--color-blood-bright)" className="flicker" />
        <h2 style={{
          fontSize: "1.25rem",
          color: "var(--color-blood-bright)",
          margin: 0,
        }}>
          Ты в Тюрьме
        </h2>
      </div>

      <p style={{
        fontSize: "0.9rem",
        color: "var(--color-text)",
        fontStyle: "italic",
        lineHeight: 1.6,
        marginBottom: "1rem",
      }}>
        За дроп ты ввергнут в каменный мешок Бездны.
        Чтобы выйти — пройди игру длительностью 6+ часов
        с оценкой 1–60 на Metacritic.
      </p>

      <Link
        href="/region/prison"
        className="btn-dark"
        style={{ width: "100%", textDecoration: "none", display: "flex" }}
      >
        К Стражнику
        <ArrowRight size={14} style={{ marginLeft: "0.5rem" }} />
      </Link>
    </div>
  );
}
