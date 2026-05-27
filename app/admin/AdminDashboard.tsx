"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Shield, ChevronLeft, Users, ListChecks, Gamepad2, Calendar,
  Loader2, Plus, Trash2, Edit, Save, X, AlertTriangle, Wand2,
} from "lucide-react";
import { CLASSES } from "@/lib/classes";
import { REGIONS } from "@/lib/regions";
import UtilsTab from "./UtilsTab";
import RecalcFirstInSeason from "./RecalcFirstInSeason";
import ReseedItemsButton from "./ReseedItemsButton";
import ApplySchemaButton from "./ApplySchemaButton";
import SnapshotForClaude from "./SnapshotForClaude";

type Tab = "dashboard" | "players" | "whitelist" | "games" | "seasons" | "utils";

export default function AdminDashboard(props: any) {
  const [tab, setTab] = useState<Tab>("dashboard");
  const router = useRouter();

  return (
    <main style={{
      position: "relative",
      zIndex: 2,
      minHeight: "100vh",
      padding: "1.5rem 2rem",
      maxWidth: "1400px",
      margin: "0 auto",
    }}>
      {/* Шапка */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "1.5rem",
        flexWrap: "wrap",
        gap: "1rem",
      }}>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <Link href="/profile" style={{
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            color: "var(--color-text-dim)", textDecoration: "none", fontSize: "0.9rem",
          }}>
            <ChevronLeft size={16} />
            Профиль
          </Link>
          <Link href="/admin/irl" style={{
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            color: "var(--color-gold)", textDecoration: "none", fontSize: "0.9rem",
          }}>
            🎯 ИРЛ-квесты
          </Link>
          <Link href="/admin/content" style={{
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            color: "var(--color-gold)", textDecoration: "none", fontSize: "0.9rem",
          }}>
            📜 Контент
          </Link>
          <Link href="/admin/perov" style={{
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            color: "#b3c0e8", textDecoration: "none", fontSize: "0.9rem",
          }}>
            💀 Перов
          </Link>
          <RecalcFirstInSeason />
          <ReseedItemsButton />
          <ApplySchemaButton />
          <SnapshotForClaude />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Shield size={24} color="var(--color-gold)" className="flicker" />
          <h1 style={{
            fontSize: "1.5rem",
            color: "var(--color-gold)",
            letterSpacing: "0.1em",
            margin: 0,
          }}>
            Чертог Хранителя
          </h1>
        </div>

        <div style={{ minWidth: "100px" }} />
      </div>

      {/* Табы */}
      <div style={{
        display: "flex",
        gap: "0.5rem",
        marginBottom: "1.5rem",
        flexWrap: "wrap",
        borderBottom: "1px solid var(--color-border)",
        paddingBottom: "0.5rem",
      }}>
        <TabBtn active={tab === "dashboard"} onClick={() => setTab("dashboard")} icon={<Shield size={14} />} label="Дашборд" />
        <TabBtn active={tab === "players"} onClick={() => setTab("players")} icon={<Users size={14} />} label={`Игроки (${props.stats.totalPlayers})`} />
        <TabBtn active={tab === "whitelist"} onClick={() => setTab("whitelist")} icon={<ListChecks size={14} />} label={`Свиток (${props.stats.totalAllowed})`} />
        <TabBtn active={tab === "games"} onClick={() => setTab("games")} icon={<Gamepad2 size={14} />} label={`Игры (${props.stats.totalGames})`} />
        <TabBtn active={tab === "seasons"} onClick={() => setTab("seasons")} icon={<Calendar size={14} />} label="Сезон" />
        <TabBtn active={tab === "utils"} onClick={() => setTab("utils")} icon={<Wand2 size={14} />} label="Утилиты" />
      </div>

      {tab === "dashboard" && <DashboardTab stats={props.stats} currentSeason={props.currentSeason} />}
      {tab === "players" && <PlayersTab players={props.players} items={props.items} />}
      {tab === "whitelist" && <WhitelistTab whitelist={props.whitelist} accounts={props.accounts} />}
      {tab === "games" && <GamesTab games={props.games} />}
      {tab === "seasons" && <SeasonsTab currentSeason={props.currentSeason} allSeasons={props.allSeasons} />}
      {tab === "utils" && <UtilsTab players={props.players} questsByPlayer={props.questsByPlayer ?? {}} />}
    </main>
  );
}

