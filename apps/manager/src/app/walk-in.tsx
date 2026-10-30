import { router } from 'expo-router';
import { randomUUID } from 'expo-crypto';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Chip, Field, Screen, s, useAction } from '@/components/UI';
import { useBarber } from '@/providers/BarberProvider';
import { type } from '@/theme';
export default function WalkIn() { const { data } = useBarber(); const { run, busy, error } = useAction(); const [key] = useState(randomUUID); const [name, setName] = useState(''); const [mobile, setMobile] = useState(''); const [note, setNote] = useState(''); const [service, setService] = useState<string | null>(null); return <Screen title="Add Walk-In" back><Text accessibilityRole="header" style={type.title}>A customer has arrived.</Text><Field label="Customer name (optional)" value={name} onChange={setName} maxLength={80}/><Field label="Mobile (optional)" value={mobile} onChange={setMobile} maxLength={32}/><View style={s.row}><Chip label="Choose service later" selected={!service} onPress={() => setService(null)}/>{data?.services.map(v => <Chip key={v.id} label={v.name} selected={service === v.id} onPress={() => setService(v.id)}/>)}</View><Field label="Note (optional)" value={note} onChange={setNote} maxLength={2000} multiline/>{error && <Text accessibilityRole="alert" style={type.body}>{error}</Text>}<Button label={busy ? 'Adding…' : 'Add arrived customer'} disabled={busy} onPress={() => { void run('walk_in', { request_key: key, customer_name: name, mobile, note, service_id: service }, () => router.dismissTo('/queue')); }}/></Screen>; }
