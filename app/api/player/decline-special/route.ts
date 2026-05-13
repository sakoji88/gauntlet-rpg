import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getRegionById } from "@/lib/regions";

// Игрок отказывается от особого условия NPC до конца сезона.
// Этот регион больше не будет давать special при заходе.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Кривое тело" }, { status: 400 });
  }

  const { regionId } = body as { regionId?: string };

  if (!regionId || typeof regionId !== "string") {
    return NextResponse.json({ error: "Не указан регион" }, { status: 400 });
  }

  const region = getRegionById(regionId);
  if (!region) {
    return NextResponse.json({ error: "Регион не найден" }, { status: 404 });
  }

  const player = await prisma.player.findUnique({ where: { userId } });
  if (!player) {
    return NextResponse.json({ error: "Профиль не найден" }, { status: 404 });
  }

  const declined: string[] = player.declinedSpecials
    ? safeParseJsonArray(player.declinedSpecials)
    : [];

  if (!declined.includes(regionId)) {
    declined.push(regionId);
    await prisma.player.update({
      where: { id: player.id },
      data: { declinedSpecials: JSON.stringify(declined) },
    });
  }

  return NextResponse.json({ success: true, declinedSpecials: declined });
}

function safeParseJsonArray(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}
