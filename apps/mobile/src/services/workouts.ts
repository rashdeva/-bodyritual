import type {
  LeaderboardWindow,
  WorkoutSessionFinishResult,
  WorkoutSessionStartResult,
} from '@bodyritual/shared';
import { supabase } from '../lib/supabase';

export type ActiveRitual = {
  id: string;
  title: string;
  durationSeconds: number;
};

export type ActiveWorkoutSessionSnapshot = {
  id: string;
  ritualId: string;
  ritualTitle: string;
  ritualDurationSeconds: number;
  startedAt: string;
  baseXpAwarded: number;
};

export async function listActiveRituals(): Promise<ActiveRitual[]> {
  if (!supabase) {
    throw new Error('Supabase env is not configured');
  }

  const { data, error } = await supabase
    .from('workout_rituals')
    .select('id, title, duration_seconds')
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as Array<{ id: string; title: string; duration_seconds: number }>;

  return rows.map((ritual) => ({
    id: ritual.id,
    title: ritual.title,
    durationSeconds: ritual.duration_seconds,
  }));
}

export async function getActiveWorkoutSession(): Promise<ActiveWorkoutSessionSnapshot | null> {
  if (!supabase) {
    throw new Error('Supabase env is not configured');
  }

  const { data, error } = await supabase
    .from('workout_sessions')
    .select(
      `
      id,
      ritual_id,
      started_at,
      base_xp_awarded,
      workout_rituals (
        title,
        duration_seconds
      )
    `
    )
    .eq('status', 'active')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const row = data as
    | {
        id: string;
        ritual_id: string;
        started_at: string;
        base_xp_awarded: number;
        workout_rituals:
          | {
              title: string;
              duration_seconds: number;
            }
          | {
              title: string;
              duration_seconds: number;
            }[];
      }
    | null;

  if (!row || !row.workout_rituals) {
    return null;
  }

  const ritual = Array.isArray(row.workout_rituals) ? row.workout_rituals[0] : row.workout_rituals;

  return {
    id: row.id,
    ritualId: row.ritual_id,
    ritualTitle: ritual.title,
    ritualDurationSeconds: ritual.duration_seconds,
    startedAt: row.started_at,
    baseXpAwarded: row.base_xp_awarded,
  };
}

export async function startWorkoutSession(ritualId: string): Promise<WorkoutSessionStartResult> {
  if (!supabase) {
    throw new Error('Supabase env is not configured');
  }

  const { data, error } = await supabase.rpc('start_workout_session' as never, {
    p_ritual_id: ritualId,
  } as never);

  if (error) {
    throw error;
  }

  const payload = (Array.isArray(data) ? data[0] : data) as
    | {
        session_id: string;
        started_at: string;
        initial_xp: number;
        xp_total: number;
        level: number;
      }
    | undefined;

  if (!payload) {
    throw new Error('Empty start_workout_session response');
  }

  return {
    sessionId: payload.session_id,
    startedAt: payload.started_at,
    initialXp: payload.initial_xp,
    xpTotal: payload.xp_total,
    level: payload.level,
  };
}

export async function finishWorkoutSession(
  sessionId: string,
  clientDurationSeconds: number
): Promise<WorkoutSessionFinishResult> {
  if (!supabase) {
    throw new Error('Supabase env is not configured');
  }

  const { data, error } = await supabase.rpc('finish_workout_session' as never, {
    p_session_id: sessionId,
    p_client_duration_seconds: clientDurationSeconds,
  } as never);

  if (error) {
    throw error;
  }

  const payload = (Array.isArray(data) ? data[0] : data) as
    | {
        session_id: string;
        confirmed_xp: number;
        confirmed_seconds: number;
        xp_total: number;
        level: number;
        daily_rank: number | null;
        weekly_rank: number | null;
        ended_at: string;
      }
    | undefined;

  if (!payload) {
    throw new Error('Empty finish_workout_session response');
  }

  return {
    sessionId: payload.session_id,
    confirmedXp: payload.confirmed_xp,
    confirmedSeconds: payload.confirmed_seconds,
    xpTotal: payload.xp_total,
    level: payload.level,
    dailyRank: payload.daily_rank,
    weeklyRank: payload.weekly_rank,
    endedAt: payload.ended_at,
  };
}

export async function fetchLeaderboard(window: LeaderboardWindow) {
  if (!supabase) {
    throw new Error('Supabase env is not configured');
  }

  const { data, error } = await supabase.rpc('fetch_leaderboard' as never, {
    p_window: window,
  } as never);

  if (error) {
    throw error;
  }

  return (data ?? []) as Array<{
    rank: number;
    user_id: string;
    display_name: string;
    username: string | null;
    avatar_seed: string;
    level: number;
    xp_total: number;
    xp_window: number;
  }>;
}
