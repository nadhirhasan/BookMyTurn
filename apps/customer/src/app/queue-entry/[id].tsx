import { router, useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native';
import { Action, Screen } from '@/components/UI';
import { DataStatus, PrivateGate, useRefreshOnFocus } from '@/components/CustomerUI';
import { QueueCard } from '@/components/VisitCards';
import { useCustomer } from '@/providers/CustomerProvider';
import { type } from '@/theme';
export default function QueueConfirmation() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();
  const { visits, qrQueues, refresh } = useCustomer();
  useRefreshOnFocus();
  const entry = visits.queues.find(q => q.id === id);
  const qr = qrQueues.find(q => q.id === id);
  return <Screen title="Your queue visit"><DataStatus />{entry ? <QueueCard entry={entry} confirmation/> : qr ? <QueueCard entry={qr} qr confirmation/> : <PrivateGate><Text style={type.body}>This visit is not available in your account or on this device.</Text><Action label="Refresh visits" onPress={() => { void refresh(); }}/></PrivateGate>}<Action label="My Queue" secondary onPress={() => router.replace('/queue')}/><Action label="Back to Home" secondary onPress={() => router.replace('/')}/></Screen>;
}
