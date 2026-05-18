import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import PageBackdrop from "@/app/components/PageBackdrop";
import Avatar from "@/app/components/Avatar";
import { getTitleText } from "@/lib/cosmetics";
import { Flame, Shield, MapPin, BookMarked, Package, Scroll, Swords, Crown, Coins } from "lucide-react";
import ActiveGamePanel from "./ActiveGamePanel";
import ClassActionPanel from "./ClassActionPanel";
import StealPanel from "./StealPanel";
import StatDistributionPanel from "./StatDistributionPanel";
import PunishmentPactPanel from "./PunishmentPactPanel";
import { getClassActionForPlayer, classActionCooldownLeft } from "@/lib/class-actions";
import { parseActiveBuffs, findBuff } from "@/lib/active-buffs";
import { getTrapByBuffKey, TRAP_BUFF_KEYS } from "@/lib/trap-effects";
import { getCrownHolderId } from "@/lib/crown";
import { ensureEnergyReset } from "@/lib/energy";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  const userId = (session.user as any).id;
  let playerFromDb = await prisma.player.findUnique({
    where: { userId },
  });

  if (!playerFromDb?.class) {
    redirect("/select-class");
  }

  // Автосброс энергии при заходе на профиль
  playerFromDb = await ensureEnergyReset(playerFromDb);

  // Активная игра, если есть
  const activeGame = playerFromDb.activeGameId
    ? await prisma.game.findUnique({
        where: { id: playerFromDb.activeGameId },
      })
    : null;

  // Классовая активка + кулдаун
  const classAction = getClassActionForPlayer(playerFromDb.class);
  const classActionCooldown = classActionCooldownLeft(playerFromDb.lastClassActionAt);

  // Корона Короля Стрима
  const crownHolderId = await getCrownHolderId();
  const wearsCrown = crownHolderId === playerFromDb.id;

  // Активные дуэли (для бейджа)
  const pendingDuels = await prisma.duel.count({
    where: {
      defenderId: playerFromDb.id,
      status: "PROPOSED",
    },
  });

  // Цели для кражи (только для Урки)
  let stealTargets: any[] = [];
  let stealCooldownLeft = 0;
  if (playerFromDb.class === "urka") {
    const others = await prisma.player.findMany({
      where: { id: { not: playerFromDb.id }, class: { not: null } },
      include: {
        inventory: {
          where: { charges: { gt: 0 } },
          include: { item: true },
        },
      },
    });
    stealTargets = others
      .map((p: typeof others[number]) => ({
        id: p.id,
        nickname: p.nickname,
        level: p.level,
        luck: p.luck,
        items: p.inventory
          .filter((inv: typeof p.inventory[number]) =>
            inv.item.category !== "COSMETIC" && inv.item.rarity !== "LEGENDARY"
          )
          .map((inv: typeof p.inventory[number]) => ({
            inventoryItemId: inv.id,
            itemName: inv.item.name,
            rarity: inv.item.rarity,
            category: inv.item.category,
          })),
      }))
      .filter((t: { items: any[] }) => t.items.length > 0);

    if (playerFromDb.lastStealAt) {
      const passed = Date.now() - playerFromDb.lastStealAt.getTime();
      stealCooldownLeft = Math.max(0, 24 * 60 * 60 * 1000 - passed);
    }
  }

  // Список fusable items для Алхимика (по 3+ одинаковых, расходники/экипировка)
  let fusableItems: { itemId: string; itemName: string; count: number }[] = [];
  if (playerFromDb.class === "alchemist") {
    const grouped = await prisma.inventoryItem.groupBy({
      by: ["itemId"],
      where: {
        playerId: playerFromDb.id,
        charges: { gt: 0 },
        item: { category: { in: ["CONSUMABLE", "EQUIPMENT"] } },
      },
      _count: { _all: true },
    });
    const tripleStacks = grouped.filter((g: typeof grouped[number]) => g._count._all >= 3);
    if (tripleStacks.length > 0) {
      const items = await prisma.item.findMany({
        where: { id: { in: tripleStacks.map((g: typeof tripleStacks[number]) => g.itemId) } },
      });
      fusableItems = tripleStacks.map((g: typeof tripleStacks[number]) => ({
        itemId: g.itemId,
        itemName: items.find((i: typeof items[number]) => i.id === g.itemId)?.name ?? g.itemId,
        count: g._count._all,
      }));
    }
  }

  // Последние пройденные/дропнутые игры (для лога)
  const recentGames = await prisma.game.findMany({
    where: {
      playerId: playerFromDb.id,
      status: { not: "ACTIVE" },
    },
    orderBy: { completedAt: "desc" },
    take: 5,
  });

  const user = session.user;
  const player = playerFromDb;
  const isAdmin = player.isAdmin === true;

  return (
    <>
      <PageBackdrop image="profile.jpg" accent="#d4a574" />
      <main style={{
      position: "relative",
      zIndex: 2,
      minHeight: "100vh",
      padding: "3rem 2rem",
      maxWidth: "900px",
      margin: "0 auto",
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "2.5rem",
        flexWrap: "wrap",
        gap: "1rem",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Flame size={32} color="var(--color-gold)" className="flicker" />
          <h1 style={{ fontSize: "2rem", color: "var(--color-gold)" }}>
            Профиль путника
          </h1>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <Link
          href="/inventory"
           className="btn-dark"
           style={{ fontSize: "0.85rem", padding: "0.6rem 1.5rem" }}
>
             <Package size={16} style={{ marginRight: "0.5rem" }} />
            Инвентарь
          </Link>
          <Link
            href="/quests"
            className="btn-dark"
            style={{ fontSize: "0.85rem", padding: "0.6rem 1.5rem" }}
          >
            <Scroll size={16} style={{ marginRight: "0.5rem" }} />
            Свиток квестов
          </Link>
          <Link
            href="/shop"
            className="btn-dark"
            style={{ fontSize: "0.85rem", padding: "0.6rem 1.5rem" }}
          >
            <Coins size={16} style={{ marginRight: "0.5rem" }} />
            Лавка
          </Link>
          <Link
            href="/codex"
            className="btn-dark"
            style={{ fontSize: "0.85rem", padding: "0.6rem 1.5rem" }}
          >
            <BookMarked size={16} style={{ marginRight: "0.5rem" }} />
            Кодекс
          </Link>
          <Link
            href="/duels"
            className="btn-dark"
            style={{
              fontSize: "0.85rem",
              padding: "0.6rem 1.5rem",
              borderColor: "var(--color-blood-bright)",
              color: "var(--color-blood-bright)",
            }}
          >
            <Swords size={16} style={{ marginRight: "0.5rem" }} />
            Дуэли
          </Link>
          <Link
            href="/feed"
            className="btn-dark"
            style={{ fontSize: "0.85rem", padding: "0.6rem 1.5rem" }}
          >
            <BookMarked size={16} style={{ marginRight: "0.5rem" }} />
            Хроники
          </Link>
          <Link
            href="/map"
            className="btn-dark"
            style={{ fontSize: "0.85rem", padding: "0.6rem 1.5rem" }}
          >
            <MapPin size={16} style={{ marginRight: "0.5rem" }} />
            К карте
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className="btn-dark"
              style={{ fontSize: "0.85rem", padding: "0.6rem 1.5rem" }}
            >
              <Shield size={16} style={{ marginRight: "0.5rem" }} />
              Админка
            </Link>
          )}
        </div>
      </div>

      {/* Карточка профиля */}
      <div className="parchment" style={{
        padding: "2rem",
        marginBottom: "1.5rem",
        ...(isAdmin && {
          borderColor: "var(--color-gold-dim)",
          boxShadow: "0 0 30px rgba(212, 165, 116, 0.1)",
        }),
      }}>
        <div style={{ display: "flex", gap: "2rem", alignItems: "center", marginBottom: "2rem" }}>
          {user.image && (
            <div style={{ position: "relative" }}>
              <Avatar
                src={user.image}
                size={100}
                frameId={player?.equippedFrameId}
                alt="Аватар"
              />
              {isAdmin && (
                <div style={{
                  position: "absolute",
                  bottom: "-4px",
                  right: "-4px",
                  background: "var(--color-bg)",
                  border: "2px solid var(--color-gold)",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <Shield size={16} color="var(--color-gold)" />
                </div>
              )}
            </div>
          )}
          <div>
            <h2 style={{ marginBottom: getTitleText(player?.equippedTitleId) ? "0.15rem" : "0.5rem" }}>
              {player?.nickname || user.name}
            </h2>
            {getTitleText(player?.equippedTitleId) && (
              <div style={{
                color: "var(--color-gold)",
                fontFamily: "var(--font-cinzel)",
                fontSize: "0.8rem",
                letterSpacing: "0.08em",
                marginBottom: "0.5rem",
              }}>
                ◈ {getTitleText(player?.equippedTitleId)}
              </div>
            )}
            <p style={{ color: "var(--color-text-dim)", fontStyle: "italic" }}>
              {isAdmin && (
                <span style={{ color: "var(--color-gold)", marginRight: "0.5rem" }}>
                  ★ Хранитель Списка ★
                </span>
              )}
              {player?.class || "Класс не выбран"} · Уровень {player?.level || 1}
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
          <StatBlock label="Сила" value={player?.strength || 10} />
          <StatBlock label="Терпение" value={player?.patience || 10} />
          <StatBlock label="Удача" value={player?.luck || 10} />
          <StatBlock label="Харизма" value={player?.charisma || 10} />
        </div>

        <div style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "1rem 0",
          borderTop: "1px solid var(--color-border)",
        }}>
          <div style={{ color: "var(--color-text-dim)" }}>
            Поинты: <span style={{ color: "var(--color-gold)" }}>{player?.points || 0}</span>
          </div>
          <div style={{ color: "var(--color-text-dim)" }}>
            Злато: <span style={{ color: "var(--color-gold)" }}>{player?.gold || 0}</span>
          </div>
          <div style={{ color: "var(--color-text-dim)" }}>
            Энергия: <span style={{ color: "var(--color-gold)" }}>{player?.energy ?? 3}/3</span>
          </div>
        </div>
      </div>

      {/* Активные ловушки на игроке — алармирующий бейдж */}
      {(() => {
        const buffs = parseActiveBuffs(playerFromDb.activeBuffs);
        const trapBuffs = buffs.filter((b) => TRAP_BUFF_KEYS.includes(b.effectKey));
        if (trapBuffs.length === 0) return null;
        return (
          <div style={{
            padding: "0.75rem 1rem",
            background: "rgba(184, 90, 90, 0.1)",
            border: "1px solid var(--color-blood-bright)",
            marginBottom: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.4rem",
          }}>
            <div style={{
              fontSize: "0.7rem",
              color: "var(--color-blood-bright)",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              fontFamily: "var(--font-cinzel)",
            }}>
              🩸 На тебе ловушки
            </div>
            {trapBuffs.map((b) => {
              const trap = getTrapByBuffKey(b.effectKey);
              const thrower = typeof b.payload?.throwerNickname === "string"
                ? b.payload.throwerNickname
                : "неизвестно";
              return (
                <div key={b.effectKey} style={{
                  fontSize: "0.85rem",
                  color: "var(--color-text-bright)",
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "0.5rem",
                }}>
                  <span>«{trap?.name ?? b.effectKey}» — {trap?.description}</span>
                  <span style={{ color: "var(--color-text-dim)" }}>
                    от {thrower}
                  </span>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Корона Стрима — носит лидер */}
      {wearsCrown && (
        <div style={{
          padding: "0.75rem 1.25rem",
          background: "rgba(212, 165, 116, 0.1)",
          border: "1px solid var(--color-gold)",
          marginBottom: "1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
          color: "var(--color-gold)",
          fontFamily: "var(--font-cinzel)",
          letterSpacing: "0.1em",
          fontSize: "0.85rem",
        }}>
          <Crown size={18} />
          На тебе Корона Короля Стрима. Победитель дуэли с тобой получит +5 поинтов.
        </div>
      )}

      {/* Уведомление о входящих дуэлях */}
      {pendingDuels > 0 && (
        <div style={{
          padding: "0.75rem 1.25rem",
          background: "rgba(184, 90, 90, 0.1)",
          border: "1px solid var(--color-blood-bright)",
          marginBottom: "1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
          color: "var(--color-blood-bright)",
        }}>
          <Swords size={16} />
          <span style={{ fontSize: "0.9rem" }}>
            Тебе бросили вызов — {pendingDuels} {pendingDuels === 1 ? "дуэль" : "дуэли"}.
          </span>
          <Link
            href="/duels"
            style={{
              marginLeft: "auto",
              color: "var(--color-blood-bright)",
              textDecoration: "underline",
              fontSize: "0.85rem",
            }}
          >
            На арену →
          </Link>
        </div>
      )}

      {/* Распределение очков статов (видно только при наличии очков) */}
      {player.unspentStatPoints > 0 && (
        <StatDistributionPanel
          strength={player.strength}
          patience={player.patience}
          luck={player.luck}
          charisma={player.charisma}
          unspentStatPoints={player.unspentStatPoints}
        />
      )}

      {/* Личное Наказание */}
      <PunishmentPactPanel initialText={player.punishmentPact} />

      {/* Классовая активка */}
      {classAction && (
        <ClassActionPanel
          action={classAction}
          cooldownLeftMs={classActionCooldown}
          fusableItems={fusableItems}
        />
      )}

      {/* Кража — только для Урки */}
      {playerFromDb.class === "urka" && (
        <StealPanel
          targets={stealTargets}
          cooldownLeftMs={stealCooldownLeft}
          myLuck={playerFromDb.luck}
        />
      )}

      {/* Активная игра */}
      {activeGame && (
        <ActiveGamePanel
          game={{
            ...activeGame,
            conditionType:
              activeGame.conditionType === "genre" || activeGame.conditionType === "special"
                ? activeGame.conditionType
                : "basic",
          }}
          activeHype={(() => {
            const buffs = parseActiveBuffs(playerFromDb.activeBuffs);
            const hypeBuff = findBuff(buffs, "class_hype");
            const promise = hypeBuff?.payload?.promise;
            return typeof promise === "string" ? promise : null;
          })()}
        />
      )}

      {/* Последние игры */}
      {recentGames.length > 0 && (
        <div className="parchment" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
          <h2 style={{
            fontSize: "1.2rem",
            marginBottom: "1rem",
            color: "var(--color-text-bright)",
          }}>
            Твоя летопись
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {recentGames.map((g: typeof recentGames[number]) => (
              <div key={g.id} style={{
                padding: "0.6rem 0.9rem",
                background: "var(--color-bg-tertiary)",
                border: "1px solid var(--color-border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "0.9rem",
                flexWrap: "wrap",
                gap: "0.5rem",
              }}>
                <div>
                  <span style={{
                    color: g.status === "COMPLETED" ? "var(--color-gold)" : "var(--color-blood-bright)",
                    marginRight: "0.5rem",
                    fontSize: "0.7rem",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                  }}>
                    {g.status === "COMPLETED" ? "✓ Пройдено" : "✕ Дроп"}
                  </span>
                  <span style={{ color: "var(--color-text-bright)" }}>{g.title}</span>
                </div>
                <span style={{
                  color: g.pointsEarned >= 0 ? "var(--color-gold)" : "var(--color-blood-bright)",
                  fontFamily: "var(--font-cinzel)",
                  fontSize: "0.9rem",
                }}>
                  {g.pointsEarned >= 0 ? "+" : ""}{g.pointsEarned}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}
        style={{ marginTop: "2rem", textAlign: "center" }}
      >
        <button type="submit" className="btn-dark">
          Покинуть Бездну
        </button>
      </form>
      </main>
    </>
  );
}

function StatBlock({ label, value }: { label: string; value: number }) {
  return (
    <div style={{
      textAlign: "center",
      padding: "1rem",
      background: "var(--color-bg-tertiary)",
      border: "1px solid var(--color-border)",
    }}>
      <div style={{
        fontSize: "0.75rem",
        color: "var(--color-text-dim)",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        marginBottom: "0.5rem",
      }}>
        {label}
      </div>
      <div style={{ fontSize: "1.75rem", color: "var(--color-gold)", fontFamily: "var(--font-cinzel)" }}>
        {value}
      </div>
    </div>
  );
}
