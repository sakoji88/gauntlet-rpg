import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

// Редактор контента (админ): тексты условий NPC и пользовательские диалоги.
// action: save_condition | delete_condition | add_dialogue | delete_dialogue

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Кривое тело" }, { status: 400 });
  }
  const action = body.action;

  // ===== ТЕКСТ УСЛОВИЯ =====
  if (action === "save_condition") {
    const regionId = String(body.regionId ?? "");
    const conditionType = String(body.conditionType ?? "");
    const description = String(body.description ?? "").trim();
    const flavor = String(body.flavor ?? "").trim();
    if (!regionId || !["basic", "genre", "special"].includes(conditionType)) {
      return NextResponse.json({ error: "Регион и тип условия обязательны" }, { status: 400 });
    }
    if (!description || !flavor) {
      return NextResponse.json({ error: "Описание и реплика не должны быть пустыми" }, { status: 400 });
    }
    await prisma.conditionTextOverride.upsert({
      where: { regionId_conditionType: { regionId, conditionType } },
      update: { description, flavor },
      create: { regionId, conditionType, description, flavor },
    });
    return NextResponse.json({ success: true });
  }

  if (action === "delete_condition") {
    const regionId = String(body.regionId ?? "");
    const conditionType = String(body.conditionType ?? "");
    await prisma.conditionTextOverride
      .delete({ where: { regionId_conditionType: { regionId, conditionType } } })
      .catch(() => {});
    return NextResponse.json({ success: true });
  }

  // ===== ДИАЛОГИ =====
  if (action === "add_dialogue") {
    const npcRegion = String(body.npcRegion ?? "");
    const prompt = String(body.prompt ?? "").trim();
    const rawChoices = Array.isArray(body.choices) ? body.choices : [];
    const choices = rawChoices
      .map((c: any) => ({
        text: String(c?.text ?? "").trim(),
        attitudeDelta: Number(c?.attitudeDelta) || 0,
        response: String(c?.response ?? "").trim(),
      }))
      .filter((c: { text: string }) => c.text.length > 0);

    if (!npcRegion || !prompt) {
      return NextResponse.json({ error: "Регион и реплика NPC обязательны" }, { status: 400 });
    }
    if (choices.length < 2) {
      return NextResponse.json({ error: "Нужно минимум 2 варианта ответа" }, { status: 400 });
    }
    const created = await prisma.customDialogue.create({
      data: { npcRegion, prompt, choices: JSON.stringify(choices) },
    });
    return NextResponse.json({ success: true, id: created.id });
  }

  if (action === "delete_dialogue") {
    const dialogueId = String(body.dialogueId ?? "");
    await prisma.customDialogue.delete({ where: { id: dialogueId } }).catch(() => {});
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Неизвестное действие" }, { status: 400 });
}
