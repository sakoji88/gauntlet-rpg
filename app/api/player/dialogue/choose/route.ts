import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  getDialogueById,
  parseAttitudes,
  parseSeenDialogues,
} from "@/lib/dialogues";

// Применить выбор игрока в диалоге.
// Тело: { dialogueId: string, choiceIndex: number }
// Возвращает: { response: string, attitudeAfter: number, attitudeDelta: number }

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }
  const userId = (session.user as any).id;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Кривое тело" }, { status: 400 });
  }
  const { dialogueId, choiceIndex } = body as {
    dialogueId?: string;
    choiceIndex?: number;
  };
  if (!dialogueId || typeof choiceIndex !== "number") {
    return NextResponse.json(
      { error: "dialogueId и choiceIndex обязательны" },
      { status: 400 },
    );
  }

  const dialogue = getDialogueById(dialogueId);
  if (!dialogue) {
    return NextResponse.json({ error: "Диалог не найден" }, { status: 404 });
  }
  const choice = dialogue.choices[choiceIndex];
  if (!choice) {
    return NextResponse.json({ error: "Выбор не найден" }, { status: 400 });
  }

  const player = await prisma.player.findUnique({ where: { userId } });
  if (!player) {
    return NextResponse.json({ error: "Профиль не найден" }, { status: 404 });
  }

  // Если уже видел этот диалог — игнорим (идемпотентность)
  const seen = parseSeenDialogues(player.seenDialogues);
  if (seen.includes(dialogueId)) {
    return NextResponse.json(
      { error: "Этот диалог уже был" },
      { status: 400 },
    );
  }

  // Обновляем attitude
  const attitudes = parseAttitudes(player.npcAttitudes);
  const before = attitudes[dialogue.npcRegion] ?? 0;
  const after = clamp(before + choice.attitudeDelta, -100, 100);
  attitudes[dialogue.npcRegion] = after;

  // Помечаем диалог как пройденный
  seen.push(dialogueId);

  await prisma.player.update({
    where: { id: player.id },
    data: {
      npcAttitudes: JSON.stringify(attitudes),
      seenDialogues: JSON.stringify(seen),
    },
  });

  return NextResponse.json({
    success: true,
    response: choice.response,
    attitudeBefore: before,
    attitudeAfter: after,
    attitudeDelta: choice.attitudeDelta,
  });
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