// ===== ТАБ-КНОПКА =====
function TabBtn({ active, onClick, icon, label }: any) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: "0.4rem",
        padding: "0.5rem 0.9rem",
        background: active ? "var(--color-bg-tertiary)" : "transparent",
        color: active ? "var(--color-gold)" : "var(--color-text-dim)",
        border: `1px solid ${active ? "var(--color-gold-dim)" : "var(--color-border)"}`,
        fontFamily: "var(--font-cinzel)",
        fontSize: "0.8rem",
        letterSpacing: "0.05em",
        cursor: "pointer",
        transition: "all 0.2s",
      }}
    >
      {icon}
      {label}
    </button>
  );
}

// ============================================
// ДАШБОРД
// ============================================
function DashboardTab({ stats, currentSeason }: any) {
  return (
    <div>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "0.75rem",
        marginBottom: "2rem",
      }}>
        <StatCard label="Путников в Бездне" value={stats.totalPlayers} />
        <StatCard label="Из них с классом" value={stats.totalPlayersWithClass} />
        <StatCard label="Имён в Свитке" value={stats.totalAllowed} />
        <StatCard label="Активных игр" value={stats.activeGames} />
        <StatCard label="Всего игр" value={stats.totalGames} />
        <StatCard label="Поинтов в обороте" value={stats.totalPoints} />
      </div>

      <div className="parchment" style={{ padding: "1.5rem" }}>
        <h2 style={{ marginBottom: "1rem", color: "var(--color-gold)", fontSize: "1.1rem" }}>
          Текущий сезон
        </h2>
        {currentSeason ? (
          <div>
            <div style={{ marginBottom: "0.5rem" }}>
              <span style={{ color: "var(--color-text-dim)" }}>Сезон: </span>
              <span style={{ color: "var(--color-gold)", fontFamily: "var(--font-cinzel)" }}>
                #{currentSeason.number} — {currentSeason.name}
              </span>
            </div>
            {currentSeason.theme && (
              <div style={{ marginBottom: "0.5rem" }}>
                <span style={{ color: "var(--color-text-dim)" }}>Тема: </span>
                {currentSeason.theme}
              </div>
            )}
            <div>
              <span style={{ color: "var(--color-text-dim)" }}>Запущен: </span>
              {new Date(currentSeason.startedAt).toLocaleString("ru")}
            </div>
          </div>
        ) : (
          <p style={{ color: "var(--color-text-dim)", fontStyle: "italic" }}>
            Нет активного сезона. Запусти его во вкладке "Сезон".
          </p>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div style={{
      padding: "1rem 1.25rem",
      background: "var(--color-bg-secondary)",
      border: "1px solid var(--color-border)",
    }}>
      <div style={{
        fontSize: "0.7rem",
        color: "var(--color-text-dim)",
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        marginBottom: "0.5rem",
      }}>
        {label}
      </div>
      <div style={{
        fontSize: "1.5rem",
        color: "var(--color-gold)",
        fontFamily: "var(--font-cinzel)",
      }}>
        {value}
      </div>
    </div>
  );
}

// ============================================
// ИГРОКИ
// ============================================
function PlayersTab({ players, items }: any) {
  const [editing, setEditing] = useState<string | null>(null);
  const [giveItemFor, setGiveItemFor] = useState<string | null>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {players.map((p: any) => (
        <PlayerRow
          key={p.id}
          player={p}
          isEditing={editing === p.id}
          onEdit={() => setEditing(p.id)}
          onCancel={() => setEditing(null)}
          onGiveItem={() => setGiveItemFor(p.id)}
          items={items}
          giveItemOpen={giveItemFor === p.id}
          onCloseGiveItem={() => setGiveItemFor(null)}
        />
      ))}
    </div>
  );
}

