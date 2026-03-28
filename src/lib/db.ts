import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";
import { env } from "@/lib/env";

if (!env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to initialize Prisma.");
}

const adapter = new PrismaPg({
  connectionString: env.DATABASE_URL,
});

const globalForPrisma = globalThis as typeof globalThis & {
  prismaBodyritualV2?: PrismaClient;
};

export const db =
  globalForPrisma.prismaBodyritualV2 ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaBodyritualV2 = db;
}
