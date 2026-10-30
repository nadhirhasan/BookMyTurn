import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';
import { Button, Field, Note, Screen, useAction } from '@/components/UI';
import { useBarber } from '@/providers/BarberProvider';
import { minor } from '@/lib/types';
import { type } from '@/theme';
export default function ServiceEditor() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();
  const { data } = useBarber();
  const current = data?.services.find(s => s.id === id);
  const [name, setName] = useState(current?.name ?? '');
  const [min, setMin] = useState(current ? String(current.price_min_minor / 100) : '');
  const [max, setMax] = useState(current ? String(current.price_max_minor / 100) : '');
  const [duration, setDuration] = useState(current?.duration_minutes.toString() ?? '');
  const { run, error, busy } = useAction();
  const [localError, setLocalError] = useState<string | null>(null);
  const submit = () => { const lo = minor(min), hi = minor(max); if (!name.trim() || lo === null || hi === null || hi < lo || !/^\d+$/.test(duration) || Number(duration) < 1 || Number(duration) > 480) {
    setLocalError('Check the service name, price range and duration.');
    return;
  } setLocalError(null); void run('service', { id: id === 'new' ? null : id, name: name.trim(), price_min_minor: lo, price_max_minor: hi, duration_minutes: Number(duration) }, () => router.dismissTo('/profile')); };
  return <Screen title={id === 'new' ? 'Add service' : 'Edit service'} back>{data?.can_manage_catalog ? <><Field label="Service name" value={name} onChange={setName}/><Field label="Minimum price (Rs.)" value={min} onChange={setMin} numeric/><Field label="Maximum price (Rs.)" value={max} onChange={setMax} numeric/><Field label="Duration (minutes)" value={duration} onChange={setDuration} numeric/><Note>Existing agreed prices and completed sales keep their original snapshots.</Note>{(error || localError) && <Text accessibilityRole="alert" style={type.body}>{localError ?? error}</Text>}<Button label="Save Service" disabled={busy} onPress={submit}/></> : <Text style={type.body}>Your salon owner manages service prices.</Text>}</Screen>;
}
