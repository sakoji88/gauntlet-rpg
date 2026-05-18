import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import PageBackdrop from "@/app/components/PageBackdrop";
import { ChevronLeft, Package, Sparkles } from "lucide-react";
import { RARITY_COLORS, RARITY_NAMES, CATEGORY_NAMES, ItemRarity, ItemCategory, ITEMS } from "@/lib/items";
import { isPassive } from "@/lib/item-effects";
import { parseActiveBuffs } from "@/lib/active-buffs";
import { getTrapByItemId } from "@/lib/trap-effects";
import UseItemButton from "./UseItemButton";
import ThrowTrapButton from "./TrapCard";
import EquipButton from "./EquipButton";
import { isFrameItem, isTitleItem } from "@/lib/cosmetics";

const INVENTORY_LIMIT = 6;

export default async function InventoryPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const userId = (session.user as any).id;
  const player = await prisma.player.findUnique({ where: { userId } });
  if (!player) redirect("/");
  if (!player.class) redirect("/select-class");

  const inventory = await prisma.inventoryItem.findMany({
    where: { playerId: player.id },
    include: { item: true },
    orderBy: { obtainedAt: "desc" },
  });

  const activeBuffs = parseActiveBuffs(player.activeBuffs);

  // Список возможных целей для броска ловушек (другие игроки с классом)
  const otherPlayers = await prisma.player.findMany({
    where: {
      id: { not: player.id },
      class: { not: null },
    },
    select: {
      id: true,
      nickname: true,
      class: true,
      level: true,
    },
    orderBy: { level: "desc" },
  });
  const targets = otherPlayers.map((p: typeof otherPlayers[number]) => ({
    id: p.id,
    nickname: p.nickname,
    className: p.class,
    level: p.level,
  }));
  const isUrka = player.class === "urka";

  // Заполняем до 6 пустыми слотами
  const slots: (typeof inventory[number] | null)[] = [
    ...inventory,
    ...Array.from({ length: Math.max(0, INVENTORY_LIMIT - inventory.length) }, () => null),
  ].slice(0, INVENTORY_LIMIT);

  return (
    <>
      <PageBackdrop image="inventory.jpg" accent="#8a6f4a" />
      <main style={{
      position: "relative",
      zIndex: 2,
      minHeight: "100vh",
      padding: "2rem",
      maxWidth: "1000px",
      margin: "0 auto",
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
          marginBottom: "1.5rem",
        }}
      >
        <ChevronLeft size={16} />
        Профиль
      </Link>

      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
        marginBottom: "2.5rem",
        flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Package size={32} color="var(--color-gold)" className="flicker" />
          <div>
            <h1 style={{ fontSize: "2rem", color: "var(--color-gold)", margin: 0 }}>
              Инвентарь
            </h1>
            <p style={{
              color: "var(--color-text-dim)",
              fontStyle: "italic",
              fontSize: "0.95rem",
              marginTop: "0.25rem",
            }}>
              {inventory.length}/{INVENTORY_LIMIT} занято
            </p>
          </div>
        </div>
      </div>

      {/* === АКТИВНЫЕ БАФФЫ === */}
      {activeBuffs.length > 0 && (
        <div style={{
          padding: "1rem 1.25rem",
          background: "var(--color-bg-secondary)",
          border: "1px solid var(--color-gold-dim)",
          marginBottom: "1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.75rem",
            color: "var(--color-gold)",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}>
            <Sparkles size={14} />
            Активные эффекты
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {activeBuffs.map((b) => {
              const itemDef = ITEMS.find((i) => i.id === b.sourceItemId);
              return (
                <span
                  key={b.effectKey}
                  style={{
                    fontSize: "0.8rem",
                    padding: "0.3rem 0.7rem",
                    background: "rgba(212,165,116,0.1)",
                    border: "1px solid var(--color-gold)",
                    color: "var(--color-gold)",
                    fontFamily: "var(--font-cinzel)",
                    letterSpacing: "0.05em",
                  }}
                >
                  ✦ {itemDef?.name ?? b.effectKey}
                </span>
              );
            })}
          </div>
        </div>
      )}

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: "1rem",
      }}>
        {slots.map((slot, idx) => {
          if (!slot) {
            return <EmptySlot key={`empty-${idx}`} />;
          }
          return (
            <ItemCard
              key={slot.id}
              invItem={slot}
              targets={targets}
              isUrka={isUrka}
              equippedFrameId={player.equippedFrameId}
              equippedTitleId={player.equippedTitleId}
            />
          );
        })}
      </div>

      {inventory.length === 0 && (
        <div style={{
          textAlign: "center",
          marginTop: "2rem",
          color: "var(--color-text-dim)",
          fontStyle: "italic",
        }}>
          Инвентарь пуст. Пройди игру — крутни колесо предметов.
        </div>
      )}
      </main>
    </>
  );
}

