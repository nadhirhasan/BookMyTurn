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
});
