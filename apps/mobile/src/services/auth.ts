import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import type { Provider } from '@supabase/supabase-js';

import { createAnonymousIdentity } from '../utils/avatar';
import { supabase } from '../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

function parseTokensFromUrl(url: string) {
  const hashFragment = url.split('#')[1] ?? '';
  const searchFragment = url.split('?')[1] ?? '';
  const params = new URLSearchParams(hashFragment || searchFragment);

  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');

  if (!accessToken || !refreshToken) {
    return null;
  }

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
  };
}

async function completeOAuthSession(url: string) {
  const redirectTo = makeRedirectUri({
    scheme: 'bodyritual',
    path: 'auth/callback',
  });
  const result = await WebBrowser.openAuthSessionAsync(url, redirectTo);

  if (result.type !== 'success') {
    return;
  }

  const tokens = parseTokensFromUrl(result.url);
  if (tokens && supabase) {
    await supabase.auth.setSession(tokens);
  }
}

export async function ensureAnonymousSession() {
  if (!supabase) {
    throw new Error('Supabase env is not configured');
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    const { data: userResult, error: userError } = await supabase.auth.getUser();

    if (!userError && userResult.user) {
      return session;
    }

    await supabase.auth.signOut();
  }

  const identity = createAnonymousIdentity();
  const { data, error } = await supabase.auth.signInAnonymously({
    options: {
      data: {
        display_name: identity.displayName,
        avatar_seed: identity.avatarSeed,
      },
    },
  });

  if (error) {
    throw error;
  }

  return data.session;
}

export async function authenticateWithProvider(provider: Provider, shouldLink: boolean) {
  if (!supabase) {
    throw new Error('Supabase env is not configured');
  }

  const redirectTo = makeRedirectUri({
    scheme: 'bodyritual',
    path: 'auth/callback',
  });

  if (shouldLink) {
    const { data, error } = await supabase.auth.linkIdentity({
      provider,
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      throw error;
    }

    if (data?.url) {
      await completeOAuthSession(data.url);
    }

    return;
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) {
    throw error;
  }

  if (data?.url) {
    await completeOAuthSession(data.url);
  }
}

export async function signOut() {
  if (!supabase) {
    return;
  }

  await supabase.auth.signOut();
}
