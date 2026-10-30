import type { AuthChangeEvent, Session, SupabaseClient } from '@supabase/supabase-js';

type Auth = Pick<SupabaseClient['auth'], 'getSession' | 'onAuthStateChange' | 'startAutoRefresh' | 'stopAutoRefresh'>;
type Dependencies = {
  getClient: () => { client: { auth: Auth } | null; error: string | null };
  lifecycle?: { currentState: () => string | null; subscribe: (callback: (state: string) => void) => () => void };
};
export type SessionSnapshot = {
  status: 'loading' | 'guest' | 'authenticated' | 'error' | 'unconfigured';
  session: Session | null;
  event: AuthChangeEvent | null;
  error: string | null;
};
const initial: SessionSnapshot = { status: 'loading', session: null, event: null, error: null };
const restoreError = 'Your session could not be restored. You can keep browsing and try signing in again.';

export function createSessionStore({ getClient, lifecycle }: Dependencies) {
  let snapshot = initial;
  const listeners = new Set<() => void>();
  let generation = 0;
  let stopCurrent: (() => void) | null = null;
  const publish = (next: SessionSnapshot) => {
    snapshot = next;
    listeners.forEach(listener => listener());
  };
  return {
    getSnapshot: () => snapshot,
    getServerSnapshot: () => initial,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    start() {
      stopCurrent?.();
      if (snapshot !== initial) publish(initial);
      const current = ++generation;
      let revision = 0;
      let removeLifecycle: (() => void) | undefined;
      let subscription: { unsubscribe: () => void } | undefined;
      let auth: Auth | undefined;
      const stop = () => {
        if (generation !== current) return;
        generation++;
        subscription?.unsubscribe();
        removeLifecycle?.();
        if (lifecycle && auth) void auth.stopAutoRefresh().catch(() => {});
        stopCurrent = null;
      };
      stopCurrent = stop;
      try {
        const result = getClient();
        if (!result.client) {
          publish({ status: 'unconfigured', session: null, event: null, error: result.error });
          return stop;
        }
        auth = result.client.auth;
        subscription = auth.onAuthStateChange((event, session) => {
          if (generation !== current) return;
          revision++;
          // Keep this synchronous; awaiting Supabase calls inside this callback
          // can deadlock the SDK's auth lock.
          publish({ status: session ? 'authenticated' : 'guest', session, event, error: null });
        }).data.subscription;
        const initialRevision = revision;
        void auth.getSession().then(({ data, error }) => {
          if (generation !== current || revision !== initialRevision) return;
          publish(error
            ? { status: 'error', session: null, event: null, error: restoreError }
            : { status: data.session ? 'authenticated' : 'guest', session: data.session, event: null, error: null });
        }).catch(() => {
          if (generation === current && revision === initialRevision) {
            publish({ status: 'error', session: null, event: null, error: restoreError });
          }
        });
        if (lifecycle) {
          const updateRefresh = (state: string | null) => {
            if (generation !== current) return;
            const refreshRevision = revision;
            const refresh = state === 'active' ? auth!.startAutoRefresh() : auth!.stopAutoRefresh();
            void refresh.catch(() => {
              if (generation === current && revision === refreshRevision) {
                publish({ status: 'error', session: null, event: null, error: restoreError });
              }
            });
          };
          removeLifecycle = lifecycle.subscribe(updateRefresh);
          updateRefresh(lifecycle.currentState());
        }
      } catch {
        publish({ status: 'error', session: null, event: null, error: restoreError });
      }
      return stop;
    },
  };
}
