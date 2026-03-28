import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.url().optional(),
  NEXTAUTH_URL: z.url().optional(),
  NEXTAUTH_SECRET: z.string().min(1).optional(),
  VK_CLIENT_ID: z.string().min(1).optional(),
  VK_CLIENT_SECRET: z.string().min(1).optional(),
  ADMIN_USER_IDS: z.string().optional(),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  VK_CLIENT_ID: process.env.VK_CLIENT_ID,
  VK_CLIENT_SECRET: process.env.VK_CLIENT_SECRET,
  ADMIN_USER_IDS: process.env.ADMIN_USER_IDS,
});
