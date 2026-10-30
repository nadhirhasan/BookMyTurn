import { Image, Text, View } from 'react-native';
import { useBarber } from '@/providers/BarberProvider';
import { Button, Note, s, useAction } from './UI';
import { type } from '@/theme';
export function Preferences({ id }: {
  id: string;
}) { const { data } = useBarber(); const { run, error, busy } = useAction(); const requests = data?.styles.filter(r => r.queue_entry_id === id || r.appointment_id === id) ?? []; return <>{requests.map(r => <View key={r.id} style={s.card}><Text style={type.label}>Customer style preferences</Text><View style={s.row}>{r.images.map(i => <View key={i.id} style={{ width: 100, gap: 5 }}><Image source={{ uri: i.image_url }} style={{ width: 100, height: 110, borderRadius: 10 }}/><Text style={type.caption}>{i.title}</Text></View>)}</View>{r.note && <Text style={type.body}>{r.note}</Text>}{r.viewed_at ? <Text style={type.caption}>Viewed</Text> : <Button label="Mark preferences viewed" secondary disabled={busy} onPress={() => { void run('styles_viewed', { id: r.id }); }}/>}{error && <Note>{error}</Note>}</View>)}</>; }
