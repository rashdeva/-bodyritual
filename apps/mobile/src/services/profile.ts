import type { CurrentUserProfile } from '@bodyritual/shared';
import { mapProfile } from '@bodyritual/supabase';

import { supabase } from '../lib/supabase';

export async function fetchProfileSnapshot(): Promise<CurrentUserProfile> {
  if (!supabase) {
    throw new Error('Supabase env is not configured');
  }

  const { data, error } = await supabase.rpc('get_profile_snapshot');

  if (error) {
    throw error;
  }

  const row = data?.[0];
  if (!row) {
    throw new Error('Profile not found');
  }

  return mapProfile(row);
}

export async function touchLastSeen() {
  if (!supabase) {
    return;
  }

  await supabase.rpc('touch_last_seen');
}
