import { getFrameStyle } from "@/lib/cosmetics";

// Аватар игрока с опциональной косметической рамкой.
// Серверный компонент (без хуков).
//
// Рамка работает в два слоя:
//   1. CSS-обводка + свечение (всегда, надёжно — даже без арта).
//   2. PNG-оверлей /images/frames/{frameId}.png — если файл есть, рисуется поверх.
//      Если файла нет, background-image тихо ничего не покажет (без битых иконок).
export default function Avatar({
  src,
  size = 120,
  frameId,
  alt = "",
}: {
  src: string | null | undefined;
  size?: number;
  frameId?: string | null;
  alt?: string;
}) {
  const frame = getFrameStyle(frameId);
  const overlay = Math.round(size * 1.4);
  const offset = Math.round((overlay - size) / 2);

  return (
    <div style={{ position: "relative", width: `${size}px`, height: `${size}px`, flexShrink: 0 }}>
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: "50%",
          overflow: "hidden",
          border: `3px solid ${frame ? frame.border : "var(--color-border-bright)"}`,
          boxShadow: frame ? `0 0 ${Math.round(size / 4)}px ${frame.glow}` : "none",
          background: "var(--color-bg-tertiary)",
        }}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : null}
      </div>
      {frameId && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            width: `${overlay}px`,
            height: `${overlay}px`,
            left: `-${offset}px`,
            top: `-${offset}px`,
            backgroundImage: `url(/images/frames/${frameId}.png)`,
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
}
