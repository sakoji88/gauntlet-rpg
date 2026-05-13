import { Skull } from "lucide-react";
import Link from "next/link";

export default function NotAllowedPage() {
  return (
    <main style={{
      position: "relative",
      zIndex: 2,
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem",
      textAlign: "center",
    }}>
      <Skull
        size={64}
        color="var(--color-blood-bright)"
        className="flicker"
        style={{ marginBottom: "2rem" }}
      />

      <h1 style={{
        fontSize: "clamp(2rem, 5vw, 3.5rem)",
        marginBottom: "1rem",
        color: "var(--color-blood-bright)",
      }}>
        Врата затворены
      </h1>

      <p style={{
        fontSize: "1.1rem",
        color: "var(--color-text-dim)",
        fontStyle: "italic",
        maxWidth: "500px",
        marginBottom: "2rem",
      }}>
        Имя твоё не значится в свитке избранных, путник.
        Обратись к хранителю списка, либо ступай прочь.
      </p>

      <Link href="/" className="btn-dark">
        Вернуться
      </Link>
    </main>
  );
}