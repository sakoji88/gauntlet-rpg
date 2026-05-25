"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2, RefreshCw, Skull, Unlock, Trash2, Sparkles, Zap, Lock,
  Crown, ChevronRight, Wand2, Award,
} from "lucide-react";

interface PlayerInfo {
  id: string;
  nickname: string;
  class: string | null;
  level: number;
  exp: number;
  points: number;
  energy: number;
  inPrison: boolean;
  currentRegion: string | null;
  activeGameId: string | null;
  activeBuffs: string | null;
  declinedQuestCooldowns: string | null;
  declinedSpecials: string | null;
  helmetUsedSeasonId: string | null;
  lastClassActionAt: Date | null;
}

interface QuestInfo {
  id: string;
  title: string;
  status: string;
  npcRegion: string;
}

export default function UtilsTab({
  players,
  questsByPlayer,
}: {
  players: PlayerInfo[];
  questsByPlayer: Record<string, QuestInfo[]>;
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string>(players[0]?.id ?? "");
  const [busy, setBusy] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);

  const player = players.find((p) => p.id === selectedId);

  async function run(action: string, extra: Record<string, unknown> = {}) {
    if (!player) return;
    setBusy(action);
    try {
      const res = await fetch("/api/admin/player-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: player.id, action, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLog((l) => [`❌ ${data.error ?? "Ошибка"}`, ...l].slice(0, 20));
      } else {
        setLog((l) => [`✅ ${data.message ?? "Готово"}`, ...l].slice(0, 20));
        router.refresh();
      }
    } catch (e) {
      setLog((l) => [`❌ Ошибка соединения`, ...l].slice(0, 20));
    } finally {
      setBusy(null);
    }
  }

  async function addExp() {
    const amount = prompt("Сколько EXP добавить? (можно отрицательное)");
    if (!amount) return;
    const num = Number(amount);
    if (!isFinite(num) || num === 0) {
      alert("Нужно число ≠ 0");
      return;
    }
    await run("add_exp", { amount: num });
  }

  if (!player) {
    return <p style={{ color: "var(--color-text-dim)" }}>Нет игроков</p>;
  }

  const buffs = safeParseArr(player.activeBuffs);
  const declinedQ = safeParseObj(player.declinedQuestCooldowns);
  const declinedS = safeParseArr(player.declinedSpecials);
  const classCdLeft = player.lastClassActionAt
    ? Math.max(0, 24 * 60 * 60 * 1000 - (Date.now() - new Date(player.lastClassActionAt).getTime()))
    : 0;
  const questsForPlayer = questsByPlayer[player.id] ?? [];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: "1rem" }}>
      {/* Список игроков */}
      <div style={{
        background: "var(--color-bg-secondary)",
        border: "1px solid var(--color-border)",
        padding: "0.5rem",
        maxHeight: "70vh",
        overflowY: "auto",
      }}>
        <div style={{
          fontSize: "0.7rem",
          color: "var(--color-text-dim)",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          marginBottom: "0.5rem",
          padding: "0.25rem 0.5rem",
        }}>
          Игроки
        </div>
        {players.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedId(p.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              width: "100%",
              padding: "0.5rem 0.75rem",
              background: p.id === selectedId ? "var(--color-bg-tertiary)" : "transparent",
              border: "none",
              borderLeft: `2px solid ${p.id === selectedId ? "var(--color-gold)" : "transparent"}`,
              color: p.id === selectedId ? "var(--color-gold)" : "var(--color-text)",
              cursor: "pointer",
              textAlign: "left",
              fontFamily: "inherit",
              fontSize: "0.85rem",
            }}
          >
            <ChevronRight size={12} style={{ opacity: p.id === selectedId ? 1 : 0 }} />
            <span style={{ flex: 1 }}>{p.nickname}</span>
            {p.inPrison && <Lock size={12} color="var(--color-blood-bright)" />}
          </button>
        ))}
      </div>

      {/* Детали игрока + кнопки */}
      <div style={{
        background: "var(--color-bg-secondary)",
        border: "1px solid var(--color-border)",
        padding: "1.25rem",
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "1rem",
        }}>
          <div>
            <h3 style={{ margin: 0, color: "var(--color-gold)", fontFamily: "var(--font-cinzel)" }}>
              {player.nickname}
            </h3>
            <div style={{ fontSize: "0.8rem", color: "var(--color-text-dim)", marginTop: "0.25rem" }}>
              Класс: {player.class ?? "—"} · Уровень {player.level} ({player.exp} EXP) · {player.points} поинтов
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--color-text-dim)" }}>
              ⚡ {player.energy}/3 · Регион: {player.currentRegion ?? "—"}
              {player.inPrison && (
                <span style={{ color: "var(--color-blood-bright)", marginLeft: "0.5rem" }}>
                  · 🔒 АРЕСТ
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Диагностика */}
        <div style={{
          padding: "0.75rem",
          background: "var(--color-bg-tertiary)",
          border: "1px solid var(--color-border)",
          fontSize: "0.8rem",
          color: "var(--color-text)",
          marginBottom: "1rem",
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "0.5rem",
        }}>
          <DiagItem label="Активные баффы" value={buffs.length} />
          <DiagItem label="Cooldowns отказов от квестов" value={Object.keys(declinedQ).length} />
          <DiagItem label="Отказы от special-условий" value={declinedS.length} />
          <DiagItem
            label="Кулдаун активки класса"
            value={classCdLeft > 0 ? `~${Math.ceil(classCdLeft / 3600000)}ч` : "—"}
          />
          <DiagItem label="Шлем использован" value={player.helmetUsedSeasonId ? "да" : "нет"} />
          <DiagItem label="Активная игра" value={player.activeGameId ? "есть" : "—"} />
        </div>

        {/* Активные баффы — список */}
        {buffs.length > 0 && (
          <div style={{
            padding: "0.6rem 0.8rem",
            background: "rgba(212,165,116,0.07)",
            border: "1px solid var(--color-gold-dim)",
            fontSize: "0.8rem",
            marginBottom: "1rem",
            display: "flex",
            flexWrap: "wrap",
            gap: "0.4rem",
          }}>
            {buffs.map((b, i) => (
              <span key={i} style={{
                padding: "0.15rem 0.5rem",
                background: "rgba(212,165,116,0.15)",
                color: "var(--color-gold)",
                fontFamily: "var(--font-cinzel)",
                fontSize: "0.75rem",
              }}>
                ✦ {b.effectKey}
                {b.expiresAt && ` (до ${new Date(b.expiresAt).toLocaleString().slice(0, 16)})`}
              </span>
            ))}
          </div>
        )}

        {/* Кнопки утилит */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.5rem" }}>
          <ActionBtn
            icon={<RefreshCw size={14} />}
            label="Сбросить все баффы"
            onClick={() => run("reset_buffs")}
            busy={busy === "reset_buffs"}
          />
          <ActionBtn
            icon={<RefreshCw size={14} />}
            label="Сбросить cooldowns квестов"
            onClick={() => run("reset_quest_cooldowns")}
            busy={busy === "reset_quest_cooldowns"}
          />
          <ActionBtn
            icon={<Zap size={14} />}
            label="Сбросить cooldown активки"
            onClick={() => run("reset_class_action_cooldown")}
            busy={busy === "reset_class_action_cooldown"}
          />
          <ActionBtn
            icon={<RefreshCw size={14} />}
            label="Сбросить отказы от special"
            onClick={() => run("reset_declined_specials")}
            busy={busy === "reset_declined_specials"}
          />
          <ActionBtn
            icon={<Unlock size={14} />}
            label="Освободить из тюрьмы"
            onClick={() => run("release_from_prison")}
            busy={busy === "release_from_prison"}
            danger={!player.inPrison}
          />
          <ActionBtn
            icon={<Crown size={14} />}
            label="Сбросить шлем"
            onClick={() => run("reset_helmet")}
            busy={busy === "reset_helmet"}
          />
          <ActionBtn
            icon={<Trash2 size={14} />}
            label="Очистить активную игру"
            onClick={() => run("clear_active_game")}
            busy={busy === "clear_active_game"}
            danger
          />
          <ActionBtn
            icon={<Trash2 size={14} />}
            label="Очистить инвентарь"
            onClick={() => {
              if (confirm("Удалить ВЕСЬ инвентарь игрока?")) run("reset_inventory");
            }}
            busy={busy === "reset_inventory"}
            danger
          />
          <ActionBtn
            icon={<Skull size={14} />}
            label="Призвать Перова"
            onClick={() => run("summon_perov")}
            busy={busy === "summon_perov"}
            highlight
          />
          <ActionBtn
            icon={<Award size={14} />}
            label="Пересчитать уровень"
            onClick={() => run("force_recompute_level")}
            busy={busy === "force_recompute_level"}
          />
          <ActionBtn
            icon={<Sparkles size={14} />}
            label="Дать/убрать EXP..."
            onClick={addExp}
            busy={busy === "add_exp"}
          />
        </div>

        {/* Квесты игрока */}
        {questsForPlayer.length > 0 && (
          <details style={{ marginTop: "1.25rem" }}>
            <summary style={{
              cursor: "pointer",
              color: "var(--color-text-bright)",
              fontSize: "0.85rem",
              padding: "0.5rem",
              background: "var(--color-bg-tertiary)",
              border: "1px solid var(--color-border)",
            }}>
              Квесты игрока ({questsForPlayer.length})
            </summary>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", marginTop: "0.5rem" }}>
              {questsForPlayer.map((q) => (
                <div key={q.id} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.4rem 0.6rem",
                  background: "var(--color-bg)",
                  border: "1px solid var(--color-border)",
                  fontSize: "0.8rem",
                }}>
                  <span style={{ flex: 1 }}>
                    <span style={{ color: "var(--color-text-bright)" }}>{q.title}</span>
                    <span style={{ color: "var(--color-text-dim)", marginLeft: "0.5rem" }}>
                      [{q.npcRegion}] · {q.status}
                    </span>
                  </span>
                  {(q.status === "OFFERED" || q.status === "ACTIVE") && (
                    <>
                      <button
                        onClick={() => run("force_complete_quest", { questId: q.id })}
                        style={miniBtn("var(--color-gold)")}
                        title="Засчитать квест и начислить все награды (поинты, EXP, Злато, предмет)"
                      >
                        Засчитать
                      </button>
                      <button
                        onClick={() => run("force_decline_quest", { questId: q.id })}
                        style={miniBtn("var(--color-blood-bright)")}
                      >
                        Отклонить
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </details>
        )}

        {/* Лог действий */}
        {log.length > 0 && (
          <div style={{
            marginTop: "1.25rem",
            padding: "0.75rem",
            background: "var(--color-bg-tertiary)",
            border: "1px solid var(--color-border)",
            fontSize: "0.78rem",
            color: "var(--color-text)",
            fontFamily: "var(--font-cormorant)",
            maxHeight: "200px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "0.25rem",
          }}>
            {log.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DiagItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div style={{
        fontSize: "0.65rem",
        color: "var(--color-text-dim)",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
      }}>
        {label}
      </div>
      <div style={{ color: "var(--color-text-bright)", fontFamily: "var(--font-cinzel)" }}>
        {value}
      </div>
    </div>
  );
}

function ActionBtn({
  icon,
  label,
  onClick,
  busy,
  danger,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  busy: boolean;
  danger?: boolean;
  highlight?: boolean;
}) {
  const color = highlight
    ? "#8ba0e3"
    : danger
    ? "var(--color-blood-bright)"
    : "var(--color-gold)";
  return (
    <button
      onClick={onClick}
      disabled={busy}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.4rem",
        padding: "0.5rem 0.7rem",
        background: highlight ? "rgba(107,126,196,0.1)" : "transparent",
        border: `1px solid ${color}55`,
        color,
        fontFamily: "var(--font-cinzel)",
        fontSize: "0.75rem",
        letterSpacing: "0.05em",
        cursor: busy ? "wait" : "pointer",
        textAlign: "left",
        opacity: busy ? 0.6 : 1,
        transition: "all 0.2s",
      }}
    >
      {busy ? <Loader2 size={12} className="spin" /> : icon}
      <span>{label}</span>
    </button>
  );
}

function miniBtn(color: string): React.CSSProperties {
  return {
    padding: "0.2rem 0.5rem",
    background: "transparent",
    border: `1px solid ${color}55`,
    color,
    fontSize: "0.7rem",
    fontFamily: "var(--font-cinzel)",
    cursor: "pointer",
    letterSpacing: "0.05em",
  };
}

function safeParseArr(raw: string | null): any[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeParseObj(raw: string | null): Record<string, any> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}
