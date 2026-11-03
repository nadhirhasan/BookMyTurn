import { router, useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native';
import { BarberAccess } from '@/components/BarberAccess';
import { ManagementScreen } from '@/components/ManagementUI';
import { Button, Note } from '@/components/UI';
import { useManager } from '@/providers/ManagerProvider';
import { type } from '@/theme';

export default function BarberLogin() {
  const { id, salon: salonId, created } = useLocalSearchParams<{ id: string; salon: string; created?: string }>();
  const { data } = useManager();
  const salon = data?.salons.find(s => s.id === salonId), barber = salon?.barbers.find(b => b.id === id);
  return <ManagementScreen title={created ? 'Barber added' : 'Barber access'} back>{salon && barber && !salon.archived_at && !barber.archived_at ? <><Text style={type.caption}>{salon.name}</Text><Text accessibilityRole="header" style={type.title}>{created ? `Invite ${barber.display_name} to their chair.` : barber.display_name}</Text>{created && <Text style={type.body}>Their profile is saved. Now share an invitation so they can sign in on their own phone and manage their queue.</Text>}<BarberAccess salonId={salon.id} barberId={barber.id} /><Button label="Back to team" secondary onPress={() => router.dismissTo(`/manage/salon/${salon.id}?tab=team`)} /><Text style={type.caption}>You can return from Team → Invite barber / Login access. Until they accept, you can manage this chair yourself.</Text></> : <Note>This barber is unavailable in your account.</Note>}</ManagementScreen>;
}
