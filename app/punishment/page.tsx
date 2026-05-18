import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import PageBackdrop from "@/app/components/PageBackdrop";
import PunishmentSetup from "./PunishmentSetup";

// Экран ввода Личного Наказания — показывается ОДИН раз, сразу после выбора класса.
export default async function PunishmentPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const userId = (session.user as any).id;
  const player = await prisma.player.findUnique({ where: { userId } });
  if (!player) redirect("/");
  if (!player.class) redirect("/select-class");

  // Уже вписано — назад дороги нет, на профиль
  if (player.punishmentPact && player.punishmentPact.trim().length > 0) {
    redirect("/profile");
  }

  return (
    <>
      <PageBackdrop image="select-class.jpg" accent="#8b2424" />
      <PunishmentSetup />
    </>
  );
}
