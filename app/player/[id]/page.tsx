import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import PageBackdrop from "@/app/components/PageBackdrop";
import Avatar from "@/app/components/Avatar";
import { getTitleText } from "@/lib/cosmetics";
import { ChevronLeft, MapPin, Coins, Zap, Trophy, Gamepad2, Package } from "lucide-react";
import { getClassById } from "@/lib/classes";
import { getRegionById } from "@/lib/regions";
import { RARITY_COLORS, ItemRarity } from "@/lib/items";

export default async function PublicPlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/");

  const userId = (session.user as any).id;
  const me = await prisma.player.findUnique({ where: { userId } });
  if (!me?.class) redirect("/select-class");

  const player = await prisma.player.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, image: true } },
      inventory: { include: { item: true } },
    },
  });

  if (!player) notFound();

  const isMe = player.userId === userId;

  // Активная игра (видна всем)
  const activeGame = player.activeGameId
    ? await prisma.game.findUnique({ where: { id: player.activeGameId } })
    : null;

  // Последние завершённые игры
  const recentGames = await prisma.game.findMany({
    where: {
      playerId: player.id,
      status: { not: "ACTIVE" },
    },
    orderBy: { completedAt: "desc" },
    take: 10,
  });

  const classData = getClassById(player.class);
  const region = getRegionById(player.currentRegion);

  return (
    <>
      <PageBackdrop image="profile.jpg" accent="#d4a574" />
      <main style={{
      position: "relative",
      zIndex: 2,
      minHeight: "100vh",
      padding: "2rem",
      maxWidth: "900px",
      margin: "0 auto",
    }}>
      <Link href="/feed" style={{
        display: "inline-flex", alignItems: "center", gap: "0.5rem",
        color: "var(--color-text-dim)", textDecoration: "none",
        fontSize: "0.9rem", marginBottom: "1.5rem",
      }}>
        <ChevronLeft size={16} />
        Хроники
      </Link>

      {/* Шапка с аватаркой */}
      <div className="parchment" style={{
        padding: "2rem",
        marginBottom: "1.5rem",
        ...(player.isAdmin && {
          borderColor: "var(--color-gold-dim)",
          boxShadow: "0 0 30px rgba(212, 165, 116, 0.1)",
        }),
      }}>
        <div style={{ display: "flex", gap: "2rem", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap" }}>
          {player.user?.image && (
            <Avatar
              src={player.user.image}
              size={120}
              frameId={player.equippedFrameId}
              alt=""
            />
          )}
          <div style={{ flex: 1, minWidth: "200px" }}>
            <h1 style={{ fontSize: "2rem", marginBottom: "0.25rem", color: "var(--color-text-bright)" }}>
              {player.nickname}
              {isMe && <span style={{ color: "var(--color-gold)", fontSize: "0.8rem", marginLeft: "0.5rem" }}>(это ты)</span>}
            </h1>
            {getTitleText(player.equippedTitleId) && (
              <div style={{
                color: "var(--color-gold)",
                fontFamily: "var(--font-cinzel)",
                fontSize: "0.85rem",
                letterSpacing: "0.08em",
                marginBottom: "0.5rem",
              }}>
                ◈ {getTitleText(player.equippedTitleId)}
              </div>
            )}
            <p style={{ color: "var(--color-text-dim)", fontStyle: "italic", marginBottom: "0.5rem" }}>
              {player.isAdmin && (
                <span style={{ color: "var(--color-gold)", marginRight: "0.5rem" }}>
                  ★ Хранитель Списка ★
                </span>
              )}
              {classData?.name ?? "Без класса"} · Уровень {player.level}
            </p>
            {classData && (
              <p style={{ color: "var(--color-text-dim)", fontStyle: "italic", fontSize: "0.85rem" }}>
                «{classData.tagline}»
              </p>
            )}
          </div>
        </div>

        {/* Статы */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem", marginBottom: "1.5rem" }}>
          <StatBlock label="Сила" value={player.strength} />
          <StatBlock label="Терпение" value={player.patience} />
          <StatBlock label="Удача" value={player.luck} />
          <StatBlock label="Харизма" value={player.charisma} />
        </div>

        {/* Поинты, энергия, регион */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "0.75rem",
          paddingTop: "1rem",
          borderTop: "1px solid var(--color-border)",
        }}>
          <InfoPill icon={<Coins size={14} />} label="Поинты" value={player.points} color="var(--color-gold)" />
          <InfoPill icon={<Zap size={14} />} label="Энергия" value={`${player.energy}/3`} color="var(--color-gold)" />
          {region && (
            <InfoPill icon={<MapPin size={14} />} label="Регион" value={region.shortName} color={region.accentColor} />
          )}
        </div>
      </div>

      {/* Личное Наказание (виден всем — часть давления) */}
      {player.punishmentPact && (
        <div style={{
          padding: "1rem 1.25rem",
          background: "rgba(139, 36, 36, 0.08)",
          border: "1px solid var(--color-blood-bright)",
          marginBottom: "1.5rem",
        }}>
          <div style={{
            fontFamily: "var(--font-cinzel)",
            color: "var(--color-blood-bright)",
            letterSpacing: "0.1em",
            fontSize: "0.8rem",
            marginBottom: "0.4rem",
            textTransform: "uppercase",
          }}>
            ☠ Личное Наказание
          </div>
          <p style={{
            color: "var(--color-text)",
            fontStyle: "italic",
            margin: 0,
            lineHeight: 1.55,
          }}>
            «{player.punishmentPact}»
          </p>
        </div>
      )}

      {/* Активная игра */}
      {activeGame && (
        <div className="parchment" style={{ padding: "1.25rem", marginBottom: "1.5rem", borderColor: "var(--color-gold-dim)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <Gamepad2 size={16} color="var(--color-gold)" />
            <span style={{
              fontSize: "0.7rem", color: "var(--color-text-dim)",
              letterSpacing: "0.15em", textTransform: "uppercase",
            }}>
              Сейчас проходит
            </span>
          </div>
          <div style={{ color: "var(--color-text-bright)", fontSize: "1.05rem", marginBottom: "0.25rem" }}>
            {activeGame.title}
          </div>
          {activeGame.link && (
            <a href={activeGame.link} target="_blank" rel="noopener noreferrer"
               style={{ color: "var(--color-gold)", fontSize: "0.8rem", textDecoration: "none" }}>
              ↗ Открыть ссылку
            </a>
          )}
        </div>
      )}

      {/* Инвентарь (только названия — без подробностей чужих предметов для интриги) */}
      {player.inventory.length > 0 && (
        <div className="parchment" style={{ padding: "1.25rem", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <Package size={16} color="var(--color-gold)" />
            <span style={{
              fontSize: "0.7rem", color: "var(--color-text-dim)",
              letterSpacing: "0.15em", textTransform: "uppercase",
            }}>
              Инвентарь ({player.inventory.length}/6)
            </span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
            {player.inventory.map((inv: typeof player.inventory[number]) => {
              const colors = RARITY_COLORS[inv.item.rarity as ItemRarity];
              return (
                <span key={inv.id} style={{
                  fontSize: "0.8rem",
                  padding: "0.3rem 0.6rem",
                  background: "var(--color-bg-tertiary)",
                  border: `1px solid ${colors.border}`,
                  color: colors.text,
                }}
                title={isMe ? inv.item.description : "Чужие предметы — только имена"}
                >
                  {inv.item.name}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* История игр */}
      {recentGames.length > 0 && (
        <div className="parchment" style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <Trophy size={16} color="var(--color-gold)" />
            <span style={{
              fontSize: "0.7rem", color: "var(--color-text-dim)",
              letterSpacing: "0.15em", textTransform: "uppercase",
            }}>
              Летопись
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {recentGames.map((g: typeof recentGames[number]) => (
              <div key={g.id} style={{
                padding: "0.5rem 0.8rem",
                background: "var(--color-bg-tertiary)",
                border: "1px solid var(--color-border)",
                borderLeft: `3px solid ${
                  g.status === "COMPLETED" ? "var(--color-gold)" : "var(--color-blood-bright)"
                }`,
                display: "flex", justifyContent: "space-between", alignItems: "center",
                fontSize: "0.85rem", flexWrap: "wrap", gap: "0.5rem",
              }}>
                <div>
                  <span style={{
                    color: g.status === "COMPLETED" ? "var(--color-gold)" : "var(--color-blood-bright)",
                    fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", marginRight: "0.5rem",
                  }}>
                    {g.status === "COMPLETED" ? "✓" : "✕"}
                  </span>
                  <span style={{ color: "var(--color-text-bright)" }}>{g.title}</span>
                  {g.description && !g.description.includes("[wheel:") && (
                    <div style={{
                      fontSize: "0.75rem", color: "var(--color-text-dim)",
                      fontStyle: "italic", marginTop: "0.2rem", paddingLeft: "1.5rem",
                    }}>
                      «{g.description.replace(/\[wheel:\w+\]/g, "").trim()}»
                    </div>
                  )}
                </div>
                <span style={{
                  color: g.pointsEarned >= 0 ? "var(--color-gold)" : "var(--color-blood-bright)",
                  fontFamily: "var(--font-cinzel)",
                }}>
                  {g.pointsEarned > 0 ? "+" : ""}{g.pointsEarned}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      </main>
    </>
  );
}

function StatBlock({ label, value }: { label: string; value: number }) {
  return (
    <div style={{
      textAlign: "center",
      padding: "0.75rem",
      background: "var(--color-bg-tertiary)",
      border: "1px solid var(--color-border)",
    }}>
      <div style={{
        fontSize: "0.7rem", color: "var(--color-text-dim)",
        letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.4rem",
      }}>{label}</div>
      <div style={{ fontSize: "1.4rem", color: "var(--color-gold)", fontFamily: "var(--font-cinzel)" }}>
        {value}
      </div>
    </div>
  );
}

function InfoPill({ icon, label, value, color }: any) {
  return (
    <div style={{
      padding: "0.6rem 0.8rem",
      background: "var(--color-bg-tertiary)",
      border: "1px solid var(--color-border)",
      display: "flex", flexDirection: "column", gap: "0.2rem",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: "0.3rem",
        fontSize: "0.65rem", color: "var(--color-text-dim)",
        letterSpacing: "0.1em", textTransform: "uppercase",
      }}>
        {icon}
        {label}
      </div>
      <div style={{ color, fontSize: "1rem", fontFamily: "var(--font-cinzel)" }}>
        {value}
      </div>
    </div>
  );
}
