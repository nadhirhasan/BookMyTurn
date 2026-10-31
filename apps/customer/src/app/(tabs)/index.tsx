import { router } from 'expo-router';
import { MapPin } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SalonCard } from '@/components/SalonCard';
import { Screen, SearchField } from '@/components/UI';
import { DataStatus, useRefreshOnFocus } from '@/components/CustomerUI';
import { salonDisplay, searchSalons } from '@/data/salons';
import { useCustomer } from '@/providers/CustomerProvider';
import { colors, type } from '@/theme';
export default function HomeScreen() {
  const [query, setQuery] = useState('');
  const { catalog } = useCustomer();
  useRefreshOnFocus();
  const salons = catalog?.salons.map(s => salonDisplay(s, catalog)).sort((a, b) => Number(b.open) - Number(a.open) || (a.wait?.[0] ?? Infinity) - (b.wait?.[0] ?? Infinity)) ?? [];
  const results = searchSalons(salons, query);
  return <Screen title="BookMyTurn" home>
  <View style={s.location}><MapPin size={15} color={colors.muted}/><Text style={type.caption}>Akurana, Sri Lanka</Text></View>
  <Text accessibilityRole="header" style={type.title}>{'Find a good time\nfor your next haircut.'}</Text>
  <SearchField value={query} onChange={setQuery} onSubmit={() => router.navigate({ pathname: '/salons', params: { q: query } })}/>
  <View style={s.segment}><View style={[s.intent, s.active]}><Text style={type.label}>Go now</Text></View><Pressable accessibilityRole="button" onPress={() => router.navigate({ pathname: '/salons', params: { intent: 'plan', q: query } })} style={s.intent}><Text style={type.caption}>Plan a visit</Text></Pressable></View>
  <DataStatus />
  <View style={s.heading}><Text accessibilityRole="header" style={type.section}>{query.trim() ? 'Matching salons' : 'Less waiting nearby'}</Text><Pressable accessibilityRole="button" onPress={() => router.navigate('/salons')} hitSlop={12}><Text style={type.caption}>See all</Text></Pressable></View>
  {(query.trim() ? results : results.slice(0, 3)).map((salon, index) => <SalonCard key={salon.id} salon={salon} featured={index === 0 && !query.trim()}/>)}
  {catalog && !results.length && <Text style={type.body}>No matching salons or barbers.</Text>}
 </Screen>;
}
const s = StyleSheet.create({ location: { flexDirection: 'row', gap: 6, alignItems: 'center' }, segment: { flexDirection: 'row', padding: 4, gap: 4, borderRadius: 12, backgroundColor: colors.surface }, intent: { flex: 1, minHeight: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 8 }, active: { backgroundColor: colors.background }, heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }, qr: { padding: 16, backgroundColor: colors.surface, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 14 } });
