import { useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native';
import { BarberAccess } from '@/components/BarberAccess';
import { ManagementScreen } from '@/components/ManagementUI';
import { Note } from '@/components/UI';
import { useManager } from '@/providers/ManagerProvider';
import { type } from '@/theme';

export default function BarberLogin() {
  const { id, salon: salonId } = useLocalSearchParams<{ id: string; salon: string }>();
  const { data } = useManager();
  const salon = data?.salons.find(s => s.id === salonId), barber = salon?.barbers.find(b => b.id === id);
  return <ManagementScreen title="Barber access" back>{salon && barber && !salon.archived_at && !barber.archived_at ? <><Text style={type.caption}>{salon.name}</Text><Text accessibilityRole="header" style={type.title}>{barber.display_name}</Text><BarberAccess salonId={salon.id} barberId={barber.id} /></> : <Note>This barber is unavailable in your account.</Note>}</ManagementScreen>;
}
