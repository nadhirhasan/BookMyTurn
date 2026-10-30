import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { contexts as fetchContexts, state as fetchState, command, setup } from '@/lib/api';
import type { Context as BarberContext, State, Json } from '@/lib/types';
import { useSession } from './SessionProvider';
type Value = {
  contexts: BarberContext[];
  data: State | null;
  loading: boolean;
  error: string | null;
  busy: boolean;
  refresh: () => Promise<void>;
  select: (barber: string) => void;
  mutate: (action: string, data: Json) => Promise<{
    id: string;
  }>;
  setup: (data: Json) => Promise<void>;
};
const Context = createContext<Value | null>(null);
export function BarberProvider({ children }: {
  children: ReactNode;
}) {
  const session = useSession();
  const uid = session.status === 'authenticated' ? session.session?.user.id ?? null : null;
  const [snapshot, setSnapshot] = useState<{
    uid: string | null;
    contexts: BarberContext[];
    data: State | null;
  }>({ uid: null, contexts: [], data: null });
  const [selection, setSelection] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    const version = ++generation.current;
    try {
      if (!uid) {
        setSnapshot({ uid: null, contexts: [], data: null });
        setError(null);
        return;
      }
      const list = await fetchContexts();
      const selected = list.find(c => c.barber_id === selection) ?? list[0];
      const data = selected ? await fetchState(selected.barber_id) : null;
      if (version === generation.current) {
        setSnapshot({ uid, contexts: list, data });
        setError(null);
      }
    }
    catch (e) {
      if (version === generation.current) {
        setError(e instanceof Error ? e.message : 'Could not load your work.');
        setSnapshot({ uid, contexts: [], data: null });
      }
    }
    finally {
      if (version === generation.current)
        setLoading(false);
    }
  }, [uid, selection]);
  useEffect(() => { void Promise.resolve().then(refresh); const interval = setInterval(() => { if (AppState.currentState !== 'background')
    void refresh(); }, 10000); const sub = AppState.addEventListener('change', value => { if (value === 'active')
    void refresh(); }); const invalidate = () => { generation.current++; }; return () => { clearInterval(interval); sub.remove(); invalidate(); }; }, [refresh]);
  const mutate = async (action: string, data: Json) => { if (pending.current)
    throw new Error('Please wait for the current request.'); const barber = snapshot.uid === uid ? snapshot.data?.barber.id : null; if (!barber)
    throw new Error('Refresh your barber access.'); pending.current = true; setBusy(true); try {
    const result = await command(barber, action, data);
    await refresh();
    return result;
  }
  finally {
    pending.current = false;
    setBusy(false);
  } };
  const setupSalon = async (data: Json) => { if (pending.current)
    throw new Error('Please wait for the current request.'); pending.current = true; setBusy(true); try {
    await setup(data);
    await refresh();
  }
  finally {
    pending.current = false;
    setBusy(false);
  } };
  const visible = snapshot.uid === uid ? snapshot : null;
  return <Context.Provider value={{ contexts: visible?.contexts ?? [], data: visible?.data ?? null, loading: loading || !!uid && !visible, error, busy, refresh, select: setSelection, mutate, setup: setupSalon }}>{children}</Context.Provider>;
}
export function useBarber() { const value = useContext(Context); if (!value)
  throw new Error('BarberProvider missing'); return value; }
