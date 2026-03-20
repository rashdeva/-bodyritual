const { existsSync, readFileSync } = require('node:fs');
const { resolve } = require('node:path');

const rootEnvPath = resolve(__dirname, '../../.env');

if (existsSync(rootEnvPath)) {
  const lines = readFileSync(rootEnvPath, 'utf8').split('\n');

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');

    if (key && !process.env[key]) {
      process.env[key] = value;
    }
  }
}

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  name: 'BodyRitual',
  slug: 'bodyritual',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'bodyritual',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.rashdeva.bodyritual',
  },
  android: {
    package: 'com.rashdeva.bodyritual',
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: './assets/favicon.png',
  },
  extra: {
    eas: {
      projectId: '5009c509-0ddb-4233-83a0-3558303283c2',
    },
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  },
  owner: 'rashdeva',
};
