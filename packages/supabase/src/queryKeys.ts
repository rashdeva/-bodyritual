export const queryKeys = {
  authSession: ['auth-session'] as const,
  profile: ['profile'] as const,
  leaderboard: (window: 'day' | 'week') => ['leaderboard', window] as const,
  ritualCatalog: ['ritual-catalog'] as const,
};
