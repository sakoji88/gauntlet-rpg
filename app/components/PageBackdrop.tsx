// Универсальный фон страницы Темнодушного Лета.
// Кладёт картинку из /public/images/backgrounds/{image} как fixed-backdrop
// с тёмной вуалью, чтобы контент (z-index >= 2) оставался читаемым.
//
// Если файла картинки нет — браузер тихо пропустит background-image,
// останется обычный тёмный фон body. Без ошибок сборки.

export default function PageBackdrop({
  image,
  accent,
  opacity = 0.6,
}: {
  image: string; // имя файла, напр. "profile.jpg"
  accent?: string; // цвет лёгкого внутреннего свечения по краям
  opacity?: number; // насколько ярко видно картинку (0..1)
}) {
  // По умолчанию — как фоны локаций: картинка видна ярко, вуаль лёгкая.
  return (
    <>
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: `url(/images/backgrounds/${image})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          zIndex: 0,
          opacity,
        }}
      />
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          background: `
            radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 72%, rgba(0,0,0,0.82) 100%),
            linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.6) 100%)
          `,
          zIndex: 1,
          pointerEvents: "none",
        }}
      />
      {accent && (
        <div
          aria-hidden
          style={{
            position: "fixed",
            inset: 0,
            boxShadow: `inset 0 0 220px ${accent}33`,
            zIndex: 1,
            pointerEvents: "none",
          }}
        />
      )}
    </>
  );
}
