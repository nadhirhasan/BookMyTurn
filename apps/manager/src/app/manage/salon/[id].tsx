import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { ManagementScreen, Cover, Portrait, EmptyTeam, MenuRow, m } from '@/components/ManagementUI';
import { Button, Note, s } from '@/components/UI';
import { useManager } from '@/providers/ManagerProvider';
import { useBarber } from '@/providers/BarberProvider';
import { money } from '@/lib/types';
import { type } from '@/theme';
import { SalonEditor } from '@/components/SalonEditor';
export default function SalonDetail() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();
  const { data } = useManager();
  const barber = useBarber();
  const salon = data?.salons.find(s => s.id === id);
  if (id === 'new')
    return <ManagementScreen title="Add salon" back><SalonEditor /></ManagementScreen>;
  if (!salon)
    return <ManagementScreen title="Your salon" back><Note>This salon is unavailable in your account.</Note></ManagementScreen>;
  return <ManagementScreen title={salon.name} back><Cover uri={salon.photo_url} name={salon.name}/><View style={{ gap: 6 }}><Text accessibilityRole="header" style={type.title}>{salon.name}</Text><Text style={type.body}>{salon.address || 'Akurana, Sri Lanka'}</Text><Text style={type.caption}>{salon.is_open ? 'Open for customers' : 'Currently closed'} · {salon.waiting} waiting · {salon.pending} appointment requests</Text></View><MenuRow label="Edit salon" detail="Photo, name, address and opening status" onPress={() => router.push(`/manage/salon/${id}/edit`)}/><View style={{ gap: 6 }}><Text style={type.section}>Your team</Text><Text style={type.body}>Every barber has their own chair, calendar and profile.</Text></View><Button label="+ Add barber" onPress={() => router.push(`/manage/barber/new?salon=${id}`)}/>{!salon.barbers.length && <EmptyTeam />}{salon.barbers.map(b => <View key={b.id} style={m.formGroup}><View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}><Portrait uri={b.photo_url} name={b.display_name}/><View style={{ flex: 1, gap: 4 }}><Text style={type.section}>{b.display_name}</Text><Text style={type.caption}>{b.is_active ? b.availability.replaceAll('_', ' ') : 'Inactive'}{b.experience_years ? ` · ${b.experience_years} years` : ''}</Text><Text style={type.caption}>{b.specialities.join(' · ') || 'Your salon team'}</Text></View></View><View style={s.row}><View style={{ flex: 1, minWidth: 110 }}><Button label="Edit profile" accessibilityLabel={`Edit ${b.display_name}`} secondary onPress={() => router.push(`/manage/barber/${b.id}?salon=${id}`)}/></View>{b.is_active && <View style={{ flex: 1, minWidth: 110 }}><Button label="Open chair" accessibilityLabel={`Open ${b.display_name}'s chair`} onPress={() => { void barber.select(b.id).then(() => router.push('/queue')); }}/></View>}</View></View>)}<View style={{ gap: 12 }}><Text style={type.section}>Services</Text>{salon.services.map(v => <MenuRow key={v.id} label={v.name} detail={`${v.duration_minutes} min · ${money(v.price_min_minor)}–${money(v.price_max_minor)}`} onPress={() => router.push(`/manage/service/${v.id}?salon=${id}`)}/>)}<Button label="+ Add salon service" secondary onPress={() => router.push(`/manage/service/new?salon=${id}`)}/></View><View style={{ gap: 8 }}><Text style={type.section}>Opening hours</Text>{salon.hours.map(h => <Text key={h.weekday} style={type.body}>{['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][h.weekday]} · {h.opens_at.slice(0, 5)}–{h.closes_at.slice(0, 5)}</Text>)}</View></ManagementScreen>;
}
