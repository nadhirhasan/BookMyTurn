import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Action, Notice } from './UI';
import { styles, useVisitAction } from './CustomerUI';
import { activeQueue, statusLabel, time, visitDate, type QueueEntry, type Appointment } from '@/lib/customer-types';
import { useCustomer } from '@/providers/CustomerProvider';
import { qrAction } from '@/lib/qr-visits';
import { useSession } from '@/providers/SessionProvider';
import { type } from '@/theme';
export function ReviewLink({ queue, appointment }: {
  queue?: string;
  appointment?: string;
}) {
  const { visits } = useCustomer();
  const session = visits.sessions.find(s => s.queue_entry_id === queue || s.appointment_id === appointment);
  if (!session || session.status !== 'completed')
    return null;
  return visits.reviews.some(r => r.service_session_id === session.id) ? <Text style={type.caption}>Thanks — your review has been submitted.</Text> : <Action label="Review your haircut" secondary onPress={() => router.push(`/review/${session.id}`)}/>;
}
export function QueueCard({ entry, confirmation = false, qr = false }: {
  entry: QueueEntry;
  confirmation?: boolean;
  qr?: boolean;
}) {
  const { catalog, refresh } = useCustomer();
  const { run, error, busy } = useVisitAction();
  const [demo, setDemo] = useState(false);
  const [qrBusy, setQrBusy] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const session = useSession();
  const receiptAction = async (action: 'cancel' | 'link') => { if (qrBusy)
    return; setQrBusy(true); setQrError(null); try {
    await qrAction(entry.id, action);
    await refresh();
  }
  catch (e) {
    setQrError(e instanceof Error ? e.message : 'Please retry.');
  }
  finally {
    setQrBusy(false);
  } };
  const salon = catalog?.salons.find(s => s.id === entry.salon_id);
  const barber = catalog?.barbers.find(b => b.id === (entry.assigned_barber_id ?? entry.preferred_barber_id));
  return <View style={styles.card}>
 {confirmation && <Text accessibilityRole="header" style={type.title}>{activeQueue(entry) ? 'You’re in the queue!' : 'Your queue visit'}</Text>}
 <Text style={type.section}>{salon?.name ?? entry.salon_name ?? 'Salon'}</Text><Text style={type.label}>{entry.reference}</Text><Text style={type.body}>{statusLabel(entry.status)}</Text>
 <Text style={type.caption}>{barber?.display_name ?? entry.barber_name ?? 'Any Available Barber'} · {catalog?.services.find(s => s.id === entry.service_id)?.name ?? entry.service_name ?? 'Choose service at salon'}</Text>
 {activeQueue(entry) && <><Text style={type.caption}>{entry.estimated_start ? `Estimated service ${time(entry.estimated_start)}` : 'Estimate unavailable — check with the salon'}</Text><Notice>Check-in establishes your physical queue position. The estimate can change as work progresses.</Notice></>}
 {error && <Text accessibilityRole="alert" style={type.body}>{error}</Text>}
 {qrError && <Text accessibilityRole="alert" style={type.body}>{qrError}</Text>}
 {entry.status === 'joined' && <Action label="I’ve Arrived — Check In" disabled={busy} onPress={() => { void run('check_in', { id: entry.id }); }}/>}
 {['joined', 'arrived'].includes(entry.status) && <Action label="Cancel queue entry" secondary disabled={busy || qrBusy} onPress={() => { if (qr)
    void receiptAction('cancel');
  else
    void run('cancel_queue', { id: entry.id }); }}/>}
 {qr && session.status === 'authenticated' && entry.status === 'arrived' && <Action label="Link this visit to my account" secondary disabled={qrBusy} onPress={() => { void receiptAction('link'); }}/>}
 {['joined', 'arrived'].includes(entry.status) && <><Text style={type.body}>While you wait, explore hairstyles and show your barber what you want.</Text><Action label="Choose reference styles" secondary onPress={() => router.push(`/hairstyles?salon=${entry.salon_id}&queue=${entry.id}`)}/></>}
 <ReviewLink queue={entry.id}/>
 {!qr && salon?.simulation_enabled && entry.status === 'arrived' && <><Action label={demo ? 'Hide demo controls' : 'Demo controls'} secondary onPress={() => setDemo(!demo)}/>{demo && <><Notice>Demo only: simulate your own completed haircut. This also records the service and its demo price in the database.</Notice><Action label="Demo: complete my haircut" disabled={busy} onPress={() => { void run('demo_finish_queue', { id: entry.id }); }}/></>}</>}
</View>;
}
export function AppointmentCard({ entry }: {
  entry: Appointment;
}) {
  const { catalog, visits } = useCustomer();
  const { run, error, busy } = useVisitAction();
  const [demo, setDemo] = useState(false);
  const salon = catalog?.salons.find(s => s.id === entry.salon_id);
  const date = entry.confirmed_start ?? entry.requested_start;
  const proposal = visits.proposals.filter(p => p.appointment_id === entry.id).sort((a, b) => b.suggested_at.localeCompare(a.suggested_at))[0];
  return <View style={styles.card}><Text style={type.section}>{salon?.name ?? entry.salon_name ?? 'Salon'}</Text><Text style={type.label}>{statusLabel(entry.status)}</Text>
<Text style={type.body}>{visitDate(date)} · {time(date)}</Text><Text style={type.caption}>{catalog?.services.find(s => s.id === entry.service_id)?.name ?? entry.service_name ?? 'Service'} · {catalog?.barbers.find(b => b.id === (entry.confirmed_barber_id ?? entry.preferred_barber_id))?.display_name ?? entry.barber_name ?? 'Any Available Barber'}</Text><Text style={type.caption}>{entry.reference}</Text>
{entry.status === 'pending' && <Notice>Your chosen time is held. Your appointment is not confirmed until the salon responds.</Notice>}
{entry.status === 'alternative_suggested' && proposal && <><Notice>The salon suggests {visitDate(proposal.starts_at)} at {time(proposal.starts_at)} with {catalog?.barbers.find(b => b.id === proposal.barber_id)?.display_name}. Accept this time to confirm.</Notice><Action label="Accept alternative time" disabled={busy} onPress={() => { void run('accept_alternative', { id: entry.id, proposal_id: proposal.id }); }}/></>}
{error && <Text accessibilityRole="alert" style={type.body}>{error}</Text>}
{['pending', 'alternative_suggested', 'confirmed'].includes(entry.status) && <><Action label="Choose reference styles" secondary onPress={() => router.push(`/hairstyles?salon=${entry.salon_id}&appointment=${entry.id}`)}/><Action label="Cancel appointment" secondary disabled={busy} onPress={() => { void run('cancel_appointment', { id: entry.id }); }}/></>}
<ReviewLink appointment={entry.id}/>
{salon?.simulation_enabled && ['pending', 'alternative_suggested', 'confirmed'].includes(entry.status) && <><Action label={demo ? 'Hide demo controls' : 'Demo controls'} secondary onPress={() => setDemo(!demo)}/>{demo && <><Notice>Demo only: these simulate the salon response for your own test appointment.</Notice>{entry.status === 'pending' && <Action label="Demo: salon accepts" disabled={busy} onPress={() => { void run('demo_accept', { id: entry.id }); }}/>}{['pending', 'alternative_suggested'].includes(entry.status) && <><Action label="Demo: suggest a later time" secondary disabled={busy} onPress={() => { void run('demo_alternative', { id: entry.id }); }}/><Action label="Demo: salon declines" secondary disabled={busy} onPress={() => { void run('demo_decline', { id: entry.id }); }}/></>}{entry.status === 'confirmed' && <Action label="Demo: complete my haircut" disabled={busy} onPress={() => { void run('demo_finish_appointment', { id: entry.id }); }}/>}</>}</>}
</View>;
}
