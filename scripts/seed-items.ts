// Сидер каталога предметов.
// Запуск: `npx tsx scripts/seed-items.ts`
// Можно запускать многократно — обновит существующие предметы (upsert).

import { PrismaClient } from "@prisma/client";
import { ITEMS } from "../lib/items";

const prisma = new PrismaClient();

async function main() {
  console.log("🌑 Заливаю каталог предметов в Бездну...");

  for (const item of ITEMS) {
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
    console.log(`  ✓ ${item.name} (${item.rarity})`);
  }

  console.log(`\n🌑 Залито ${ITEMS.length} предметов.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
