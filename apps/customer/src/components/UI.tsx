import { router } from 'expo-router';
import { ArrowLeft, ChevronRight, Info, Scissors, Search, UserRound, X } from 'lucide-react-native';
import { type ReactNode, type Ref } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, type } from '@/theme';

export function Action({ label, onPress, secondary = false, disabled = false }: {
  label: string; onPress: () => void; secondary?: boolean; disabled?: boolean;
}) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [s.action, secondary && s.secondary, { opacity: disabled ? 0.45 : pressed ? 0.75 : 1 }]}>
    <Text style={[type.label, { color: secondary ? colors.action : colors.onAction, textAlign: 'center' }]}>{label}</Text>
  </Pressable>;
}
export function Notice({ children }: { children: ReactNode }) {
  return <View style={s.note}><Info size={18} color={colors.amber}/><Text style={[type.caption, { flex: 1, color: colors.amber }]}>{children}</Text></View>;
}
export function Header({ title, home = false, tab = false }: { title: string; home?: boolean; tab?: boolean }) {
  return <View style={s.header}>
    {home ? <View style={s.brand}><Scissors size={21} color={colors.onAction}/></View> : !tab && <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={s.iconButton}><ArrowLeft size={23} color={colors.text}/></Pressable>}
    <Text style={[type.section, { flex: 1 }]}>{title}</Text>
    {home && <Pressable accessibilityRole="button" accessibilityLabel="Account" onPress={() => router.push('/account')} style={[s.iconButton, { backgroundColor: colors.surface }]}><UserRound size={22} color={colors.text}/></Pressable>}
  </View>;
}
export function Screen({ title, home, children, footer, scrollRef, tab = false }: {
  title: string; home?: boolean; children: ReactNode; footer?: ReactNode; scrollRef?: Ref<ScrollView>; tab?: boolean;
}) {
  return <SafeAreaView edges={tab ? ['top'] : ['top', 'bottom']} style={s.screen}>
    <Header title={title} home={home} tab={tab}/>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView ref={scrollRef} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={s.content}>{children}</ScrollView>
      {footer && <View style={s.footer}>{footer}</View>}
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
export function SearchField({ value, onChange, onSubmit }: { value: string; onChange: (value: string) => void; onSubmit?: () => void }) {
  return <View style={s.search}><Search size={21} color={colors.action}/>
    <TextInput accessibilityLabel="Search salons or barbers" placeholder="Find a salon or barber" placeholderTextColor={colors.muted} value={value} onChangeText={onChange} onSubmitEditing={onSubmit} returnKeyType="search" autoCorrect={false} style={s.input}/>
    {!!value && <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => onChange('')} style={s.iconButton}><X size={18} color={colors.text}/></Pressable>}
  </View>;
}
export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={({ pressed }) => [s.chip, selected && s.chipActive, pressed && { opacity: 0.7 }]}><Text style={[type.label, { color: selected ? colors.onAction : colors.muted }]}>{label}</Text></Pressable>;
}
export function SectionHeading({ title, action, onPress }: { title: string; action?: string; onPress?: () => void }) {
  return <View style={s.heading}><Text accessibilityRole="header" style={[type.section, { flex: 1 }]}>{title}</Text>{action && onPress && <Pressable accessibilityRole="button" onPress={onPress} style={s.textAction}><Text style={[type.label, { color: colors.action }]}>{action}</Text><ChevronRight size={16} color={colors.action}/></Pressable>}</View>;
}
export function StatusPill({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'success' | 'warning' }) {
  const color = tone === 'success' ? colors.green : tone === 'warning' ? colors.amber : colors.muted;
  return <View style={[s.pill, { backgroundColor: tone === 'success' ? colors.mint : tone === 'warning' ? colors.butter : colors.surface }]}><View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }}/><Text style={[type.caption, { color, fontFamily: fonts.semibold, flexShrink: 1 }]}>{label}</Text></View>;
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background }, header: { minHeight: 64, paddingHorizontal: 20, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 10 },
  brand: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.action, alignItems: 'center', justifyContent: 'center' },
  iconButton: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28, gap: 20 },
  footer: { paddingHorizontal: 20, paddingVertical: 12, gap: 8, borderTopWidth: 1, borderTopColor: colors.divider, backgroundColor: colors.card },
  action: { minHeight: 54, paddingHorizontal: 18, paddingVertical: 15, backgroundColor: colors.action, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.divider },
  note: { flexDirection: 'row', gap: 10, padding: 14, backgroundColor: colors.butter, borderRadius: 14 },
  search: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 18, paddingLeft: 16, paddingRight: 6 },
  input: { fontFamily: fonts.regular, fontSize: 16, color: colors.text, flex: 1, minWidth: 0, minHeight: 54 },
  chip: { minHeight: 48, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, justifyContent: 'center', alignItems: 'center' },
  chipActive: { backgroundColor: colors.action, borderColor: colors.action },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 12 }, textAction: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 2 },
  pill: { alignSelf: 'flex-start', borderRadius: 30, paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 6 },
});
