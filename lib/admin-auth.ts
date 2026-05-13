// Хелпер для админских API роутов.
// Проверяет что вызывающий — админ. Если нет — возвращает 403.

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function requireAdmin(): Promise<
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse }
> {
  const session = await auth();
  if (!session?.user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Не авторизован" }, { status: 401 }),
    };
  }
  const userId = (session.user as any).id;
  const player = await prisma.player.findUnique({ where: { userId } });
  if (!player?.isAdmin) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Только для админа" }, { status: 403 }),
    };
  }
  return { ok: true, userId };
}
