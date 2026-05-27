"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, Skull, Send, X, Check, RotateCcw, Loader2, Edit3, Save,
} from "lucide-react";

interface TrialOpt {
  id: string;
  title: string;
  description: string;
  flavor: string;
  rewardPoints: number;
  rewardItemId: string | null;
  durationDays: number;
}

interface PlayerOpt {
  id: string;
  nickname: string;
}

interface PerovQuest {
  id: string;
  playerId: string;
  playerNickname: string;
  templateId: string;
  title: string;
  description: string;
  flavor: string;
  rewards: string;
  status: "OFFERED" | "ACTIVE" | "COMPLETED" | "DECLINED" | "EXPIRED";
  offeredAt: string;
  acceptedAt: string | null;
  completedAt: string | null;
  expiresAt: string | null;
  progress: number;
  targetCount: number;
}

export default function PerovAdminView({
  players,
  trials,
  quests,
  seasonStartedAt,
}: {
  players: PlayerOpt[];
  trials: TrialOpt[];
  quests: PerovQuest[];
  seasonStartedAt: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [giveTo, setGiveTo] = useState<string>(players[0]?.id ?? "");
  const [giveTrial, setGiveTrial] = useState<string>(trials[0]?.id ?? "");

  async function call(payload: Record<string, unknown>) {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/perov", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Ошибка");
        return null;
      }
      if (data.message) alert(data.message);
      router.refresh();
      return data;
    } catch {
      alert("Сбой запроса");
      return null;
    } finally {
      setBusy(false);
    }
  }

  const offered = quests.filter((q) => q.status === "OFFERED");
  const active = quests.filter((q) => q.status === "ACTIVE");
  const completed = quests.filter((q) => q.status === "COMPLETED");
  const declined = quests.filter(
    (q) => q.status === "DECLINED" || q.status === "EXPIRED",
  );

  // Игроки которым можно выдать сейчас (нет активного/предложенного Perov)
  const blockedPlayerIds = new Set(
    quests
      .filter((q) => q.status === "OFFERED" || q.status === "ACTIVE")
      .map((q) => q.playerId),
  );
  const availablePlayers = players.filter((p) => !blockedPlayerIds.has(p.id));

  return (
    <main
      style={{
        position: "relative",
        zIndex: 2,
        minHeight: "100vh",
        padding: "2rem",
        maxWidth: "1100px",
        margin: "0 auto",
      }}
    >
      <Link
        href="/admin"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          color: "var(--color-text-dim)",
          textDecoration: "none",
          fontSize: "0.9rem",
          marginBottom: "1.5rem",
        }}
      >
        <ChevronLeft size={16} />
        Админка
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
        <Skull size={28} color="#8ba0e3" />
        <h1
          style={{
            fontSize: "2rem",
            color: "#b3c0e8",
            margin: 0,
            fontFamily: "var(--font-cinzel)",
            letterSpacing: "0.1em",
          }}
        >
          Дух Гомодрила Перова
        </h1>
      </div>
      <p
        style={{
          color: "var(--color-text-dim)",
          fontStyle: "italic",
          marginBottom: "2rem",
        }}
      >
        Сезон с {seasonStartedAt?.slice(0, 10) ?? "—"}.{" "}
        Всего испытаний в реестре: {trials.length}. Активных у игроков: {offered.length + active.length}.
      </p>

      {/* === ВЫДАТЬ ИСПЫТАНИЕ === */}
      <Section title="Выдать испытание">
        {availablePlayers.length === 0 ? (
          <Empty text="У всех игроков уже есть активное испытание Перова." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            <Field label="Игрок">
              <select
                value={giveTo}
                onChange={(e) => setGiveTo(e.target.value)}
                style={inp}
              >
                {availablePlayers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nickname}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Испытание">
              <select
                value={giveTrial}
                onChange={(e) => setGiveTrial(e.target.value)}
                style={inp}
              >
                <option value="">— случайное (по seed дня) —</option>
                {trials.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} (+{t.rewardPoints} поинтов
                    {t.rewardItemId ? ` · ${t.rewardItemId}` : ""})
                  </option>
                ))}
              </select>
            </Field>
            <button
              onClick={() =>
                call({
                  action: "give",
                  playerId: giveTo,
                  trialId: giveTrial || undefined,
                })
              }
              disabled={busy || !giveTo}
              style={btn("#8ba0e3")}
            >
              <Send size={14} /> Призвать Перова к игроку
            </button>
          </div>
        )}
      </Section>

      {/* === ПУЛ ИСПЫТАНИЙ === */}
      <Section title={`Каталог испытаний (${trials.length})`}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {trials.map((t) => (
            <div key={t.id} style={card}>
              <strong style={{ color: "#b3c0e8" }}>{t.title}</strong>{" "}
              <span style={{ fontSize: "0.75rem", color: "var(--color-gold)" }}>
                +{t.rewardPoints} поинтов
                {t.rewardItemId ? ` · ${t.rewardItemId}` : ""} · {t.durationDays}д
              </span>
              <p style={{ fontSize: "0.85rem", color: "var(--color-text)", margin: "0.35rem 0" }}>
                {t.description}
              </p>
              <p
                style={{
                  fontSize: "0.78rem",
                  color: "#8ba0e3",
                  fontStyle: "italic",
                  margin: 0,
                  paddingLeft: "0.6rem",
                  borderLeft: "2px solid #4c5a8c",
                }}
              >
                «{t.flavor}»
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* === АКТИВНЫЕ / ПРЕДЛОЖЕННЫЕ === */}
      <Section title={`Активные и предложенные (${offered.length + active.length})`}>
        {offered.length + active.length === 0 ? (
          <Empty text="Никому Перов сейчас не докучает." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {[...offered, ...active].map((q) => (
              <QuestRow
                key={q.id}
                quest={q}
                trials={trials}
                onCancel={() => call({ action: "cancel", questId: q.id })}
                onComplete={() =>
                  call({ action: "force_complete", questId: q.id })
                }
                onReroll={(trialId) =>
                  call({ action: "reroll_trial", questId: q.id, trialId })
                }
                onEdit={(patch) =>
                  call({ action: "edit", questId: q.id, ...patch })
                }
                busy={busy}
              />
            ))}
          </div>
        )}
      </Section>

      {/* === ЗАВЕРШЁННЫЕ === */}
      {completed.length > 0 && (
        <Section title={`Завершённые в сезоне (${completed.length})`}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {completed.map((q) => (
              <div
                key={q.id}
                style={{
                  ...card,
                  borderLeft: "3px solid var(--color-gold)",
                  opacity: 0.85,
                }}
              >
                <strong>{q.playerNickname}</strong> прошёл{" "}
                <em style={{ color: "#b3c0e8" }}>«{q.title}»</em>
                {q.completedAt && (
                  <span
                    style={{ color: "var(--color-text-dim)", fontSize: "0.75rem", marginLeft: "0.5rem" }}
                  >
                    ({q.completedAt.slice(0, 16).replace("T", " ")})
                  </span>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* === ОТКАЗАННЫЕ / ПРОСРОЧЕННЫЕ === */}
      {declined.length > 0 && (
        <Section title={`Отказы / просрочки (${declined.length})`}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {declined.map((q) => (
              <div
                key={q.id}
                style={{
                  ...card,
                  borderLeft: "3px solid var(--color-blood-bright)",
                  opacity: 0.6,
                }}
              >
                <strong>{q.playerNickname}</strong> — {q.status}: «{q.title}»
              </div>
            ))}
          </div>
        </Section>
      )}

      {busy && (
        <div style={{ color: "var(--color-text-dim)", display: "flex", gap: "0.4rem" }}>
          <Loader2 size={14} className="spin" /> обработка…
        </div>
      )}

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </main>
  );
}

// === Карточка квеста ===
function QuestRow({
  quest,
  trials,
  onCancel,
  onComplete,
  onReroll,
  onEdit,
  busy,
}: {
  quest: PerovQuest;
  trials: TrialOpt[];
  onCancel: () => void;
  onComplete: () => void;
  onReroll: (trialId: string) => void;
  onEdit: (patch: Record<string, unknown>) => void;
  busy: boolean;
}) {
  const [rerollTo, setRerollTo] = useState<string>("");
  const [editing, setEditing] = useState(false);

  // Парсим текущие награды для формы
  let initialRewards = { points: 0, exp: 0, itemId: "" as string };
  try {
    const parsed = JSON.parse(quest.rewards);
    if (typeof parsed?.points === "number") initialRewards.points = parsed.points;
    if (typeof parsed?.exp === "number") initialRewards.exp = parsed.exp;
    if (typeof parsed?.itemId === "string") initialRewards.itemId = parsed.itemId;
  } catch {}

  const [editTitle, setEditTitle] = useState(quest.title);
  const [editDesc, setEditDesc] = useState(quest.description);
  const [editFlavor, setEditFlavor] = useState(quest.flavor);
  const [editPoints, setEditPoints] = useState(initialRewards.points);
  const [editExp, setEditExp] = useState(initialRewards.exp);
  const [editItemId, setEditItemId] = useState(initialRewards.itemId);

  function saveEdit() {
    const patch: Record<string, unknown> = {};
    if (editTitle.trim() !== quest.title) patch.title = editTitle.trim();
    if (editDesc.trim() !== quest.description) patch.description = editDesc.trim();
    if (editFlavor.trim() !== quest.flavor) patch.flavor = editFlavor.trim();
    if (editPoints !== initialRewards.points) patch.rewardPoints = editPoints;
    if (editExp !== initialRewards.exp) patch.rewardExp = editExp;
    if (editItemId !== initialRewards.itemId) patch.rewardItemId = editItemId || null;
    if (Object.keys(patch).length === 0) {
      alert("Ничего не поменялось");
      return;
    }
    onEdit(patch);
    setEditing(false);
  }

  const statusColor =
    quest.status === "ACTIVE" ? "var(--color-gold)" : "#8ba0e3";
  const isOffered = quest.status === "OFFERED";

  return (
    <div style={{ ...card, borderLeft: `3px solid ${statusColor}` }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.5rem",
          flexWrap: "wrap",
        }}
      >
        <div>
          <strong style={{ color: "var(--color-text-bright)" }}>{quest.playerNickname}</strong>{" "}
          <span style={{ fontSize: "0.75rem", color: statusColor }}>
            [{quest.status}]
          </span>
        </div>
        <div style={{ fontSize: "0.75rem", color: "var(--color-text-dim)" }}>
          выдано: {quest.offeredAt.slice(0, 16).replace("T", " ")}
          {quest.expiresAt && (
            <> · истекает: {quest.expiresAt.slice(0, 16).replace("T", " ")}</>
          )}
        </div>
      </div>

      {!editing && (
        <>
          <div style={{ marginTop: "0.4rem" }}>
            <em style={{ color: "#b3c0e8" }}>«{quest.title}»</em>{" "}
            <span style={{ fontSize: "0.78rem", color: "var(--color-text-dim)" }}>
              ({quest.description})
            </span>
          </div>
          <div
            style={{
              fontSize: "0.75rem",
              color: "var(--color-text-dim)",
              fontStyle: "italic",
              marginTop: "0.25rem",
              paddingLeft: "0.5rem",
              borderLeft: "2px solid #4c5a8c",
            }}
          >
            «{quest.flavor}»
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--color-gold)", marginTop: "0.35rem" }}>
            Награда: +{initialRewards.points} поинтов, +{initialRewards.exp} EXP
            {initialRewards.itemId ? ` · ${initialRewards.itemId}` : ""}
          </div>
        </>
      )}

      {editing && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
          <FieldRow label="Название">
            <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} style={inp} />
          </FieldRow>
          <FieldRow label="Описание (что делать)">
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              rows={2}
              style={{ ...inp, resize: "vertical" }}
            />
          </FieldRow>
          <FieldRow label="Реплика Перова">
            <textarea
              value={editFlavor}
              onChange={(e) => setEditFlavor(e.target.value)}
              rows={2}
              style={{ ...inp, resize: "vertical" }}
            />
          </FieldRow>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <FieldRow label="Поинты">
              <input
                type="number"
                value={editPoints}
                onChange={(e) => setEditPoints(Number(e.target.value))}
                style={{ ...inp, width: "100px" }}
              />
            </FieldRow>
            <FieldRow label="EXP">
              <input
                type="number"
                value={editExp}
                onChange={(e) => setEditExp(Number(e.target.value))}
                style={{ ...inp, width: "100px" }}
              />
            </FieldRow>
            <FieldRow label="Предмет (itemId, пусто = ничего)">
              <input
                value={editItemId}
                onChange={(e) => setEditItemId(e.target.value)}
                placeholder="напр. perov_vessel"
                style={{ ...inp, width: "200px" }}
              />
            </FieldRow>
          </div>
          <div style={{ display: "flex", gap: "0.4rem" }}>
            <button onClick={saveEdit} disabled={busy} style={btn("var(--color-gold)")}>
              <Save size={13} /> Сохранить
            </button>
            <button onClick={() => setEditing(false)} disabled={busy} style={btn("var(--color-text-dim)")}>
              <X size={13} /> Отмена
            </button>
          </div>
        </div>
      )}

      {!editing && (
        <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.6rem", flexWrap: "wrap" }}>
          <button onClick={onComplete} disabled={busy} style={btn("var(--color-gold)")}>
            <Check size={13} /> Засчитать
          </button>
          <button onClick={() => setEditing(true)} disabled={busy} style={btn("#8ba0e3")}>
            <Edit3 size={13} /> Редактировать
          </button>
          <button onClick={onCancel} disabled={busy} style={btn("var(--color-blood-bright)")}>
            <X size={13} /> Отменить
          </button>
          {isOffered && (
            <>
              <select
                value={rerollTo}
                onChange={(e) => setRerollTo(e.target.value)}
                style={{ ...inp, maxWidth: "240px" }}
              >
                <option value="">— заменить на шаблон… —</option>
                {trials
                  .filter((t) => t.id !== quest.templateId)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
              </select>
              <button
                onClick={() => rerollTo && onReroll(rerollTo)}
                disabled={busy || !rerollTo}
                style={btn("#8ba0e3")}
              >
                <RotateCcw size={13} /> Перевернуть карты
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
      <span
        style={{
          fontSize: "0.7rem",
          color: "var(--color-text-dim)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

const inp: React.CSSProperties = {
  padding: "0.5rem 0.7rem",
  background: "var(--color-bg-tertiary)",
  border: "1px solid var(--color-border)",
  color: "var(--color-text-bright)",
  fontFamily: "var(--font-cormorant)",
  fontSize: "0.9rem",
};

function btn(color: string): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.35rem",
    padding: "0.45rem 0.85rem",
    background: "transparent",
    border: `1px solid ${color}`,
    color,
    cursor: "pointer",
    fontFamily: "var(--font-cinzel)",
    fontSize: "0.78rem",
  };
}

const card: React.CSSProperties = {
  padding: "0.85rem 1rem",
  background: "var(--color-bg-secondary)",
  border: "1px solid var(--color-border)",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "2rem" }}>
      <h2
        style={{
          fontSize: "1.1rem",
          color: "#b3c0e8",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          marginBottom: "1rem",
        }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
      <span
        style={{
          fontSize: "0.72rem",
          color: "var(--color-text-dim)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

function Empty({ text }: { text: string }) {
  return <p style={{ color: "var(--color-text-dim)", fontStyle: "italic" }}>{text}</p>;
}
