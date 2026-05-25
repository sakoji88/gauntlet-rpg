import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

// Идемпотентные SQL-патчи схемы — на случай если на проде ещё не сделали
// `prisma db push` после изменений в schema.prisma. Безопасно жать
// многократно: ADD COLUMN IF NOT EXISTS не трогает существующие колонки.
//
// Добавляй сюда любые новые ALTER, когда меняешь схему — пользователь
// сможет применить их с кнопки в админке без shell-доступа.

interface Patch {
  name: string;
  description: string;
  sql: string;
}

const PATCHES: Patch[] = [
  {
    name: "quest_self_complete",
    description: 'Колонка Quest.selfComplete (Boolean default false)',
    sql: `ALTER TABLE "Quest" ADD COLUMN IF NOT EXISTS "selfComplete" BOOLEAN NOT NULL DEFAULT false`,
  },
  {
    name: "irl_template_self_complete",
    description: 'Колонка IrlQuestTemplate.selfComplete (Boolean default false)',
    sql: `ALTER TABLE "IrlQuestTemplate" ADD COLUMN IF NOT EXISTS "selfComplete" BOOLEAN NOT NULL DEFAULT false`,
  },
];

export async function POST() {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  const results: Array<{ name: string; description: string; ok: boolean; error?: string }> = [];

  for (const patch of PATCHES) {
    try {
      await prisma.$executeRawUnsafe(patch.sql);
      results.push({ name: patch.name, description: patch.description, ok: true });
    } catch (e: any) {
      results.push({
        name: patch.name,
        description: patch.description,
        ok: false,
        error: e?.message ?? String(e),
      });
    }
  }

  const okCount = results.filter((r) => r.ok).length;
  return NextResponse.json({
    success: results.every((r) => r.ok),
    applied: okCount,
    total: results.length,
    results,
  });
}
