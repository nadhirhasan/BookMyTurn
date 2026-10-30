import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text } from 'react-native';
import { Action, Notice, Screen } from '@/components/UI';
import { DataStatus, Field, PrivateGate, styles, useRefreshOnFocus, useVisitAction } from '@/components/CustomerUI';
import { Calendar, addDays } from '@/components/Calendar';
import { VisitSelection } from '@/components/VisitSelection';
import { fetchSlots, requestKey } from '@/lib/customer-api';
import { time, visitDate, type Slot } from '@/lib/customer-types';
import { useCustomer } from '@/providers/CustomerProvider';
import { colors, type } from '@/theme';
export default function AppointmentScreen() {
  const { id, barber: preferred } = useLocalSearchParams<{
    id: string;
    barber?: string;
  }>();
  const { catalog, stale, refresh } = useCustomer();
  useRefreshOnFocus();
  const salon = catalog?.salons.find(s => s.slug === id || s.id === id);
  const [service, setService] = useState<string | null>(null);
  const [barber, setBarber] = useState<string | null>(preferred ?? null);
  const [day, setDay] = useState('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotError, setSlotError] = useState<string | null>(null);
  const [settled, setSettled] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const { run, error, busy } = useVisitAction();
  const retry = useRef({ signature: '', key: requestKey() });
  const date = day || catalog?.today || '';
  const signature = [salon?.id, service, barber, date].join(':');
  const queryVersion = signature + catalog?.observed_at;
  const loading = !!service && settled !== queryVersion;
  const [loadedFor, setLoadedFor] = useState('');
  useEffect(() => {
    if (!salon || !service || !date)
      return;
    let alive = true;
    void fetchSlots(salon.id, service, date, barber).then(result => { if (alive) {
      setSlots(result);
      setSlotError(null);
      setLoadedFor(signature);
      setSettled(queryVersion);
    } }, () => { if (alive) {
      setSlotError('Could not load available times. Refresh and try again.');
      setSettled(queryVersion);
      setLoadedFor('');
    } });
    return () => { alive = false; };
  }, [salon, service, date, barber, signature, queryVersion]);
  const grouped = loadedFor === signature ? Array.from(new Set(slots.map(s => s.starts_at))).sort().map(start => ({ start, available: slots.some(s => s.starts_at === start && s.available) })) : [];
  const canSubmit = !!selected && grouped.some(s => s.start === selected && s.available) && !loading && !stale;
  return <Screen title={salon?.name ?? 'Request Appointment'}><Text accessibilityRole="header" style={type.title}>Make time for yourself.</Text><Text style={type.body}>Choose your service, date and an available time.</Text><DataStatus />
{catalog && salon && <><VisitSelection catalog={catalog} salon={salon.id} service={service} barber={barber} onService={v => { setService(v); setSelected(null); }} onBarber={v => { setBarber(v); setSelected(null); }}/>
{service && <><Text style={type.section}>Choose a date</Text><Calendar today={catalog.today} lastDay={addDays(catalog.today, salon.booking_horizon_days)} value={date} onChange={v => { setDay(v); setSelected(null); }}/>
<Text style={type.section}>Available times · {visitDate(`${date}T12:00:00+05:30`)}</Text><Text style={type.caption}>Sri Lanka time · Times overlapping your appointments are unavailable, even with another barber.</Text>
{loading && <ActivityIndicator color={colors.text} accessibilityLabel="Loading available times"/>}{slotError && <Notice>{slotError}</Notice>}
<ScrollView nestedScrollEnabled style={{ maxHeight: 250 }} contentContainerStyle={styles.row}>{grouped.map(slot => <Pressable key={slot.start} accessibilityRole="button" accessibilityLabel={`${time(slot.start)}${slot.available ? '' : ' unavailable'}`} accessibilityState={{ disabled: !slot.available, selected: slot.available && selected === slot.start }} disabled={!slot.available || loading} onPress={() => setSelected(slot.start)} style={{ minHeight: 48, minWidth: 96, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 10, opacity: slot.available ? 1 : 0.3, backgroundColor: selected === slot.start && slot.available ? colors.action : colors.background }}><Text style={[type.label, { color: selected === slot.start && slot.available ? colors.background : colors.text }]}>{time(slot.start)}</Text></Pressable>)}</ScrollView>
{!loading && loadedFor === signature && !grouped.some(s => s.available) && <Notice>No times are available for this selection. Choose another day or barber.</Notice>}
{selected && !canSubmit && !loading && <Notice>This selection is no longer available. Pick another time.</Notice>}
<Action label="Refresh times" secondary onPress={() => { void refresh(); }}/>
<PrivateGate><Field label="Name (optional)" value={name} onChange={setName}/><Field label="Mobile (optional)" value={mobile} onChange={setMobile} maxLength={32}/>
<Notice>Your time is held when submitted. The appointment remains pending until the salon accepts it.</Notice>
{error && <Text accessibilityRole="alert" style={type.body}>{error}</Text>}
<Action label={busy ? 'Sending request…' : 'Request Appointment'} disabled={busy || !canSubmit} onPress={() => {
          const submission = signature + selected;
          if (retry.current.signature !== submission)
            retry.current = { signature: submission, key: requestKey() };
          void run('request_appointment', { salon_id: salon.id, service_id: service, barber_id: barber, starts_at: selected, customer_name: name, mobile, request_key: retry.current.key }, entry => router.replace(`/appointments?created=${entry}`));
        }}/></PrivateGate></>}
</>}
</Screen>;
}
