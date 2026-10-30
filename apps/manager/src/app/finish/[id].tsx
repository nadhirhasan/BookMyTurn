import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Chip, Field, Note, Screen, s, useAction } from '@/components/UI';
import { useBarber } from '@/providers/BarberProvider';
import { minor, money } from '@/lib/types';
import { type } from '@/theme';
export default function Finish() { const { id } = useLocalSearchParams<{
  id: string;
}>(); const { data } = useBarber(); const session = data?.sessions.find(ss => ss.id === id); return <Screen title="Finish Service" back>{session ? <FinishForm key={session.id} session={session}/> : <Text style={type.body}>This service is not assigned to you. Refresh My Queue.</Text>}</Screen>; }
function FinishForm({ session }: {
  session: NonNullable<ReturnType<typeof useBarber>['data']>['sessions'][number];
}) {
  const [base, setBase] = useState(String(session.agreed_price_minor / 100));
  const [extras, setExtras] = useState<{
    name: string;
    amount: string;
  }[]>([]);
  const [reason, setReason] = useState('');
  const [payment, setPayment] = useState('');
  const [agreed, setAgreed] = useState(false);
  const { run, busy, error } = useAction();
  const [localError, setLocalError] = useState<string | null>(null);
  const parsed = extras.map(e => ({ description: e.name.trim(), amount_minor: minor(e.amount) }));
  const total = (minor(base) ?? 0) + parsed.reduce((sum, e) => sum + (e.amount_minor ?? 0), 0);
  const outside = total < session.price_min_minor_snapshot || total > session.price_max_minor_snapshot;
  if (session.status === 'completed')
    return <><Text accessibilityRole="header" style={type.title}>Service completed.</Text><Text style={type.body}>{money(session.final_amount_minor ?? 0)} recorded. The customer can now review this haircut.</Text><Button label="Start next customer" onPress={() => router.dismissTo('/queue')}/><Button label="Take a Break" secondary onPress={() => router.replace('/break')}/></>;
  const submit = () => { if (minor(base) === null || parsed.some(e => !e.description || e.amount_minor === null || e.amount_minor <= 0) || !agreed || (outside && !reason.trim())) {
    setLocalError('Check the amounts, extra service details, price reason and customer agreement.');
    return;
  } setLocalError(null); void run('finish', { id: session.id, final_amount_minor: total, final_agreed: agreed, price_reason: reason, payment_method: payment, extras: parsed.map(e => ({ description: e.description, amount_minor: e.amount_minor! })) }); };
  return <><Text accessibilityRole="header" style={type.title}>Finish with everything agreed.</Text><Text style={type.section}>{session.service_name_snapshot}</Text><Note>Estimated {money(session.price_min_minor_snapshot)}–{money(session.price_max_minor_snapshot)}. Agreed before service: {money(session.agreed_price_minor)}.</Note><Field label="Service amount (Rs.)" value={base} onChange={setBase} numeric/>
{extras.map((extra, index) => <View key={index} style={s.card}><Field label={`Extra ${index + 1} description`} value={extra.name} onChange={value => setExtras(current => current.map((e, i) => i === index ? { ...e, name: value } : e))}/><Field label={`Extra ${index + 1} amount (Rs.)`} value={extra.amount} onChange={value => setExtras(current => current.map((e, i) => i === index ? { ...e, amount: value } : e))} numeric/><Button label={`Remove extra ${index + 1}`} secondary onPress={() => setExtras(current => current.filter((_, i) => i !== index))}/></View>)}
{extras.length < 10 && <Button label="+ Add extra service" secondary onPress={() => setExtras(current => [...current, { name: '', amount: '' }])}/>}<Text style={type.title}>Final total {money(total)}</Text><Field label="Reason for price outside the range" value={reason} onChange={setReason} maxLength={2000} multiline/><Field label="Payment method (optional)" value={payment} onChange={setPayment} maxLength={60}/>{session.commission_disclosure_snapshot && <Note>{session.commission_disclosure_snapshot}. Included surcharge: {money(session.commission_surcharge_minor)}.</Note>}<Chip label="Customer agreed to this final amount" selected={agreed} onPress={() => setAgreed(!agreed)}/>{(error || localError) && <Text accessibilityRole="alert" style={type.body}>{localError ?? error}</Text>}<Button label={busy ? 'Completing…' : 'Complete Service'} disabled={busy} onPress={submit}/></>;
}
