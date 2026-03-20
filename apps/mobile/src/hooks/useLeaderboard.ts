import { useQuery } from '@tanstack/react-query';

import type { LeaderboardWindow } from '@bodyritual/shared';
import { mapLeaderboardEntry, queryKeys } from '@bodyritual/supabase';

import { fetchLeaderboard } from '../services/workouts';

export function useLeaderboard(window: LeaderboardWindow, currentUserId: string | null, onlineIds: Set<string>) {
  return useQuery({
    queryKey: queryKeys.leaderboard(window),
    queryFn: async () => {
      const rows = await fetchLeaderboard(window);
      return rows.map((row: (typeof rows)[number]) => mapLeaderboardEntry(row, currentUserId, onlineIds));
    },
    refetchInterval: 20_000,
  });
}
