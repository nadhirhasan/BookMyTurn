import { router } from 'expo-router';
import { Text } from 'react-native';
import { Action, Screen } from '@/components/UI';
import { DataStatus, PrivateGate, useRefreshOnFocus } from '@/components/CustomerUI';
import { QueueCard } from '@/components/VisitCards';
import { useCustomer } from '@/providers/CustomerProvider';
import { activeQueue } from '@/lib/customer-types';
import { type } from '@/theme';
export default function MyQueue() {
  const { visits, qrQueues } = useCustomer();
  useRefreshOnFocus();
  const active = visits.queues.filter(activeQueue);
  const history = visits.queues.filter(q => !activeQueue(q));
  const guest = qrQueues.filter(q => !visits.queues.some(v => v.id === q.id));
  return <Screen title="My Queue"><Text accessibilityRole="header" style={type.title}>Your turn, without the guesswork.</Text><DataStatus />{guest.map(q => <QueueCard key={q.id} entry={q} qr/>)}<PrivateGate>
{!active.length && <><Text style={type.section}>No active queue entries</Text><Text style={type.body}>Find a salon and join when you are ready.</Text><Action label="Find a salon" onPress={() => router.navigate('/salons')}/></>}{active.map(q => <QueueCard key={q.id} entry={q}/>)}
{!!history.length && <Text style={type.section}>Past visits</Text>}{history.map(q => <QueueCard key={q.id} entry={q}/>)}</PrivateGate></Screen>;
}
