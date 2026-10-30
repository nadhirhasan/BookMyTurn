import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Chip, Field, Note, Screen, s, useAction } from '@/components/UI';
import { Preferences } from '@/components/Preferences';
import { useBarber } from '@/providers/BarberProvider';
import { minor, money } from '@/lib/types';
import { type } from '@/theme';
export default function Start() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();
  const { data } = useBarber();
  const visit = data?.queues.find(q => q.id === id) ?? data?.appointments.find(a => a.id === id);
  const [selected, setSelected] = useState<string | null>(null);
  const service = data?.services.find(s => s.id === (visit?.service_id ?? selected)) ?? (!visit?.service_id ? data?.services.find(s => s.id === selected) : undefined);
  const [amount, setAmount] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [commissionAgreed, setCommissionAgreed] = useState(false);
  const [reason, setReason] = useState('');
  const { run, busy, error } = useAction();
  const [localError, setLocalError] = useState<string | null>(null);
  const source = visit && 'source' in visit ? visit.source : 'appointment';
  const rule = data?.commission_rules.find(r => r.eligible_sources.includes(source));
  const lo = service ? service.price_min_minor + (rule?.surcharge_minor ?? 0) : 0;
  const hi = service ? service.price_max_minor + (rule?.surcharge_minor ?? 0) : 0;
  const submit = () => { const value = minor(amount); if (!service || value === null || !agreed || (rule && !commissionAgreed) || ((value < lo || value > hi) && !reason.trim())) {
    setLocalError('Choose the service, enter the agreed price and confirm the required agreements. Explain any price outside the range.');
    return;
  } setLocalError(null); void run('start', { id, service_id: service.id, agreed_price_minor: value, price_agreed: agreed, commission_agreed: commissionAgreed, price_reason: reason }, () => router.dismissTo('/queue')); };
  return <Screen title="Start Service" back><Text accessibilityRole="header" style={type.title}>Agree before you begin.</Text>{visit ? <><Text style={type.label}>{visit.customer_name ?? 'Customer'} · {visit.reference}</Text><Preferences id={id}/>{!visit.service_id && <View style={s.row}>{data?.services.map(sv => <Chip key={sv.id} label={sv.name} selected={selected === sv.id} onPress={() => setSelected(sv.id)}/>)}</View>}{service && <Note>{service.name} · {service.duration_minutes} minutes · Estimated {money(lo)}–{money(hi)}</Note>}<Field label="Agreed price before service (Rs.)" value={amount} onChange={setAmount} numeric/><Field label="Reason if outside the range" value={reason} onChange={setReason} maxLength={2000} multiline/>
{rule && <><Note>{rule.disclosure} · Included surcharge {money(rule.surcharge_minor)}</Note><Chip label="Customer agreed to the disclosed surcharge" selected={commissionAgreed} onPress={() => setCommissionAgreed(!commissionAgreed)}/></>}
<Chip label="Customer agreed to this price before service" selected={agreed} onPress={() => setAgreed(!agreed)}/>{(error || localError) && <Text accessibilityRole="alert" style={type.body}>{localError ?? error}</Text>}<Button label={busy ? 'Starting…' : 'Start Service'} disabled={busy} onPress={submit}/></> : <Text style={type.body}>This visit is not assigned to you or has already moved on. Refresh My Queue.</Text>}</Screen>;
}
