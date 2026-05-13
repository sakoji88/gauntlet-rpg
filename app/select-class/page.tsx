import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CLASSES } from "@/lib/classes";
import ClassCard from "./ClassCard";
import { Flame } from "lucide-react";

export default async function SelectClassPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  const userId = (session.user as any).id;

  // Проверяем — уже выбрал класс или нет
  const player = await prisma.player.findUnique({
    where: { userId },
  });

  if (player?.class) {
    // Уже выбрал — отправляем на профиль
    redirect("/profile");
  }

  return (
    <main style={{
      position: "relative",
      zIndex: 2,
      minHeight: "100vh",
      padding: "3rem 2rem",
      maxWidth: "1400px",
      margin: "0 auto",
    }}>
      {/* Заголовок */}
      <div style={{
        textAlign: "center",
        marginBottom: "3rem",
      }}>
        <Flame
          size={48}
          color="var(--color-gold)"
          className="flicker"
          style={{ marginBottom: "1rem" }}
        />
        <h1 style={{
          fontSize: "clamp(2rem, 5vw, 3.5rem)",
          color: "var(--color-gold)",
          marginBottom: "1rem",
          textShadow: "0 0 30px rgba(212, 165, 116, 0.3)",
        }}>
          Выбери свой путь
        </h1>
        <p style={{
          color: "var(--color-text-dim)",
          fontStyle: "italic",
          fontSize: "1.1rem",
          maxWidth: "600px",
          margin: "0 auto",
        }}>
          Шесть путей лежат перед тобой, путник. Каждый — это сила и проклятие.
          Выбирай мудро, ибо назад дороги нет до конца сезона.
        </p>
      </div>

      {/* Сетка карточек классов */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
        gap: "1.5rem",
      }}>
        {CLASSES.map((cls) => (
          <ClassCard key={cls.id} classData={cls} />
        ))}
      </div>

      {/* Подсказка снизу */}
      <p style={{
        textAlign: "center",
        marginTop: "3rem",
        color: "var(--color-text-dim)",
        fontSize: "0.85rem",
        letterSpacing: "0.1em",
      }}>
        Выбор пути необратим до начала следующего сезона
      </p>
    </main>
  );
}