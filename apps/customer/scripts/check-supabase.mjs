import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { fileURLToPath } from 'node:url';
import { parseSupabaseConfiguration } from '../src/lib/supabase/config.ts';

const rootEnvironment = fileURLToPath(new URL('../../../.env', import.meta.url));
if (existsSync(rootEnvironment)) loadEnvFile(rootEnvironment);
const result = parseSupabaseConfiguration(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);

if (!result.configuration) {
  console.error(result.error);
  process.exitCode = 1;
} else {
  try {
    const { url, publishableKey } = result.configuration;
    const settings = await fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: publishableKey }, signal: AbortSignal.timeout(15000),
    });
    if (!settings.ok) throw new Error('The Auth API rejected the configured project URL or publishable key.');
    const auth = await settings.json();
    console.log('PASS: Supabase Auth API reachable with the publishable key.');
    console.log(`Email provider: ${auth.external?.email ? 'enabled' : 'disabled'}. Email confirmation: ${auth.mailer_autoconfirm ? 'disabled' : 'enabled'}.`);

    // This intentionally runs without a user JWT and requests zero records.
    const profile = await fetch(`${url}/rest/v1/customer_profiles?select=id&limit=0`, {
      headers: { apikey: publishableKey }, signal: AbortSignal.timeout(15000),
    });
    const body = await profile.json();
    if ((profile.status === 401 || profile.status === 403) && body.code === '42501') {
      console.log('PASS: Unauthenticated profile access denied by database privileges.');
    } else if (profile.status === 404 && body.code === 'PGRST205') {
      throw new Error('Profile migration is not applied (or schema cache is not refreshed). Apply 20261029000100_customer_profiles.sql, then rerun this check.');
    } else {
      throw new Error('Profile access did not match the expected private-table policy. Review the migration and database permission tests.');
    }
  } catch (error) {
    // Print only our own messages; fetch/network errors may contain a project URL.
    const safeMessages = [
      'The Auth API rejected the configured project URL or publishable key.',
      'Profile migration is not applied (or schema cache is not refreshed). Apply 20261029000100_customer_profiles.sql, then rerun this check.',
      'Profile access did not match the expected private-table policy. Review the migration and database permission tests.',
    ];
    console.error(error instanceof Error && safeMessages.includes(error.message)
      ? error.message : 'Supabase check could not complete. Check your network and project availability, then try again.');
    process.exitCode = 1;
  }
}
