import { router } from 'expo-router';
import { MapPin } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SalonCard } from '@/components/SalonCard';
import { Screen, SearchField } from '@/components/UI';
import { salons, searchSalons } from '@/data/salons';
import { colors, type } from '@/theme';

export default function HomeScreen() {
  const [query, setQuery] = useState('');
  const results = searchSalons(query);
  return <Screen title="BookMyTurn" home>
    <View style={s.location}><MapPin size={15} color={colors.muted} /><Text style={type.caption}>Akurana, Sri Lanka</Text></View>
    <Text accessibilityRole="header" style={type.title}>{'Find a good time\nfor your next haircut.'}</Text>
    <SearchField value={query} onChange={setQuery} onSubmit={() => router.navigate({ pathname: '/salons', params: { q: query } })} />
    <View style={s.segment}>
      <View accessibilityRole="button" accessibilityState={{ selected: true }} style={[s.intent, s.active]}><Text style={type.label}>Go now</Text></View>
      <Pressable accessibilityRole="button" onPress={() => router.navigate({ pathname: '/salons', params: { intent: 'plan', q: query } })} style={s.intent}><Text style={[type.label, { color: colors.muted }]}>Plan a visit</Text></Pressable>
    </View>
    <View style={s.heading}><Text accessibilityRole="header" style={type.section}>{query.trim() ? 'Matching salons' : 'Less waiting nearby'}</Text><Pressable accessibilityRole="button" onPress={() => router.navigate({ pathname: '/salons', params: { q: query } })} hitSlop={12}><Text style={type.caption}>See all</Text></Pressable></View>
    {query.trim() ? results.map(salon => <SalonCard key={salon.id} salon={salon} />) : <>
      {salons[0] && <SalonCard salon={salons[0]} featured />}
      <Text style={type.caption}>Demo estimates · Updated at 2:00 pm</Text>
      {salons[2] && <SalonCard salon={salons[2]} />}
    </>}
    {results.length === 0 && <Text style={type.body}>No salons or barbers match “{query}”. Try another name.</Text>}
    <Text style={type.caption}>Explore salons without creating an account.</Text>
    <Text style={type.caption}>Fictional demo data and illustrative photos. Availability is a fixed preview, not a live forecast.</Text>
  </Screen>;
}
const s = StyleSheet.create({
  location: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  segment: { flexDirection: 'row', padding: 4, gap: 4, borderRadius: 12, backgroundColor: colors.surface, minHeight: 44 },
  intent: { flex: 1, minHeight: 36, justifyContent: 'center', alignItems: 'center', borderRadius: 8 }, active: { backgroundColor: colors.background },
  heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
});
