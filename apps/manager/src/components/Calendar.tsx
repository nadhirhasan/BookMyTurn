import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { colors, type } from '@/theme';
export function addDays(day: string, count: number) { const d = new Date(`${day}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + count); return d.toISOString().slice(0, 10); }
export function Calendar({ today, lastDay, value, onChange }: {
  today: string;
  lastDay: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const {width}=useWindowDimensions();
  const [month, setMonth] = useState(value.slice(0, 7));
  const first = new Date(`${month}-01T12:00:00Z`);
  const count = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  const offset = first.getUTCDay();
  const previous = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() - 1, 1, 12)).toISOString().slice(0, 7);
  const next = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 1, 12)).toISOString().slice(0, 7);
  return <View style={[s.calendar,width<360&&{marginHorizontal:-16}]}><View style={s.heading}><Pressable accessibilityRole="button" accessibilityLabel="Previous month" disabled={previous < today.slice(0, 7)} onPress={() => setMonth(previous)} style={s.arrow}><ChevronLeft size={22} color={previous < today.slice(0, 7) ? colors.border : colors.text}/></Pressable><Text accessibilityRole="header" style={type.section}>{first.toLocaleDateString('en-LK', { timeZone: 'UTC', month: 'long', year: 'numeric' })}</Text><Pressable accessibilityRole="button" accessibilityLabel="Next month" disabled={next > lastDay.slice(0, 7)} onPress={() => setMonth(next)} style={s.arrow}><ChevronRight size={22} color={next > lastDay.slice(0, 7) ? colors.border : colors.text}/></Pressable></View>
 <View style={s.grid}>{['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <View key={i} style={s.cell}><Text style={type.caption}>{d}</Text></View>)}
 {Array.from({ length: offset }, (_, i) => <View key={`blank-${i}`} style={s.cell}/>)}
 {Array.from({ length: count }, (_, i) => { const date = `${month}-${String(i + 1).padStart(2, '0')}`; const disabled = date < today || date > lastDay; return <Pressable key={date} accessibilityRole="button" accessibilityLabel={`Choose date ${date}`} aria-selected={value === date} accessibilityState={{ selected: value === date, disabled }} disabled={disabled} onPress={() => onChange(date)} style={[s.cell, s.day, value === date && s.selected, disabled && { opacity: 0.25 }]}><Text style={[type.label, value === date && { color: colors.background }]}>{i + 1}</Text></Pressable>; })}</View>
</View>;
}
const s = StyleSheet.create({ calendar: { borderWidth: 1, borderColor: colors.divider, borderRadius: 20, padding: 4, gap: 8, backgroundColor: colors.card }, heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, arrow: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, grid: { flexDirection: 'row', flexWrap: 'wrap' }, cell: { width: '14.2857%', minHeight: 48, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' }, day: { borderRadius: 10 }, selected: { backgroundColor: colors.action } });
