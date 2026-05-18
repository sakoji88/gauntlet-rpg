"use client";

import { useState } from "react";
import { BookOpen, Package } from "lucide-react";
import BackLink from "@/app/components/BackLink";
import {
  RARITY_COLORS,
  RARITY_NAMES,
  CATEGORY_NAMES,
  ItemRarity,
  ItemCategory,
} from "@/lib/items";

interface CodexItem {
  id: string;
  name: string;
  description: string;
  category: string;
  rarity: string;
  iconKey: string;
  isTrap: boolean;
  rollWeight: number;
}

const RARITY_ORDER: Record<string, number> = {
  COMMON: 0,
  RARE: 1,
  EPIC: 2,
  LEGENDARY: 3,
};

const CATEGORY_ORDER: ItemCategory[] = [
  "CONSUMABLE",
  "EQUIPMENT",
  "ARTIFACT",
  "TRAP",
  "COSMETIC",
];

export default function CodexView({ items }: { items: CodexItem[] }) {
  const [tab, setTab] = useState<"rules" | "items">("rules");

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
      <BackLink />

      <h1 style={{ fontSize: "2.2rem", color: "var(--color-gold)", marginBottom: "0.25rem" }}>
        Кодекс Темнодушного Лета
      </h1>
      <p
        style={{
          color: "var(--color-text-dim)",
          fontStyle: "italic",
          marginBottom: "1.5rem",
        }}
      >
        Свод законов Бездны и опись всего, что может выпасть путнику.
      </p>

      {/* Табы */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem" }}>
        <TabButton active={tab === "rules"} onClick={() => setTab("rules")}>
          <BookOpen size={16} /> Правила
        </TabButton>
        <TabButton active={tab === "items"} onClick={() => setTab("items")}>
          <Package size={16} /> Предметы ({items.length})
        </TabButton>
      </div>

      {tab === "rules" ? <Rules /> : <ItemsCatalog items={items} />}
    </main>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.4rem",
        padding: "0.55rem 1.25rem",
        background: active ? "var(--color-bg-tertiary)" : "transparent",
        border: `1px solid ${active ? "var(--color-gold)" : "var(--color-border)"}`,
        color: active ? "var(--color-gold)" : "var(--color-text-dim)",
        cursor: "pointer",
        fontFamily: "var(--font-cinzel)",
        fontSize: "0.85rem",
        letterSpacing: "0.05em",
      }}
    >
      {children}
    </button>
  );
}

// ===================== ПРАВИЛА =====================
function Rules() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <RuleBlock title="Цель">
        21 день. Победитель — у кого больше всех <b>поинтов</b> в день 21. Всё решает
        стратегия, а не количество свободного времени: ходов у всех поровну.
      </RuleBlock>

      <RuleBlock title="Энергия и ходы">
        <b>3 хода в день</b>, обнуляются в полночь (UTC). Не копятся. Ход тратится на:
        ролл новой игры, перемещение по карте (1 — сосед, 2 — далеко), бросок ловушки
        (Урка — бесплатно). Бесплатно: засчитать игру, крутить колесо предметов,
        использовать предмет, говорить с NPC, заходить в Лавку.
      </RuleBlock>

      <RuleBlock title="Карта и регионы">
        8 регионов + Тюрьма. Игрок всегда в одном регионе. Регион даёт: квесты своего
        NPC, жанры ролла, пассивный бонус. Алхимика не пускают в Терем Костаная.
      </RuleBlock>

      <RuleBlock title="Поинты и Злато">
        <b>Поинты</b> — счёт на лидерборде. База за игру +3, жанровые условия +6,
        особые — больше. Первым прошёл игру в сезоне — +2. Квест NPC — +5…+10.
        Потолок <b>25 поинтов за одну игру</b> (анти-абуз, действует даже со всеми баффами).
        <br />
        <b>Злато</b> — мягкая валюта Лавки Романала. Капает +3 за игру, +5 за квест.
        На лидерборд не влияет — трать спокойно.
      </RuleBlock>

      <RuleBlock title="Статы и уровни">
        4 стата: Сила (hardcore-игры), Терпение (длинные игры), Удача (редкость на
        колесе), Харизма (квесты). За каждый уровень — <b>3 очка</b> в статы по выбору.
        EXP: +10 за игру, +30 за квест.
      </RuleBlock>

      <RuleBlock title="Тюрьма">
        Дроп игры = −2 поинта и этап в Тюрьму. Оттуда нельзя двигаться и брать обычные
        квесты. Чтобы выйти — пройти убогую и долгую тюремную игру. За стойкость —
        бонусные поинты.
      </RuleBlock>

      <RuleBlock title="Квесты и Дух Перова">
        У каждого NPC своя линия квестов (стартовый → сюжет → побочки), открываются по
        классу и уровню. Дух Гомодрила Перова приходит сам — с легендарным испытанием
        (+20 поинтов и Сосуд Перова). Отказ Перову — штраф и дебафф.
      </RuleBlock>

      <RuleBlock title="PvP">
        Ловушки — вешаются на других (−ходы или −поинты жертве). Дуэли — договорная
        игра, победитель забирает поинты. Кража — только Урка. Корона Короля — на
        лидере сезона, за победу над ним в дуэли +5.
      </RuleBlock>

      <RuleBlock title="Предметы и колесо">
        После пройденной игры — крути <b>колесо предметов</b>. Редкость: Обычное (50%),
        Редкое (30%), Эпическое (15%), Легендарное (5%). Инвентарь — <b>6 слотов</b>.
        С колеса может выпасть и <b>проклятье</b> (☠ дебафф) — следи за описанием.
        Косметика (рамки, титулы) с колеса не падает — только за квесты.
      </RuleBlock>

      <RuleBlock title="Победа и Личное Наказание">
        День 21, подсчёт поинтов — победитель получает титул и Корону на след. сезон.
        Последнее место — антипризы и <b>Личное Наказание</b>, которое каждый вписывает
        себе сам до старта сезона. Видно всем — это часть давления.
      </RuleBlock>
    </div>
  );
}

function RuleBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: "1.1rem 1.35rem",
        background: "var(--color-bg-secondary)",
        border: "1px solid var(--color-border)",
      }}
    >
      <h3
        style={{
          fontSize: "1.05rem",
          color: "var(--color-gold)",
          marginBottom: "0.5rem",
          letterSpacing: "0.05em",
        }}
      >
        {title}
      </h3>
      <p style={{ color: "var(--color-text)", lineHeight: 1.6, margin: 0, fontSize: "0.95rem" }}>
        {children}
      </p>
    </div>
  );
}

// ===================== ПРЕДМЕТЫ =====================
function ItemsCatalog({ items }: { items: CodexItem[] }) {
  const groups = CATEGORY_ORDER.map((cat) => ({
    cat,
    list: items
      .filter((i) => i.category === cat)
      .sort(
        (a, b) =>
          (RARITY_ORDER[a.rarity] ?? 0) - (RARITY_ORDER[b.rarity] ?? 0) ||
          a.name.localeCompare(b.name),
      ),
  })).filter((g) => g.list.length > 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {groups.map((g) => (
        <div key={g.cat}>
          <h2
            style={{
              fontSize: "1.2rem",
              color: "var(--color-gold)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: "1rem",
            }}
          >
            {CATEGORY_NAMES[g.cat]} · {g.list.length}
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "0.85rem",
            }}
          >
            {g.list.map((it) => (
              <ItemCard key={it.id} item={it} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ItemCard({ item }: { item: CodexItem }) {
  const colors = RARITY_COLORS[item.rarity as ItemRarity];
  return (
    <div
      style={{
        display: "flex",
        gap: "0.75rem",
        padding: "0.85rem",
        background: "var(--color-bg-secondary)",
        border: `1px solid ${colors.border}`,
      }}
    >
      <ItemIcon iconKey={item.iconKey} rarity={item.rarity} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "0.4rem" }}>
          <span style={{ color: colors.text, fontWeight: 600, fontSize: "0.95rem" }}>
            {item.name}
          </span>
          <span
            style={{
              fontSize: "0.58rem",
              color: colors.text,
              opacity: 0.7,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}
          >
            {RARITY_NAMES[item.rarity as ItemRarity]}
          </span>
        </div>
        <div
          style={{
            fontSize: "0.62rem",
            color: "var(--color-text-dim)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginTop: "0.1rem",
          }}
        >
          {item.isTrap ? "Ловушка" : CATEGORY_NAMES[item.category as ItemCategory]}
          {item.rollWeight === 0 && " · не с колеса"}
        </div>
        <p
          style={{
            fontSize: "0.8rem",
            color: "var(--color-text)",
            lineHeight: 1.45,
            margin: "0.35rem 0 0",
          }}
        >
          {item.description}
        </p>
      </div>
    </div>
  );
}

// Иконка предмета: пробует /images/items/{iconKey}.png, при ошибке — заглушка-ромб.
function ItemIcon({ iconKey, rarity }: { iconKey: string; rarity: string }) {
  const [failed, setFailed] = useState(false);
  const colors = RARITY_COLORS[rarity as ItemRarity];
  if (failed) {
    return (
      <div
        style={{
          width: "48px",
          height: "48px",
          flexShrink: 0,
          border: `1px solid ${colors.border}`,
          background: "var(--color-bg-tertiary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: colors.text,
          fontSize: "1.1rem",
        }}
      >
        ✦
      </div>
    );
  }
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={`/images/items/${iconKey}.png`}
      alt=""
      onError={() => setFailed(true)}
      style={{
        width: "48px",
        height: "48px",
        flexShrink: 0,
        objectFit: "cover",
        border: `1px solid ${colors.border}`,
      }}
    />
  );
}
