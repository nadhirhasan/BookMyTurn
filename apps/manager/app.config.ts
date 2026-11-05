import type { ConfigContext, ExpoConfig } from 'expo/config';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { loadEnvFile } from 'node:process';

// Expo reads the app directory's .env files itself. Use the workspace root as
// a fallback, without overwriting injected or app-specific environment values.
const environmentPath = path.resolve(__dirname, '../../.env');
if (existsSync(environmentPath)) loadEnvFile(environmentPath);

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'BookMyTurn Manager',
  slug: 'bookmyturn-barber',
  plugins: [
    ...(config.plugins ?? []),
    ...(process.env.GOOGLE_MAPS_ANDROID_API_KEY ? [[
      'react-native-maps', { androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY },
    ] as [string, Record<string, string>]] : []),
  ],
});
