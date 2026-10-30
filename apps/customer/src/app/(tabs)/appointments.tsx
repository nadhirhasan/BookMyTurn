import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { Action, Notice, Screen } from '@/components/UI';
import { DataStatus, PrivateGate, styles, useRefreshOnFocus, useVisitAction } from '@/components/CustomerUI';
import { AppointmentCard } from '@/components/VisitCards';
import { useCustomer } from '@/providers/CustomerProvider';
import { type } from '@/theme';
export default function MyAppointments() {
  const { created } = useLocalSearchParams<{
    created?: string;
  }>();
  const { visits } = useCustomer();
  useRefreshOnFocus();
  const { run, busy } = useVisitAction();
  const unread = visits.notifications.filter(n => !n.read_at);
  return <Screen title="My Appointments"><Text accessibilityRole="header" style={type.title}>A little time, set aside.</Text><DataStatus /><PrivateGate>
{created && visits.appointments.some(a => a.id === created) && <Notice>Appointment request sent. Your time is held while the salon reviews it.</Notice>}
{!!unread.length && <><Text style={type.section}>Updates</Text>{unread.slice(0, 10).map(n => <View key={n.id} style={styles.card}><Text style={type.label}>{n.title}</Text><Text style={type.body}>{n.body}</Text></View>)}<Action label="Mark updates as read" secondary disabled={busy} onPress={() => { void run('read_notifications', {}); }}/></>}
{!visits.appointments.length && <><Text style={type.section}>No appointments yet</Text><Text style={type.body}>Choose a salon, date and time to request a visit.</Text><Action label="Find a salon" onPress={() => router.navigate({ pathname: '/salons', params: { intent: 'plan' } })}/></>}
{visits.appointments.map(a => <AppointmentCard key={a.id} entry={a}/>)}</PrivateGate></Screen>;
}
