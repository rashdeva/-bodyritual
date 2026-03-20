import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@bodyritual/supabase';

import { isSupabaseConfigured } from '../lib/supabase';
import { fetchProfileSnapshot } from '../services/profile';

export function useProfile(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: fetchProfileSnapshot,
    enabled: isSupabaseConfigured && enabled,
    retry: 2,
  });
}
