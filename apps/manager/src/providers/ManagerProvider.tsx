import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { management, manage, type Management } from '@/lib/management';
import type { Json } from '@/lib/types';
import { useSession } from './SessionProvider';
type Value = {
  data: Management | null;
  loading: boolean;
  error: string | null;
  busy: boolean;
  refresh: () => Promise<void>;
  save: (action: string, data: Json) => Promise<{
    id: string;
  }>;
};
const ManagerContext = createContext<Value | null>(null);
export function ManagerProvider({ children }: {
  children: ReactNode;
}) {
  const session = useSession();
  const uid = session.status === 'authenticated' ? session.session?.user.id ?? null : null;
  const [snapshot, setSnapshot] = useState<{
    uid: string | null;
    data: Management | null;
  }>({ uid: null, data: null });
  const [loading, setLoading] = useState(true), [error, setError] = useState<string | null>(null), [busy, setBusy] = useState(false);
  const generation = useRef(0), pending = useRef(false);
  const refresh = useCallback(async () => { const version = ++generation.current; try {
    const data = uid ? await management() : null;
    if (version === generation.current) {
      setSnapshot({ uid, data });
      setError(null);
    }
  }
  catch (e) {
    if (version === generation.current) {
      setSnapshot({ uid, data: null });
      setError(e instanceof Error ? e.message : 'Could not load your salons.');
    }
  }
  finally {
    if (version === generation.current)
      setLoading(false);
  } }, [uid]);
  useEffect(() => { void Promise.resolve().then(refresh); const timer = setInterval(() => { if (AppState.currentState !== 'background')
    void refresh(); }, 15000); const sub = AppState.addEventListener('change', s => { if (s === 'active')
    void refresh(); }); const invalidate = () => { generation.current++; }; return () => { invalidate(); clearInterval(timer); sub.remove(); }; }, [refresh]);
  const save = async (action: string, data: Json) => { if (pending.current)
    throw new Error('Please wait for the current request.'); pending.current = true; setBusy(true); try {
    const result = await manage(action, data);
    await refresh();
    return result;
  }
  finally {
    pending.current = false;
    setBusy(false);
  } };
  return <ManagerContext.Provider value={{ data: snapshot.uid === uid ? snapshot.data : null, loading: loading || snapshot.uid !== uid, error, busy, refresh, save }}>{children}</ManagerContext.Provider>;
}
export function useManager() { const value = useContext(ManagerContext); if (!value)
  throw new Error('ManagerProvider missing'); return value; }
