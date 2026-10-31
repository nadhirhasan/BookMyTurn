import { router } from 'expo-router';
import { ChevronLeft, CornerUpRight, Info, Search, UserRound, X } from 'lucide-react-native';
import { type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, type } from '@/theme';
export function Action({ label, onPress, secondary = false, disabled = false }: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
}) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [s.action, secondary && s.secondary, { opacity: disabled ? 0.4 : pressed ? 0.7 : 1 }]}>
  <Text style={[type.label, !secondary && { color: colors.background }]}>{label}</Text>
 </Pressable>;
}
export function Notice({ children }: {
  children: ReactNode;
}) {
  return <View style={s.note}><Info size={17} color={colors.muted}/><Text style={[type.caption, { flex: 1 }]}>{children}</Text></View>;
}
export function Header({ title, home = false }: {
  title: string;
  home?: boolean;
}) {
  return <View style={s.header}>
  {home ? <CornerUpRight size={25} color={colors.text}/> : <Pressable accessibilityRole="button" accessibilityLabel="Go back" hitSlop={8} onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={s.back}><ChevronLeft size={22} color={colors.text}/></Pressable>}
  <Text numberOfLines={1} style={[type.section, { flex: 1 }]}>{title}</Text>
  {home && <Pressable accessibilityRole="button" accessibilityLabel="Account" onPress={() => router.push('/account')} style={s.iconButton}><UserRound size={24} color={colors.text}/></Pressable>}
 </View>;
}
export function Screen({ title, home, children, footer }: {
  title: string;
  home?: boolean;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return <SafeAreaView edges={footer ? ['top', 'bottom'] : ['top']} style={s.screen}>
  <Header title={title} home={home}/>
  <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>{children}</ScrollView>
  {footer && <View style={s.footer}>{footer}</View>}
 </SafeAreaView>;
}
export function SearchField({ value, onChange, onSubmit }: {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
}) {
  return <View style={s.search}>
  <TextInput accessibilityLabel="Search salons or barbers" placeholder="Search salons or barbers" placeholderTextColor={colors.muted} value={value} onChangeText={onChange} onSubmitEditing={onSubmit} returnKeyType="search" autoCorrect={false} style={s.input}/>
  {value ? <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => onChange('')} style={s.iconButton}><X size={18} color={colors.text}/></Pressable> : <Search size={18} color={colors.text}/>}
 </View>;
}
export function Chip({ label, selected, onPress }: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return <Pressable accessibilityRole="button" aria-selected={selected} accessibilityState={{ selected }} onPress={onPress} style={[s.chip, selected && s.chipActive]}><Text style={[type.caption, { color: selected ? colors.background : colors.text }]}>{label}</Text></Pressable>;
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background }, header: { height: 56, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 10 },
  back: { minHeight: 44, width: 28, justifyContent: 'center', marginLeft: -8 }, iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  badge: { borderRadius: 8, backgroundColor: colors.surface, padding: 8 }, demo: { fontFamily: fonts.regular, fontSize: 10, color: colors.muted },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24, gap: 16 },
  footer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, borderTopWidth: 1, borderTopColor: colors.divider },
  action: { minHeight: 52, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: colors.action, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, secondary: { backgroundColor: colors.background },
  note: { flexDirection: 'row', gap: 8, padding: 12, backgroundColor: colors.surface, borderRadius: 12 },
  search: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 16 },
  input: { fontFamily: fonts.regular, fontSize: 14, color: colors.text, flex: 1, minWidth: 0, height: 52 },
  chip: { minHeight: 44, paddingHorizontal: 18, borderRadius: 24, borderWidth: 1, borderColor: colors.divider, justifyContent: 'center', alignItems: 'center' }, chipActive: { backgroundColor: colors.action, borderColor: colors.action },
  scrim: { flex: 1, backgroundColor: '#00000066', justifyContent: 'center', alignItems: 'center', padding: 24 }, modal: { width: '100%', maxWidth: 400, backgroundColor: colors.background, padding: 24, borderRadius: 16, gap: 16 },
});
