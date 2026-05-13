import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, BookMarked, Gamepad2, Check, X, Trophy } from "lucide-react";
import { getRegionById } from "@/lib/regions";
import { getClassById } from "@/lib/classes";

export default async function FeedPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const userId = (session.user as any).id;
  const me = await prisma.player.findUnique({ where: { userId } });
  if (!me?.class) redirect("/select-class");

  // Все игроки + их активные игры + последние пройденные
  const allPlayers = await prisma.player.findMany({
    where: { class: { not: null } },
    orderBy: { points: "desc" },
    include: {
      user: { select: { name: true, image: true } },
    },
  });

  // Последние 20 завершённых игр у всех
  const recentGames = await prisma.game.findMany({
    where: { status: { not: "ACTIVE" } },
    orderBy: { completedAt: "desc" },
    take: 20,
    include: {
      player: {
        select: {
          nickname: true,
          user: { select: { image: true } },
        },
      },
    },
  });

  // Активные игры у всех (исключая мою — её и так видно в профиле)
  const activeGames = await prisma.game.findMany({
    where: { status: "ACTIVE" },
    orderBy: { rolledAt: "desc" },
    include: {
      player: {
        select: {
          id: true,
          nickname: true,
          class: true,
          user: { select: { image: true } },
        },
      },
    },
  });

  return (
    <main style={{
      position: "relative",
      zIndex: 2,
      minHeight: "100vh",
      padding: "2rem",
      maxWidth: "1200px",
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
        gap: "1rem",
        marginBottom: "2.5rem",
      }}>
        <BookMarked size={32} color="var(--color-gold)" className="flicker" />
        <div>
          <h1 style={{ fontSize: "2rem", color: "var(--color-gold)", margin: 0 }}>
            Хроники Бездны
          </h1>
          <p style={{
            color: "var(--color-text-dim)",
            fontStyle: "italic",
            fontSize: "0.95rem",
            marginTop: "0.25rem",
          }}>
            Что делают другие путники
          </p>
        </div>
      </div>

      {/* === Лидерборд === */}
      <section style={{ marginBottom: "2.5rem" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
          marginBottom: "1rem",
        }}>
          <Trophy size={18} color="var(--color-gold)" />
          <h2 style={{
            fontSize: "1.1rem",
            color: "var(--color-gold)",
            margin: 0,
            letterSpacing: "0.1em",
          }}>
            Лидерборд
          </h2>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "0.75rem",
        }}>
          {allPlayers.map((p: typeof allPlayers[number], idx: number) => {
            const isMe = p.userId === userId;
            const classData = getClassById(p.class);
            const place = idx + 1;
            return (
              <Link
                key={p.id}
                href={`/player/${p.id}`}
                style={{
                  padding: "0.9rem 1rem",
                  background: isMe ? "var(--color-bg-tertiary)" : "var(--color-bg-secondary)",
                  border: `1px solid ${isMe ? "var(--color-gold)" : "var(--color-border)"}`,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  textDecoration: "none",
                  color: "inherit",
                  transition: "all 0.2s",
                }}
              >
                <div style={{
                  fontSize: "1.5rem",
                  fontFamily: "var(--font-cinzel)",
                  color: place === 1 ? "var(--color-gold)" : "var(--color-text-dim)",
                  minWidth: "28px",
                  textAlign: "center",
                }}>
                  {place === 1 ? "🥇" : place === 2 ? "🥈" : place === 3 ? "🥉" : `#${place}`}
                </div>
                {p.user?.image && (
                  <img
                    src={p.user.image}
                    alt=""
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      border: "1px solid var(--color-border-bright)",
                    }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    color: "var(--color-text-bright)",
                    fontSize: "0.95rem",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    {p.nickname}
                    {place === 1 && p.points > 0 && (
                      <span title="Корона Короля Стрима" style={{ marginLeft: "0.3rem" }}>👑</span>
                    )}
                    {isMe && <span style={{ color: "var(--color-gold)", fontSize: "0.75rem", marginLeft: "0.3rem" }}>(ты)</span>}
                  </div>
                  <div style={{
                    fontSize: "0.75rem",
                    color: "var(--color-text-dim)",
                    fontStyle: "italic",
                  }}>
                    {classData?.name ?? "—"} · ур. {p.level}
                  </div>
                </div>
                <div style={{
                  fontSize: "1.2rem",
                  color: "var(--color-gold)",
                  fontFamily: "var(--font-cinzel)",
                  fontWeight: 500,
                }}>
                  {p.points}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* === Кто что играет === */}
      <section style={{ marginBottom: "2.5rem" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
          marginBottom: "1rem",
        }}>
          <Gamepad2 size={18} color="var(--color-gold)" />
          <h2 style={{
            fontSize: "1.1rem",
            color: "var(--color-gold)",
            margin: 0,
            letterSpacing: "0.1em",
          }}>
            Сейчас проходят
          </h2>
        </div>

        {activeGames.length === 0 ? (
          <div className="parchment" style={{ padding: "1.5rem", textAlign: "center" }}>
            <p style={{ color: "var(--color-text-dim)", fontStyle: "italic" }}>
              Никто пока ничего не роллнул
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {activeGames.map((g: typeof activeGames[number]) => {
              const region = getRegionById(g.region);
              const classData = getClassById(g.player.class);
              return (
                <div
                  key={g.id}
                  style={{
                    padding: "0.85rem 1rem",
                    background: "var(--color-bg-secondary)",
                    border: "1px solid var(--color-border)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    flexWrap: "wrap",
                  }}
                >
                  {g.player.user?.image && (
                    <img
                      src={g.player.user.image}
                      alt=""
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        border: "1px solid var(--color-border-bright)",
                      }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: "var(--color-text-bright)", fontSize: "0.9rem" }}>
                      <strong>{g.player.nickname}</strong>{" "}
                      <span style={{ color: "var(--color-text-dim)" }}>играет в</span>{" "}
                      <strong style={{ color: "var(--color-gold)" }}>{g.title}</strong>
                    </div>
                    <div style={{
                      fontSize: "0.75rem",
                      color: "var(--color-text-dim)",
                      fontStyle: "italic",
                    }}>
                      {classData?.name ?? "—"} · из региона "{region?.shortName ?? g.region}"
                    </div>
                  </div>
                  {g.link && (
                    <a
                      href={g.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "var(--color-gold)",
                        fontSize: "0.75rem",
                        textDecoration: "none",
                      }}
                    >
                      ↗ ссылка
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* === Лента событий === */}
      <section>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
          marginBottom: "1rem",
        }}>
          <BookMarked size={18} color="var(--color-gold)" />
          <h2 style={{
            fontSize: "1.1rem",
            color: "var(--color-gold)",
            margin: 0,
            letterSpacing: "0.1em",
          }}>
            Лента событий
          </h2>
        </div>

        {recentGames.length === 0 ? (
          <div className="parchment" style={{ padding: "1.5rem", textAlign: "center" }}>
            <p style={{ color: "var(--color-text-dim)", fontStyle: "italic" }}>
              Хроники пусты. Никто ещё ничего не завершил.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {recentGames.map((g: typeof recentGames[number]) => {
              const isComplete = g.status === "COMPLETED";
              return (
                <div
                  key={g.id}
                  style={{
                    padding: "0.75rem 1rem",
                    background: "var(--color-bg-secondary)",
                    border: "1px solid var(--color-border)",
                    borderLeft: `3px solid ${isComplete ? "var(--color-gold)" : "var(--color-blood-bright)"}`,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    flexWrap: "wrap",
                  }}
                >
                  {g.player.user?.image && (
                    <img
                      src={g.player.user.image}
                      alt=""
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                      }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.9rem", color: "var(--color-text)" }}>
                      <strong style={{ color: "var(--color-text-bright)" }}>{g.player.nickname}</strong>{" "}
                      {isComplete ? (
                        <>
                          <Check size={12} style={{ display: "inline", color: "var(--color-gold)", marginRight: "0.2rem" }} />
                          прошёл
                        </>
                      ) : (
                        <>
                          <X size={12} style={{ display: "inline", color: "var(--color-blood-bright)", marginRight: "0.2rem" }} />
                          дропнул
                        </>
                      )}{" "}
                      <strong style={{ color: "var(--color-gold)" }}>{g.title}</strong>
                    </div>
                    {g.description && (
                      <div style={{
                        fontSize: "0.8rem",
                        color: "var(--color-text-dim)",
                        fontStyle: "italic",
                        marginTop: "0.2rem",
                      }}>
                        «{g.description}»
                      </div>
                    )}
                  </div>
                  <span style={{
                    color: g.pointsEarned >= 0 ? "var(--color-gold)" : "var(--color-blood-bright)",
                    fontFamily: "var(--font-cinzel)",
                    fontSize: "0.95rem",
                  }}>
                    {g.pointsEarned >= 0 ? "+" : ""}{g.pointsEarned}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
