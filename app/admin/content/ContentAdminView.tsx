"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Save, RotateCcw, Plus, Trash2, Loader2 } from "lucide-react";

interface CondText {
  description: string;
  flavor: string;
}
interface RegionInfo {
  id: string;
  name: string;
  conditions: { basic: CondText | null; genre: CondText | null; special: CondText | null };
}
interface Override {
  regionId: string;
  conditionType: string;
  description: string;
  flavor: string;
}
interface CustomDlg {
  id: string;
  npcRegion: string;
  prompt: string;
}

const COND_LABEL: Record<string, string> = {
  basic: "Базовое",
  genre: "Жанровое",
  special: "Особое",
};

export default function ContentAdminView({
  regions,
  overrides,
  dialogues,
}: {
  regions: RegionInfo[];
  overrides: Override[];
  dialogues: CustomDlg[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  // --- редактор условий ---
  const [regionId, setRegionId] = useState(regions[0]?.id ?? "");
  const [condType, setCondType] = useState<"basic" | "genre" | "special">("basic");
  const region = regions.find((r) => r.id === regionId);
  const baseCond = region?.conditions[condType] ?? null;
  const override = overrides.find((o) => o.regionId === regionId && o.conditionType === condType);

  const [desc, setDesc] = useState("");
  const [flavor, setFlavor] = useState("");
  const [loadedKey, setLoadedKey] = useState("");

  // подгружаем текст при смене региона/типа
  const key = `${regionId}:${condType}`;
  if (key !== loadedKey) {
    setLoadedKey(key);
    setDesc(override?.description ?? baseCond?.description ?? "");
    setFlavor(override?.flavor ?? baseCond?.flavor ?? "");
  }

  // --- добавление диалога ---
  const [dlgRegion, setDlgRegion] = useState(regions[0]?.id ?? "");
  const [prompt, setPrompt] = useState("");
  const [c1, setC1] = useState({ text: "", attitudeDelta: 5, response: "" });
  const [c2, setC2] = useState({ text: "", attitudeDelta: -5, response: "" });

  async function call(payload: Record<string, unknown>) {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/content", {
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

  return (
    <main
      style={{
        position: "relative",
        zIndex: 2,
        minHeight: "100vh",
        padding: "2rem",
        maxWidth: "900px",
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
        Редактор контента
      </h1>
      <p style={{ color: "var(--color-text-dim)", fontStyle: "italic", marginBottom: "2rem" }}>
        Тексты условий NPC и пользовательские диалоги. Требования (жанры/часы) меняются только в коде.
      </p>

      {/* ===== УСЛОВИЯ ===== */}
      <Section title="Тексты условий NPC">
        <div style={{ display: "flex", gap: "0.6rem", marginBottom: "0.85rem", flexWrap: "wrap" }}>
          <select value={regionId} onChange={(e) => setRegionId(e.target.value)} style={inp}>
            {regions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <select
            value={condType}
            onChange={(e) => setCondType(e.target.value as "basic" | "genre" | "special")}
            style={inp}
          >
            {(["basic", "genre", "special"] as const).map((t) => (
              <option key={t} value={t} disabled={!region?.conditions[t]}>
                {COND_LABEL[t]}
                {region?.conditions[t] ? "" : " (нет)"}
              </option>
            ))}
          </select>
        </div>

        {!baseCond ? (
          <Empty text="У этого NPC нет такого типа условия." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            <Field label="Описание условия (что надо сделать)">
              <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} style={{ ...inp, resize: "vertical" }} />
            </Field>
            <Field label="Реплика NPC (flavor)">
              <textarea value={flavor} onChange={(e) => setFlavor(e.target.value)} rows={2} style={{ ...inp, resize: "vertical" }} />
            </Field>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={() => call({ action: "save_condition", regionId, conditionType: condType, description: desc, flavor })}
                disabled={busy}
                style={btn("var(--color-gold)")}
              >
                <Save size={14} /> Сохранить
              </button>
              {override && (
                <button
                  onClick={() => {
                    if (confirm("Вернуть текст из кода?")) {
                      call({ action: "delete_condition", regionId, conditionType: condType });
                      setLoadedKey("");
                    }
                  }}
                  disabled={busy}
                  style={btn("var(--color-text)")}
                >
                  <RotateCcw size={14} /> Сбросить
                </button>
              )}
              {override && (
                <span style={{ alignSelf: "center", fontSize: "0.75rem", color: "var(--color-gold)" }}>
                  ● правка активна
                </span>
              )}
            </div>
          </div>
        )}
      </Section>

      {/* ===== ДИАЛОГИ ===== */}
      <Section title="Новый диалог NPC">
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          <Field label="NPC-регион">
            <select value={dlgRegion} onChange={(e) => setDlgRegion(e.target.value)} style={inp}>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Реплика NPC (вопрос)">
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={2} style={{ ...inp, resize: "vertical" }} />
          </Field>
          <ChoiceEditor label="Ответ 1" value={c1} onChange={setC1} />
          <ChoiceEditor label="Ответ 2" value={c2} onChange={setC2} />
          <button
            onClick={async () => {
              const r = await call({
                action: "add_dialogue",
                npcRegion: dlgRegion,
                prompt,
                choices: [c1, c2],
              });
              if (r) {
                setPrompt("");
                setC1({ text: "", attitudeDelta: 5, response: "" });
                setC2({ text: "", attitudeDelta: -5, response: "" });
              }
            }}
            disabled={busy}
            style={btn("var(--color-gold)")}
          >
            <Plus size={14} /> Добавить диалог
          </button>
        </div>
      </Section>

      <Section title={`Пользовательские диалоги (${dialogues.length})`}>
        {dialogues.length === 0 ? (
          <Empty text="Своих диалогов пока нет." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {dialogues.map((d) => {
              const rname = regions.find((r) => r.id === d.npcRegion)?.name ?? d.npcRegion;
              return (
                <div
                  key={d.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.6rem 0.85rem",
                    background: "var(--color-bg-secondary)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.7rem", color: "var(--color-gold)" }}>{rname}</div>
                    <div style={{ fontSize: "0.85rem", color: "var(--color-text)" }}>{d.prompt}</div>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm("Удалить диалог?")) call({ action: "delete_dialogue", dialogueId: d.id });
                    }}
                    disabled={busy}
                    style={btn("var(--color-blood-bright)")}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
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

function ChoiceEditor({
  label,
  value,
  onChange,
}: {
  label: string;
  value: { text: string; attitudeDelta: number; response: string };
  onChange: (v: { text: string; attitudeDelta: number; response: string }) => void;
}) {
  return (
    <div style={{ padding: "0.6rem", background: "var(--color-bg-tertiary)", border: "1px solid var(--color-border)" }}>
      <div style={{ fontSize: "0.72rem", color: "var(--color-gold)", marginBottom: "0.35rem" }}>{label}</div>
      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
        <input
          placeholder="текст ответа игрока"
          value={value.text}
          onChange={(e) => onChange({ ...value, text: e.target.value })}
          style={{ ...inp, flex: 2, minWidth: "140px" }}
        />
        <input
          type="number"
          title="изменение отношения NPC"
          value={value.attitudeDelta}
          onChange={(e) => onChange({ ...value, attitudeDelta: Number(e.target.value) })}
          style={{ ...inp, width: "70px" }}
        />
        <input
          placeholder="реакция NPC"
          value={value.response}
          onChange={(e) => onChange({ ...value, response: e.target.value })}
          style={{ ...inp, flex: 2, minWidth: "140px" }}
        />
      </div>
    </div>
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
