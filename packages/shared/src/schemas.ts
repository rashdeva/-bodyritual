import { z } from 'zod';

export const leaderboardWindowSchema = z.enum(['day', 'week']);

export const startWorkoutSessionSchema = z.object({
  ritualId: z.string().uuid(),
});

export const finishWorkoutSessionSchema = z.object({
  sessionId: z.string().uuid(),
  clientDurationSeconds: z.number().int().min(0),
});

export const onlineRacePresenceSchema = z.object({
  userId: z.string().uuid(),
  displayName: z.string().min(1),
  avatarSeed: z.string().min(1),
  level: z.number().int().min(1),
  xpTotal: z.number().int().min(0),
  sessionId: z.string().uuid().nullable(),
  currentSessionXp: z.number().int().min(0),
  startedAt: z.string().nullable(),
  lastSeenAt: z.string(),
});
