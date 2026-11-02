import { useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';
import { randomUUID } from 'expo-crypto';
import { ManagementScreen, Section } from '@/components/ManagementUI';
import { Button, Field, Note } from '@/components/UI';
import { ChoiceField, DateField } from '@/components/FinanceFields';
import { useManager } from '@/providers/ManagerProvider';
import { useSession } from '@/providers/SessionProvider';
import { useFinanceResource } from '@/hooks/useFinanceResource';
import { colomboDay, finance, retryKey, type Expense, type FinanceReport } from '@/lib/finance';
import { minor } from '@/lib/types';
import { type } from '@/theme';

export default function ExpenseScreen() {
  const { id, salon } = useLocalSearchParams<{ id: string; salon?: string }>(), session = useSession(), manager = useManager();
  const owner = !!manager.data?.salons.length;
  return <ManagementScreen title={id === 'new' ? 'Add expense' : 'Expense'} back>{owner ? <ExpenseLoader key={`${session.session?.user.id}:${id}`} id={id} salon={salon} /> : <Note>Financial records are available to salon owners only.</Note>}</ManagementScreen>;
}
function ExpenseLoader({ id, salon }: { id: string; salon?: string }) {
  const [today] = useState(colomboDay), [revision, setRevision] = useState(0);
  const metadata = useFinanceResource<FinanceReport>('report', { from: today, to: today, salon_id: null });
  const existing = useFinanceResource<Expense>('expense', { id, salon_id: salon ?? null }, id !== 'new');
  const reload = async () => { await metadata.refresh(); if (id === 'new' || await existing.refresh()) setRevision(v => v + 1); };
  return <>{metadata.error && <Text accessibilityRole="alert" style={type.body}>{metadata.error}</Text>}{existing.error && <Text accessibilityRole="alert" style={type.body}>{existing.error}</Text>}{(metadata.loading || id !== 'new' && existing.loading) && <ActivityIndicator />}
    {metadata.data && (id === 'new' || existing.data) && <ExpenseForm key={`${id}:${revision}`} report={metadata.data} expense={existing.data} initialSalon={salon} stale={metadata.stale || id !== 'new' && existing.stale} reload={reload} />}
    {(!metadata.data || id !== 'new' && !existing.data) && <Button label="Retry financial data" secondary onPress={() => { void reload(); }} />}
  </>;
}
function ExpenseForm({ report, expense, initialSalon, stale, reload }: { report: FinanceReport; expense: Expense | null; initialSalon?: string; stale: boolean; reload: () => Promise<void> }) {
  const [original] = useState(expense), [id] = useState(() => expense?.id ?? randomUUID());
  const [salon, setSalon] = useState(expense?.salon_id ?? initialSalon ?? (report.salons.length === 1 ? report.salons[0]!.id : ''));
  const [description, setDescription] = useState(expense?.description ?? ''), [amount, setAmount] = useState(expense ? (expense.amount_minor / 100).toString() : '');
  const [category, setCategory] = useState(expense?.category_code ?? ''), [kind, setKind] = useState<'operating' | 'capital'>(expense?.kind ?? 'operating');
  const [status, setStatus] = useState<'paid' | 'expected'>(expense?.status === 'paid' ? 'paid' : 'expected');
  const [date, setDate] = useState(expense?.due_on ?? report.today), [paidOn, setPaidOn] = useState(expense?.paid_on ?? report.today);
  const [method, setMethod] = useState(expense?.payment_method ?? ''), [note, setNote] = useState(expense?.note ?? ''), [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState<string | null>(null), [cancel, setCancel] = useState(false);
  const pending = useRef(false), request = useRef<ReturnType<typeof retryKey> | null>(null);
  const paidBefore = original?.status === 'paid' || original?.ever_paid;
  const value = minor(amount);
  const submit = async (cancelling = false) => {
    setSubmitted(true); setError(null); if (pending.current) return;
    if (stale) { setError('Financial data may be out of date. Reload saved data before making changes.'); return; }
    if (paidBefore && !reason.trim() || !cancelling && (!salon || !description.trim() || !category || value === null || value <= 0)) return;
    const action = cancelling ? 'cancel_expense' : 'save_expense';
    const data = cancelling ? { id, salon_id: salon, version: original?.version ?? 0, change_reason: reason.trim() } : { id, salon_id: salon, version: original?.version ?? 0, description: description.trim(), amount_minor: value, category_code: category, kind, status, due_on: date, paid_on: status === 'paid' ? paidOn : null, payment_method: method.trim(), note: note.trim(), change_reason: reason.trim() };
    request.current = retryKey(request.current, { action, ...data });
    pending.current = true; setBusy(true);
    try { await finance(action, { ...data, request_id: request.current.id }); if (router.canGoBack()) router.back(); else router.replace('/manage/finance'); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not save the expense.'); }
    finally { pending.current = false; setBusy(false); }
  };
  return <><Text accessibilityRole="header" style={type.title}>{original ? original.description : 'Keep every cost in view.'}</Text>{stale && <Note>Financial data may be out of date. Reload before saving.</Note>}
    {original?.status === 'cancelled' && <Note>This expense is cancelled and excluded from costs. Saving it will restore it with the status selected below.</Note>}
    <Section title="Expense details"><ChoiceField label="Expense salon" value={salon} options={report.salons.map(s => ({ value: s.id, label: s.name }))} onChange={setSalon} disabled={!!original || busy} error={submitted && !salon ? 'Choose a salon.' : undefined} />
      <Field label="Expense description" value={description} onChange={setDescription} maxLength={200} error={submitted && !description.trim() ? 'Enter an expense description.' : undefined} />
      <ChoiceField label="Expense category" value={category} options={report.categories.map(c => ({ value: c.code, label: c.name }))} onChange={setCategory} error={submitted && !category ? 'Choose an expense category.' : undefined} disabled={busy} />
      <Field label="Expense amount (Rs.)" value={amount} onChange={setAmount} numeric maxLength={12} error={submitted && (value === null || value <= 0) ? 'Enter an amount greater than zero.' : undefined} />
      <ChoiceField label="Expense type" value={kind} options={[{ value: 'operating', label: 'Operating cost' }, { value: 'capital', label: 'Capital purchase / equipment' }]} onChange={v => setKind(v as typeof kind)} disabled={busy} />
      <DateField label="Expense date" value={date} onChange={setDate} disabled={busy} />
    </Section>
    <Section title="Payment"><ChoiceField label="Payment status" value={status} options={[{ value: 'expected', label: 'Expected / unpaid' }, { value: 'paid', label: 'Paid' }]} onChange={v => setStatus(v as typeof status)} disabled={busy} />
      {status === 'paid' && <><DateField label="Paid on" value={paidOn} onChange={setPaidOn} lastDay={report.today} disabled={busy} /><Field label="Payment method (optional)" value={method} onChange={setMethod} maxLength={80} /></>}
      <Field label="Expense notes (optional)" value={note} onChange={setNote} maxLength={2000} multiline />
      <Note>{kind === 'capital' ? 'Capital purchases are shown separately and do not reduce the operating profit estimate.' : status === 'expected' ? 'Unpaid expenses are shown separately and do not reduce the profit estimate until paid.' : 'This paid operating cost reduces estimated profit on its payment date.'}</Note>
    </Section>
    {paidBefore && <Field label="Reason for correction" value={reason} onChange={setReason} maxLength={500} multiline error={submitted && !reason.trim() ? 'Explain the correction to this paid expense.' : undefined} />}
    {error && <Text accessibilityRole="alert" style={type.body}>{error}</Text>}
    <Button label={busy ? 'Saving expense…' : original ? 'Save expense' : 'Create expense'} disabled={busy} onPress={() => { void submit(); }} />
    {original && original.status !== 'cancelled' && <View style={{ gap: 12 }}>{cancel ? <><Note>Cancel this expense? It will be excluded from costs. The record and its audit history will be kept.</Note><Button label="Confirm cancellation" secondary disabled={busy} onPress={() => { void submit(true); }} /><Button label="Keep expense" secondary disabled={busy} onPress={() => setCancel(false)} /></> : <Button label="Cancel expense" secondary disabled={busy} onPress={() => { setCancel(true); setSubmitted(false); }} />}</View>}
    <Button label="Reload saved financial data" secondary disabled={busy} onPress={() => { void reload(); }} />
  </>;
}
