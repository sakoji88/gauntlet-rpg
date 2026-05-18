"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

// Кнопка «Назад» — возвращает на предыдущую страницу (история браузера),
// а не жёстко на профиль. Если истории нет — уходит на fallback.
export default function BackLink({
  fallback = "/profile",
  label = "Назад",
}: {
  fallback?: string;
  label?: string;
}) {
  const router = useRouter();

  function go() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallback);
    }
  }

  return (
    <button
      onClick={go}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.5rem",
        background: "transparent",
        border: "none",
        padding: 0,
        margin: "0 0 1.5rem",
        color: "var(--color-text-dim)",
        cursor: "pointer",
        fontSize: "0.9rem",
        fontFamily: "var(--font-cormorant)",
      }}
    >
      <ChevronLeft size={16} />
      {label}
    </button>
  );
}
