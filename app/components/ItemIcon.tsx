"use client";

// Универсальный значок предмета.
// Пробует подгрузить /images/items/<iconKey>.png (с itemId-оверрайдами),
// если файл битый — показывает эмодзи как fallback.
//
// Используется в инвентаре, на колесе предметов и в крафт-сетке Алхимика.

import { useState } from "react";
import { getItemEmoji, getItemImageUrl } from "@/lib/item-icons";

interface ItemIconProps {
  itemId?: string | null;
  iconKey: string | null | undefined;
  size?: number;          // px, и для img и для эмодзи (эмодзи рендерится ≈80% размера)
  glow?: string;          // CSS color для drop-shadow вокруг картинки
  className?: string;
  style?: React.CSSProperties;
}

export default function ItemIcon({
  itemId,
  iconKey,
  size = 36,
  glow,
  className,
  style,
}: ItemIconProps) {
  const [broken, setBroken] = useState(false);
  const url = getItemImageUrl(itemId, iconKey);

  const wrapperStyle: React.CSSProperties = {
    width: size,
    height: size,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    ...style,
  };

  if (!url || broken) {
    return (
      <span
        aria-hidden
        className={className}
        style={{
          ...wrapperStyle,
          fontSize: Math.round(size * 0.8),
          lineHeight: 1,
        }}
      >
        {getItemEmoji(iconKey)}
      </span>
    );
  }

  return (
    <img
      src={url}
      alt=""
      width={size}
      height={size}
      onError={() => setBroken(true)}
      className={className}
      style={{
        ...wrapperStyle,
        objectFit: "contain",
        filter: glow ? `drop-shadow(0 0 ${Math.round(size / 6)}px ${glow})` : undefined,
      }}
    />
  );
}
