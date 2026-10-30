import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, RefreshCw } from 'lucide-react-native';
import { colors, fonts, type } from '@/theme';
import {ActivityBell} from '@/components/StaffAlerts';
import { useManager } from '@/providers/ManagerProvider';
import { useBarber } from '@/providers/BarberProvider';
import type { Json } from '@/lib/types';
export function Button({ label, onPress, secondary = false, disabled = false, accessibilityLabel }: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
}) { return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [s.button, secondary && s.secondary, { opacity: disabled ? .4 : pressed ? .7 : 1 }]}><Text style={[type.label, !secondary && { color: colors.background }]}>{label}</Text></Pressable>; }
export function Chip({ label, selected, onPress, accessibilityLabel }: {
  label: string;
  selected: boolean;
  accessibilityLabel?: string;
  onPress: () => void;
}) { return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} accessibilityState={{ selected }} onPress={onPress} style={[s.chip, selected && { backgroundColor: colors.action }]}><Text style={[type.label, selected && { color: colors.background }]}>{label}</Text></Pressable>; }
export function Field({ label, value, onChange, multiline = false, numeric = false, maxLength = 100 }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  numeric?: boolean;
  maxLength?: number;
}) { return <View style={{ gap: 8 }}><Text style={type.label}>{label}</Text><TextInput accessibilityLabel={label} value={value} onChangeText={onChange} multiline={multiline} keyboardType={numeric ? 'decimal-pad' : 'default'} maxLength={maxLength} style={[s.input, multiline && { minHeight: 100, textAlignVertical: 'top' }]}/></View>; }
export function Note({ children }: {
  children: ReactNode;
}) { return <View style={s.note}><Text style={type.caption}>{children}</Text></View>; }
export function Screen({ title, children, back = false }: {
  title: string;
  children: ReactNode;
  back?: boolean;
}) { const { refresh, error, loading } = useBarber(); const manager = useManager(); return <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}><View style={s.header}>{back && <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.canGoBack() ? router.back() : router.replace('/queue')} style={s.icon}><ChevronLeft size={22} color={colors.text}/></Pressable>}<Text style={[type.section, { flex: 1 }]}>{title}</Text>{!!manager.data?.salons.length && <Pressable accessibilityRole="button" accessibilityLabel="My salons" onPress={() => router.dismissTo('/manage')} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={type.label}>My salons</Text></Pressable>}<ActivityBell/><Pressable accessibilityRole="button" accessibilityLabel="Refresh work" onPress={() => { void refresh(); }} style={s.icon}><RefreshCw size={19} color={colors.text}/></Pressable></View><ScrollView keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets contentContainerStyle={s.content}>{error && <Note>{error}</Note>}{loading && <ActivityIndicator color={colors.text}/>}{children}</ScrollView></SafeAreaView>; }
export function useRefresh() { const { refresh } = useBarber(); useFocusEffect(useCallback(() => { void refresh(); }, [refresh])); }
export function useAction() {
  const { mutate, busy } = useBarber();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const run = async (action: string, data: Json, onSuccess?: (id: string) => void) => {
    setError(null);
    setMessage(null);
    try {
      const result = await mutate(action, data);
      setMessage('Saved.');
      onSuccess?.(result.id);
      return true;
    }
    catch (e) {
      setError(e instanceof Error ? e.message : 'Please retry.');
      return false;
    }
  };
  return { run, busy, error, message };
}
export const s = StyleSheet.create({ header: { minHeight: 60, paddingHorizontal: 20, flexDirection: 'row', gap: 8, alignItems: 'center' }, icon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, content: { padding: 20, gap: 16, paddingBottom: 40 }, button: { minHeight: 52, borderRadius: 12, padding: 14, backgroundColor: colors.action, alignItems: 'center', justifyContent: 'center' }, secondary: { backgroundColor: colors.surface }, chip: { minHeight: 44, borderWidth: 1, borderColor: colors.border, borderRadius: 24, paddingHorizontal: 15, alignItems: 'center', justifyContent: 'center' }, input: { minHeight: 50, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, fontFamily: fonts.regular, fontSize: 15, color: colors.text }, card: { padding: 16, borderWidth: 1, borderColor: colors.divider, borderRadius: 14, gap: 12 }, note: { backgroundColor: colors.surface, padding: 14, borderRadius: 12 }, row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 } });
