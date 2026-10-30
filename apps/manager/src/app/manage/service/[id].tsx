import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native';
import { ManagementScreen, Section } from '@/components/ManagementUI';
import { Button, Field, Note } from '@/components/UI';
import { useManager } from '@/providers/ManagerProvider';
import type { ManagedSalon } from '@/lib/management';
import type { Service } from '@/lib/types';
import { minor } from '@/lib/types';
import { type } from '@/theme';
export default function ServiceEditor() { const { id, salon: salonId } = useLocalSearchParams<{
  id: string;
  salon: string;
}>(); const { data } = useManager(); const salon = data?.salons.find(s => s.id === salonId), service = salon?.services.find(s => s.id === id); return <ManagementScreen title={id === 'new' ? 'Add service' : 'Edit service'} back>{salon && (id === 'new' || service) ? <ServiceForm key={id} salon={salon} service={service}/> : <Note>This service is unavailable in your account.</Note>}</ManagementScreen>; }
function ServiceForm({ salon, service }: {
  salon: ManagedSalon;
  service?: Service;
}) {
  const { save, busy } = useManager();
  const [name, setName] = useState(service?.name ?? ''), [lo, setLo] = useState(service ? (service.price_min_minor / 100).toString() : ''), [hi, setHi] = useState(service ? (service.price_max_minor / 100).toString() : ''), [duration, setDuration] = useState(service?.duration_minutes.toString() ?? '30'), [error, setError] = useState<string | null>(null);
  const submit = async () => { const min = minor(lo), max = minor(hi); if (!name.trim() || min === null || max === null || max < min || !/^\d+$/.test(duration) || Number(duration) < 1 || Number(duration) > 480) {
    setError('Check the service name, price range and duration.');
    return;
  } setError(null); try {
    await save('service', { salon_id: salon.id, id: service?.id ?? null, name: name.trim(), price_min_minor: min, price_max_minor: max, duration_minutes: Number(duration) });
    router.dismissTo(`/manage/salon/${salon.id}`);
  }
  catch (e) {
    setError(e instanceof Error ? e.message : 'Could not save service.');
  } };
  return <><Text accessibilityRole="header" style={type.title}>{salon.name}</Text><Section title="Service details"><Field label="Service name" value={name} onChange={setName}/><Field label="Minimum price (Rs.)" value={lo} onChange={setLo} numeric/><Field label="Maximum price (Rs.)" value={hi} onChange={setHi} numeric/><Field label="Service duration (minutes)" value={duration} onChange={setDuration} numeric/></Section><Note>Assign new services to the barbers who offer them from Edit barber. Existing service snapshots keep their original prices.</Note>{error && <Text accessibilityRole="alert" style={type.body}>{error}</Text>}<Button label="Save service" disabled={busy} onPress={() => { void submit(); }}/></>;
}
