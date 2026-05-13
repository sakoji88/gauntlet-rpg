"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RegionData, REGIONS } from "@/lib/regions";
import { NpcDialogue, getRandomLine } from "@/lib/npc-dialogues";
import RollGameModal from "./RollGameModal";
import QuestScroll, { type QuestProps } from "./QuestScroll";
import DialogueBox, { type DialogueData } from "./DialogueBox";
import {
  ChevronLeft,
  Dice5,
  Scroll,
  ShoppingBag,
  FlaskRound,
  Sparkles,
  Ban,
  Lock,
  Skull,
} from "lucide-react";

interface RegionViewProps {
  region: RegionData;
  dialogue: NpcDialogue;
  isBlocked: boolean;
  playerClass: string;
  playerEnergy: number;
  hasActiveGame: boolean;
  specialAvailable: boolean; // Определяется на сервере (детерминированно по дню)
  inPrison: boolean;         // true = арест активен
  currentQuest: QuestProps | null;
  // Новое: лёгкий диалог и отношение NPC
  randomDialogue: DialogueData | null;
  attitude: { value: number; label: string; color: string };
}

export default function RegionView({
  region,
  dialogue,
  isBlocked,
  playerClass,
  playerEnergy,
  hasActiveGame,
  specialAvailable: specialAvailableInitial,
  inPrison,
  currentQuest,
  randomDialogue,
  attitude,
}: RegionViewProps) {
  const router = useRouter();
  const [npcLine, setNpcLine] = useState<string>("");
  const [imageError, setImageError] = useState(false);
  const [rollOpen, setRollOpen] = useState(false);

  // Локальный стейт — чтобы после отказа special-карточка моментально пропала
  // без перезагрузки страницы.
  const [specialAvailable, setSpecialAvailable] = useState<boolean>(specialAvailableInitial);

  useEffect(() => {
    setNpcLine(getRandomLine(dialogue.greetings));
  }, [dialogue.greetings]);

  useEffect(() => {
    setSpecialAvailable(specialAvailableInitial);
  }, [specialAvailableInitial]);

  function newLine() {
    const idle = getRandomLine(dialogue.idle);
    setNpcLine(idle);
  }

  if (isBlocked) {
    return <BlockedView />;
  }

  if (region.id === "prison") {
    return (
      <PrisonView
        inPrison={inPrison}
        hasActiveGame={hasActiveGame}
        playerEnergy={playerEnergy}
      />
    );
  }

  const npcImageUrl = `/images/quest-givers/${region.id}.png`;

  // Условия для кнопки ролла
  let rollDisabled = false;
  let rollReason = "";
  if (region.genres.length === 0) {
    rollDisabled = true;
    rollReason = "В этом регионе игры не роллятся";
  } else if (hasActiveGame) {
    rollDisabled = true;
    rollReason = "Сначала заверши текущую игру";
  } else if (playerEnergy < 1) {
    rollDisabled = true;
    rollReason = "Нет ходов · ждать до полуночи";
  }

  return (
    <>
      <RegionBackdrop regionId={region.id} accentColor={region.accentColor} />

    <main style={{
      position: "relative",
      zIndex: 2,
      minHeight: "100vh",
      padding: "1.5rem",
      maxWidth: "1400px",
      margin: "0 auto",
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "2rem",
      }}>
        <Link
          href="/map"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            color: "var(--color-text-dim)",
            textDecoration: "none",
            fontSize: "0.9rem",
          }}
        >
          <ChevronLeft size={16} />
          К карте
        </Link>

        <div style={{ textAlign: "right" }}>
          <div style={{
            fontSize: "0.7rem",
            color: "var(--color-text-dim)",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}>
            Локация
          </div>
          <div style={{
            fontSize: "1rem",
            color: region.accentColor,
            fontFamily: "var(--font-cinzel)",
            letterSpacing: "0.1em",
          }}>
            {region.name}
          </div>
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 480px",
        gap: "2rem",
        alignItems: "start",
      }}>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div>
            <h1 style={{
              fontSize: "2.5rem",
              color: region.accentColor,
              marginBottom: "0.25rem",
              textShadow: `0 0 20px ${region.accentColor}33`,
            }}>
              {region.npcName}
            </h1>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              flexWrap: "wrap",
            }}>
              <p style={{
                color: "var(--color-text-dim)",
                fontStyle: "italic",
                fontSize: "0.95rem",
                margin: 0,
              }}>
                {dialogue.signature}
              </p>
              <span
                title={`Отношение к тебе: ${attitude.value}`}
                style={{
                  fontSize: "0.7rem",
                  padding: "0.2rem 0.55rem",
                  background: `${attitude.color}22`,
                  border: `1px solid ${attitude.color}77`,
                  color: attitude.color,
                  fontFamily: "var(--font-cinzel)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                {attitude.label} ({attitude.value > 0 ? "+" : ""}{attitude.value})
              </span>
            </div>
          </div>

          {/* Случайный диалог */}
          {randomDialogue && (
            <DialogueBox
              dialogue={randomDialogue}
              npcName={region.npcName}
              accentColor={region.accentColor}
            />
          )}

          {/* Свиток квеста NPC */}
          {currentQuest && (
            <QuestScroll
              quest={currentQuest}
              npcName={region.npcName}
              accentColor={region.accentColor}
            />
          )}

          <div
            onClick={newLine}
            className="parchment"
            style={{
              padding: "1.5rem 1.75rem",
              borderColor: region.accentColor,
              cursor: "pointer",
              position: "relative",
              minHeight: "120px",
            }}
            title="Кликни чтобы услышать ещё"
          >
            <div style={{
              fontSize: "0.7rem",
              color: "var(--color-text-dim)",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              marginBottom: "0.75rem",
            }}>
              {region.npcName.split(" ")[0]} говорит:
            </div>
            <p style={{
              color: "var(--color-text-bright)",
              fontStyle: "italic",
              fontSize: "1.05rem",
              lineHeight: 1.6,
              margin: 0,
            }}>
              «{npcLine}»
            </p>
            <div style={{
              position: "absolute",
              bottom: "0.5rem",
              right: "1rem",
              fontSize: "0.7rem",
              color: "var(--color-text-dim)",
              opacity: 0.6,
            }}>
              кликни ещё
            </div>
          </div>

          <div>
            <div style={{
              fontSize: "0.75rem",
              color: "var(--color-text-dim)",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              marginBottom: "0.75rem",
            }}>
              Действия
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "0.75rem",
            }}>
              {region.genres.length > 0 && (
                <ActionCard
                  icon={<Dice5 size={20} />}
                  title={specialAvailable ? "💎 Роллнуть игру" : "Роллнуть игру"}
                  subtitle={
                    specialAvailable
                      ? "NPC предлагает особое условие!"
                      : `1 ход · ${region.genres.slice(0, 2).join(", ")}${region.genres.length > 2 ? "..." : ""}`
                  }
                  color={specialAvailable ? "#d4a574" : region.accentColor}
                  disabled={rollDisabled}
                  disabledReason={rollReason}
                  onClick={() => setRollOpen(true)}
                  pulse={specialAvailable && !rollDisabled}
                />
              )}

              <ActionCard
                icon={<Scroll size={20} />}
                title="Все квесты"
                subtitle="Список активных и завершённых"
                color={region.accentColor}
                disabled={false}
                onClick={() => router.push("/quests")}
              />

              {region.id === "bazar" && (
                <ActionCard
                  icon={<ShoppingBag size={20} />}
                  title="Магазин"
                  subtitle="Зелья и свитки"
                  color={region.accentColor}
                  disabled
                  onClick={() => {}}
                />
              )}

              {region.id === "kukhnya" && (
                <ActionCard
                  icon={<FlaskRound size={20} />}
                  title="Крафт"
                  subtitle="Свари что-нибудь"
                  color={region.accentColor}
                  disabled
                  onClick={() => {}}
                />
              )}

              {region.id === "atelye" && (
                <ActionCard
                  icon={<Sparkles size={20} />}
                  title="Косметика"
                  subtitle="Рамки и титулы"
                  color={region.accentColor}
                  disabled
                  onClick={() => {}}
                />
              )}
            </div>
          </div>

          <div style={{
            padding: "1rem 1.25rem",
            background: `${region.accentColor}11`,
            border: `1px solid ${region.accentColor}44`,
            fontSize: "0.85rem",
            color: "var(--color-text)",
          }}>
            <div style={{
              fontSize: "0.7rem",
              color: "var(--color-gold)",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              marginBottom: "0.4rem",
            }}>
              🜂 Пассивный бонус
            </div>
            {region.passiveBonus}
          </div>
        </div>

        <div style={{
          position: "relative",
          aspectRatio: "3 / 4",
          background: "var(--color-bg-secondary)",
          border: `2px solid ${region.accentColor}`,
          overflow: "hidden",
          boxShadow: `0 0 40px ${region.accentColor}33`,
        }}>
          {!imageError ? (
            <img
              src={npcImageUrl}
              alt={region.npcName}
              onError={() => setImageError(true)}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : (
            <div style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: region.accentColor,
              opacity: 0.4,
              padding: "2rem",
              textAlign: "center",
            }}>
              <div style={{ fontSize: "5rem" }}>?</div>
              <p style={{
                marginTop: "1rem",
                fontSize: "0.75rem",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "var(--color-text-dim)",
              }}>
                /images/quest-givers/{region.id}.png
              </p>
            </div>
          )}

          <div style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "1rem 1.25rem",
            background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, transparent 100%)",
            color: region.accentColor,
            fontFamily: "var(--font-cinzel)",
            letterSpacing: "0.1em",
          }}>
            <div style={{ fontSize: "1.1rem" }}>{region.npcName}</div>
            <div style={{
              fontSize: "0.75rem",
              color: "var(--color-text-dim)",
              fontStyle: "italic",
              fontFamily: "var(--font-cormorant)",
              letterSpacing: 0,
            }}>
              {region.npcTitle}
            </div>
          </div>
        </div>
      </div>

      {/* Модалка ролла */}
      <RollGameModal
        isOpen={rollOpen}
        onClose={() => setRollOpen(false)}
        region={region}
        specialAvailable={specialAvailable}
        onSpecialDeclined={() => setSpecialAvailable(false)}
      />

      <style>{`
        @keyframes actionPulse {
          0%, 100% { box-shadow: 0 0 12px rgba(212,165,116,0.35); }
          50% { box-shadow: 0 0 28px rgba(212,165,116,0.75); }
        }
      `}</style>
    </main>
    </>
  );
}

