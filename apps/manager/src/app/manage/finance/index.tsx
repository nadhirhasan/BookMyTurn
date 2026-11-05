import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { ArrowDownLeft, ArrowUpRight, Plus, RefreshCw } from 'lucide-react-native';
import { ManagementScreen, MenuRow, m } from '@/components/ManagementUI';
import { Button, Chip, Note, s } from '@/components/UI';
import { ChoiceField, DateField } from '@/components/FinanceFields';
import { useSession } from '@/providers/SessionProvider';
import { useManager } from '@/providers/ManagerProvider';
import { useFinanceResource } from '@/hooks/useFinanceResource';
import { periodRange, validRange, type FinanceFilters, type FinanceReport, type FinancePage, type SaleEvent, type Expense } from '@/lib/finance';
import { money, time, visitDate } from '@/lib/types';
import { colors, type } from '@/theme';

export default function FinanceScreen() {
  const session = useSession(), manager = useManager(), { salon } = useLocalSearchParams<{ salon?: string }>();
  const owner = !!manager.data?.salons.length;
  return <ManagementScreen title="Finance" navigation>{owner ? <FinanceWorkspace key={`${session.session?.user.id}:${salon ?? ''}`} initialSalon={salon ?? null} /> : <Note>{manager.loading ? 'Loading owner access…' : 'Financial records are available to salon owners only.'}</Note>}</ManagementScreen>;
}
function FinanceWorkspace({ initialSalon }: { initialSalon: string | null }) {
  const [salon, setSalon] = useState<string | null>(initialSalon), [period, setPeriod] = useState<'today' | 'week' | 'month' | 'custom'>('today');
  const [range, setRange] = useState(() => periodRange('today')), [draft, setDraft] = useState(range), [submitted, setSubmitted] = useState(false);
  const [tab, setTab] = useState<'overview' | 'sales' | 'expenses' | 'reports'>('overview'), [revision, setRevision] = useState(0);
  const filters: FinanceFilters = { salon_id: salon, ...range };
  const report = useFinanceResource<FinanceReport>('report', filters, true, revision);
  const preset = (value: 'today' | 'week' | 'month') => { setPeriod(value); const next = periodRange(value); setRange(next); setDraft(next); setSubmitted(false); };
  return <>
    <MenuRow label="Explore team analytics" detail="Interactive trends and individual barber performance" onPress={()=>router.push({pathname:'/manage/analytics',params:salon?{salon}:{}})}/>
    <View style={{ gap: 6 }}><Text style={type.caption}>OWNER WORKSPACE</Text><Text accessibilityRole="header" style={type.title}>Your business, in view.</Text><Text style={type.caption}>{range.from} — {range.to} · Sri Lanka time</Text></View>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Text style={[type.caption, { flex: 1 }]}>{report.lastUpdated ? `Finance updated ${new Date(report.lastUpdated).toLocaleTimeString()}` : 'Loading financial records…'}</Text><Pressable accessibilityRole="button" accessibilityLabel="Refresh financial data" onPress={() => setRevision(v => v + 1)} style={m.icon}><RefreshCw size={19} color={colors.text} /></Pressable></View>
    {report.stale && report.data && <Note>Financial data may be out of date. Refresh before relying on these totals.</Note>}
    {report.error && <Text accessibilityRole="alert" style={type.body}>{report.error}</Text>}
    {report.loading && !report.data && <ActivityIndicator color={colors.text} />}
    {report.data && <ChoiceField label="Report salon" value={salon ?? ''} options={[{ value: '', label: 'All my salons' }, ...report.data.salons.map(s => ({ value: s.id, label: `${s.name}${s.archived ? ' (archived)' : ''}` }))]} onChange={value => setSalon(value || null)} />}
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>{(['today', 'week', 'month', 'custom'] as const).map(value => <Chip key={value} label={{ today: 'Today', week: 'This week', month: 'This month', custom: 'Custom dates' }[value]} selected={period === value} onPress={() => value === 'custom' ? setPeriod(value) : preset(value)} />)}</ScrollView>
    {period === 'custom' && <View style={s.card}><DateField label="From date" value={draft.from} onChange={from => setDraft(v => ({ ...v, from }))} /><DateField label="To date" value={draft.to} onChange={to => setDraft(v => ({ ...v, to }))} error={submitted && !validRange(draft.from, draft.to) ? 'Choose an end date after the start, within 366 days.' : undefined} /><Button label="Apply dates" secondary onPress={() => { setSubmitted(true); if (validRange(draft.from, draft.to)) setRange(draft); }} /></View>}
    <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: colors.divider }}>{(['overview', 'sales', 'expenses', 'reports'] as const).map(value => <Pressable key={value} accessibilityRole="button" accessibilityLabel={`Finance ${value}`} accessibilityState={{ selected: tab === value }} onPress={() => setTab(value)} style={{ flex: 1, alignItems: 'center', minHeight: 48, justifyContent: 'center', borderBottomWidth: tab === value ? 2 : 0, borderColor: colors.positive }}><Text style={[type.label, { fontSize: 13, color: tab === value ? colors.action : colors.muted }]}>{value[0]!.toUpperCase() + value.slice(1)}</Text></Pressable>)}</View>
    {report.data && <>
      {tab === 'overview' && <Overview report={report.data} salonId={salon} />}
      {tab === 'sales' && <Sales key={JSON.stringify(filters)} filters={filters} report={report.data} revision={revision} />}
      {tab === 'expenses' && <Expenses key={JSON.stringify(filters)} filters={filters} revision={revision} />}
      {tab === 'reports' && <Reports report={report.data} />}
    </>}
  </>;
}
function Metric({ label, amount, testID }: { label: string; amount: number; testID?: string }) { return <View style={{ flex: 1, minWidth: 120, gap: 5 }}><Text style={type.caption}>{label}</Text><Text testID={testID} style={type.section}>{money(amount)}</Text></View>; }
function Overview({ report, salonId }: { report: FinanceReport; salonId: string | null }) {
  const summary = report.summary;
  return <><View style={[s.card, { backgroundColor: colors.positiveSoft, gap: 18, borderColor: colors.positiveSoft }]}><View style={{ gap: 6 }}><Text style={type.caption}>COMPLETED HAIRCUT REVENUE</Text><Text testID="finance-revenue" style={[type.title, { fontSize: 30 }]}>{money(summary.revenue_minor)}</Text><Text style={type.caption}>{summary.completed_count} completed haircut{summary.completed_count === 1 ? '' : 's'}{summary.adjustments_minor ? ` · ${money(summary.adjustments_minor)} in posted corrections` : ''}</Text></View><View style={{ height: 1, backgroundColor: colors.divider }} /><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}><Metric label="Paid operating costs" amount={summary.operating_minor} testID="finance-operating" /><Metric label="Estimated profit" amount={summary.profit_minor} testID="finance-profit" /></View></View>
    <Note>Estimated profit from recorded sales, less paid operating expenses and accrued BookMyTurn commission. Unpaid expenses and capital purchases are shown separately.</Note>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}><Metric label="Expected / unpaid expenses" amount={summary.expected_minor} /><Metric label="Paid capital purchases" amount={summary.capital_minor} /></View>
    <Text style={type.section}>BookMyTurn commission</Text><View style={s.card}><Metric label="Accrued in this period" amount={summary.commission_minor} /><Metric label="Payments recorded in this period" amount={summary.commission_paid_minor} /><Metric label={`Unsettled through ${report.to}`} amount={summary.commission_outstanding_minor} /><Text style={type.caption}>Settlement payments are not deducted from profit a second time. Only recorded commission is included; no new charge is added.</Text></View>
    <Button label="Add expense" onPress={() => router.push(`/manage/finance/expense/new${salonId ? `?salon=${salonId}` : ''}`)} />
  </>;
}
const sourceName = (source: string) => ({ remote: 'App queue', qr: 'Salon QR', walk_in: 'Walk-in', appointment: 'Appointment' })[source] ?? source;
function Sales({ filters, report, revision }: { filters: FinanceFilters; report: FinanceReport; revision: number }) {
  const [barber, setBarber] = useState(''), [source, setSource] = useState(''), [offset, setOffset] = useState(0);
  const query = useFinanceResource<FinancePage<SaleEvent>>('sales', { ...filters, barber_id: barber || null, source: source || null, offset }, true, revision);
  return <><Text style={type.section}>Recorded sales</Text><Text style={type.caption}>Only finished haircuts generate sales. Corrections appear on their posting date.</Text>
    <ChoiceField label="Sales barber" value={barber} options={[{ value: '', label: 'All barbers' }, ...report.barbers.map(b => ({ value: b.id, label: `${b.display_name} · ${b.salon_name}` }))]} onChange={v => { setBarber(v); setOffset(0); }} />
    <ChoiceField label="Customer source" value={source} options={[{ value: '', label: 'All sources' }, ...['remote', 'qr', 'walk_in', 'appointment'].map(value => ({ value, label: sourceName(value) }))]} onChange={v => { setSource(v); setOffset(0); }} />
    {query.error && <Text accessibilityRole="alert" style={type.body}>{query.error}</Text>}{query.loading && !query.data && <ActivityIndicator />}
    {query.data && <><Text style={type.caption}>{query.data.total} record{query.data.total === 1 ? '' : 's'} · page {Math.floor(offset / 25) + 1}</Text>{!query.data.rows.length && <Note>No recorded sales match these dates and filters.</Note>}{query.data.rows.map(sale => <View key={sale.id} testID={`sale-${sale.id}`} style={s.card}><View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>{sale.amount_minor < 0 ? <ArrowDownLeft color={colors.pending} size={20} /> : <ArrowUpRight color={colors.positive} size={20} />}<Text style={[type.section, { flex: 1 }]}>{money(sale.amount_minor)}</Text><Text style={type.caption}>{sale.event_kind === 'sale' ? 'Completed' : 'Correction'}</Text></View><Text style={type.body}>{sale.barber_name} · {sale.salon_name}</Text><Text style={type.caption}>{visitDate(sale.recorded_at)} · {time(sale.recorded_at)} · {sourceName(sale.source)}</Text>{sale.payment_method && <Text style={type.caption}>{sale.payment_method}</Text>}{sale.reason && <Text style={type.body}>{sale.reason}</Text>}<Text selectable style={type.caption}>Sale reference: {sale.id}</Text></View>)}<View style={s.row}>{offset > 0 && <Button label="Previous sales" secondary onPress={() => setOffset(v => Math.max(0, v - 25))} />}{query.data.next_offset !== null && <Button label="Next sales" secondary onPress={() => setOffset(query.data!.next_offset!)} />}</View></>}
  </>;
}
function Expenses({ filters, revision }: { filters: FinanceFilters; revision: number }) {
  const [status, setStatus] = useState(''), [offset, setOffset] = useState(0);
  const query = useFinanceResource<FinancePage<Expense>>('expenses', { ...filters, status: status || null, offset }, true, revision);
  return <><View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Text style={type.section}>Expenses</Text><Pressable accessibilityRole="button" accessibilityLabel="Add expense" onPress={() => router.push(`/manage/finance/expense/new${filters.salon_id ? `?salon=${filters.salon_id}` : ''}`)} style={[s.row, { minHeight: 48 }]}><Plus size={18} color={colors.text} /><Text style={type.label}>Add expense</Text></Pressable></View><Text style={type.caption}>Paid entries use the payment date. Expected and cancelled entries use their expense date.</Text>
    <ChoiceField label="Expense status" value={status} options={[{ value: '', label: 'All statuses' }, { value: 'paid', label: 'Paid' }, { value: 'expected', label: 'Expected / unpaid' }, { value: 'cancelled', label: 'Cancelled' }]} onChange={v => { setStatus(v); setOffset(0); }} />
    {query.error && <Text accessibilityRole="alert" style={type.body}>{query.error}</Text>}{query.loading && !query.data && <ActivityIndicator />}
    {query.data && <><Text style={type.caption}>{query.data.total} expense{query.data.total === 1 ? '' : 's'} · page {Math.floor(offset / 25) + 1}</Text>{!query.data.rows.length && <Note>No expenses match these dates and filters.</Note>}{query.data.rows.map(expense => <Pressable accessibilityRole="button" accessibilityLabel={`Edit expense: ${expense.description}`} key={expense.id} onPress={() => router.push(`/manage/finance/expense/${expense.id}?salon=${expense.salon_id}`)} style={({pressed})=>[s.card,{opacity:pressed?.7:1}]}><View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}><Text style={[type.label, { flex: 1 }]}>{expense.description}</Text><Text style={type.section}>{money(expense.amount_minor)}</Text></View><Text style={type.caption}>{expense.salon_name} · {expense.category_name}</Text><Text style={[type.caption, { color: expense.status === 'expected' ? colors.pending : colors.muted }]}>{expense.status === 'expected' ? 'Expected / unpaid' : expense.status === 'paid' ? 'Paid' : 'Cancelled'} · {expense.paid_on ?? expense.due_on} · {expense.kind === 'capital' ? 'Capital purchase' : 'Operating cost'}</Text></Pressable>)}<View style={s.row}>{offset > 0 && <Button label="Previous expenses" secondary onPress={() => setOffset(v => Math.max(0, v - 25))} />}{query.data.next_offset !== null && <Button label="Next expenses" secondary onPress={() => setOffset(query.data!.next_offset!)} />}</View></>}
  </>;
}
function Reports({ report }: { report: FinanceReport }) {
  const [group, setGroup] = useState<'daily' | 'monthly'>('daily');
  const rows = group === 'daily' ? report.daily.map(d => ({ ...d, label: d.day })) : report.monthly.map(d => ({ ...d, label: d.month }));
  const active = rows.filter(r => r.revenue_minor || r.operating_minor || r.commission_minor || r.completed_count);
  return <><Text style={type.section}>Revenue & costs</Text><View style={s.row}><Chip label="Daily report" selected={group === 'daily'} onPress={() => setGroup('daily')} /><Chip label="Monthly report" selected={group === 'monthly'} onPress={() => setGroup('monthly')} /></View>{!active.length && <Note>No completed sales or paid operating costs in this period.</Note>}{active.map(row => <View key={row.label} style={s.card}><Text style={type.label}>{row.label} · {row.completed_count} haircuts</Text><Text style={type.body}>Revenue {money(row.revenue_minor)}</Text><Text style={type.caption}>Operating costs {money(row.operating_minor)} · Commission {money(row.commission_minor)}</Text><Text style={type.label}>Estimated profit {money(row.profit_minor)}</Text></View>)}
    <Text style={type.section}>Barber performance</Text><Text style={type.caption}>Revenue includes corrections posted in this period. Ratings use reviews posted in this period. Duration uses completed haircut start/finish times.</Text>{!report.barbers.length && <Note>Add your team to see barber performance.</Note>}{report.barbers.map(barber => <View key={barber.id} style={s.card}><Text style={type.section}>{barber.display_name}{barber.archived_at ? ' (archived)' : ''}</Text><Text style={type.caption}>{barber.salon_name}</Text><Text style={type.body}>{barber.completed_count} completed · {money(barber.revenue_minor)}</Text><Text style={type.caption}>{barber.average_minutes === null ? 'No completed duration yet' : `${barber.average_minutes} min average`} · {barber.review_count ? `${barber.rating}/5 from ${barber.review_count} reviews` : 'No reviews in this period'}</Text></View>)}</>;
}
