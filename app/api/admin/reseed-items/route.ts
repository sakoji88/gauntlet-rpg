import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { ITEMS } from "@/lib/items";

// Пересевает каталог предметов из lib/items.ts в БД. Безопасно вызывать
// многократно — это upsert по id, существующие InventoryItem-записи у
// игроков не трогаются (только сам справочник Item).
//
// Используется когда добавлены/переименованы предметы и нужно прокатить
// изменения на прод без shell-доступа к серверу.
export async function POST() {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  let upserted = 0;
  const errors: Array<{ id: string; error: string }> = [];

  for (const item of ITEMS) {
    try {
      await prisma.item.upsert({
        where: { id: item.id },
        update: {
          name: item.name,
          description: item.description,
          category: item.category,
          rarity: item.rarity,
          iconKey: item.iconKey,
          effectKey: item.effectKey ?? null,
          charges: item.charges ?? 1,
          rollWeight: item.rollWeight,
          isTrap: item.isTrap ?? false,
        },
        create: {
          id: item.id,
          name: item.name,
          description: item.description,
          category: item.category,
          rarity: item.rarity,
          iconKey: item.iconKey,
          effectKey: item.effectKey ?? null,
          charges: item.charges ?? 1,
          rollWeight: item.rollWeight,
          isTrap: item.isTrap ?? false,
        },
      });
      upserted++;
    } catch (e: any) {
      errors.push({ id: item.id, error: e?.message ?? String(e) });
    }
  }

  return NextResponse.json({
    success: true,
    upserted,
    total: ITEMS.length,
    errors,
  });
}
