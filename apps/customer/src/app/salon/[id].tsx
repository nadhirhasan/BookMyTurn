import { router, useLocalSearchParams } from 'expo-router';
import { Star, Store, UserRound } from 'lucide-react-native';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Action, FeatureNotice, Notice, Screen } from '@/components/UI';
import { money, salons, waitLabel } from '@/data/salons';
import { colors, fonts, type } from '@/theme';

export function generateStaticParams() {
  return salons.map(salon => ({ id: salon.id }));
}

export default function SalonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const salon = salons.find(item => item.id === id);
  const [window, setWindow] = useState<string | null>(null);
  const [feature, setFeature] = useState<string | null>(null);
  if (!salon) return <Screen title="Salon not found"><Text style={type.title}>We could not find this salon.</Text><Action label="Browse salons" onPress={() => router.replace('/salons')} /></Screen>;
  const windows = salon.open ? [salon.earliest, ...(salon.id === 'royal-saloon' ? ['2:30 pm', '3:30 pm'] : ['4:00 pm', '5:00 pm'])] : [];
  const selected = windows.includes(window ?? '') ? window : windows[0];
  return <Screen title={salon.name} footer={<>
    <Action label={salon.open ? 'Join Queue' : 'Salon closed'} disabled={!salon.open} onPress={() => setFeature('Queue joining')} />
    <Action label="Request Appointment" secondary onPress={() => setFeature('Appointment requests')} />
  </>}>
    <Image source={salon.photo} accessibilityLabel="Illustrative salon photo" style={s.photo} />
    <Text accessibilityRole="header" style={type.title}>{salon.name}</Text>
    <View style={s.row}><Star size={15} color={colors.text} /><Text style={type.caption}>{salon.rating} ({salon.reviews} reviews) · Akurana</Text></View>
    <View style={s.row}><Store size={16} color={colors.text} /><Text style={[type.caption, { color: colors.text }]}>{salon.open ? 'Open until 8:00 pm' : 'Closed · Opens tomorrow at 9:00 am'}</Text></View>
    <View style={s.metrics}><View style={s.metric}><Text style={s.number}>{salon.open ? salon.waiting : '—'}</Text><Text style={type.caption}>physically waiting</Text></View><View style={s.metric}>
      <Text style={type.section}>{waitLabel(salon)}</Text><Text style={type.caption}>{salon.open ? 'estimated wait' : 'No availability today'}</Text>
      <Text style={[type.caption, { color: colors.text }]}>{!salon.open ? 'Check another salon' : salon.available ? `${salon.available} barber available` : 'All barbers in service'}</Text>
    </View></View>
    <Text style={type.caption}>Demo data · Last updated 2:00 pm</Text>
    <Text accessibilityRole="header" style={type.section}>When could you visit?</Text>
    <Text style={type.caption}>{salon.open ? 'Estimated windows today · Haircut, 30 min' : 'No estimated windows while closed'}</Text>
    {salon.open && <View accessibilityRole="radiogroup" accessibilityLabel="Estimated visit windows" style={s.windows}>{windows.map(time => <Pressable key={time} accessibilityRole="radio" accessibilityLabel={`Visit window ${time}`} aria-checked={selected === time} accessibilityState={{ checked: selected === time }} onPress={() => setWindow(time)} style={[s.window, selected === time && s.selected]}><Text style={[type.label, selected === time && { color: colors.background }]}>{time}</Text></Pressable>)}</View>}
    <Notice>Visit windows can change as customers arrive. A requested appointment needs salon confirmation.</Notice>
    <Text accessibilityRole="header" style={type.section}>Services</Text>
    <View style={s.service}><Text style={type.label}>Haircut · 30 min</Text><Text style={type.label}>{money(salon.price)}–{(salon.price + 200).toLocaleString('en-LK')}</Text></View>
    <Text style={type.caption}>Final price agreed before your service starts.</Text>
    <Text accessibilityRole="header" style={type.section}>Your barbers</Text>
    {salon.barberNames.map((name, index) => <View key={name} style={s.barber}><View style={s.avatar}><UserRound size={22} color={colors.muted} /></View><View style={{ flex: 1, gap: 3 }}><Text style={type.label}>{name}</Text><Text style={type.caption}>{!salon.open ? 'Off duty' : index === 0 && salon.available ? 'Available · Haircuts & beard styling' : `In service · Estimated free at ${salon.id === 'royal-saloon' ? '2:30 pm' : salon.earliest}`}</Text></View></View>)}
    <Notice>Fictional demo data and illustrative photos. Selecting a window does not reserve a time or a physical queue position.</Notice>
    <FeatureNotice feature={feature} onClose={() => setFeature(null)} />
  </Screen>;
}
const s = StyleSheet.create({
  photo: { width: '100%', height: 180, borderRadius: 12 }, row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metrics: { backgroundColor: colors.surface, padding: 16, borderRadius: 12, flexDirection: 'row', gap: 16 },
  metric: { flex: 1, gap: 5, justifyContent: 'center' }, number: { fontFamily: fonts.bold, fontSize: 36, lineHeight: 42, color: colors.text },
  windows: { flexDirection: 'row', gap: 12 }, window: { flex: 1, minHeight: 48, borderWidth: 1, borderColor: colors.border, borderRadius: 12, alignItems: 'center', justifyContent: 'center', padding: 8 },
  selected: { backgroundColor: colors.action }, service: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' },
  barber: { flexDirection: 'row', gap: 12, alignItems: 'center' }, avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
});
