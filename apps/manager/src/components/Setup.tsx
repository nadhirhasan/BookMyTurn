import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Chip, Field, Note, Screen, s } from './UI';
import { useBarber } from '@/providers/BarberProvider';
import { auth } from '@/lib/api';
import { minor } from '@/lib/types';
import { type } from '@/theme';
export function Setup() {
  const { setup, busy } = useBarber();
  const [salon, setSalon] = useState('');
  const [address, setAddress] = useState('');
  const [barber, setBarber] = useState('');
  const [service, setService] = useState('Haircut');
  const [low, setLow] = useState('');
  const [high, setHigh] = useState('');
  const [duration, setDuration] = useState('30');
  const [opens, setOpens] = useState('09:00');
  const [closes, setCloses] = useState('20:00');
  const [days, setDays] = useState([0, 1, 2, 3, 4, 5, 6]);
  const [error, setError] = useState<string | null>(null);
  const submit = async () => { const min = minor(low), max = minor(high); if (!salon.trim() || !barber.trim() || !service.trim() || min === null || max === null || max < min || !/^\d+$/.test(duration) || Number(duration) < 1 || Number(duration) > 480 || !/^([01]\d|2[0-3]):[0-5]\d$/.test(opens) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(closes) || closes <= opens || !days.length) {
    setError('Complete the names, valid price range, duration and opening hours.');
    return;
  } setError(null); try {
    await setup({ salon_name: salon.trim(), barber_name: barber.trim(), address, service_name: service.trim(), price_min_minor: min, price_max_minor: max, duration_minutes: Number(duration), opens_at: opens, closes_at: closes, weekdays: days });
  }
  catch (e) {
    setError(e instanceof Error ? e.message : 'Could not create your salon.');
  } };
  return <Screen title="Set up your salon"><Text accessibilityRole="header" style={type.title}>Make it yours.</Text><Text style={type.body}>Your salon will appear in the customer app with its own services, hours and empty queue.</Text><Field label="Salon name" value={salon} onChange={setSalon}/><Field label="Address in Akurana" value={address} onChange={setAddress} maxLength={500}/><Field label="Your barber display name" value={barber} onChange={setBarber}/>
<Text style={type.section}>First service</Text><Field label="Service name" value={service} onChange={setService}/><Field label="Minimum price (Rs.)" value={low} onChange={setLow} numeric/><Field label="Maximum price (Rs.)" value={high} onChange={setHigh} numeric/><Field label="Service duration (minutes)" value={duration} onChange={setDuration} numeric/>
<Text style={type.section}>Working hours</Text><Field label="Opens at (24h HH:MM)" value={opens} onChange={setOpens}/><Field label="Closes at (24h HH:MM)" value={closes} onChange={setCloses}/><View style={s.row}>{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label, i) => <Chip key={label} label={label} selected={days.includes(i)} onPress={() => setDays(current => current.includes(i) ? current.filter(d => d !== i) : [...current, i])}/>)}</View>
<Note>You become the owner and primary barber of this new salon. Existing staff should ask their salon owner for access rather than create a duplicate salon.</Note>{error && <Text accessibilityRole="alert" style={type.body}>{error}</Text>}<Button label={busy ? 'Creating salon…' : 'Create & open my salon'} disabled={busy} onPress={() => { void submit(); }}/><Button label="Sign out" secondary onPress={() => { void auth.signOut(); }}/>
</Screen>;
}
