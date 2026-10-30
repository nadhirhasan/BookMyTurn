import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { command, fetchCatalog, fetchVisits } from '@/lib/customer-api';
import { emptyVisits, type Catalog, type VisitState } from '@/lib/customer-types';
import { useSession } from './SessionProvider';
import { readQrVisits, type QrQueue } from '@/lib/qr-visits';
type CustomerContextValue = {
  catalog: Catalog | null;
  visits: VisitState;
  loading: boolean;
  error: string | null;
  visitError: string | null;
  stale: boolean;
  busy: boolean;
  qrQueues: QrQueue[];
  refresh: () => Promise<void>;
  mutate: (action: string, data: Record<string, string | boolean | string[] | number | null>) => Promise<{
    id: string;
    existing?: boolean;
  }>;
};
const Context = createContext<CustomerContextValue | null>(null);
export function CustomerProvider({ children }: {
  children: ReactNode;
}) {
  const session = useSession();
  const uid = session.status === 'authenticated' ? session.session?.user.id ?? null : null;
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [privateState, setPrivateState] = useState<{
    uid: string | null;
    visits: VisitState;
  }>({ uid: null, visits: emptyVisits() });
  const [error, setError] = useState<string | null>(null);
  const [visitError, setVisitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [qrQueues, setQrQueues] = useState<QrQueue[]>([]);
  const [clock, setClock] = useState(Date.now);
  const pending = useRef(false);
  const identity = useRef(uid);
  useEffect(() => { identity.current = uid; }, [uid]);
  const latest = useRef(0);
  const refresh = useCallback(async () => {
    const version = ++latest.current;
    const [publicResult, privateResult, qrResult] = await Promise.allSettled([fetchCatalog(), uid ? fetchVisits() : Promise.resolve(emptyVisits()), readQrVisits()]);
    if (latest.current !== version || identity.current !== uid)
      return;
    if (publicResult.status === 'fulfilled') {
      setCatalog(publicResult.value);
      setError(null);
    }
    else
      setError(publicResult.reason instanceof Error ? publicResult.reason.message : 'Could not load salons.');
    if (privateResult.status === 'fulfilled') {
      setPrivateState({ uid, visits: privateResult.value });
      setVisitError(null);
    }
    else
      setVisitError('Could not load your visits. Refresh to try again.');
    if (qrResult.status === 'fulfilled')
      setQrQueues(qrResult.value);
    setLoading(false);
    setClock(Date.now());
  }, [uid]);
  useEffect(() => {
    void Promise.resolve().then(refresh);
    const interval = setInterval(() => { setClock(Date.now()); if (AppState.currentState !== 'background')
      void refresh(); }, 15000);
    const subscription = AppState.addEventListener('change', state => { if (state === 'active')
      void refresh(); });
    // This is a request generation counter, not a DOM/native element ref.
    const invalidate = () => { latest.current++; };
    return () => { clearInterval(interval); subscription.remove(); invalidate(); };
  }, [refresh]);
  const mutate = useCallback(async (action: string, data: Record<string, string | boolean | string[] | number | null>) => {
    if (pending.current)
      throw new Error('Please wait for your current request.');
    pending.current = true;
    setBusy(true);
    try {
      const result = await command(action, data);
      await refresh();
      return result;
    }
    finally {
      pending.current = false;
      setBusy(false);
    }
  }, [refresh]);
  const stale = !catalog || clock - new Date(catalog.observed_at).getTime() > 45000 || !!error;
  return <Context.Provider value={{ catalog, visits: privateState.uid === uid ? privateState.visits : emptyVisits(), loading, error, visitError: privateState.uid === uid ? visitError : null, stale, busy, qrQueues, refresh, mutate }}>{children}</Context.Provider>;
}
export function useCustomer() { const value = useContext(Context); if (!value)
  throw new Error('CustomerProvider missing'); return value; }
