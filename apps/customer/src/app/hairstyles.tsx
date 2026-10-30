import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { Action, Chip, Notice, Screen } from '@/components/UI';
import { DataStatus, Field, PrivateGate, styles, useRefreshOnFocus, useVisitAction } from '@/components/CustomerUI';
import { activeQueue } from '@/lib/customer-types';
import { useCustomer } from '@/providers/CustomerProvider';
import { type } from '@/theme';
export default function Hairstyles() {
  const params = useLocalSearchParams<{
    salon?: string;
    queue?: string;
    appointment?: string;
    add?: string;
  }>();
  const { catalog, visits } = useCustomer();
  useRefreshOnFocus();
  const [category, setCategory] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [target, setTarget] = useState<string | null>(params.queue ?? params.appointment ?? null);
  const [saved, setSaved] = useState(false);
  const { run, error, busy } = useVisitAction();
  const [lastAdd, setLastAdd] = useState<string | undefined>(undefined);
  if (params.add !== lastAdd) {
    setLastAdd(params.add);
    if (params.add)
      setSelected(current => current.includes(params.add!) ? current : [...current, params.add!].slice(0, 8));
  }
  useEffect(() => { if (params.add)
    router.setParams({ add: undefined }); }, [params.add]);
  const queues = visits.queues.filter(q => activeQueue(q) && q.status !== 'in_service' && (!params.salon || q.salon_id === params.salon));
  const appointments = visits.appointments.filter(a => ['pending', 'alternative_suggested', 'confirmed', 'arrived'].includes(a.status) && (!params.salon || a.salon_id === params.salon));
  const availableTargets = [...queues.map(q => ({ id: q.id, kind: 'queue', salon: q.salon_id, reference: q.reference })), ...appointments.map(a => ({ id: a.id, kind: 'appointment', salon: a.salon_id, reference: a.reference }))];
  const destination = availableTargets.find(v => v.id === target);
  const chooseTarget = (id: string) => { setTarget(id); setSaved(false); const existing = visits.style_requests.find(r => r.queue_entry_id === id || r.appointment_id === id); if (existing) {
    setSelected(existing.hairstyle_ids);
    setNote(existing.note ?? '');
  } };
  return <Screen title="Hairstyles"><Text accessibilityRole="header" style={type.title}>A little inspiration.</Text><Text style={type.body}>Choose up to eight references to discuss with your barber.</Text><DataStatus />
<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}><Chip label="All styles" selected={!category} onPress={() => setCategory(null)}/>{catalog?.categories.map(c => <Chip key={c.id} label={c.name} selected={category === c.id} onPress={() => setCategory(c.id)}/>)}</ScrollView>
<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>{catalog?.hairstyles.filter(h => !category || h.category_id === category).map(h => <View key={h.id} style={{ width: '47%', gap: 8, marginBottom: 12 }}><Pressable accessibilityRole="button" accessibilityLabel={`View ${h.title}`} onPress={() => router.push(`/hairstyle/${h.id}${params.salon ? `?salon=${params.salon}` : ''}`)}><Image source={{ uri: h.image_url }} style={{ width: '100%', height: 170, borderRadius: 12 }}/><Text style={[type.label, { marginTop: 8 }]}>{h.title}</Text></Pressable><Chip label={selected.includes(h.id) ? 'Selected' : 'Select reference'} selected={selected.includes(h.id)} onPress={() => { setSelected(current => current.includes(h.id) ? current.filter(id => id !== h.id) : current.length < 8 ? [...current, h.id] : current); setSaved(false); }}/></View>)}</View>
{catalog && !catalog.hairstyles.length && <Text style={type.caption}>No hairstyle references published yet.</Text>}
<Notice>Photos are illustrative references. A category does not guarantee the salon offers that style; agree the result and price with your barber.</Notice>
<Text style={type.section}>{selected.length} reference{selected.length === 1 ? '' : 's'} selected</Text>
<PrivateGate>{!!availableTargets.length ? <><Text style={type.label}>Share with a visit</Text><View style={styles.row}>{availableTargets.map(v => <Chip key={v.id} label={`${catalog?.salons.find(s => s.id === v.salon)?.name} · ${v.reference.slice(0, 12)}`} selected={target === v.id} onPress={() => chooseTarget(v.id)}/>)}</View><Field label="Note for your barber (optional)" value={note} onChange={v => { setNote(v); setSaved(false); }} maxLength={2000} multiline/>
{error && <Text accessibilityRole="alert" style={type.body}>{error}</Text>}{saved && <Notice>Your hairstyle preferences have been shared with your barber.</Notice>}
<Action label={busy ? 'Sharing…' : 'Share styles with my barber'} disabled={busy || !destination || !selected.length} onPress={() => { if (destination)
      void run('share_styles', { id: destination.id, kind: destination.kind, hairstyle_ids: selected, note }).then(ok => { if (ok)
        setSaved(true); }); }}/>
</> : <><Text style={type.body}>Join a queue or request an appointment before sharing styles.</Text><Action label="Find a salon" secondary onPress={() => router.push('/salons')}/></>}</PrivateGate>
</Screen>;
}
