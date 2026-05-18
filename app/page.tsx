"use client";

import { Skull, Flame } from "lucide-react";
import { signIn } from "next-auth/react";
import PageBackdrop from "@/app/components/PageBackdrop";

export default function HomePage() {
  return (
    <>
      <PageBackdrop image="landing.jpg" accent="#8b2424" opacity={0.5} />
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
      <Flame
        size={48}
        color="var(--color-gold)"
        className="flicker"
        style={{ marginBottom: "2rem" }}
      />

      <h1 style={{
        fontSize: "clamp(2.5rem, 6vw, 5rem)",
        marginBottom: "1rem",
        color: "var(--color-gold)",
        textShadow: "0 0 30px rgba(212, 165, 116, 0.3)",
      }}>
        Темнодушное Лето
      </h1>

      <p style={{
        fontSize: "1.25rem",
        color: "var(--color-text-dim)",
        fontStyle: "italic",
        letterSpacing: "0.1em",
        marginBottom: "3rem",
        maxWidth: "600px",
      }}>
        Забег обречённых душ через миры игр
      </p>

      <div className="divider" style={{ maxWidth: "400px", width: "100%" }}>
        <Skull size={20} color="var(--color-gold-dim)" />
      </div>

      <div style={{
        maxWidth: "600px",
        margin: "2rem 0 3rem",
        color: "var(--color-text)",
        fontSize: "1.05rem",
        lineHeight: "1.8",
      }}>
        <p style={{ marginBottom: "1rem" }}>
          Восемь странных земель раскинулись перед тобой, путник.
        </p>
        <p style={{ marginBottom: "1rem" }}>
          Восемь хозяев ждут тебя — кто с дарами, кто с насмешкой.
        </p>
        <p>
          Пройди игры, что они укажут. Заслужи их благосклонность.
          Или сгинь во тьме.
        </p>
      </div>

      <button
        className="btn-dark"
        onClick={() => signIn("discord", { callbackUrl: "/profile" })}
      >
        Войти через Discord
      </button>

      <p style={{
        position: "absolute",
        bottom: "2rem",
        fontSize: "0.8rem",
        color: "var(--color-text-dim)",
        letterSpacing: "0.2em",
        textTransform: "uppercase",
      }}>
        Только по приглашению
      </p>
      </main>
    </>
  );
}