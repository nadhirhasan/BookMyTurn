import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseSupabaseConfiguration } from '../src/lib/supabase/config.ts';

const key = 'sb_publishable_test_configuration_only';
test('accepts and normalises a public HTTPS configuration', () => {
  assert.deepEqual(parseSupabaseConfiguration(' https://demo.supabase.co/ ', ` ${key} `), {
    configuration: { url: 'https://demo.supabase.co', publishableKey: key }, error: null,
  });
});
test('missing, insecure and credential-bearing URLs fail with safe setup instructions', () => {
  for (const url of [undefined, '', 'not-a-url', 'http://demo.supabase.co', 'https://name:private-password@demo.supabase.co', 'https://demo.supabase.co?token=private', 'https://demo.supabase.co/rest/v1']) {
    const result = parseSupabaseConfiguration(url, key);
    assert.equal(result.configuration, null);
    assert.match(result.error ?? '', /EXPO_PUBLIC_SUPABASE_URL/);
    assert.ok(!result.error?.includes('private'));
  }
});
test('requires a publishable key and never echoes a privileged or invalid key', () => {
  for (const value of [undefined, '', 'sb_secret_do_not_expose', 'service-role-token', 'sb_publishable_bad key']) {
    const result = parseSupabaseConfiguration('https://demo.supabase.co', value);
    assert.equal(result.configuration, null);
    assert.match(result.error ?? '', /EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
    if (value) assert.ok(!result.error?.includes(value));
  }
});
