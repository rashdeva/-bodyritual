import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { createClient } from '@supabase/supabase-js';

import { parseSupabasePublicEnv, type Database } from '@bodyritual/supabase';

function resolveEnv() {
  const extra = Constants.expoConfig?.extra as
    | {
        supabaseUrl?: string;
        supabaseAnonKey?: string;
      }
    | undefined;

  try {
    return parseSupabasePublicEnv({
      url: process.env.EXPO_PUBLIC_SUPABASE_URL ?? extra?.supabaseUrl,
      anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? extra?.supabaseAnonKey,
    });
  } catch {
    return null;
  }
}

const env = resolveEnv();

export const supabase = env
  ? createClient<Database>(env.url, env.anonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

export const isSupabaseConfigured = Boolean(env);
