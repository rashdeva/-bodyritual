import { getServerSession, type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { FitnessLevel, PreferredTime, UserStatus } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

type VkIdentity = {
  providerAccountId: string;
  displayName: string;
  avatarUrl: string | null;
  email: string | null;
};

export const isVkAuthConfigured = Boolean(env.VK_CLIENT_ID && env.VK_CLIENT_SECRET && env.NEXTAUTH_SECRET);

export function isAdminUser(userId: string) {
  const adminIds = env.ADMIN_USER_IDS?.split(",")
    .map((value) => value.trim())
    .filter(Boolean) ?? [];

  if (adminIds.length === 0) {
    return process.env.NODE_ENV !== "production";
  }

  return adminIds.includes(userId);
}

function readObject(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function extractVkIdentity(rawPayload: unknown): VkIdentity {
  const payload = readObject(rawPayload);
  if (!payload) {
    throw new Error("VK payload is empty.");
  }

  const candidates = [
    payload,
    readObject(payload.userInfo),
    readObject(payload.user),
    readObject(payload.userInfo)?.user,
    Array.isArray(payload.response) ? readObject(payload.response[0]) : null,
    Array.isArray(readObject(payload.userInfo)?.response) ? readObject((readObject(payload.userInfo)?.response as unknown[])[0]) : null,
  ].filter(Boolean) as Array<Record<string, unknown>>;

  for (const candidate of candidates) {
    const providerAccountId = String(candidate.user_id ?? candidate.id ?? candidate.sub ?? "");
    if (!providerAccountId) {
      continue;
    }

    const displayName =
      String(
        candidate.name ??
          [candidate.first_name, candidate.last_name].filter(Boolean).join(" ") ??
          `VK ${providerAccountId}`,
      ) || `VK ${providerAccountId}`;

    const avatarUrl = String(
      candidate.avatar ?? candidate.avatar_url ?? candidate.picture ?? candidate.photo_100 ?? "",
    ) || null;
    const email = String(candidate.email ?? "") || null;

    return {
      providerAccountId,
      displayName,
      avatarUrl,
      email,
    };
  }

  throw new Error("Unable to extract VK identity from widget payload.");
}

async function upsertVkUser(identity: VkIdentity) {
  return db.user.upsert({
    where: {
      authProvider_authProviderAccountId: {
        authProvider: "vk",
        authProviderAccountId: identity.providerAccountId,
      },
    },
    update: {
      email: identity.email,
      displayName: identity.displayName,
      avatarUrl: identity.avatarUrl,
      status: UserStatus.ACTIVE,
    },
    create: {
      email: identity.email,
      authProvider: "vk",
      authProviderAccountId: identity.providerAccountId,
      displayName: identity.displayName,
      avatarUrl: identity.avatarUrl,
      timezone: "Europe/Moscow",
      locale: "ru-RU",
      status: UserStatus.ACTIVE,
      onboardingCompleted: false,
      profile: {
        create: {
          goal: "Собрать ежедневный ритуал движения",
          preferredTime: PreferredTime.MORNING,
          fitnessLevel: FitnessLevel.BEGINNER,
          experiencePoints: 0,
          currentLevel: 1,
          currentStreak: 0,
          longestStreak: 0,
        },
      },
      progress: {
        create: {
          level: 1,
          xp: 0,
          streak: 0,
          totalCompletedSessions: 0,
          weeklyCompletedSessions: 0,
        },
      },
    },
    include: {
      profile: true,
      progress: true,
    },
  });
}

export const authOptions: NextAuthOptions = {
  secret: env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth",
  },
  providers: isVkAuthConfigured
    ? [
        CredentialsProvider({
          id: "vkid",
          name: "VK ID",
          credentials: {
            vk_payload: { label: "VK Payload", type: "text" },
          },
          async authorize(credentials) {
            const raw = credentials?.vk_payload;
            if (!raw) {
              return null;
            }

            const parsed = JSON.parse(raw);
            const identity = extractVkIdentity(parsed);
            const dbUser = await upsertVkUser(identity);

            return {
              id: dbUser.id,
              name: dbUser.displayName,
              email: dbUser.email,
              image: dbUser.avatarUrl,
            };
          },
        }),
      ]
    : [],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.userId = user.id;
      }

      if (!token.userId && token.sub) {
        const dbUser = await db.user.findFirst({
          where: {
            OR: [{ id: token.sub }, { email: token.email ?? undefined }],
          },
          select: { id: true },
        });

        if (dbUser) {
          token.userId = dbUser.id;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.userId) {
        session.user.id = String(token.userId);
      }

      return session;
    },
  },
};

export function getAuthSession() {
  return getServerSession(authOptions);
}
