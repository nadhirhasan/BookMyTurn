import assert from 'node:assert/strict';
import { test } from 'node:test';
import { checkImmediateSignup } from '../src/lib/supabase/signup-policy.ts';

test('immediate signup fails closed for confirmation, disabled providers, signup and invalid responses', async () => {
  const original = globalThis.fetch;
  try {
    for (const [body, allowed] of [
      [{ external: { email: true }, mailer_autoconfirm: true }, true],
      [{ external: { email: true }, mailer_autoconfirm: false }, false],
      [{ external: { email: false }, mailer_autoconfirm: true }, false],
      [{ external: { email: true }, mailer_autoconfirm: true, disable_signup: true }, false],
      [{}, false],
    ] as const) {
      globalThis.fetch = async () => new Response(JSON.stringify(body));
      assert.equal(await checkImmediateSignup('https://example.supabase.co', 'sb_publishable_fixture'), allowed);
    }
    globalThis.fetch = async () => new Response('{}', { status: 503 });
    assert.equal(await checkImmediateSignup('https://example.supabase.co', 'sb_publishable_fixture'), false);
  } finally { globalThis.fetch = original; }
});