function EmptySlot() {
  return (
    <div style={{
      padding: "1.5rem",
      background: "var(--color-bg-secondary)",
      border: "1px dashed var(--color-border)",
      minHeight: "180px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "var(--color-text-dim)",
      fontSize: "0.85rem",
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      opacity: 0.5,
    }}>
      Пусто
    </div>
  );
}

function ItemCard({
  invItem,
  targets,
  isUrka,
  equippedFrameId,
  equippedTitleId,
}: {
  invItem: any;
  targets: any[];
  isUrka: boolean;
  equippedFrameId: string | null;
  equippedTitleId: string | null;
}) {
  const item = invItem.item;
  const colors = RARITY_COLORS[item.rarity as ItemRarity];
  return (
    <div style={{
      padding: "1.25rem",
      background: "var(--color-bg-secondary)",
      border: `1px solid ${colors.border}`,
      display: "flex",
      flexDirection: "column",
      gap: "0.5rem",
      minHeight: "180px",
      transition: "all 0.2s",
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "0.5rem",
      }}>
        <h3 style={{
          fontSize: "1.05rem",
          color: colors.text,
          margin: 0,
          lineHeight: 1.2,
        }}>
          {item.name}
        </h3>
        <span style={{
          fontSize: "0.65rem",
          color: colors.text,
          opacity: 0.7,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
        }}>
          {RARITY_NAMES[item.rarity as ItemRarity]}
        </span>
      </div>

      <div style={{
        fontSize: "0.7rem",
        color: "var(--color-text-dim)",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
      }}>
        {CATEGORY_NAMES[item.category as ItemCategory]}
        {invItem.charges > 1 && ` · заряды ${invItem.charges}`}
      </div>

      <p style={{
        fontSize: "0.85rem",
        color: "var(--color-text)",
        lineHeight: 1.5,
        margin: 0,
        marginTop: "0.25rem",
      }}>
        {item.description}
      </p>

      <div style={{ marginTop: "auto", paddingTop: "0.75rem" }}>
        {item.category === "TRAP" ? (
          getTrapByItemId(item.id) ? (
            <ThrowTrapButton
              inventoryItemId={invItem.id}
              itemName={item.name}
              itemDescription={item.description}
              targets={targets}
              isUrka={isUrka}
              color={colors.text}
            />
          ) : (
            <div style={{
              width: "100%",
              padding: "0.5rem",
              color: "var(--color-text-dim)",
              border: "1px dashed var(--color-border)",
              fontSize: "0.7rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              textAlign: "center",
              fontStyle: "italic",
            }}>
              Ловушка пока не реализована
            </div>
          )
        ) : item.effectKey ? (
          <UseItemButton
            inventoryItemId={invItem.id}
            isPassive={isPassive(item.effectKey)}
            hint={
              item.effectKey === "cheap_move"
                ? "Сапоги уже работают"
                : item.effectKey === "greed"
                ? "Кольцо уже на пальце"
                : "Работает пассивно"
            }
            color={colors.text}
          />
        ) : item.category === "COSMETIC" ? (
          isFrameItem(item.id) || isTitleItem(item.id) ? (
            <EquipButton
              itemId={item.id}
              slot={isFrameItem(item.id) ? "frame" : "title"}
              isEquipped={
                isFrameItem(item.id)
                  ? equippedFrameId === item.id
                  : equippedTitleId === item.id
              }
              color={colors.text}
            />
          ) : (
            <div style={{
              width: "100%",
              padding: "0.5rem",
              color: "var(--color-text-dim)",
              border: "1px dashed var(--color-border)",
              fontSize: "0.7rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              textAlign: "center",
              fontStyle: "italic",
            }}>
              Косметика — в коллекции
            </div>
          )
        ) : (
          <div style={{
            width: "100%",
            padding: "0.5rem",
            color: "var(--color-text-dim)",
            fontSize: "0.7rem",
            textAlign: "center",
            fontStyle: "italic",
          }}>
            Нет активного эффекта
          </div>
        )}
      </div>
    </div>
  );
}
