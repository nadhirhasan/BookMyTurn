import { useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ChartNoAxesCombined, ChevronRight, Clock3, RefreshCw, Scissors, SlidersHorizontal, Star } from 'lucide-react-native';
import { ManagementScreen, Portrait } from '@/components/ManagementUI';
import { Button, Chip, Note } from '@/components/UI';
import { ChoiceField, DateField } from '@/components/FinanceFields';
import { PerformanceChart } from '@/components/PerformanceChart';
import { useManager } from '@/providers/ManagerProvider';
import { useSession } from '@/providers/SessionProvider';
import { useFinanceResource } from '@/hooks/useFinanceResource';
import { colomboDay, validRange } from '@/lib/finance';
import { comparison, dateSpan, performanceRange, type PerformanceReport } from '@/lib/performance';
import { money } from '@/lib/types';
import { colors, fonts, type } from '@/theme';

export default function AnalyticsScreen() {
  const manager = useManager(), session = useSession(), scroll = useRef<ScrollView>(null);
  const params = useLocalSearchParams<{ salon?: string; barber?: string }>();
  return <ManagementScreen title="Analytics" navigation scrollRef={scroll} showFreshness={false}>
    {manager.data?.salons.length ? <AnalyticsWorkspace key={`${session.session?.user.id}:${params.salon}:${params.barber}`} initialSalon={params.salon ?? null} initialBarber={params.barber ?? null} onDrillDown={() => scroll.current?.scrollTo({ y: 0, animated: false })} /> : <Note>{manager.loading ? 'Loading owner access…' : 'Performance and revenue reports are available to salon owners only.'}</Note>}
  </ManagementScreen>;
}
function AnalyticsWorkspace({ initialSalon, initialBarber, onDrillDown }: { initialSalon: string | null; initialBarber: string | null; onDrillDown: () => void }) {
  const [salon, setSalon] = useState(initialSalon), [barber, setBarber] = useState(initialBarber);
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'custom'>('week');
  const [range, setRange] = useState(() => performanceRange('week')), [draft, setDraft] = useState(range);
  const [filtersOpen, setFiltersOpen] = useState(false), [invalid, setInvalid] = useState(false);
  const [metric, setMetric] = useState<'revenue_minor' | 'completed_count'>('revenue_minor'), [group, setGroup] = useState<'daily' | 'weekly'>('daily');
  const report = useFinanceResource<PerformanceReport>('performance', { salon_id: salon, barber_id: barber, ...range });
  const data = report.data, selected = data?.team.find(b => b.id === barber);
  const team = [...(data?.team ?? [])].sort((a, b) => b[metric] - a[metric] || a.display_name.localeCompare(b.display_name));
  const teamMaximum = Math.max(1, ...team.map(b => b[metric]));
  const scope = selected?.display_name ?? (salon ? data?.salons.find(s => s.id === salon)?.name ?? 'Selected salon' : 'All your salons');
  const preset = (p: 'today' | 'week' | 'month') => { setPeriod(p); const next = performanceRange(p); setRange(next); setDraft(next); setInvalid(false); };
  return <>
    <View style={a.heading}><View style={{ flex: 1, gap: 5 }}><Text style={type.eyebrow}>BUSINESS PERFORMANCE</Text><Text accessibilityRole="header" style={type.title}>{scope}</Text><Text style={type.caption}>{dateSpan(range.from, range.to)} · {range.to.slice(0, 4)} · Sri Lanka time</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Filter performance" accessibilityState={{ expanded: filtersOpen }} onPress={() => setFiltersOpen(!filtersOpen)} style={a.icon}><SlidersHorizontal color={colors.action} size={22} /></Pressable></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>{(['today', 'week', 'month', 'custom'] as const).map(p => <Chip key={p} label={{ today: 'Today', week: 'This week', month: 'This month', custom: 'Custom dates' }[p]} selected={period === p} onPress={() => p === 'custom' ? setPeriod(p) : preset(p)} />)}</ScrollView>
    {period === 'custom' && <View style={a.card}><DateField label="Analytics from date" value={draft.from} lastDay={colomboDay()} onChange={from => setDraft(v => ({ ...v, from }))} /><DateField label="Analytics to date" value={draft.to} lastDay={colomboDay()} onChange={to => setDraft(v => ({ ...v, to }))} error={invalid ? 'Choose up to 366 days, ending today or earlier.' : undefined} /><Button label="Apply analytics dates" onPress={() => { const ok = validRange(draft.from, draft.to) && draft.to <= colomboDay(); setInvalid(!ok); if (ok) setRange(draft); }} /></View>}
    {filtersOpen && <View style={a.card}><ChoiceField label="Analytics salon" value={salon ?? ''} options={[{ value: '', label: 'All my salons' }, ...(data?.salons ?? []).map(s => ({ value: s.id, label: `${s.name}${s.archived ? ' (archived)' : ''}` }))]} onChange={value => { setSalon(value || null); setBarber(null); }} /><ChoiceField label="Analytics barber" value={barber ?? ''} options={[{ value: '', label: 'All barbers' }, ...(data?.team ?? []).map(b => ({ value: b.id, label: `${b.display_name} · ${b.salon_name}${b.archived_at ? ' (archived)' : ''}` }))]} onChange={value => setBarber(value || null)} disabled={!data} /><Button label="Done filtering" secondary onPress={() => setFiltersOpen(false)} /></View>}
    {barber && <Button label="Back to whole team" secondary onPress={() => setBarber(null)} />}
    <View style={a.heading}><Text style={[type.caption, { flex: 1 }]}>{report.lastUpdated ? `Updated ${new Date(report.lastUpdated).toLocaleTimeString()}` : 'Loading performance…'}</Text><Pressable accessibilityRole="button" accessibilityLabel="Refresh performance" onPress={() => { void report.refresh(); }} style={a.refresh}><RefreshCw color={colors.action} size={17} /><Text style={[type.caption, { color: colors.action }]}>Refresh</Text></Pressable></View>
    {report.stale && data && <Note>Performance data may be out of date. Refresh before relying on these figures.</Note>}
    {report.error && <Text accessibilityRole="alert" style={type.body}>{report.error}</Text>}
    {report.loading && !data && <ActivityIndicator accessibilityLabel="Loading performance" color={colors.action} />}
    {data && <>
      <View style={a.hero}>
        <View style={a.heading}><Text style={[type.label, { flex: 1 }]}>Completed haircut revenue</Text><ChartNoAxesCombined color={colors.action} size={23} /></View>
        <Text testID="performance-revenue" style={a.amount}>{money(data.summary.revenue_minor)}</Text>
        <Text style={[type.label, { color: data.summary.revenue_minor >= data.previous.revenue_minor ? colors.positive : colors.pending }]}>{comparison(data.summary.revenue_minor, data.previous.revenue_minor)}</Text>
        <Text style={type.caption}>Compared with {dateSpan(data.comparison_from, data.comparison_to)} ({money(data.previous.revenue_minor)}).</Text>
        {data.to === data.today && <Text style={type.caption}>Today is still in progress.</Text>}
        {!!data.summary.adjustments_minor && <Text style={type.caption}>Includes {money(data.summary.adjustments_minor)} in posted corrections.</Text>}
      </View>
      <View style={a.grid}>
        <View style={a.metric}><Scissors size={20} color={colors.action} /><Text testID="performance-cuts" style={a.metricValue}>{data.summary.completed_count}</Text><Text style={type.label}>Haircuts completed</Text><Text style={type.caption}>{data.previous.completed_count} in previous period</Text></View>
        <View style={a.metric}><Clock3 size={20} color={colors.pending} /><Text style={a.metricValue}>{data.summary.average_minutes === null ? '—' : `${data.summary.average_minutes} min`}</Text><Text style={type.label}>Average haircut time</Text><Text style={type.caption}>From start to finish</Text></View>
      </View>
      <View style={a.average}><Text style={type.label}>Average haircut value</Text><Text style={type.section}>{data.summary.average_sale_minor === null ? '—' : money(data.summary.average_sale_minor)}</Text></View>
      {selected && <View style={a.card}><View style={a.heading}><Portrait uri={selected.photo_url} name={selected.display_name} size={52} /><View style={{ flex: 1, gap: 4 }}><Text style={type.section}>{selected.display_name}</Text><Text style={type.caption}>{selected.salon_name}{selected.archived_at ? ' · Archived' : ''}</Text></View><Star size={20} color={colors.pending} /></View><Text style={type.body}>{selected.rating === null ? 'No reviews in this period' : `${selected.rating}/5 · ${selected.review_count} review${selected.review_count === 1 ? '' : 's'} in this period`}</Text></View>}
      <View style={a.card}><Text accessibilityRole="header" style={type.section}>Performance over time</Text><View style={a.wrap}><Chip label="Revenue" selected={metric === 'revenue_minor'} onPress={() => setMetric('revenue_minor')} /><Chip label="Haircuts" selected={metric === 'completed_count'} onPress={() => setMetric('completed_count')} /></View><View style={a.wrap}><Chip label="Daily" selected={group === 'daily'} onPress={() => setGroup('daily')} /><Chip label="Weekly" selected={group === 'weekly'} onPress={() => setGroup('weekly')} /></View><PerformanceChart key={`${salon}:${barber}:${range.from}:${range.to}:${group}`} rows={data[group]} metric={metric} />{group === 'weekly' && <Text style={type.caption}>Weeks start on Monday. First and last weeks may be partial.</Text>}</View>
      <View style={{ gap: 6 }}><Text accessibilityRole="header" style={type.section}>Your team, at a glance</Text><Text style={type.caption}>Ranked by {metric === 'revenue_minor' ? 'revenue' : 'completed haircuts'} · Tap a barber to explore their results.</Text></View>
      {!team.length && <Note>Add your first barber to start tracking team performance.</Note>}
      {team.map((b, index) => <Pressable key={b.id} accessibilityRole="button" accessibilityLabel={`View performance: ${b.display_name}`} accessibilityState={{ selected: barber === b.id }} onPress={() => { setBarber(b.id); setFiltersOpen(false); onDrillDown(); }} style={({ pressed }) => [a.team, barber === b.id && { borderColor: colors.action }, { opacity: pressed ? 0.75 : 1 }]}>
        <View style={a.heading}><Text style={[type.caption, { width: 18 }]}>{index + 1}</Text><Portrait uri={b.photo_url} name={b.display_name} size={42} /><View style={{ flex: 1, gap: 3 }}><Text style={type.label}>{b.display_name}</Text><Text style={type.caption}>{b.salon_name}{b.archived_at ? ' · Archived' : ''}</Text></View><ChevronRight color={colors.action} size={20} /></View>
        <View style={[a.heading, { justifyContent: 'space-between', flexWrap: 'wrap' }]}><Text style={type.label}>{b.completed_count} haircut{b.completed_count === 1 ? '' : 's'}</Text><Text style={[type.section, { color: colors.action }]}>{money(b.revenue_minor)}</Text></View>
        <View style={a.track}><View style={{ height: 4, borderRadius: 2, width: `${Math.max(0, b[metric]) / teamMaximum * 100}%`, backgroundColor: colors.action }} /></View>
        <Text style={type.caption}>{b.average_minutes === null ? 'No completed haircuts yet' : `${b.average_minutes} min average`}{b.rating === null ? ' · No reviews' : ` · ${b.rating}/5 (${b.review_count})`}</Text>
      </Pressable>)}
      <Button label="Open sales and expenses" secondary onPress={() => router.push({ pathname: '/manage/finance', params: salon ? { salon } : {} })} />
      <Text style={type.caption}>Revenue belongs to the business; it is not barber pay. Only completed haircuts count. Average value excludes later corrections. Ratings use reviews posted during these dates.</Text>
    </>}
  </>;
}
const a = StyleSheet.create({
  heading: { flexDirection: 'row', alignItems: 'center', gap: 12 }, wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  icon: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  refresh: { minHeight: 48, flexDirection: 'row', gap: 6, alignItems: 'center' },
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.divider, borderRadius: 22, padding: 18, gap: 16 },
  hero: { padding: 22, borderRadius: 24, backgroundColor: colors.brandSoft, gap: 10 },
  amount: { fontFamily: fonts.bold, fontSize: 34, lineHeight: 43, color: colors.action, fontVariant: ['tabular-nums'] },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metric: { flex: 1, minWidth: 124, borderWidth: 1, borderColor: colors.divider, padding: 16, borderRadius: 20, backgroundColor: colors.card, gap: 8 },
  metricValue: { fontFamily: fonts.bold, fontSize: 27, color: colors.text, fontVariant: ['tabular-nums'] },
  average: { padding: 18, borderRadius: 18, backgroundColor: colors.surface, gap: 6 },
  team: { padding: 18, borderWidth: 1, borderColor: colors.divider, borderRadius: 20, backgroundColor: colors.card, gap: 14 },
  track: { height: 4, backgroundColor: colors.surface, borderRadius: 2, overflow: 'hidden' },
});
