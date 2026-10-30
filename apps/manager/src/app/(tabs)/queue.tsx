import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Chip, Field, Note, Screen, s, useAction, useRefresh } from '@/components/UI';
import { Preferences } from '@/components/Preferences';
import { useBarber } from '@/providers/BarberProvider';
import { statusLabel, time } from '@/lib/types';
import { type } from '@/theme';
export default function QueueScreen() {
  const { data } = useBarber();
  useRefresh();
  const { run, error, busy, message } = useAction();
  const [reference, setReference] = useState('');
  if (!data)
    return <Screen title="My Queue"><Text style={type.body}>Loading your chair…</Text></Screen>;
  const current = data.sessions.find(ss => ss.status === 'in_service');
  const waiting = data.queues.filter(q => q.status === 'arrived');
  const requests = data.appointments.filter(a => a.status === 'pending').length;
  return <Screen title={data.salon.name}><Text style={type.caption}>{data.barber.display_name} · {current ? 'in service' : data.barber.availability.replaceAll('_', ' ')}</Text><Text accessibilityRole="header" style={type.title}>{current ? 'In the chair.' : `${waiting.length} waiting for you.`}</Text>
{current && <View style={s.card}><Text style={type.section}>{current.service_name_snapshot}</Text><Text style={type.caption}>Started {time(current.started_at)}</Text><Preferences id={current.queue_entry_id ?? current.appointment_id ?? ''}/><Button label="Finish Service" onPress={() => router.push(`/finish/${current.id}`)}/></View>}
{!current && <View style={s.row}><Chip label="Available" selected={data.barber.availability === 'available'} onPress={() => { void run('availability', { status: 'available' }); }}/><Button label="Take a break" secondary onPress={() => router.push('/break')}/><Chip label="Off duty" selected={data.barber.availability === 'off_duty'} onPress={() => { void run('availability', { status: 'off_duty' }); }}/></View>}
{!!data.breaks.length && <Note>Break until {time(data.breaks[0]!.ends_at)}. Tap Available when you return.</Note>}
{!!requests && <Button label={`${requests} Pending Appointment Request${requests === 1 ? '' : 's'}`} secondary onPress={() => router.navigate('/appointments')}/>}
{error && <Text accessibilityRole="alert" style={type.body}>{error}</Text>}{message && <Text style={type.caption}>{message}</Text>}
<Button label="+ Add Walk-In" onPress={() => router.push('/walk-in')}/><View style={s.card}><Field label="Arriving customer queue code" value={reference} onChange={setReference}/><Button label="Mark Arrived" secondary disabled={busy || !reference.trim()} onPress={() => { void run('check_in', { reference }).then(ok => { if (ok)
    setReference(''); }); }}/></View>
<Text style={type.section}>Your queue</Text>{!data.queues.length && <Text style={type.body}>No customers assigned yet. QR arrivals and checked-in customers appear here when it is your turn to serve them.</Text>}
{data.queues.filter(q => q.status !== 'in_service').map(q => <View key={q.id} style={s.card}><Text style={type.section}>{q.customer_name ?? (q.source === 'qr' ? 'QR visitor' : 'Customer')}</Text><Text style={type.label}>{q.reference}</Text><Text style={type.caption}>{statusLabel(q.status)} · {data.services.find(v => v.id === q.service_id)?.name ?? 'Choose service before starting'}</Text>{q.estimated_start && <Text style={type.caption}>Estimated {time(q.estimated_start)}</Text>}<Preferences id={q.id}/>{q.status === 'arrived' && <Button label="Start Service" disabled={!!current || busy || data.barber.availability !== 'available'} onPress={() => router.push(`/start/${q.id}`)}/>}</View>)}
</Screen>;
}
