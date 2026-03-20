export type LeaderboardWindow = 'day' | 'week';
export type WorkoutSessionStatus = 'active' | 'completed' | 'abandoned';
export type XpLedgerReason = 'session_start' | 'session_tick' | 'bonus' | 'manual_adjustment';

export type WorkoutSessionStartResult = {
  sessionId: string;
  startedAt: string;
  initialXp: number;
  xpTotal: number;
  level: number;
};

export type WorkoutSessionFinishResult = {
  sessionId: string;
  confirmedXp: number;
  confirmedSeconds: number;
  xpTotal: number;
  level: number;
  dailyRank: number | null;
  weeklyRank: number | null;
  endedAt: string;
};

export type OnlineRacePresence = {
  userId: string;
  displayName: string;
  avatarSeed: string;
  level: number;
  xpTotal: number;
  sessionId: string | null;
  currentSessionXp: number;
  startedAt: string | null;
  lastSeenAt: string;
};

export type LeaderboardEntry = {
  rank: number;
  userId: string;
  displayName: string;
  username: string | null;
  avatarSeed: string;
  level: number;
  xpTotal: number;
  xpWindow: number;
  isCurrentUser: boolean;
  isOnline: boolean;
};

export type CurrentUserProfile = {
  id: string;
  username: string | null;
  displayName: string;
  avatarSeed: string;
  level: number;
  xpTotal: number;
  lastSeenAt: string | null;
};
