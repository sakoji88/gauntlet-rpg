import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),

  providers: [
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }),
  ],

  session: {
    strategy: "database",
  },

  callbacks: {
    // ПРОВЕРКА БЕЛОГО СПИСКА: пускаем только из AllowedDiscordId
    async signIn({ account }) {
      if (!account || account.provider !== "discord") {
        return false;
      }

      const discordId = account.providerAccountId;

      const allowed = await prisma.allowedDiscordId.findUnique({
        where: { discordId },
      });

      if (!allowed) {
        // Перенаправляем на страницу "тебя нет в списке"
        return "/not-allowed";
      }

      return true;
    },

    // Добавляем игровые данные в сессию (чтобы видеть на фронте)
    async session({ session, user }) {
      const player = await prisma.player.findUnique({
        where: { userId: user.id },
      });

      return {
        ...session,
        user: {
          ...session.user,
          id: user.id,
          player,
        },
      };
    },
  },

  // СОБЫТИЯ: после первого логина создаём игровой профиль
 events: {
  async createUser({ user }) {
    if (!user.id) return;
    // Создаём профиль игрока с дефолтными статами
    await prisma.player.create({
      data: {
        userId: user.id,
        nickname: user.name || "Безымянный",
      },
    });
  },
  // Каждый раз при логине проверяем что Player существует
  // (защита на случай если запись была удалена вручную)
  async signIn({ user, profile }) {
    if (!user.id) return;

    // Подтягиваем актуальную аватарку из Discord при каждом входе
    const p = profile as { id?: string; avatar?: string | null } | undefined;
    if (p?.id && p.avatar) {
      const ext = p.avatar.startsWith("a_") ? "gif" : "png";
      const avatarUrl = `https://cdn.discordapp.com/avatars/${p.id}/${p.avatar}.${ext}`;
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { image: avatarUrl },
        });
      } catch {
        // не критично — пропускаем
      }
    }

    const existing = await prisma.player.findUnique({
      where: { userId: user.id },
    });
    if (!existing) {
      await prisma.player.create({
        data: {
          userId: user.id,
          nickname: user.name || "Безымянный",
        },
      });
    }
  },
},

  pages: {
    signIn: "/",       // Страница логина = главная
    error: "/not-allowed", // Ошибка = "не в списке"
  },
});