import { z } from 'zod';

const publicEnvSchema = z.object({
  url: z.string().url(),
  anonKey: z.string().min(1),
});

export type SupabasePublicEnv = z.infer<typeof publicEnvSchema>;

export function parseSupabasePublicEnv(values: { url?: string; anonKey?: string }) {
  return publicEnvSchema.parse({
    url: values.url,
    anonKey: values.anonKey,
  });
}