function PlayerRow({ player, isEditing, onEdit, onCancel, items, onGiveItem, giveItemOpen, onCloseGiveItem }: any) {
  const router = useRouter();
  const [draft, setDraft] = useState({
    nickname: player.nickname,
    class: player.class ?? "",
    level: player.level,
    points: player.points,
    energy: player.energy,
    strength: player.strength,
    patience: player.patience,
    luck: player.luck,
    charisma: player.charisma,
    currentRegion: player.currentRegion ?? "",
    isAdmin: player.isAdmin,
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/player/${player.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: {
            ...draft,
            class: draft.class || null,
            currentRegion: draft.currentRegion || null,
            level: parseInt(String(draft.level), 10) || 1,
            points: parseInt(String(draft.points), 10) || 0,
            energy: parseInt(String(draft.energy), 10) || 0,
            strength: parseInt(String(draft.strength), 10) || 0,
            patience: parseInt(String(draft.patience), 10) || 0,
            luck: parseInt(String(draft.luck), 10) || 0,
            charisma: parseInt(String(draft.charisma), 10) || 0,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Ошибка");
        setSaving(false);
        return;
      }
      router.refresh();
      onCancel();
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  }

  async function remove() {
    if (!confirm(`Удалить игрока ${player.nickname}? Действие необратимо.`)) return;
    try {
      const res = await fetch(`/api/admin/player/${player.id}`, { method: "DELETE" });
      if (!res.ok) {
        alert("Не удалось удалить");
        return;
      }
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  }

  async function giveItem(itemId: string) {
    try {
      const res = await fetch(`/api/admin/inventory/give`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: player.id, itemId }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Ошибка");
        return;
      }
      router.refresh();
      onCloseGiveItem();
    } catch (e) {
      console.error(e);
    }
  }

  async function removeItem(invItemId: string) {
    if (!confirm("Удалить предмет?")) return;
    try {
      const res = await fetch(`/api/admin/inventory/give?invItemId=${invItemId}`, {
        method: "DELETE",
      });
      if (!res.ok) return;
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="parchment" style={{
      padding: "1rem 1.25rem",
      ...(player.isAdmin && { borderColor: "var(--color-gold-dim)" }),
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: isEditing ? "1rem" : 0, flexWrap: "wrap" }}>
        {player.user?.image && (
          <img src={player.user.image} alt="" style={{
            width: "36px", height: "36px", borderRadius: "50%",
            border: `1px solid ${player.isAdmin ? "var(--color-gold)" : "var(--color-border-bright)"}`,
          }} />
        )}
        <div style={{ flex: 1, minWidth: "200px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <span style={{ color: "var(--color-text-bright)", fontWeight: 500 }}>
              {player.nickname}
            </span>
            {player.isAdmin && (
              <span style={{ color: "var(--color-gold)", fontSize: "0.7rem", letterSpacing: "0.1em" }}>★ АДМИН</span>
            )}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--color-text-dim)", fontStyle: "italic" }}>
            {player.class ?? "без класса"} · ур. {player.level} · 🪙 {player.points} · ⚡ {player.energy}/3
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.4rem" }}>
          {!isEditing ? (
            <>
              <button onClick={onGiveItem} style={miniBtn}>
                <Plus size={12} /> Предмет
              </button>
              <button onClick={onEdit} style={miniBtn}>
                <Edit size={12} /> Править
              </button>
              <button onClick={remove} style={{ ...miniBtn, borderColor: "var(--color-blood-bright)", color: "var(--color-blood-bright)" }}>
                <Trash2 size={12} />
              </button>
            </>
          ) : (
            <>
              <button onClick={save} disabled={saving} style={{ ...miniBtn, borderColor: "var(--color-gold)", color: "var(--color-gold)" }}>
                {saving ? <Loader2 size={12} className="spin" /> : <Save size={12} />} Сохранить
              </button>
              <button onClick={onCancel} style={miniBtn}>
                <X size={12} /> Отмена
              </button>
            </>
          )}
        </div>
      </div>

      {isEditing && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.5rem" }}>
          <Field label="Никнейм">
            <input value={draft.nickname} onChange={(e) => setDraft({ ...draft, nickname: e.target.value })} style={inputStyle} />
          </Field>
          <Field label="Класс">
            <select value={draft.class} onChange={(e) => setDraft({ ...draft, class: e.target.value })} style={inputStyle}>
              <option value="">— нет —</option>
              {CLASSES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Регион">
            <select value={draft.currentRegion} onChange={(e) => setDraft({ ...draft, currentRegion: e.target.value })} style={inputStyle}>
              <option value="">— нет —</option>
              {REGIONS.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </Field>
          <Field label="Уровень"><input type="number" value={draft.level} onChange={(e) => setDraft({ ...draft, level: parseInt(e.target.value) || 1 })} style={inputStyle} /></Field>
          <Field label="Поинты"><input type="number" value={draft.points} onChange={(e) => setDraft({ ...draft, points: parseInt(e.target.value) || 0 })} style={inputStyle} /></Field>
          <Field label="Энергия"><input type="number" value={draft.energy} onChange={(e) => setDraft({ ...draft, energy: parseInt(e.target.value) || 0 })} style={inputStyle} /></Field>
          <Field label="СИЛ"><input type="number" value={draft.strength} onChange={(e) => setDraft({ ...draft, strength: parseInt(e.target.value) || 0 })} style={inputStyle} /></Field>
          <Field label="ТЕР"><input type="number" value={draft.patience} onChange={(e) => setDraft({ ...draft, patience: parseInt(e.target.value) || 0 })} style={inputStyle} /></Field>
          <Field label="УДЧ"><input type="number" value={draft.luck} onChange={(e) => setDraft({ ...draft, luck: parseInt(e.target.value) || 0 })} style={inputStyle} /></Field>
          <Field label="ХАР"><input type="number" value={draft.charisma} onChange={(e) => setDraft({ ...draft, charisma: parseInt(e.target.value) || 0 })} style={inputStyle} /></Field>
          <Field label="Админ">
            <select value={String(draft.isAdmin)} onChange={(e) => setDraft({ ...draft, isAdmin: e.target.value === "true" })} style={inputStyle}>
              <option value="false">нет</option>
              <option value="true">да</option>
            </select>
          </Field>
        </div>
      )}

      {player.inventory?.length > 0 && (
        <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid var(--color-border)" }}>
          <div style={{ fontSize: "0.7rem", color: "var(--color-text-dim)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.4rem" }}>
            Инвентарь
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
            {player.inventory.map((inv: any) => (
              <button
                key={inv.id}
                onClick={() => removeItem(inv.id)}
                title={`${inv.item.name} — кликни чтобы удалить`}
                style={{
                  padding: "0.2rem 0.5rem",
                  background: "var(--color-bg-tertiary)",
                  border: "1px solid var(--color-border-bright)",
                  color: "var(--color-text)",
                  fontSize: "0.7rem",
                  cursor: "pointer",
                }}
              >
                {inv.item.name} ✕
              </button>
            ))}
          </div>
        </div>
      )}

      {giveItemOpen && (
        <GiveItemModal items={items} onChoose={giveItem} onClose={onCloseGiveItem} playerName={player.nickname} />
      )}
    </div>
  );
}

function Field({ label, children }: any) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
      <span style={{ fontSize: "0.65rem", color: "var(--color-text-dim)", letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</span>
      {children}
    </label>
  );
}

function GiveItemModal({ items, onChoose, onClose, playerName }: any) {
  const [filter, setFilter] = useState("");
  const filtered = items.filter((i: any) =>
    i.name.toLowerCase().includes(filter.toLowerCase()) || i.id.includes(filter)
  );
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "var(--color-bg-secondary)",
        border: "1px solid var(--color-gold-dim)",
        padding: "1.5rem",
        width: "100%",
        maxWidth: "500px",
        maxHeight: "80vh",
        overflow: "auto",
      }}>
        <h3 style={{ marginBottom: "1rem", color: "var(--color-gold)" }}>Выдать предмет: {playerName}</h3>
        <input
          placeholder="Поиск..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ ...inputStyle, marginBottom: "1rem", width: "100%" }}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
          {filtered.map((item: any) => (
            <button
              key={item.id}
              onClick={() => onChoose(item.id)}
              style={{
                textAlign: "left",
                padding: "0.5rem 0.8rem",
                background: "var(--color-bg)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text)",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <div style={{ fontSize: "0.9rem" }}>{item.name}</div>
              <div style={{ fontSize: "0.7rem", color: "var(--color-text-dim)" }}>
                {item.rarity} · {item.category}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// БЕЛЫЙ СПИСОК
// ============================================
function WhitelistTab({ whitelist, accounts }: any) {
  const router = useRouter();
  const [discordId, setDiscordId] = useState("");
  const [note, setNote] = useState("");
  const [adding, setAdding] = useState(false);

  const accountsByDiscordId = new Map<string, { id: string; name: string | null }>(
  accounts.map((a: any) => [a.providerAccountId, a.user])
);

  async function add() {
    if (!discordId.trim()) return alert("Впиши Discord ID");
    setAdding(true);
    try {
      const res = await fetch("/api/admin/whitelist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discordId: discordId.trim(), note: note.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Ошибка");
        setAdding(false);
        return;
      }
      setDiscordId("");
      setNote("");
      router.refresh();
    } catch (e) {
      console.error(e);
    }
    setAdding(false);
  }

  async function remove(id: string) {
    if (!confirm("Удалить из белого списка?")) return;
    try {
      const res = await fetch(`/api/admin/whitelist?id=${id}`, { method: "DELETE" });
      if (!res.ok) return;
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div>
      <div className="parchment" style={{ padding: "1.25rem", marginBottom: "1rem" }}>
        <h3 style={{ marginBottom: "0.75rem", color: "var(--color-gold)" }}>Внести имя в свиток</h3>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <input
            placeholder="Discord ID (например 123456789012345678)"
            value={discordId} onChange={(e) => setDiscordId(e.target.value)}
            style={{ ...inputStyle, flex: 1, minWidth: "200px" }}
          />
          <input
            placeholder="Заметка (имя друга)"
            value={note} onChange={(e) => setNote(e.target.value)}
            style={{ ...inputStyle, flex: 1, minWidth: "200px" }}
          />
          <button onClick={add} disabled={adding} className="btn-dark" style={{ minWidth: "100px" }}>
            {adding ? <Loader2 size={14} className="spin" /> : <><Plus size={14} style={{ marginRight: "0.3rem" }} /> Добавить</>}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        {whitelist.map((entry: any) => {
          const linkedUser = accountsByDiscordId.get(entry.discordId);
          return (
            <div key={entry.id} style={{
              padding: "0.7rem 1rem",
              background: "var(--color-bg-secondary)",
              border: "1px solid var(--color-border)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              flexWrap: "wrap", gap: "0.5rem",
            }}>
              <div>
                <div style={{ color: "var(--color-text-bright)", fontSize: "0.9rem" }}>
                  {entry.note || "(без заметки)"}
                  {linkedUser ? (
                    <span style={{ color: "var(--color-gold)", marginLeft: "0.5rem", fontSize: "0.75rem" }}>
                      ✓ залогинен ({linkedUser.name})
                    </span>
                  ) : (
                    <span style={{ color: "var(--color-text-dim)", marginLeft: "0.5rem", fontSize: "0.75rem", fontStyle: "italic" }}>
                      ожидает входа
                    </span>
                  )}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-dim)", fontFamily: "monospace" }}>
                  {entry.discordId}
                </div>
              </div>
              <button onClick={() => remove(entry.id)} style={{ ...miniBtn, borderColor: "var(--color-blood-bright)", color: "var(--color-blood-bright)" }}>
                <Trash2 size={12} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// ИГРЫ
// ============================================
function GamesTab({ games }: any) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
      {games.map((g: any) => (
        <div key={g.id} style={{
          padding: "0.7rem 1rem",
          background: "var(--color-bg-secondary)",
          border: "1px solid var(--color-border)",
          borderLeft: `3px solid ${
            g.status === "ACTIVE" ? "var(--color-gold)" :
            g.status === "COMPLETED" ? "var(--color-gold-dim)" :
            "var(--color-blood-bright)"
          }`,
          display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem",
        }}>
          <div>
            <span style={{
              fontSize: "0.65rem",
              letterSpacing: "0.15em",
              color: g.status === "ACTIVE" ? "var(--color-gold)" :
                     g.status === "COMPLETED" ? "var(--color-gold-dim)" :
                     "var(--color-blood-bright)",
              marginRight: "0.5rem",
            }}>
              {g.status}
            </span>
            <strong style={{ color: "var(--color-text-bright)" }}>{g.title}</strong>
            <span style={{ color: "var(--color-text-dim)", marginLeft: "0.5rem", fontSize: "0.85rem" }}>
              · {g.player.nickname} · {g.region}
            </span>
          </div>
          <div style={{
            color: g.pointsEarned >= 0 ? "var(--color-gold)" : "var(--color-blood-bright)",
            fontFamily: "var(--font-cinzel)",
          }}>
            {g.pointsEarned > 0 ? "+" : ""}{g.pointsEarned}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// СЕЗОНЫ
// ============================================
function SeasonsTab({ currentSeason, allSeasons }: any) {
  const router = useRouter();
  const [newName, setNewName] = useState("");
  const [newTheme, setNewTheme] = useState("");
  const [loading, setLoading] = useState(false);

  async function action(actionType: string, extra: Record<string, any> = {}) {
    if (!confirm(`Подтвердить действие: ${actionType}? Действие глобальное.`)) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/global", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: actionType, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Ошибка");
      } else {
        alert("Готово");
      }
      router.refresh();
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div className="parchment" style={{ padding: "1.5rem" }}>
        <h3 style={{ marginBottom: "1rem", color: "var(--color-gold)" }}>Текущий сезон</h3>
        {currentSeason ? (
          <div>
            <div style={{ marginBottom: "0.5rem" }}>
              <span style={{ color: "var(--color-gold)", fontSize: "1.1rem", fontFamily: "var(--font-cinzel)" }}>
                #{currentSeason.number} — {currentSeason.name}
              </span>
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--color-text-dim)", marginBottom: "1rem" }}>
              Запущен: {new Date(currentSeason.startedAt).toLocaleString("ru")}
            </div>
            <button
              onClick={() => action("end_season")}
              disabled={loading}
              className="btn-dark"
              style={{ borderColor: "var(--color-blood-bright)", color: "var(--color-blood-bright)" }}
            >
              {loading ? <Loader2 size={14} className="spin" /> : "Закрыть сезон"}
            </button>
          </div>
        ) : (
          <p style={{ color: "var(--color-text-dim)", fontStyle: "italic" }}>
            Нет активного сезона.
          </p>
        )}
      </div>

      <div className="parchment" style={{ padding: "1.5rem", borderColor: "var(--color-gold-dim)" }}>
        <h3 style={{ marginBottom: "0.5rem", color: "var(--color-gold)" }}>Запустить новый сезон</h3>
        <div style={{
          padding: "0.5rem 0.75rem",
          background: "rgba(184, 90, 90, 0.1)",
          border: "1px solid rgba(184, 90, 90, 0.3)",
          fontSize: "0.8rem",
          color: "#d49a9a",
          marginBottom: "1rem",
          display: "flex", alignItems: "center", gap: "0.5rem",
        }}>
          <AlertTriangle size={14} /> Сбросит ВСЕХ игроков: поинты, инвентарь, активные игры. EXP делится пополам. Класс и уровень сохраняются.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
          <input placeholder="Название сезона" value={newName} onChange={(e) => setNewName(e.target.value)} style={inputStyle} />
          <input placeholder="Тема (опционально)" value={newTheme} onChange={(e) => setNewTheme(e.target.value)} style={inputStyle} />
        </div>
        <button
          onClick={() => action("start_season", { name: newName, theme: newTheme })}
          disabled={loading || !newName.trim()}
          className="btn-dark"
          style={{ width: "100%" }}
        >
          {loading ? <Loader2 size={14} className="spin" /> : "Запустить новый сезон"}
        </button>
      </div>

      <div className="parchment" style={{ padding: "1.5rem" }}>
        <h3 style={{ marginBottom: "1rem", color: "var(--color-gold)" }}>Быстрые действия (все игроки)</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
          <button onClick={() => action("reset_energy")} disabled={loading} className="btn-dark">
            ⏰ Сбросить энергию (полночь)
          </button>
          <button onClick={() => action("give_energy_all", { amount: 1 })} disabled={loading} className="btn-dark">
            ⚡ Дать +1 ход всем
          </button>
        </div>
      </div>

      {allSeasons.length > 0 && (
        <div className="parchment" style={{ padding: "1.5rem" }}>
          <h3 style={{ marginBottom: "1rem", color: "var(--color-gold)" }}>История сезонов</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {allSeasons.map((s: any) => (
              <div key={s.id} style={{
                padding: "0.5rem 0.75rem",
                background: "var(--color-bg-tertiary)",
                border: "1px solid var(--color-border)",
                fontSize: "0.85rem",
                display: "flex", justifyContent: "space-between",
              }}>
                <span>#{s.number} — {s.name} {!s.endedAt && <span style={{ color: "var(--color-gold)" }}>(активный)</span>}</span>
                <span style={{ color: "var(--color-text-dim)" }}>
                  {new Date(s.startedAt).toLocaleDateString("ru")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ===== СТИЛИ =====
const inputStyle: React.CSSProperties = {
  padding: "0.4rem 0.6rem",
  background: "var(--color-bg)",
  border: "1px solid var(--color-border-bright)",
  color: "var(--color-text-bright)",
  fontSize: "0.85rem",
  fontFamily: "inherit",
  outline: "none",
};

const miniBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.25rem",
  padding: "0.3rem 0.6rem",
  background: "transparent",
  color: "var(--color-text-dim)",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "var(--color-border-bright)",
  fontSize: "0.7rem",
  cursor: "pointer",
  fontFamily: "inherit",
  letterSpacing: "0.05em",
};
