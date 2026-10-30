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
      throw new Error('Profile migration is not applied (or schema cache is not refreshed). Apply 20261030015043_customer_profiles.sql, then rerun this check.');
    } else {
      throw new Error('Profile access did not match the expected private-table policy. Review the migration and database permission tests.');
    }

    const catalog = await fetch(`${url}/rest/v1/salons?select=slug&order=slug`, {
      headers: { apikey: publishableKey }, signal: AbortSignal.timeout(15000),
    });
    const catalogBody = await catalog.json();
    const expectedSlugs = [
      'royal-saloon', 'mrg-akurana-6', 'mrg-akurana-7', 'mrg-akurana-8',
      'neel1', 'neel2', 'neel3', 'saloon-chami', 'mr-handsome',
      'saloon-kumar', 'mr-perfect', 'noire', 'saloon-bhai',
    ].sort();
    if (!catalog.ok || !Array.isArray(catalogBody)
      || JSON.stringify(catalogBody.map(row => row.slug).sort()) !== JSON.stringify(expectedSlugs)) {
      throw new Error('Published salon catalog does not match the 13 approved demo listings. Check the complete schema migration.');
    }
    console.log('PASS: Anonymous discovery can read exactly the 13 approved salon listings.');

    const queue = await fetch(`${url}/rest/v1/queue_entries?select=id&limit=0`, {
      headers: { apikey: publishableKey }, signal: AbortSignal.timeout(15000),
    });
    const queueBody = await queue.json();
    if (![401, 403].includes(queue.status) || queueBody.code !== '42501') {
      throw new Error('Anonymous queue access was not denied as expected. Review the complete schema grants.');
    }
    console.log('PASS: Anonymous discovery cannot read private queue records.');

    const privateSchema = await fetch(`${url}/rest/v1/salon_memberships?select=id&limit=0`, {
      headers: { apikey: publishableKey, 'Accept-Profile': 'bookmyturn_private' },
      signal: AbortSignal.timeout(15000),
    });
    const privateBody = await privateSchema.json();
    if (privateSchema.status !== 406 || privateBody.code !== 'PGRST106') {
      throw new Error('Private administrative schema is not outside the Data API as expected. Review exposed schema settings.');
    }
    console.log('PASS: Private administrative schema is outside the Data API.');
  } catch (error) {
    // Print only our own messages; fetch/network errors may contain a project URL.
    const safeMessages = [
      'The Auth API rejected the configured project URL or publishable key.',
      'Profile migration is not applied (or schema cache is not refreshed). Apply 20261030015043_customer_profiles.sql, then rerun this check.',
      'Profile access did not match the expected private-table policy. Review the migration and database permission tests.',
      'Published salon catalog does not match the 13 approved demo listings. Check the complete schema migration.',
      'Anonymous queue access was not denied as expected. Review the complete schema grants.',
      'Private administrative schema is not outside the Data API as expected. Review exposed schema settings.',
    ];
    console.error(error instanceof Error && safeMessages.includes(error.message)
      ? error.message : 'Supabase check could not complete. Check your network and project availability, then try again.');
    process.exitCode = 1;
  }
}