// === ФОН РЕГИОНА ===
// Изображение public/images/regions/{regionId}.jpg как backdrop с тёмной вуалью.
// Если файла нет — браузер тихо пропускает (background-image не найден),
// сохраняя обычный тёмный фон body. Без ошибок.
function RegionBackdrop({ regionId, accentColor }: { regionId: string; accentColor: string }) {
  return (
    <>
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: `url(/images/regions/${regionId}.jpg)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          zIndex: 0,
          opacity: 0.55,
        }}
      />
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          background: `
            radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.55) 70%, rgba(0,0,0,0.9) 100%),
            linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.7) 100%)
          `,
          zIndex: 1,
        }}
      />
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          boxShadow: `inset 0 0 200px ${accentColor}33`,
          zIndex: 1,
          pointerEvents: "none",
        }}
      />
    </>
  );
}

function ActionCard({
  icon,
  title,
  subtitle,
  color,
  disabled,
  disabledReason,
  onClick,
  pulse,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  color: string;
  disabled?: boolean;
  disabledReason?: string;
  onClick: () => void;
  pulse?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "1rem 1.25rem",
        background: "var(--color-bg-secondary)",
        border: `1px solid ${disabled ? "var(--color-border)" : color}`,
        color: disabled ? "var(--color-text-dim)" : color,
        cursor: disabled ? "not-allowed" : "pointer",
        textAlign: "left",
        opacity: disabled ? 0.5 : 1,
        transition: "all 0.2s",
        fontFamily: "inherit",
        animation: pulse ? "actionPulse 2.4s ease-in-out infinite" : "none",
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.boxShadow = `0 0 16px ${color}44`;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div style={{ flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{
          fontSize: "0.95rem",
          fontFamily: "var(--font-cinzel)",
          letterSpacing: "0.05em",
          marginBottom: "0.2rem",
        }}>
          {title}
        </div>
        <div style={{
          fontSize: "0.75rem",
          color: "var(--color-text-dim)",
          fontFamily: "var(--font-cormorant)",
        }}>
          {disabled && disabledReason ? disabledReason : subtitle}
        </div>
      </div>
    </button>
  );
}

function BlockedView() {
  return (
    <main style={{
      position: "relative",
      zIndex: 2,
      minHeight: "100vh",
      padding: "4rem 2rem",
      maxWidth: "700px",
      margin: "0 auto",
      textAlign: "center",
    }}>
      <Link
        href="/map"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          color: "var(--color-text-dim)",
          textDecoration: "none",
          marginBottom: "3rem",
          fontSize: "0.9rem",
        }}
      >
        <ChevronLeft size={16} />
        К карте
      </Link>

      <Ban
        size={64}
        color="var(--color-blood-bright)"
        className="flicker"
        style={{ marginBottom: "2rem" }}
      />

      <h1 style={{
        fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
        color: "var(--color-blood-bright)",
        marginBottom: "1.5rem",
      }}>
        Двери Терема закрыты
      </h1>

      <p style={{
        fontSize: "1.05rem",
        color: "var(--color-text)",
        fontStyle: "italic",
        lineHeight: 1.7,
        marginBottom: "1rem",
      }}>
        «А ну пшёл вон отсюда, шарлатан! Я не желаю видеть алхимиков
        в моём Тереме! Не позорь меня перед гостями!»
      </p>

      <p style={{
        color: "var(--color-text-dim)",
        fontSize: "0.9rem",
        marginBottom: "2.5rem",
      }}>
        — Костанай Зажиточный, владелец Терема
      </p>

      <p style={{
        color: "var(--color-text-dim)",
        fontSize: "0.85rem",
        fontStyle: "italic",
      }}>
        Алхимики не допускаются в Терем Зажиточного.
        Это слабость твоего класса. Смириться или возвращаться.
      </p>
    </main>
  );
}

function PrisonView({
  inPrison,
  hasActiveGame,
  playerEnergy,
}: {
  inPrison: boolean;
  hasActiveGame: boolean;
  playerEnergy: number;
}) {
  const prisonRegion = REGIONS.find((r) => r.id === "prison")!;
  const [rollOpen, setRollOpen] = useState(false);

  let rollDisabled = false;
  let rollReason = "";
  if (hasActiveGame) {
    rollDisabled = true;
    rollReason = "Сначала заверши текущую игру";
  } else if (playerEnergy < 1) {
    rollDisabled = true;
    rollReason = "Нет ходов · ждать до полуночи";
  }

  return (
    <main style={{
      position: "relative",
      zIndex: 2,
      minHeight: "100vh",
      padding: "1.5rem",
      maxWidth: "900px",
      margin: "0 auto",
    }}>
      <Link
        href="/map"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          color: "var(--color-text-dim)",
          textDecoration: "none",
          marginBottom: "2rem",
          fontSize: "0.9rem",
        }}
      >
        <ChevronLeft size={16} />
        К карте
      </Link>

      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        marginBottom: "2rem",
      }}>
        <Lock
          size={32}
          color={inPrison ? "var(--color-blood-bright)" : "var(--color-text-dim)"}
          className={inPrison ? "flicker" : ""}
        />
        <div>
          <h1 style={{
            fontSize: "2rem",
            color: inPrison ? "var(--color-blood-bright)" : "var(--color-gold)",
            marginBottom: "0.25rem",
          }}>
            {inPrison ? "Тюрьма" : "Двери Тюрьмы открыты"}
          </h1>
          <p style={{
            color: "var(--color-text-dim)",
            fontStyle: "italic",
            fontSize: "0.95rem",
          }}>
            {inPrison
              ? "Каменный мешок в центре Бездны"
              : "Стражник отвёл взгляд. Ты можешь идти."}
          </p>
        </div>
      </div>

      {inPrison ? (
        <>
          <div className="parchment" style={{
            padding: "2rem",
            borderColor: "var(--color-blood-bright)",
            marginBottom: "1.5rem",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
              <Skull size={20} color="var(--color-blood-bright)" />
              <div style={{
                fontSize: "0.85rem",
                color: "var(--color-text-bright)",
                fontFamily: "var(--font-cinzel)",
                letterSpacing: "0.1em",
              }}>
                СТРАЖНИК
              </div>
            </div>
            <p style={{
              color: "var(--color-text-bright)",
              fontStyle: "italic",
              fontSize: "1.05rem",
              lineHeight: 1.6,
            }}>
              «...» <span style={{ color: "var(--color-text-dim)" }}>(он молчит, но кивает на доску с правилами)</span>
            </p>
          </div>

          <div className="parchment" style={{ padding: "2rem", marginBottom: "1.5rem" }}>
            <h2 style={{
              fontSize: "1.2rem",
              color: "var(--color-blood-bright)",
              marginBottom: "1rem",
            }}>
              Условия освобождения
            </h2>
            <p style={{
              color: "var(--color-text)",
              lineHeight: 1.8,
              marginBottom: "1rem",
            }}>
              Чтобы выйти из Тюрьмы, пройди игру длительностью{" "}
              <strong style={{ color: "var(--color-gold)" }}>6+ часов</strong>{" "}
              с оценкой{" "}
              <strong style={{ color: "var(--color-gold)" }}>1–60 на Metacritic</strong>.
            </p>

            <div style={{
              padding: "1rem",
              background: "var(--color-bg-tertiary)",
              border: "1px solid var(--color-border)",
              marginBottom: "1rem",
            }}>
              <div style={{
                fontSize: "0.75rem",
                color: "var(--color-gold)",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                marginBottom: "0.6rem",
              }}>
                Бонусы за заслуги (сверх освобождения)
              </div>
              <ul style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                color: "var(--color-text)",
                fontSize: "0.85rem",
                lineHeight: 1.7,
              }}>
                <li>⚡ <strong style={{ color: "var(--color-gold)" }}>+1</strong> — Скорая отсидка (≤9 часов)</li>
                <li>💪 <strong style={{ color: "var(--color-gold)" }}>+1</strong> — Гордость зэка (макс. сложность)</li>
                <li>🩸 <strong style={{ color: "var(--color-gold)" }}>+1</strong> — Сладость Дна (рейтинг ≤30)</li>
              </ul>
            </div>

            <p style={{
              color: "var(--color-text-dim)",
              fontStyle: "italic",
              fontSize: "0.9rem",
              lineHeight: 1.6,
            }}>
              Без заслуг — выйдешь с 0 поинтов, но свободным.
              Дроп тюремной игры — ещё -2 поинта, и ты остаёшься внутри.
            </p>
          </div>

          <button
            onClick={() => setRollOpen(true)}
            disabled={rollDisabled}
            className="btn-dark"
            style={{
              width: "100%",
              padding: "1rem",
              borderColor: "var(--color-blood-bright)",
              color: "var(--color-blood-bright)",
              fontSize: "0.95rem",
              opacity: rollDisabled ? 0.5 : 1,
              cursor: rollDisabled ? "not-allowed" : "pointer",
            }}
          >
            <Dice5 size={18} style={{ marginRight: "0.5rem", verticalAlign: "middle" }} />
            {rollDisabled ? rollReason : "Роллнуть тюремную игру (1 ход)"}
          </button>

          <RollGameModal
            isOpen={rollOpen}
            onClose={() => setRollOpen(false)}
            region={prisonRegion}
            specialAvailable={false}
          />
        </>
      ) : (
        <>
          <div className="parchment" style={{
            padding: "2rem",
            borderColor: "var(--color-gold-dim)",
            marginBottom: "1.5rem",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
              <Skull size={20} color="var(--color-gold)" />
              <div style={{
                fontSize: "0.85rem",
                color: "var(--color-text-bright)",
                fontFamily: "var(--font-cinzel)",
                letterSpacing: "0.1em",
              }}>
                СТРАЖНИК
              </div>
            </div>
            <p style={{
              color: "var(--color-text-bright)",
              fontStyle: "italic",
              fontSize: "1.05rem",
              lineHeight: 1.6,
            }}>
              «...» <span style={{ color: "var(--color-text-dim)" }}>(он смотрит мимо тебя. Дверь камеры приоткрыта.)</span>
            </p>
          </div>

          <div className="parchment" style={{ padding: "2rem" }}>
            <h2 style={{
              fontSize: "1.2rem",
              color: "var(--color-gold)",
              marginBottom: "1rem",
            }}>
              Ты свободен
            </h2>
            <p style={{
              color: "var(--color-text)",
              lineHeight: 1.8,
              marginBottom: "1rem",
            }}>
              Арест снят. Но ты всё ещё стоишь на клетке Тюрьмы.
              Чтобы куда-то попасть — иди на карту и потрать{" "}
              <strong style={{ color: "var(--color-gold)" }}>2 хода</strong> на переход
              (соседей у Тюрьмы нет).
            </p>
            <Link
              href="/map"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                marginTop: "0.5rem",
                padding: "0.8rem 1.2rem",
                background: "var(--color-bg-secondary)",
                border: "1px solid var(--color-gold)",
                color: "var(--color-gold)",
                textDecoration: "none",
                fontFamily: "var(--font-cinzel)",
                letterSpacing: "0.1em",
                fontSize: "0.85rem",
                textTransform: "uppercase",
              }}
            >
              Идти на карту →
            </Link>
          </div>
        </>
      )}
    </main>
  );
}
