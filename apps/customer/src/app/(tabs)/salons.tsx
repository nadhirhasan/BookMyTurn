import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { SalonCard } from '@/components/SalonCard';
import { Action, Chip, Notice, Screen, SearchField } from '@/components/UI';
import { DataStatus, styles, useRefreshOnFocus } from '@/components/CustomerUI';
import { salonDisplay, searchSalons } from '@/data/salons';
import { useCustomer } from '@/providers/CustomerProvider';
import { type } from '@/theme';
export default function SalonsScreen() {
  const params = useLocalSearchParams<{
    q?: string;
    intent?: string;
  }>();
  const query = params.q ?? '';
  const [sort, setSort] = useState('wait');
  const [openOnly, setOpenOnly] = useState(false);
  const { catalog } = useCustomer();
  useRefreshOnFocus();
  const salons = catalog?.salons.map(s => salonDisplay(s, catalog)) ?? [];
  const results = searchSalons(salons, query).filter(s => !openOnly || s.open).sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name) : Number(b.open) - Number(a.open) || (a.wait?.[0] ?? Infinity) - (b.wait?.[0] ?? Infinity));
  return <Screen title="Salons" tab><Text accessibilityRole="header" style={type.title}>{!query.trim() && !openOnly ? `${salons.length} salons to explore` : `${results.length} salons found`}</Text>
  <SearchField value={query} onChange={q => router.setParams({ q })}/>
  <View style={styles.row}>{([['wait', 'Shortest wait'], ['name', 'A–Z']] as const).map(([value, label]) => <Chip key={value} label={label} selected={sort === value} onPress={() => setSort(value)}/>)}<Chip label="Open now" selected={openOnly} onPress={() => setOpenOnly(!openOnly)}/></View>
  {params.intent === 'plan' && <Notice>Choose a salon, then select a date and an available time to request an appointment.</Notice>}
  <DataStatus />
  {results.map(s => <View key={s.id} style={{ gap: 16 }}><SalonCard salon={s} featured/></View>)}
  {catalog && !results.length && <><Text style={type.section}>No salons found</Text><Action label="Reset search and filters" onPress={() => { router.setParams({ q: '' }); setOpenOnly(false); setSort('wait'); }}/></>}
  <Notice>Only checked-in customers count as physically waiting. Joining remotely does not reserve a physical position.</Notice>
 </Screen>;
}
