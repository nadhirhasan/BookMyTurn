import { Text, View } from 'react-native';
import { Screen, s, useRefresh } from '@/components/UI';
import { useBarber } from '@/providers/BarberProvider';
import { time, visitDate } from '@/lib/types';
import { type } from '@/theme';

export default function Performance() {
  const { data } = useBarber(); useRefresh();
  const completed = data?.sessions.filter(session => session.status === 'completed') ?? [];
  const average = completed.length ? Math.round(completed.reduce((total, session) => total + Math.max(0, new Date(session.completed_at!).getTime() - new Date(session.started_at).getTime()) / 60000, 0) / completed.length) : null;
  return <Screen title="My Work"><Text accessibilityRole="header" style={type.title}>Your day, recorded.</Text>{data && <>
    <View style={s.card}><Text style={type.section}>Today</Text><Text style={type.title}>{data.performance.today_count} completed</Text><Text style={type.body}>{data.performance.total_count} haircuts completed in total</Text></View>
    {average !== null && <Text style={type.body}>Average haircut: {average} minutes across your recent completed work.</Text>}
    <Text style={type.section}>Recent haircuts</Text>{completed.map(session => <View key={session.id} style={s.card}><Text style={type.label}>{session.service_name_snapshot}</Text><Text style={type.caption}>{visitDate(session.completed_at!)} ? {time(session.completed_at!)}</Text></View>)}
    {!data.performance.total_count && <Text style={type.body}>Complete your first haircut to see it here.</Text>}
    <Text style={type.section}>Your reviews</Text>{data.reviews.map(review => <View key={review.id} style={s.card}><Text style={type.label}>{review.rating}/5</Text>{review.body && <Text style={type.body}>{review.body}</Text>}</View>)}
    {!data.reviews.length && <Text style={type.body}>Reviews appear after customers rate completed haircuts.</Text>}
  </>}</Screen>;
}
