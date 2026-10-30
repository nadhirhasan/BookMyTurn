import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { AppState, Platform } from 'react-native';

import { getSupabaseClient } from '@/lib/supabase/client';
import { createSessionStore } from '@/lib/supabase/session-store';

const SessionContext = createContext<ReturnType<typeof createSessionStore> | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [store] = useState(() => createSessionStore({
    getClient: getSupabaseClient,
    ...(Platform.OS !== 'web' ? {
      lifecycle: {
        currentState: () => AppState.currentState,
        subscribe: (callback: (state: string) => void) => {
          const subscription = AppState.addEventListener('change', callback);
          return () => subscription.remove();
        },
      },
    } : {}),
  }));
  useEffect(() => store.start(), [store]);
  return <SessionContext.Provider value={store}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const store = useContext(SessionContext);
  if (!store) throw new Error('useSession must be used inside SessionProvider.');
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
}
