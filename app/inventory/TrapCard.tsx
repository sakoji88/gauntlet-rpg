"use client";

import { useState } from "react";
import { Target } from "lucide-react";
import ThrowTrapModal, { type TargetPlayer } from "./ThrowTrapModal";

export default function ThrowTrapButton({
  inventoryItemId,
  itemId,
  itemName,
  itemDescription,
  targets,
  isUrka,
  color,
}: {
  inventoryItemId: string;
  itemId: string;
  itemName: string;
  itemDescription: string;
  targets: TargetPlayer[];
  isUrka: boolean;
  color: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          width: "100%",
          padding: "0.5rem",
          background: "transparent",
          color: "var(--color-blood-bright)",
          border: "1px solid var(--color-blood-bright)",
          fontSize: "0.75rem",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          fontFamily: "var(--font-cinzel)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.4rem",
          transition: "all 0.2s",
        }}
      >
        <Target size={12} />
        Бросить
      </button>

      {open && (
        <ThrowTrapModal
          inventoryItemId={inventoryItemId}
          itemId={itemId}
          itemName={itemName}
          itemDescription={itemDescription}
          targets={targets}
          isUrka={isUrka}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
