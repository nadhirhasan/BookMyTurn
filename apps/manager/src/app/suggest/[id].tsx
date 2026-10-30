import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';
import { Calendar, addDays } from '@customer/components/Calendar';
import { Button, Field, Note, Screen, useAction } from '@/components/UI';
import { useBarber } from '@/providers/BarberProvider';
import { type } from '@/theme';
export default function Suggest() { const { id } = useLocalSearchParams<{
  id: string;
}>(); const { data } = useBarber(); const [day, setDay] = useState(''); const [time, setTime] = useState(''); const { run, busy, error } = useAction(); return <Screen title="Suggest another time" back><Text accessibilityRole="header" style={type.title}>Offer a better time.</Text>{data && <Calendar today={data.today} lastDay={addDays(data.today, 30)} value={day || data.today} onChange={setDay}/>}<Field label="Suggested time (24h HH:MM)" value={time} onChange={setTime}/><Note>The server checks your schedule before reserving this time. The customer must accept it before the appointment is confirmed.</Note>{error && <Text accessibilityRole="alert" style={type.body}>{error}</Text>}<Button label="Send Alternative Time" disabled={busy || !data || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)} onPress={() => { void run('suggest', { id, starts_at: `${day || data!.today}T${time}:00+05:30` }, () => router.dismissTo('/appointments')); }}/></Screen>; }
