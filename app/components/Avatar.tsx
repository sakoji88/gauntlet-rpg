import { getFrameStyle } from "@/lib/cosmetics";

// Аватар игрока с опциональной косметической рамкой.
// Серверный компонент (без хуков) — можно вставлять куда угодно.
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
  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        flexShrink: 0,
        borderRadius: "50%",
        border: `3px solid ${frame ? frame.border : "var(--color-border-bright)"}`,
        boxShadow: frame ? `0 0 ${Math.round(size / 4)}px ${frame.glow}` : "none",
        overflow: "hidden",
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
  );
}
