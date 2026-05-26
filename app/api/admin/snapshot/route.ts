import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

// Сводка состояния игры в markdown — для отправки Claude на анализ баланса.
// Собирает: сезон, лидерборд, статы игроков, последние игры, инвентари,
// активные баффы/ловушки, квесты, распределение предметов.
//
// Возвращает { markdown: string } — клиент копирует в буфер.

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  const season = await prisma.season.findFirst({
    where: { endedAt: null },
    orderBy: { startedAt: "desc" },
  });
  const seasonStart = season?.startedAt ?? new Date(0);
  const dayMs = 24 * 60 * 60 * 1000;
  const seasonDay = Math.max(
    1,
    Math.floor((Date.now() - seasonStart.getTime()) / dayMs) + 1,
  );

  // ===== ИГРОКИ =====
  const players = await prisma.player.findMany({
    where: { class: { not: null } },
    include: {
      user: { select: { name: true } },
      inventory: { include: { item: true } },
    },
    orderBy: { points: "desc" },
  });

  // ===== ИГРЫ ЭТОГО СЕЗОНА =====
  const games = await prisma.game.findMany({
    where: {
      OR: [
        { completedAt: { gte: seasonStart } },
        { status: "ACTIVE" },
      ],
    },
    include: { player: { select: { nickname: true } } },
    orderBy: { completedAt: "desc" },
  });

  const completedGames = games.filter((g) => g.status === "COMPLETED");
  const droppedGames = games.filter((g) => g.status === "DROPPED");
  const activeGames = games.filter((g) => g.status === "ACTIVE");

  // ===== КВЕСТЫ ЭТОГО СЕЗОНА =====
  const quests = await prisma.quest.findMany({
    include: { player: { select: { nickname: true } } },
  });
  const activeQuests = quests.filter((q) => q.status === "ACTIVE" || q.status === "OFFERED");
  const completedQuests = quests.filter((q) => q.status === "COMPLETED");
  const declinedQuests = quests.filter((q) => q.status === "DECLINED" || q.status === "EXPIRED");

  // ===== РАСПРЕДЕЛЕНИЕ ПРЕДМЕТОВ В ИНВЕНТАРЯХ =====
  const itemCounts = new Map<string, { name: string; rarity: string; count: number }>();
  for (const p of players) {
    for (const inv of p.inventory) {
      const k = inv.item.id;
      if (!itemCounts.has(k)) {
        itemCounts.set(k, { name: inv.item.name, rarity: inv.item.rarity, count: 0 });
      }
      itemCounts.get(k)!.count += 1;
    }
  }
  const itemList = [...itemCounts.values()].sort((a, b) => b.count - a.count);

  // ===== ИГРЫ ПО РЕГИОНАМ =====
  const regionPlays = new Map<string, number>();
  for (const g of completedGames) {
    regionPlays.set(g.region, (regionPlays.get(g.region) ?? 0) + 1);
  }
  const regionStats = [...regionPlays.entries()].sort((a, b) => b[1] - a[1]);

  // ===== РАСПРЕДЕЛЕНИЕ КЛАССОВ =====
  const classCount = new Map<string, number>();
  for (const p of players) {
    if (p.class) classCount.set(p.class, (classCount.get(p.class) ?? 0) + 1);
  }

  // ===== ГЕНЕРАЦИЯ MARKDOWN =====
  const md: string[] = [];

  md.push(`# Gauntlet RPG — Сводка для анализа баланса`);
  md.push(``);
  md.push(`Снято: ${new Date().toISOString()}`);
  md.push(`Сезон: ${season?.name ?? "—"} (день ${seasonDay}, стартовал ${seasonStart.toISOString().slice(0, 10)})`);
  md.push(``);

  // ----- Распределение классов -----
  md.push(`## Классы игроков`);
  md.push(``);
  if (classCount.size === 0) {
    md.push(`_(никто ещё не выбрал)_`);
  } else {
    for (const [cls, n] of [...classCount.entries()].sort((a, b) => b[1] - a[1])) {
      md.push(`- **${cls}**: ${n}`);
    }
  }
  md.push(``);

  // ----- Лидерборд -----
  md.push(`## Лидерборд (топ 20)`);
  md.push(``);
  md.push(`| # | Игрок | Класс | Ур. | EXP | Поинты | Злато | Stats (S/T/L/C) | Энергия | Регион |`);
  md.push(`|---|---|---|---|---|---|---|---|---|---|`);
  players.slice(0, 20).forEach((p, i) => {
    const stats = `${p.strength}/${p.patience}/${p.luck}/${p.charisma}`;
    md.push(
      `| ${i + 1} | ${p.nickname} | ${p.class ?? "—"} | ${p.level} | ${p.exp} | ${p.points} | ${p.gold} | ${stats} | ${p.energy}/3 | ${p.currentRegion ?? "—"}${p.inPrison ? " 🔒" : ""} |`,
    );
  });
  md.push(``);

  // ----- Игры этого сезона: статистика -----
  md.push(`## Игры сезона`);
  md.push(``);
  md.push(`- Завершено: **${completedGames.length}**`);
  md.push(`- Дропов: **${droppedGames.length}**`);
  md.push(`- Сейчас активных: **${activeGames.length}**`);
  md.push(``);

  // ----- Игры по регионам -----
  md.push(`### Активность по регионам (завершённые)`);
  md.push(``);
  if (regionStats.length === 0) {
    md.push(`_(пока пусто)_`);
  } else {
    for (const [region, count] of regionStats) {
      md.push(`- ${region}: ${count}`);
    }
  }
  md.push(``);

  // ----- Последние 30 завершённых -----
  md.push(`### Последние 30 завершённых игр`);
  md.push(``);
  md.push(`| Когда | Игрок | Регион | Название | Часов | Личн.оц. | Maxдиф | Поинтов |`);
  md.push(`|---|---|---|---|---|---|---|---|`);
  completedGames.slice(0, 30).forEach((g) => {
    const when = g.completedAt ? g.completedAt.toISOString().slice(0, 16).replace("T", " ") : "—";
    md.push(
      `| ${when} | ${g.player.nickname} | ${g.region} | ${g.title.replace(/\|/g, "\\|")} | ${g.hours ?? "—"} | ${g.rating ?? "—"} | — | ${g.pointsEarned} |`,
    );
  });
  md.push(``);

  // ----- Дропы -----
  if (droppedGames.length > 0) {
    md.push(`### Дропы`);
    md.push(``);
    md.push(`| Когда | Игрок | Регион | Название |`);
    md.push(`|---|---|---|---|`);
    droppedGames.slice(0, 20).forEach((g) => {
      const when = g.completedAt ? g.completedAt.toISOString().slice(0, 16).replace("T", " ") : "—";
      md.push(`| ${when} | ${g.player.nickname} | ${g.region} | ${g.title.replace(/\|/g, "\\|")} |`);
    });
    md.push(``);
  }

  // ----- Активные игры -----
  if (activeGames.length > 0) {
    md.push(`### Сейчас проходят`);
    md.push(``);
    md.push(`| Игрок | Регион | Название | Когда роллнул |`);
    md.push(`|---|---|---|---|`);
    activeGames.forEach((g) => {
      const when = g.rolledAt.toISOString().slice(0, 16).replace("T", " ");
      md.push(`| ${g.player.nickname} | ${g.region} | ${g.title.replace(/\|/g, "\\|")} | ${when} |`);
    });
    md.push(``);
  }

  // ----- Инвентари -----
  md.push(`## Инвентари игроков`);
  md.push(``);
  for (const p of players) {
    if (p.inventory.length === 0) continue;
    const items = p.inventory
      .map((inv) => `«${inv.item.name}» [${inv.item.rarity}, ${inv.item.category}${inv.charges > 1 ? `, ×${inv.charges}` : ""}]`)
      .join("; ");
    md.push(`- **${p.nickname}** (${p.inventory.length}/6): ${items}`);
  }
  md.push(``);

  // ----- Активные баффы / ловушки -----
  md.push(`## Активные эффекты на игроках`);
  md.push(``);
  let anyBuffs = false;
  for (const p of players) {
    if (!p.activeBuffs) continue;
    try {
      const arr = JSON.parse(p.activeBuffs);
      if (!Array.isArray(arr) || arr.length === 0) continue;
      anyBuffs = true;
      const keys = arr.map((b: any) => {
        let s = b.effectKey;
        if (b.payload?.remaining !== undefined) s += ` (осталось ${b.payload.remaining})`;
        if (b.payload?.throwerNickname) s += ` ← от ${b.payload.throwerNickname}`;
        return s;
      });
      md.push(`- **${p.nickname}**: ${keys.join(", ")}`);
    } catch {
      // skip
    }
  }
  if (!anyBuffs) md.push(`_(чисто)_`);
  md.push(``);

  // ----- Распределение предметов -----
  md.push(`## Предметы на руках у всех (топ 30)`);
  md.push(``);
  md.push(`| Предмет | Редкость | Кол-во экз. |`);
  md.push(`|---|---|---|`);
  itemList.slice(0, 30).forEach((it) => {
    md.push(`| ${it.name} | ${it.rarity} | ${it.count} |`);
  });
  md.push(``);

  // ----- Квесты -----
  md.push(`## Квесты`);
  md.push(``);
  md.push(`- Активных/предложенных: **${activeQuests.length}**`);
  md.push(`- Завершённых: **${completedQuests.length}**`);
  md.push(`- Отклонённых/просроченных: **${declinedQuests.length}**`);
  md.push(``);

  // По типам
  const byType = new Map<string, number>();
  for (const q of completedQuests) {
    byType.set(q.type, (byType.get(q.type) ?? 0) + 1);
  }
  if (byType.size > 0) {
    md.push(`### Завершённые квесты по типам`);
    md.push(``);
    for (const [t, n] of [...byType.entries()].sort((a, b) => b[1] - a[1])) {
      md.push(`- ${t}: ${n}`);
    }
    md.push(``);
  }

  // Активные сейчас
  if (activeQuests.length > 0) {
    md.push(`### Активные сейчас`);
    md.push(``);
    md.push(`| Игрок | Регион | Тип | Название | Статус | Прогресс |`);
    md.push(`|---|---|---|---|---|---|`);
    activeQuests.slice(0, 40).forEach((q) => {
      md.push(
        `| ${q.player.nickname} | ${q.npcRegion} | ${q.type} | ${q.title.replace(/\|/g, "\\|")} | ${q.status} | ${q.progress}/${q.targetCount} |`,
      );
    });
    md.push(``);
  }

  // ----- Метрики "здоровья" по игроку -----
  md.push(`## Per-player сводка`);
  md.push(``);
  md.push(`| Игрок | Игр заверш. | Дропов | Активных квестов | Активные эффекты | Инв. |`);
  md.push(`|---|---|---|---|---|---|`);
  for (const p of players) {
    const completedCnt = completedGames.filter((g) => g.playerId === p.id).length;
    const droppedCnt = droppedGames.filter((g) => g.playerId === p.id).length;
    const activeQCnt = activeQuests.filter((q) => q.playerId === p.id).length;
    let buffCnt = 0;
    if (p.activeBuffs) {
      try {
        const arr = JSON.parse(p.activeBuffs);
        if (Array.isArray(arr)) buffCnt = arr.length;
      } catch {}
    }
    md.push(`| ${p.nickname} | ${completedCnt} | ${droppedCnt} | ${activeQCnt} | ${buffCnt} | ${p.inventory.length}/6 |`);
  }
  md.push(``);

  md.push(`---`);
  md.push(``);
  md.push(`_Снято кнопкой «Сводка для Клода» из /admin._`);

  return NextResponse.json({ markdown: md.join("\n") });
}
