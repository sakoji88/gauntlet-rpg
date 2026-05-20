// Аватар игрока. Простой круглый портрет с обводкой — без кастомизации.
// Серверный компонент.
export default function Avatar({
  src,
  size = 120,
  alt = "",
}: {
  src: string | null | undefined;
  size?: number;
  alt?: string;
}) {
  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        flexShrink: 0,
        borderRadius: "50%",
        border: "3px solid var(--color-border-bright)",
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
