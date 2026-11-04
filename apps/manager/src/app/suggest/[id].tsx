import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Calendar, addDays } from '@/components/Calendar';
import { Button, Note, Screen, s, useAction, useRefresh } from '@/components/UI';
import { useBarber } from '@/providers/BarberProvider';
import { appointmentSlots } from '@/lib/api';
import { time, visitDate } from '@/lib/types';
import type { Slot } from '@customer/lib/customer-types';
import { colors, type } from '@/theme';

type Times = { signature: string; version: string; slots: Slot[]; error: string | null };
const localDay = (at: string) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Colombo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(at));

export default function Suggest() {
  const { id, return_salon } = useLocalSearchParams<{ id: string; return_salon?: string }>();
  const { data, stale, busy: saving } = useBarber();
  useRefresh();
  const { run, busy, error, clearError } = useAction();
  const [day, setDay] = useState(''), [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false), [revision, setRevision] = useState(0);
  const [times, setTimes] = useState<Times>({ signature: '', version: '', slots: [], error: null });
  const appointment = data?.appointments.find(a => a.id === id);
  const editable = !!appointment && ['pending', 'alternative_suggested'].includes(appointment.status);
  const today = data?.today ?? '';
  const lastDay = today ? addDays(today, 30) : '';
  const requestedDay = appointment ? localDay(appointment.requested_start) : today;
  const initialDay = requestedDay >= today && requestedDay <= lastDay ? requestedDay : today;
  const date = day >= today && day <= lastDay && day ? day : initialDay;
  const salonId = data?.salon.id, barberId = data?.barber.id, serviceId = appointment?.service_id ?? null;
  const signature = [id, salonId, barberId, serviceId, date, editable].join(':');
  const version = [signature, data?.observed_at, revision].join(':');
  const loading = editable && times.version !== version;
  const slots = times.signature === signature ? times.slots : [];
  const slotError = times.version === version ? times.error : null;
  const grouped = Array.from(new Set(slots.map(slot => slot.starts_at))).sort().map(start => ({
    start, available: slots.some(slot => slot.starts_at === start && slot.available),
    hour: Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Colombo', hour: '2-digit', hourCycle: 'h23' }).format(new Date(start))),
  }));
  const selectionAvailable = !!selected && grouped.some(slot => slot.start === selected && slot.available);
  const selectionError = submitted && !loading && !slotError && !selectionAvailable;

  useEffect(() => {
    if (!editable || !salonId || !barberId || !date) return;
    let active = true;
    void appointmentSlots(salonId, serviceId, date, barberId).then(
      slots => { if (active) setTimes({ signature, version, slots, error: null }); },
      () => { if (active) setTimes({ signature, version, slots: [], error: 'Could not load available times. Try again.' }); },
    );
    return () => { active = false; };
  }, [editable, salonId, barberId, serviceId, date, signature, version]);

  const send = () => {
    setSubmitted(true);
    if (!editable || !selectionAvailable || loading || busy || stale) return;
    void run('suggest', { id, starts_at: selected }, () => router.dismissTo(return_salon ? `/manage/salon/${return_salon}?tab=agenda` : '/appointments')).then(ok => {
      if (!ok) { setSelected(null); setRevision(value => value + 1); }
    });
  };
  return <Screen title="Suggest another time" back footer={editable ? <>
    <Text style={type.label}>{selected && selectionAvailable ? `${visitDate(selected)} · ${time(selected)}` : 'Choose a time to suggest'}</Text>
    <Button label={saving ? 'Sending…' : 'Send Alternative Time'} disabled={busy || loading || stale || !!slotError || !grouped.some(slot => slot.available)} onPress={send}/>
    {selectionError && <Text accessibilityRole="alert" style={[type.caption, { color: colors.error }]}>Choose an available time above.</Text>}
  </> : undefined}>
    {editable && data && appointment ? <>
      <Text accessibilityRole="header" style={type.title}>Offer a better time.</Text>
      <View style={s.card}><Text style={type.section}>{appointment.customer_name || 'Customer'}</Text><Text style={type.body}>Requested {visitDate(appointment.requested_start)} · {time(appointment.requested_start)}</Text><Text style={type.caption}>{data.barber.display_name} · {data.salon.name}</Text></View>
      <Text accessibilityRole="header" style={type.section}>Choose a date</Text>
      <Calendar today={today} lastDay={lastDay} value={date} onChange={value => { if (busy) return; setDay(value); setSelected(null); setSubmitted(false); clearError(); }}/>
      <Text accessibilityRole="header" style={type.section}>Available times · {visitDate(`${date}T12:00:00+05:30`)}</Text>
      <Text style={type.caption}>Sri Lanka time · Unavailable times cannot be selected.</Text>
      {loading && <ActivityIndicator accessibilityLabel="Loading available times" color={colors.action}/>}
      {slotError && <Text accessibilityRole="alert" style={[type.body, { color: colors.error }]}>{slotError}</Text>}
      <View testID="suggested-time-options" style={{ gap: 20, borderWidth: selectionError ? 1 : 0, borderColor: colors.error, borderRadius: 16, padding: selectionError ? 8 : 0 }}>
        {['Morning', 'Afternoon', 'Evening'].map((label, index) => {
          const group = grouped.filter(slot => index === 0 ? slot.hour < 12 : index === 1 ? slot.hour >= 12 && slot.hour < 17 : slot.hour >= 17);
          return group.length ? <View key={label} style={{ gap: 10 }}><Text style={type.label}>{label}</Text><View style={s.row}>
            {group.map(slot => <Pressable key={slot.start} accessibilityRole="button" accessibilityLabel={`${time(slot.start)}${slot.available ? '' : ' unavailable'}`} aria-selected={slot.available && selected === slot.start} accessibilityState={{ selected: slot.available && selected === slot.start, disabled: !slot.available || busy || stale }} disabled={!slot.available || busy || stale} onPress={() => { setSelected(slot.start); setSubmitted(false); clearError(); }} style={({ pressed }) => ({ minHeight: 52, minWidth: 96, flexGrow: 1, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: selected === slot.start && slot.available ? colors.action : colors.border, backgroundColor: !slot.available ? colors.surface : selected === slot.start ? colors.action : colors.card, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 })}>
              <Text style={[type.label, { color: selected === slot.start && slot.available ? colors.onAction : colors.text, textDecorationLine: slot.available ? 'none' : 'line-through' }]}>{time(slot.start)}</Text>
              {!slot.available && <Text style={type.caption}>Unavailable</Text>}
            </Pressable>)}
          </View></View> : null;
        })}
        {selectionError && <Text style={[type.caption, { color: colors.error }]}>Select an available time.</Text>}
      </View>
      {!loading && !slotError && !grouped.some(slot => slot.available) && <Note>No available times on this day. Choose another date.</Note>}
      {!!selected && !loading && !slotError && !selectionAvailable && <Note>This time is no longer available. Choose another time.</Note>}
      <Button label={slotError ? 'Retry loading times' : 'Refresh times'} secondary disabled={busy || loading} onPress={() => setRevision(value => value + 1)}/>
      <Text style={type.caption}>The customer must accept your suggested time before the appointment is confirmed.</Text>
      {error && <Text accessibilityRole="alert" style={[type.body, { color: colors.error }]}>{error}</Text>}
    </> : <Note>{data ? 'This appointment is no longer available to reschedule. Return to appointments to see its latest status.' : 'Loading your appointment…'}</Note>}
  </Screen>;
}
