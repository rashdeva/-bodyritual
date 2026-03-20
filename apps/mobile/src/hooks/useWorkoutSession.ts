import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

import { DEFAULT_RITUAL_DURATION_SECONDS, XP_PER_SECOND } from '@bodyritual/shared';
import { queryKeys } from '@bodyritual/supabase';

import type { CurrentUserProfile } from '@bodyritual/shared';
import {
  finishWorkoutSession,
  getActiveWorkoutSession,
  listActiveRituals,
  startWorkoutSession,
  type ActiveWorkoutSessionSnapshot,
} from '../services/workouts';

type ActiveSessionState = {
  sessionId: string;
  ritualId: string;
  ritualTitle: string;
  ritualDurationSeconds: number;
  startedAt: string;
  baseSessionXp: number;
  baseTotalXp: number;
};

export function useWorkoutSession(profile: CurrentUserProfile | undefined) {
  const queryClient = useQueryClient();
  const [activeSession, setActiveSession] = useState<ActiveSessionState | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const ritualsQuery = useQuery({
    queryKey: queryKeys.ritualCatalog,
    queryFn: listActiveRituals,
  });

  const activeSessionQuery = useQuery({
    queryKey: ['active-session'],
    queryFn: getActiveWorkoutSession,
    enabled: Boolean(profile),
  });

  useEffect(() => {
    if (!activeSession) {
      return;
    }

    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, [activeSession]);

  useEffect(() => {
    const snapshot = activeSessionQuery.data;

    if (!snapshot || !profile || activeSession) {
      return;
    }

    setActiveSession({
      sessionId: snapshot.id,
      ritualId: snapshot.ritualId,
      ritualTitle: snapshot.ritualTitle,
      ritualDurationSeconds: snapshot.ritualDurationSeconds,
      startedAt: snapshot.startedAt,
      baseSessionXp: snapshot.baseXpAwarded,
      baseTotalXp: profile.xpTotal,
    });
  }, [activeSession, activeSessionQuery.data, profile]);

  const primaryRitual = ritualsQuery.data?.[0] ?? null;

  const elapsedSeconds = useMemo(() => {
    if (!activeSession) {
      return 0;
    }

    return Math.max(0, Math.floor((now - new Date(activeSession.startedAt).getTime()) / 1000));
  }, [activeSession, now]);

  const secondsLeft = useMemo(() => {
    if (!activeSession) {
      return primaryRitual?.durationSeconds ?? DEFAULT_RITUAL_DURATION_SECONDS;
    }

    return Math.max(0, activeSession.ritualDurationSeconds - elapsedSeconds);
  }, [activeSession, elapsedSeconds, primaryRitual?.durationSeconds]);

  const currentSessionXp = useMemo(() => {
    if (!activeSession) {
      return 0;
    }

    return activeSession.baseSessionXp + elapsedSeconds * XP_PER_SECOND;
  }, [activeSession, elapsedSeconds]);

  const currentTotalXp = useMemo(() => {
    if (!activeSession) {
      return profile?.xpTotal ?? 0;
    }

    return activeSession.baseTotalXp + elapsedSeconds * XP_PER_SECOND;
  }, [activeSession, elapsedSeconds, profile?.xpTotal]);

  const startMutation = useMutation({
    mutationFn: async () => {
      if (!primaryRitual) {
        throw new Error('No active ritual found');
      }

      return {
        ritual: primaryRitual,
        result: await startWorkoutSession(primaryRitual.id),
      };
    },
    onSuccess: async ({ ritual, result }) => {
      setNow(Date.now());
      setActiveSession({
        sessionId: result.sessionId,
        ritualId: ritual.id,
        ritualTitle: ritual.title,
        ritualDurationSeconds: ritual.durationSeconds,
        startedAt: result.startedAt,
        baseSessionXp: result.initialXp,
        baseTotalXp: result.xpTotal,
      });

      await queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      await queryClient.invalidateQueries({ queryKey: ['active-session'] });
    },
  });

  const finishMutation = useMutation({
    mutationFn: async (snapshot: ActiveSessionState) =>
      finishWorkoutSession(snapshot.sessionId, Math.max(0, elapsedSeconds)),
    onSuccess: async () => {
      setActiveSession(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      await queryClient.invalidateQueries({ queryKey: queryKeys.leaderboard('day') });
      await queryClient.invalidateQueries({ queryKey: queryKeys.leaderboard('week') });
      await queryClient.invalidateQueries({ queryKey: ['active-session'] });
    },
  });

  return {
    primaryRitual,
    ritualsError: ritualsQuery.error ?? null,
    activeSession,
    elapsedSeconds,
    secondsLeft,
    currentSessionXp,
    currentTotalXp,
    isActive: Boolean(activeSession),
    start: startMutation.mutateAsync,
    finish: activeSession ? () => finishMutation.mutateAsync(activeSession) : null,
    isStarting: startMutation.isPending,
    isFinishing: finishMutation.isPending,
    startError: startMutation.error ?? null,
    finishError: finishMutation.error ?? null,
    lastFinishResult: finishMutation.data ?? null,
    restoreSnapshot: activeSessionQuery.data as ActiveWorkoutSessionSnapshot | null | undefined,
  };
}
