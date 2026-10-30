import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { AuthChangeEvent, Session, SupabaseClient } from '@supabase/supabase-js';
import { createSessionStore } from '../src/lib/supabase/session-store.ts';

const session: Session = {
  access_token: 'fixture-access-token', refresh_token: 'fixture-refresh-token',
  token_type: 'bearer', expires_in: 3600,
  user: { id: 'b02f0000-0000-4000-8000-000000000001', aud: 'authenticated',
    app_metadata: {}, user_metadata: {}, created_at: '2026-10-29T00:00:00Z' },
};
const settled = () => new Promise<void>(resolve => setImmediate(resolve));

function fixture() {
  let onEvent: ((event: AuthChangeEvent, value: Session | null) => unknown) | undefined;
  let onState: ((state: string) => void) | undefined;
  let restore: (value: Awaited<ReturnType<SupabaseClient['auth']['getSession']>>) => void = () => {};
  let reject: (error: Error) => void = () => {};
  const calls = { unsubscribed: 0, lifecycleRemoved: 0, started: 0, stopped: 0 };
  const auth = {
    getSession: () => new Promise<Awaited<ReturnType<SupabaseClient['auth']['getSession']>>>((resolve, fail) => { restore = resolve; reject = fail; }),
    onAuthStateChange: ((callback: typeof onEvent) => {
      onEvent = callback;
      return { data: { subscription: { unsubscribe: () => { calls.unsubscribed++; } } } };
    }) as SupabaseClient['auth']['onAuthStateChange'],
    startAutoRefresh: async () => { calls.started++; },
    stopAutoRefresh: async () => { calls.stopped++; },
  };
  const lifecycle = {
    currentState: () => 'active',
    subscribe: (callback: (state: string) => void) => {
      onState = callback;
      return () => { calls.lifecycleRemoved++; };
    },
  };
  return {
    auth, lifecycle, calls,
    restore: (value: Session | null) => restore(value
      ? { data: { session: value }, error: null }
      : { data: { session: null }, error: null }),
    reject: (error: Error) => reject(error),
    emit: (event: AuthChangeEvent, value: Session | null) => onEvent?.(event, value),
    changeState: (state: string) => onState?.(state),
  };
}

test('missing configuration does not create a client or prevent guest browsing', () => {
  const store = createSessionStore({ getClient: () => ({ client: null, error: 'Configuration needed' }) });
  const stop = store.start();
  assert.equal(store.getSnapshot().status, 'unconfigured');
  assert.equal(store.getSnapshot().session, null);
  assert.equal(store.getSnapshot().error, 'Configuration needed');
  stop();
});

test('restores an existing stored session without creating a new identity', async () => {
  const f = fixture();
  const store = createSessionStore({ getClient: () => ({ client: { auth: f.auth }, error: null }) });
  let notices = 0;
  const unsubscribe = store.subscribe(() => { notices++; });
  const stop = store.start();
  f.restore(session);
  await settled();
  assert.equal(store.getSnapshot().status, 'authenticated');
  assert.equal(store.getSnapshot().session, session);
  assert.equal(notices, 1);
  unsubscribe(); stop();
  assert.equal(f.calls.unsubscribed, 1);
});

test('a customer without a session remains a guest', async () => {
  const f = fixture();
  const store = createSessionStore({ getClient: () => ({ client: { auth: f.auth }, error: null }) });
  const stop = store.start(); f.restore(null); await settled();
  assert.equal(store.getSnapshot().status, 'guest'); stop();
});

test('a stale restore cannot overwrite a more recent sign-out', async () => {
  const f = fixture();
  const store = createSessionStore({ getClient: () => ({ client: { auth: f.auth }, error: null }) });
  const stop = store.start();
  f.emit('SIGNED_OUT', null); f.restore(session); await settled();
  assert.equal(store.getSnapshot().status, 'guest');
  assert.equal(store.getSnapshot().event, 'SIGNED_OUT'); stop();
});

test('foreground/background refresh starts and stops; cleanup ignores late events', async () => {
  const f = fixture();
  const store = createSessionStore({ getClient: () => ({ client: { auth: f.auth }, error: null }), lifecycle: f.lifecycle });
  const stop = store.start();
  assert.equal(f.calls.started, 1);
  f.changeState('background'); assert.equal(f.calls.stopped, 1);
  f.changeState('active'); assert.equal(f.calls.started, 2);
  f.emit('SIGNED_IN', session);
  stop(); stop();
  f.changeState('active'); f.emit('SIGNED_OUT', null); f.restore(null); await settled();
  assert.equal(f.calls.unsubscribed, 1);
  assert.equal(f.calls.lifecycleRemoved, 1);
  assert.equal(f.calls.stopped, 2);
  assert.equal(store.getSnapshot().status, 'authenticated');
});

test('restoration failures do not leak SDK details and a new auth event recovers', async () => {
  const f = fixture();
  const store = createSessionStore({ getClient: () => ({ client: { auth: f.auth }, error: null }) });
  const stop = store.start();
  f.reject(new Error('private-token-internal-error')); await settled();
  assert.equal(store.getSnapshot().status, 'error');
  assert.ok(!store.getSnapshot().error?.includes('private-token'));
  f.emit('SIGNED_IN', session);
  assert.equal(store.getSnapshot().status, 'authenticated');
  assert.equal(store.getSnapshot().error, null); stop();
});

test('restarting a subscription cannot apply completion from the previous run', async () => {
  const f = fixture();
  const store = createSessionStore({ getClient: () => ({ client: { auth: f.auth }, error: null }) });
  const firstStop = store.start();
  const oldRestore = f.restore;
  // Capture the first promise resolver through the first completion before restart.
  oldRestore(session);
  const secondStop = store.start();
  firstStop();
  await settled();
  assert.equal(store.getSnapshot().status, 'loading');
  f.restore(null); await settled();
  assert.equal(store.getSnapshot().status, 'guest');
  secondStop();
  assert.equal(f.calls.unsubscribed, 2);
});

test('native refresh failures are handled safely and a later auth event recovers', async () => {
  const f = fixture();
  f.auth.startAutoRefresh = async () => { throw new Error('private-native-storage-error'); };
  f.auth.stopAutoRefresh = async () => { throw new Error('private-cleanup-error'); };
  const store = createSessionStore({ getClient: () => ({ client: { auth: f.auth }, error: null }), lifecycle: f.lifecycle });
  const stop = store.start();
  await settled();
  assert.equal(store.getSnapshot().status, 'error');
  assert.ok(!store.getSnapshot().error?.includes('private-native'));
  f.emit('TOKEN_REFRESHED', session);
  assert.equal(store.getSnapshot().status, 'authenticated');
  stop();
  await settled();
  assert.equal(store.getSnapshot().status, 'authenticated');
});
