import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSession } from '@/providers/SessionProvider';
import { useManager } from '@/providers/ManagerProvider';
import { finance } from '@/lib/finance';
import { useFreshness } from './useFreshness';
import type { Json } from '@/lib/types';

export function useFinanceResource<T>(action: string, filters: Json, enabled = true, revision = 0) {
  const session = useSession(), { liveVersion } = useManager();
  const uid = session.status === 'authenticated' ? session.session?.user.id ?? null : null;
  const key = JSON.stringify(filters), generation = useRef(0);
  const [snapshot, setSnapshot] = useState<{ uid: string | null; key: string; data: T | null; checkedAt: number | null; error: string | null }>({ uid: null, key: '', data: null, checkedAt: null, error: null });
  const [pending, setPending] = useState(false);
  const refresh = useCallback(async () => {
    if (!uid || !enabled) return;
    const version = ++generation.current; setPending(true);
    try { const data = await finance<T>(action, JSON.parse(key)); if (version === generation.current) { setSnapshot({ uid, key, data, checkedAt: Date.now(), error: null }); return data; } }
    catch (e) { if (version === generation.current) setSnapshot(old => ({ uid, key, data: old.uid === uid && old.key === key && (e as { code?: string }).code !== '42501' ? old.data : null, checkedAt: old.uid === uid && old.key === key ? old.checkedAt : null, error: e instanceof Error ? e.message : 'Could not load financial data.' })); }
    finally { if (version === generation.current) setPending(false); }
  }, [uid, enabled, action, key]);
  useFocusEffect(useCallback(() => { void refresh(); const timer = setInterval(() => { if (AppState.currentState === 'active') void refresh(); }, 30000); const sub = AppState.addEventListener('change', state => { if (state === 'active') void refresh(); }); return () => { generation.current++; clearInterval(timer); sub.remove(); }; }, [refresh]));
  useEffect(() => { if (revision || liveVersion) void Promise.resolve().then(refresh); }, [revision, liveVersion, refresh]);
  const visible = snapshot.uid === uid && snapshot.key === key && enabled ? snapshot : null;
  const freshness = useFreshness(visible?.checkedAt ?? null, visible?.error ?? null);
  return { data: visible?.data ?? null, error: visible?.error ?? null, loading: pending || enabled && !visible, refresh, ...freshness };
}
