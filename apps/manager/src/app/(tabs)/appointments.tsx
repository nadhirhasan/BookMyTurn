import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Chip, Screen, s, useAction, useRefresh } from '@/components/UI';
import { Preferences } from '@/components/Preferences';
import { useBarber } from '@/providers/BarberProvider';
import { statusLabel, time, visitDate } from '@/lib/types';
import { type } from '@/theme';
export default function Appointments() {
  const { data } = useBarber();
  useRefresh();
  const { run, busy, error } = useAction();
  const [filter, setFilter] = useState('all');
  const list = data?.appointments.filter(a => filter === 'all' || (filter === 'pending' ? ['pending', 'alternative_suggested'].includes(a.status) : ['confirmed', 'arrived', 'in_service'].includes(a.status))) ?? [];
  const current = data?.sessions.some(s => s.status === 'in_service');
  return <Screen title="Appointments"><Text accessibilityRole="header" style={type.title}>Your scheduled visits.</Text><View style={s.row}>{[['all', 'All'], ['pending', 'Requests'], ['confirmed', 'Confirmed']].map(([value, label]) => <Chip key={value} label={label!} selected={filter === value} onPress={() => setFilter(value!)}/>)}</View>{error && <Text accessibilityRole="alert" style={type.body}>{error}</Text>}
{!list.length && <Text style={type.body}>No appointments in this view.</Text>}{list.map(a => <View key={a.id} style={s.card}><Text style={type.section}>{a.customer_name ?? 'Customer'}</Text><Text style={type.label}>{visitDate(a.confirmed_start ?? a.requested_start)} · {time(a.confirmed_start ?? a.requested_start)}</Text><Text style={type.caption}>{statusLabel(a.status)} · {data?.services.find(s => s.id === a.service_id)?.name}</Text><Text style={type.caption}>{a.reference}</Text><Preferences id={a.id}/>
{a.status === 'pending' && <Button label="Accept Requested Time" disabled={busy} onPress={() => { void run('accept', { id: a.id }); }}/>}
{['pending', 'alternative_suggested'].includes(a.status) && <><Button label="Suggest Another Time" secondary onPress={() => router.push(`/suggest/${a.id}`)}/><Button label="Decline Request" secondary disabled={busy} onPress={() => { void run('decline', { id: a.id }); }}/></>}
{a.status === 'confirmed' && <Button label="Mark Appointment Arrived" disabled={busy} onPress={() => { void run('appointment_arrived', { id: a.id }); }}/>}
{a.status === 'arrived' && <Button label="Start Appointment Service" disabled={busy || current} onPress={() => router.push(`/start/${a.id}`)}/>}
</View>)}</Screen>;
}
