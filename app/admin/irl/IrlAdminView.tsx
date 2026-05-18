"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Plus, Send, Check, X, Trash2, Loader2 } from "lucide-react";

interface Template {
  id: string;
  title: string;
  description: string;
  flavor: string | null;
  npcRegion: string;
  rewardPoints: number;
  rewardExp: number;
  givenCount: number;
}
interface PlayerOpt {
  id: string;
  nickname: string;
}
interface ActiveQuest {
  id: string;
  title: string;
  nickname: string;
  rewards: string;
}

const REGIONS: { id: string; name: string }[] = [
  { id: "chakhly-bor", name: "Чахлый Бор" },
  { id: "terem", name: "Терем Костаная" },
  { id: "khutor", name: "Хутор Душлендора" },
  { id: "bazar", name: "Базар Романала" },
  { id: "tabor", name: "Табор Клопса" },
  { id: "pustyri", name: "Пустыри Галемиуса" },
  { id: "kukhnya", name: "Гнилая Кухня" },
  { id: "atelye", name: "Ателье Пенькова" },
];

export default function IrlAdminView({
  templates,
  players,
  activeQuests,
}: {
  templates: Template[];
  players: PlayerOpt[];
  activeQuests: ActiveQuest[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  // форма создания
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [flavor, setFlavor] = useState("");
  const [npcRegion, setNpcRegion] = useState("tabor");
  const [rewardPoints, setRewardPoints] = useState(15);
  const [rewardExp, setRewardExp] = useState(30);

  // выбор игрока на выдачу, по templateId
  const [deliverTo, setDeliverTo] = useState<Record<string, string>>({});

  async function call(payload: Record<string, unknown>) {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/irl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Ошибка");
        return null;
      }
      router.refresh();
      return data;
    } catch {
      alert("Сбой запроса");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function create() {
    if (!title.trim() || !description.trim()) {
      alert("Нужны название и описание");
      return;
    }
    const r = await call({
      action: "create",
      title,
      description,
      flavor,
      npcRegion,
      rewardPoints,
      rewardExp,
    });
    if (r) {
      setTitle("");
      setDescription("");
      setFlavor("");
    }
  }

  async function deliver(templateId: string, target: string) {
    const r = await call({ action: "deliver", templateId, target });
    if (r) alert(`Выдано игроку: ${r.playerNickname}`);
  }

  return (
    <main
      style={{
        position: "relative",
        zIndex: 2,
        minHeight: "100vh",
        padding: "2rem",
        maxWidth: "1000px",
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

      <h1 style={{ fontSize: "2rem", color: "var(--color-gold)", marginBottom: "0.25rem" }}>
        ИРЛ-квесты
      </h1>
      <p style={{ color: "var(--color-text-dim)", fontStyle: "italic", marginBottom: "2rem" }}>
        Создай задание в пул, выдай игроку (или случайному), потом засчитай выполнение.
        Один и тот же шаблон одному игроку повторно не выдаётся.
      </p>

      {/* СОЗДАНИЕ ШАБЛОНА */}
      <Section title="Новый ИРЛ-квест">
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          <Field label="Название">
            <input value={title} onChange={(e) => setTitle(e.target.value)} style={inp} />
          </Field>
          <Field label="Что сделать (описание)">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              style={{ ...inp, resize: "vertical" }}
            />
          </Field>
          <Field label="Реплика NPC (необязательно)">
            <input value={flavor} onChange={(e) => setFlavor(e.target.value)} style={inp} />
          </Field>
          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
            <Field label="NPC-регион">
              <select
                value={npcRegion}
                onChange={(e) => setNpcRegion(e.target.value)}
                style={inp}
              >
                {REGIONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Поинты">
              <input
                type="number"
                value={rewardPoints}
                onChange={(e) => setRewardPoints(Number(e.target.value))}
                style={{ ...inp, width: "90px" }}
              />
            </Field>
            <Field label="Опыт">
              <input
                type="number"
                value={rewardExp}
                onChange={(e) => setRewardExp(Number(e.target.value))}
                style={{ ...inp, width: "90px" }}
              />
            </Field>
          </div>
          <button onClick={create} disabled={busy} style={btn("var(--color-gold)")}>
            <Plus size={15} /> Создать шаблон
          </button>
        </div>
      </Section>

      {/* ПУЛ ШАБЛОНОВ */}
      <Section title={`Пул шаблонов (${templates.length})`}>
        {templates.length === 0 ? (
          <Empty text="Пул пуст. Создай первый ИРЛ-квест выше." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {templates.map((t) => (
              <div key={t.id} style={card}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
                  <strong style={{ color: "var(--color-text-bright)" }}>{t.title}</strong>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-gold)" }}>
                    +{t.rewardPoints} поинтов · +{t.rewardExp} опыта
                  </span>
                </div>
                <p style={{ fontSize: "0.85rem", color: "var(--color-text)", margin: "0.35rem 0" }}>
                  {t.description}
                </p>
                <div style={{ fontSize: "0.72rem", color: "var(--color-text-dim)", marginBottom: "0.5rem" }}>
                  Выдан раз: {t.givenCount}
                </div>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                  <select
                    value={deliverTo[t.id] ?? ""}
                    onChange={(e) => setDeliverTo({ ...deliverTo, [t.id]: e.target.value })}
                    style={{ ...inp, maxWidth: "200px" }}
                  >
                    <option value="">— выбрать игрока —</option>
                    {players.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nickname}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      const target = deliverTo[t.id];
                      if (!target) {
                        alert("Выбери игрока или жми «случайному»");
                        return;
                      }
                      deliver(t.id, target);
                    }}
                    disabled={busy}
                    style={btn("var(--color-gold)")}
                  >
                    <Send size={14} /> Выдать
                  </button>
                  <button
                    onClick={() => deliver(t.id, "random")}
                    disabled={busy}
                    style={btn("var(--color-text)")}
                  >
                    🎲 Случайному
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Удалить шаблон из пула?")) {
                        call({ action: "delete_template", templateId: t.id });
                      }
                    }}
                    disabled={busy}
                    style={btn("var(--color-blood-bright)")}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* АКТИВНЫЕ ВЫДАННЫЕ */}
      <Section title={`Выданы, ждут проверки (${activeQuests.length})`}>
        {activeQuests.length === 0 ? (
          <Empty text="Нет активных ИРЛ-квестов." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {activeQuests.map((q) => (
              <div
                key={q.id}
                style={{
                  ...card,
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ flex: 1, minWidth: "180px" }}>
                  <strong style={{ color: "var(--color-text-bright)" }}>{q.nickname}</strong>
                  <div style={{ fontSize: "0.85rem", color: "var(--color-text)" }}>{q.title}</div>
                </div>
                <button
                  onClick={() => call({ action: "resolve", questId: q.id, result: "complete" })}
                  disabled={busy}
                  style={btn("var(--color-gold)")}
                >
                  <Check size={14} /> Засчитать
                </button>
                <button
                  onClick={() => call({ action: "resolve", questId: q.id, result: "decline" })}
                  disabled={busy}
                  style={btn("var(--color-blood-bright)")}
                >
                  <X size={14} /> Отклонить
                </button>
              </div>
            ))}
          </div>
        )}
      </Section>

      {busy && (
        <div style={{ color: "var(--color-text-dim)", display: "flex", gap: "0.4rem" }}>
          <Loader2 size={14} className="spin" /> обработка…
        </div>
      )}
    </main>
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
    display: "flex",
    alignItems: "center",
    gap: "0.35rem",
    padding: "0.5rem 0.9rem",
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
          color: "var(--color-gold)",
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
      <span style={{ fontSize: "0.72rem", color: "var(--color-text-dim)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
        {label}
      </span>
      {children}
    </label>
  );
}

function Empty({ text }: { text: string }) {
  return <p style={{ color: "var(--color-text-dim)", fontStyle: "italic" }}>{text}</p>;
}
