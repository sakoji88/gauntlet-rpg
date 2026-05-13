import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

// PATCH /api/admin/player/[id]
// Обновляет ЛЮБЫЕ поля игрока (только админ).
// Тело: { field: string, value: any } или { fields: Record<string, any> }
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Кривое тело" }, { status: 400 });
  }

  // Можно передать либо одно поле, либо несколько
  const fields: Record<string, any> = body.fields ?? { [body.field]: body.value };

  // Список разрешённых полей (анти-абуз)
  const allowed = [
    "nickname", "class", "level", "exp", "points", "energy",
    "strength", "patience", "luck", "charisma",
    "currentRegion", "isAdmin", "inPrison",
  ];

  const data: Record<string, any> = {};
  for (const key of Object.keys(fields)) {
    if (!allowed.includes(key)) {
      return NextResponse.json({ error: `Поле ${key} нельзя менять` }, { status: 400 });
    }
    data[key] = fields[key];
  }

  try {
    const updated = await prisma.player.update({
      where: { id },
      data,
    });
    return NextResponse.json({ success: true, player: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Ошибка БД" }, { status: 500 });
  }
}

// DELETE /api/admin/player/[id] — полное удаление профиля
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    await prisma.player.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Ошибка БД" }, { status: 500 });
  }
}
