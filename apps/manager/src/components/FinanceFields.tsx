import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { CalendarDays, ChevronDown } from 'lucide-react-native';
import { Calendar } from '@customer/components/Calendar';
import { colors, type } from '@/theme';
import { s } from './UI';

export function ChoiceField({ label, value, options, onChange, error, disabled = false }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (value: string) => void; error?: string; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  return <View style={{ gap: 8 }}><Text style={type.label}>{label}</Text><Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ expanded: open, disabled }} aria-invalid={!!error} disabled={disabled} onPress={() => setOpen(!open)} style={[s.input, { flexDirection: 'row', alignItems: 'center', gap: 8 }, error && { borderColor: '#B42318' }]}><Text style={[type.body, { flex: 1 }]}>{options.find(o => o.value === value)?.label ?? 'Choose'}</Text><ChevronDown size={18} color={colors.muted} /></Pressable>{open && <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, overflow: 'hidden' }}>{options.map(option => <Pressable accessibilityRole="button" accessibilityLabel={`Choose ${label}: ${option.label}`} accessibilityState={{ selected: value === option.value }} key={option.value} onPress={() => { onChange(option.value); setOpen(false); }} style={{ padding: 14, minHeight: 48, backgroundColor: value === option.value ? colors.positiveSoft : colors.background }}><Text style={type.body}>{option.label}</Text></Pressable>)}</View>}{error && <Text accessibilityRole="alert" style={[type.caption, { color: '#B42318' }]}>{error}</Text>}</View>;
}
export function DateField({ label, value, onChange, error, lastDay = '2100-12-31', disabled = false }: { label: string; value: string; onChange: (value: string) => void; error?: string; lastDay?: string; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  return <View style={{ gap: 8 }}><Text style={type.label}>{label}</Text><Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ expanded: open, disabled }} aria-invalid={!!error} disabled={disabled} onPress={() => setOpen(!open)} style={[s.input, { flexDirection: 'row', gap: 10, alignItems: 'center' }, error && { borderColor: '#B42318' }]}><CalendarDays color={colors.muted} size={18} /><Text style={type.body}>{new Date(`${value}T12:00:00Z`).toLocaleDateString('en-LK', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' })}</Text></Pressable>{open && <Calendar today="1900-01-01" lastDay={lastDay} value={value} onChange={day => { onChange(day); setOpen(false); }} />}{error && <Text accessibilityRole="alert" style={[type.caption, { color: '#B42318' }]}>{error}</Text>}</View>;
}
