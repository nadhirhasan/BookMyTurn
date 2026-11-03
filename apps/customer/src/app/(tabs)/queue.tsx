import { router } from 'expo-router';
import { Clock3 } from 'lucide-react-native';
import { EmptyState } from '@/components/Experience';
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
  return <Screen title="My Queue" tab><Text accessibilityRole="header" style={type.title}>Keep an eye on your turn.</Text><DataStatus />{guest.map(q => <QueueCard key={q.id} entry={q} qr/>)}<PrivateGate>
{!active.length && !guest.some(activeQueue) && <EmptyState icon={Clock3} title="No active queue entries" description="A fresh haircut starts with a salon. Check the wait before you go."><Action label="Find a salon" onPress={() => router.navigate('/salons')}/></EmptyState>}{active.map(q => <QueueCard key={q.id} entry={q}/>)}
{!!history.length && <Text style={type.section}>Past visits</Text>}{history.map(q => <QueueCard key={q.id} entry={q}/>)}</PrivateGate></Screen>;
}
