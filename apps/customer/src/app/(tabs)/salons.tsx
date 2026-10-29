import { router, useLocalSearchParams } from 'expo-router';
import { SlidersHorizontal } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SalonCard } from '@/components/SalonCard';
import { Action, Chip, Notice, Screen, SearchField } from '@/components/UI';
import { searchSalons } from '@/data/salons';
import { colors, type } from '@/theme';

export default function SalonsScreen() {
  const params = useLocalSearchParams<{ q?: string; intent?: string }>();
  const query = params.q ?? '';
  const setQuery = (q: string) => router.setParams({ q });
  const [sort, setSort] = useState<'wait' | 'price'>('wait');
  const [openOnly, setOpenOnly] = useState(false);
  const [filters, setFilters] = useState(false);
  const results = searchSalons(query).filter(salon => !openOnly || salon.open).sort((a, b) => Number(b.open) - Number(a.open) || (sort === 'price' ? a.price - b.price : a.wait[1] - b.wait[1]));
  return <Screen title="Salons">
    <Text accessibilityRole="header" style={type.title}>{!query.trim() && !openOnly ? '13 salons in Akurana' : `${results.length} ${results.length === 1 ? 'salon' : 'salons'} found`}</Text>
    <SearchField value={query} onChange={setQuery} />
    <View style={s.filters}>
      <Chip label="Shortest wait" selected={sort === 'wait'} onPress={() => setSort('wait')} />
      <Chip label="Open now" selected={openOnly} onPress={() => setOpenOnly(!openOnly)} />
      <Chip label="Price" selected={sort === 'price'} onPress={() => setSort('price')} />
      <Pressable accessibilityRole="button" accessibilityLabel="Filter options" onPress={() => setFilters(true)} style={s.filterButton}><SlidersHorizontal size={20} color={colors.text} /></Pressable>
    </View>
    {params.intent === 'plan' && <Notice>Planning a visit? Open a salon to compare its estimated visit windows. Appointment requests will be added in a later step.</Notice>}
    <Text style={type.caption}>Current queues · Demo estimates at 2:00 pm</Text>
    {results.map((salon, index) => <View key={salon.id} style={s.item}><SalonCard salon={salon} />{index < results.length - 1 && <View style={s.divider} />}</View>)}
    {!results.length && <><Text accessibilityRole="header" style={type.section}>No salons found</Text><Text style={type.body}>Try another name or turn off Open now.</Text><Action label="Reset search and filters" secondary onPress={() => { setQuery(''); setOpenOnly(false); setSort('wait'); }} /></>}
    <Notice>No one waiting does not always mean a barber is free. Check the earliest estimated service time.</Notice>
    <Text style={type.caption}>Fictional salons, ratings and prices. Photos are illustrative. This snapshot does not refresh.</Text>
    <Modal visible={filters} transparent animationType="fade" onRequestClose={() => setFilters(false)}>
      <View style={s.scrim}><View style={s.panel} accessibilityViewIsModal>
        <Text accessibilityRole="header" style={type.section}>Compare salons</Text>
        <Text style={type.caption}>Prices are starting haircut prices. Opening status is part of the fixed demo snapshot.</Text>
        <Chip label="Shortest wait" selected={sort === 'wait'} onPress={() => setSort('wait')} />
        <Chip label="Lowest price" selected={sort === 'price'} onPress={() => setSort('price')} />
        <Chip label="Open now only" selected={openOnly} onPress={() => setOpenOnly(!openOnly)} />
        <Action label="Show salons" onPress={() => setFilters(false)} />
      </View></View>
    </Modal>
  </Screen>;
}
const s = StyleSheet.create({
  filters: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }, filterButton: { minWidth: 32, height: 44, alignItems: 'center', justifyContent: 'center' },
  item: { gap: 16 }, divider: { height: 1, backgroundColor: colors.divider },
  scrim: { flex: 1, backgroundColor: '#00000066', justifyContent: 'center', alignItems: 'center', padding: 24 },
  panel: { backgroundColor: colors.background, width: '100%', maxWidth: 400, borderRadius: 16, padding: 24, gap: 16 },
});
