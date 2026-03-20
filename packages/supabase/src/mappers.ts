import type { CurrentUserProfile, LeaderboardEntry } from '@bodyritual/shared';
import type { Database } from './database.types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export function mapProfile(row: ProfileRow): CurrentUserProfile {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    avatarSeed: row.avatar_seed,
    level: row.level,
    xpTotal: row.xp_total,
    lastSeenAt: row.last_seen_at,
  };
}

export function mapLeaderboardEntry(
  row: Database['public']['Functions']['fetch_leaderboard']['Returns'][number],
  currentUserId: string | null,
  onlineIds: Set<string>
): LeaderboardEntry {
  return {
    rank: row.rank,
    userId: row.user_id,
    displayName: row.display_name,
    username: row.username,
    avatarSeed: row.avatar_seed,
    level: row.level,
    xpTotal: row.xp_total,
    xpWindow: row.xp_window,
    isCurrentUser: currentUserId === row.user_id,
    isOnline: onlineIds.has(row.user_id),
  };
}
