import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createAuthActions, validateCredentials } from '../src/lib/supabase/auth-actions.ts';

const credentials = { email: ' Customer@Example.com ', password: ' 12345678 ' };
function fixture() {
  const calls: { kind: string; input: unknown }[] = [];
  let result: unknown = { data: { session: { user: { id: 'fixture' } } }, error: null };
  let fail = false;
  let wait: Promise<void> | null = null;
  const auth = {
    signInWithPassword: async (input: unknown) => { calls.push({ kind: 'sign-in', input }); if (wait) await wait; if (fail) throw new Error('private URL/token'); return result; },
    signUp: async (input: unknown) => { calls.push({ kind: 'sign-up', input }); if (wait) await wait; if (fail) throw new Error('private URL/token'); return result; },
    signOut: async (input: unknown) => { calls.push({ kind: 'sign-out', input }); if (fail) throw new Error('private URL/token'); return { error: null }; },
  } as unknown as Pick<SupabaseClient['auth'], 'signInWithPassword' | 'signUp' | 'signOut'>;
  const actions = createAuthActions({ getClient: () => ({ client: { auth } }) });
  return { actions, calls, setResult: (value: unknown) => { result = value; },
    setWait: (value: Promise<void>) => { wait = value; }, throwNetwork: () => { fail = true; } };
}

test('validation accepts ordinary email and requires signup password length without changing passwords', () => {
  assert.deepEqual(validateCredentials('sign-up', credentials), {});
  assert.deepEqual(validateCredentials('sign-in', { email: 'a@example.com', password: 'old' }), {});
  assert.equal(validateCredentials('sign-up', { email: 'bad', password: 'short' }).email, 'Enter a valid email address.');
  assert.equal(validateCredentials('sign-up', { email: 'a@example.com', password: 'short' }).password, 'Use at least 8 characters.');
});
test('invalid submissions never call Auth', async () => {
  const f = fixture();
  assert.equal((await f.actions.submit('sign-up', { email: '', password: '' })).ok, false);
  assert.equal(f.calls.length, 0);
});
test('sign-in normalises email, preserves password whitespace, and uses password Auth only', async () => {
  const f = fixture();
  assert.deepEqual(await f.actions.submit('sign-in', credentials), { ok: true });
  assert.deepEqual(f.calls, [{ kind: 'sign-in', input: { email: 'customer@example.com', password: ' 12345678 ' } }]);
});
test('dummy email signup calls Auth directly without a public-settings gate', async () => {
  const f = fixture();
  assert.equal((await f.actions.submit('sign-up', credentials)).ok, true);
  assert.equal(f.calls.length, 1);
});
test('immediate signup uses no metadata roles, redirect, email resend or profile insert', async () => {
  const f = fixture();
  assert.deepEqual(await f.actions.submit('sign-up', credentials), { ok: true });
  assert.deepEqual(f.calls, [{ kind: 'sign-up', input: { email: 'customer@example.com', password: credentials.password } }]);
});
test('a response without a real session is never treated as signed in', async () => {
  const f = fixture(); f.setResult({ data: { user: { id: 'unconfirmed' }, session: null }, error: null });
  assert.equal((await f.actions.submit('sign-up', credentials)).ok, false);
});
test('overlapping submissions across routes run only once and release after completion', async () => {
  const f = fixture(); let release: () => void = () => {};
  f.setWait(new Promise<void>(resolve => { release = resolve; }));
  const first = f.actions.submit('sign-up', credentials);
  const second = await f.actions.submit('sign-in', credentials);
  assert.equal(second.ok, false); release();
  assert.equal((await first).ok, true);
  assert.equal(f.calls.length, 1);
  assert.equal((await f.actions.submit('sign-in', credentials)).ok, true);
});
test('server errors are mapped without rendering raw messages or private details', async () => {
  const f = fixture();
  for (const code of ['invalid_credentials', 'email_not_confirmed', 'user_already_exists', 'weak_password', 'unknown']) {
    f.setResult({ data: { session: null }, error: { code, message: 'private URL/token' } });
    const result = await f.actions.submit('sign-in', credentials);
    assert.equal(result.ok, false);
    if (!result.ok) assert.ok(!result.error.includes('private'));
  }
});
test('rate-limit and thrown network failures are safe and permit retries', async () => {
  const f = fixture(); f.setResult({ data: { session: null }, error: { status: 429 } });
  const limited = await f.actions.submit('sign-in', credentials);
  assert.equal(limited.ok, false); if (!limited.ok) assert.match(limited.error, /Too many attempts/);
  f.throwNetwork();
  const network = await f.actions.submit('sign-in', credentials);
  assert.equal(network.ok, false); if (!network.ok) assert.match(network.error, /^Could not connect/);
});
test('sign-out targets this device and missing setup exposes no environment values', async () => {
  const f = fixture(); assert.deepEqual(await f.actions.signOut(), { ok: true });
  assert.deepEqual(f.calls, [{ kind: 'sign-out', input: { scope: 'local' } }]);
  const missing = createAuthActions({ getClient: () => ({ client: null, error: 'sb_secret_private' }) });
  const result = await missing.submit('sign-in', credentials);
  assert.equal(result.ok, false); if (!result.ok) assert.ok(!result.error.includes('private'));
});
