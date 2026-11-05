import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { Action, Notice, Screen } from '@/components/UI';
import { DataStatus, Field, PrivateGate, useRefreshOnFocus, useVisitAction } from '@/components/CustomerUI';
import {HaircutPicker} from '@/components/HaircutPicker';
import { VisitSelection } from '@/components/VisitSelection';
import { requestKey } from '@/lib/customer-api';
import { getSupabaseClient } from '@/lib/supabase/client';
import { joinQr } from '@/lib/qr-visits';
import { activeQueue, time } from '@/lib/customer-types';
import { useCustomer } from '@/providers/CustomerProvider';
import { type } from '@/theme';
export default function JoinQueue() {
  const { id, source, barber: preferred } = useLocalSearchParams<{
    id: string;
    source?: string;
    barber?: string;
  }>();
  const { catalog, visits, stale, refresh } = useCustomer();
  useRefreshOnFocus();
  const service=null;
  const [haircut,setHaircut]=useState<string|null>(null);
  const [barber, setBarber] = useState<string | null>(preferred ?? null);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [key] = useState(requestKey);
  const { run, error, busy } = useVisitAction();
  const [qrBusy, setQrBusy] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const [quote, setQuote] = useState<{
    signature: string;
    barber_id: string;
    starts_at: string;
  } | null>(null);
  const salon = catalog?.salons.find(s => s.slug === id || s.id === id);
  const existing = visits.queues.find(q => q.salon_id === salon?.id && activeQueue(q));
  const qr = source === 'qr';
  const signature = [salon?.id, service, barber].join(':');
  useEffect(() => { if (!salon)
    return; let alive = true; const { client } = getSupabaseClient(); if (client)
    void client.rpc('customer_quote', { p_salon: salon.id, p_service: service, p_barber: barber }).then(({ data, error }) => { if (alive) {
      const value = data as {
        barber_id: string;
        starts_at: string;
      } | null;
      setQuote(!error && value ? { ...value, signature } : null);
    } }); return () => { alive = false; }; }, [salon, service, barber, signature, catalog?.observed_at]);
  const submitQr = async () => { if (qrBusy)
    return; setQrBusy(true); setQrError(null); try {
    const result = await joinQr(salon!.slug, { collection_id:haircut, barber_id: barber, customer_name: name, mobile });
    await refresh();
    router.replace(`/queue-entry/${result.id}`);
  }
  catch (e) {
    setQrError(e instanceof Error ? e.message : 'Could not join the queue. Please retry.');
  }
  finally {
    setQrBusy(false);
  } };
  const details = salon && catalog ? <><VisitSelection catalog={catalog} salon={salon.id} barber={barber} onBarber={setBarber}/>
 {quote && quote.signature === signature && <Notice>{barber ? 'Estimated service' : 'Suggested barber'}: {catalog.barbers.find(b => b.id === quote.barber_id)?.display_name} · {time(quote.starts_at)}. This is an estimate.</Notice>}
 <HaircutPicker value={haircut} onChange={setHaircut}/><Field label="Name (optional)" value={name} onChange={setName}/><Field label="Mobile (optional)" value={mobile} onChange={setMobile} maxLength={32}/></> : null;
  return <Screen title={salon?.name ?? 'Join Queue'}><Text accessibilityRole="header" style={type.title}>{qr ? 'Join the queue in seconds.' : 'Join the queue'}</Text><DataStatus />
{salon && catalog && <>{qr ? <>
 <Text style={type.body}>Join {salon.name} and get your queue code. No app or account needed.</Text>
 {qrError && <Text accessibilityRole="alert" style={type.body}>{qrError}</Text>}
 <Action label={qrBusy ? 'Joining…' : 'Join Queue'} loading={qrBusy} disabled={qrBusy || stale || !salon.open_now} onPress={() => { void submitQr(); }}/>
 <Text style={type.caption}>One join records one person waiting. Your receipt stays on this device; keep this page to track your turn.</Text>
 <Notice>{salon.waiting} waiting. Tap Join Queue once to get your code. Repeat taps on this device reuse your active entry.</Notice>
 {details}
</> : <><Notice>{salon.waiting} waiting. Joining adds you to the queue immediately. Head to the salon and show your code to staff.</Notice><PrivateGate>{existing ? <><Text style={type.section}>You already have an active visit here.</Text><Action label="View my queue entry" onPress={() => router.replace(`/queue-entry/${existing.id}`)}/></> : <>
 {details}
 {error && <Text accessibilityRole="alert" style={type.body}>{error}</Text>}
 <Action loading={busy} label={busy ? 'Joining…' : 'Join Queue'} disabled={busy || stale || !salon.open_now} onPress={() => { void run('join_queue', { salon_id: salon.id, collection_id:haircut, barber_id: barber, customer_name: name, mobile, present: true, source: 'remote', request_key: key }, entry => router.replace(`/queue-entry/${entry}`)); }}/>
</>}</PrivateGate></>}
{!salon.open_now && <Notice>The salon is currently closed. Request a future appointment instead.</Notice>}

</>}
</Screen>;
}
