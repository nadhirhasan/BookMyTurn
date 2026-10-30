import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  outputDir: '../../.artifacts/customer-e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 45000,
  use: { baseURL: 'http://127.0.0.1:8082', viewport: { width: 393, height: 852 }, trace: 'retain-on-failure' },
  webServer: {
    command: 'node ../../node_modules/expo/bin/cli start --web --port 8082',
    url: 'http://127.0.0.1:8082',
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      CI: '1',
      EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_ci_placeholder',
    },
  },
});
