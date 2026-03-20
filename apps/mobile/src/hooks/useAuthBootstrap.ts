import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import type { Provider, Session } from '@supabase/supabase-js';

import { queryKeys } from '@bodyritual/supabase';

import { ensureAnonymousSession, authenticateWithProvider, signOut } from '../services/auth';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

type AuthState = {
  session: Session | null;
  isReady: boolean;
  isAnonymous: boolean;
  hasSession: boolean;
  authError: string | null;
  continueWithProvider: (provider: Provider) => Promise<void>;
  resetSession: () => Promise<void>;
};

export function useAuthBootstrap(): AuthState {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const sessionQuery = useQuery({
    queryKey: queryKeys.authSession,
    queryFn: ensureAnonymousSession,
    enabled: isSupabaseConfigured,
    retry: 1,
  });

  useEffect(() => {
    if (!supabase) {
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      void queryClient.invalidateQueries({ queryKey: queryKeys.profile });
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, [queryClient]);

  useEffect(() => {
    if (sessionQuery.error) {
      setAuthError(sessionQuery.error instanceof Error ? sessionQuery.error.message : 'Auth bootstrap failed');
    } else {
      setAuthError(null);
    }
  }, [sessionQuery.error]);

  const providerMutation = useMutation({
    mutationFn: async (provider: Provider) => {
      const shouldLink = Boolean((session?.user as { is_anonymous?: boolean } | null)?.is_anonymous);
      await authenticateWithProvider(provider, shouldLink);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.authSession });
      await queryClient.invalidateQueries({ queryKey: queryKeys.profile });
    },
  });

  const signOutMutation = useMutation({
    mutationFn: signOut,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.authSession });
      await ensureAnonymousSession();
    },
  });

  const isAnonymous = useMemo(
    () => Boolean((session?.user as { is_anonymous?: boolean } | null)?.is_anonymous),
    [session]
  );

  return {
    session,
    isReady: !isSupabaseConfigured || sessionQuery.isSuccess || sessionQuery.isError || Boolean(session),
    isAnonymous,
    hasSession: Boolean(session),
    authError,
    continueWithProvider: providerMutation.mutateAsync,
    resetSession: signOutMutation.mutateAsync,
  };
}
