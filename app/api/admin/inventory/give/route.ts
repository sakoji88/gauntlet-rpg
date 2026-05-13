import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

// POST /api/admin/inventory/give
// Тело: { playerId: string, itemId: string }
export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Кривое тело" }, { status: 400 });
  }

  const { playerId, itemId } = body;
  if (!playerId || !itemId) {
    return NextResponse.json({ error: "Нужны playerId и itemId" }, { status: 400 });
  }

  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) {
    return NextResponse.json({ error: "Такого предмета нет" }, { status: 404 });
  }

  const inv = await prisma.inventoryItem.create({
    data: {
      playerId,
      itemId,
      charges: item.charges,
    },
  });

  return NextResponse.json({ success: true, inventory: inv });
}

// DELETE /api/admin/inventory/give?invItemId=xxx
export async function DELETE(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const invItemId = searchParams.get("invItemId");
  if (!invItemId) return NextResponse.json({ error: "Не указан invItemId" }, { status: 400 });

  try {
    await prisma.inventoryItem.delete({ where: { id: invItemId } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Ошибка БД" }, { status: 500 });
  }
}
