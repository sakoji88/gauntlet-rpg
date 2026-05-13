import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

// === БЕЛЫЙ СПИСОК ===

// GET /api/admin/whitelist
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const list = await prisma.allowedDiscordId.findMany({
    orderBy: { createdAt: "desc" },
  });

  // Подтягиваем — какие из этих ID уже залогинились (есть User с providerAccountId)
  const accounts = await prisma.account.findMany({
    where: { provider: "discord" },
    select: { providerAccountId: true, user: { select: { id: true, name: true } } },
  });
  const accountsByDiscordId = new Map(accounts.map((a: typeof accounts[number]) => [a.providerAccountId, a.user]));

  const enriched = list.map((entry: typeof list[number]) => ({
    id: entry.id,
    discordId: entry.discordId,
    note: entry.note,
    createdAt: entry.createdAt,
    user: accountsByDiscordId.get(entry.discordId) ?? null,
  }));

  return NextResponse.json({ list: enriched });
}

// POST /api/admin/whitelist
// Тело: { discordId: string, note?: string }
export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Кривое тело" }, { status: 400 });
  }

  const { discordId, note } = body;
  if (!discordId || typeof discordId !== "string") {
    return NextResponse.json({ error: "Не указан Discord ID" }, { status: 400 });
  }

  try {
    const entry = await prisma.allowedDiscordId.create({
      data: { discordId: discordId.trim(), note: note?.trim() || null },
    });
    return NextResponse.json({ success: true, entry });
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json({ error: "Этот Discord ID уже в списке" }, { status: 400 });
    }
    return NextResponse.json({ error: e.message ?? "Ошибка БД" }, { status: 500 });
  }
}

// DELETE /api/admin/whitelist?id=xxx
export async function DELETE(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Не указан id" }, { status: 400 });

  try {
    await prisma.allowedDiscordId.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Ошибка БД" }, { status: 500 });
  }
}
