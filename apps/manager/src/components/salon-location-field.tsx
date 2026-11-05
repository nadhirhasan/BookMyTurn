import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LocateFixed, MapPin, X } from 'lucide-react-native';
import * as Location from 'expo-location';
import { Button } from './UI';
import { SalonMap } from './salon-map';
import type { SalonPoint } from './salon-map.types';
import { colors, type } from '@/theme';

export function SalonLocationField({ value, onChange, error, disabled = false, address }: { value: SalonPoint | null; onChange: (p: SalonPoint) => void; error?: string; disabled?: boolean; address: string }) {
  const [open, setOpen] = useState(false);
  return <View style={{ gap: 10 }}>
    <Text style={type.label}>Salon location</Text>
    <Pressable accessibilityRole="button" accessibilityLabel={value ? 'Change salon location' : 'Choose salon location'} aria-invalid={!!error} disabled={disabled} onPress={() => setOpen(true)} style={[s.field, error && { borderColor: colors.error }, disabled && { opacity: 0.5 }]}>
      <MapPin color={colors.action} size={22} /><View style={{ flex: 1, gap: 4 }}><Text style={type.label}>{value ? 'Location pinned · Tap to change' : 'Choose on map'}</Text><Text style={type.caption}>{value ? `${value.latitude.toFixed(6)}, ${value.longitude.toFixed(6)}` : 'Mark the salon entrance so customers can find you.'}</Text></View>
    </Pressable>
    {error && <Text accessibilityRole="alert" style={[type.caption, { color: colors.error }]}>{error}</Text>}
    {open && <PinPicker value={value} address={address} onClose={() => setOpen(false)} onSave={point => { onChange(point); setOpen(false); }} />}
  </View>;
}
function PinPicker({ value, address, onClose, onSave }: { value: SalonPoint | null; address: string; onClose: () => void; onSave: (p: SalonPoint) => void }) {
  const [draft, setDraft] = useState(value), [current, setCurrent] = useState<SalonPoint | null>(null);
  const [focus, setFocus] = useState<{ point: SalonPoint; revision: number } | null>(null);
  const [locating, setLocating] = useState(false), [message, setMessage] = useState<string | null>(null);
  const generation = useRef(0);
  useEffect(() => () => { generation.current++; }, []);
  const choose = (point: SalonPoint) => { generation.current++; setLocating(false); setMessage(null); setDraft(point); };
  const locate = async () => {
    const version = ++generation.current; setLocating(true); setMessage(null); let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (version !== generation.current) return;
      if (!permission.granted) { setMessage('Location permission is off. You can still move the map and tap the salon entrance.'); return; }
      const result = await Promise.race([Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }), new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('timeout')), 15000); })]);
      if (version !== generation.current) return;
      const point = { latitude: result.coords.latitude, longitude: result.coords.longitude };
      setCurrent(point); setDraft(point); setFocus({ point, revision: version });
      setMessage(`Your location${result.coords.accuracy ? ` · approximately ${Math.round(result.coords.accuracy)} m accuracy` : ''}. Adjust the pin to the salon entrance, then confirm.`);
    } catch { if (version === generation.current) setMessage('Could not get your location. Check location services or tap the salon entrance on the map.'); }
    finally { if (timer) clearTimeout(timer); if (version === generation.current) setLocating(false); }
  };
  return <Modal visible animationType="slide" onRequestClose={onClose} presentationStyle="fullScreen"><SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
    <View style={s.header}><View style={{ flex: 1, gap: 4 }}><Text accessibilityRole="header" style={type.section}>Pin your salon</Text><Text numberOfLines={2} style={type.caption}>{address || 'Tap the map at the salon entrance'}</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Close location picker" onPress={onClose} style={s.close}><X color={colors.text} size={24} /></Pressable></View>
    <View style={{ flex: 1, minHeight: 180 }}><SalonMap value={draft} current={current} focus={focus} onChange={choose} /></View>
    <View style={s.footer}>
      <Text style={type.caption}>Tap the salon entrance to place a pin. Drag the pin to adjust it.</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Use my location" disabled={locating} onPress={() => { void locate(); }} style={[s.locate, locating && { opacity: 0.5 }]}><LocateFixed color={colors.action} size={21} /><Text style={[type.label, { color: colors.action }]}>{locating ? 'Finding your location…' : 'Use my location'}</Text></Pressable>
      {message && <Text accessibilityLiveRegion="polite" style={type.caption}>{message}</Text>}
      <Text testID="draft-salon-location" style={type.caption}>{draft ? `Selected: ${draft.latitude.toFixed(6)}, ${draft.longitude.toFixed(6)}` : 'No location selected yet'}</Text>
      <Button label="Use this pin" disabled={!draft || locating} onPress={() => { if (draft) onSave(draft); }} />
    </View>
  </SafeAreaView></Modal>;
}
const s = StyleSheet.create({
  field: { minHeight: 76, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 14, flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: colors.card },
  header: { paddingHorizontal: 20, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  close: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  footer: { padding: 18, gap: 10, borderTopWidth: 1, borderColor: colors.divider },
  locate: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 12 },
});
