import { router, useFocusEffect, usePathname } from 'expo-router';
import { useCallback, useState, type ReactNode } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Store } from 'lucide-react-native';
import { colors, fonts, shadows, type } from '@/theme';
import { PressableMotion } from '../../../customer/src/components/PressableMotion';
import { RefreshAction } from '../../../customer/src/components/RefreshAction';
import { LoadingState } from '../../../customer/src/components/LoadingState';
import { RouteMotion } from '../../../customer/src/components/RouteMotion';
import {ActivityBell} from '@/components/StaffAlerts';
import { useManager } from '@/providers/ManagerProvider';
import { useSession } from '@/providers/SessionProvider';
import { useBarber } from '@/providers/BarberProvider';
import type { Json } from '@/lib/types';
export function Button({ label, onPress, secondary = false, disabled = false, accessibilityLabel, loading = false }: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  loading?: boolean;
}) { return <PressableMotion accessibilityRole="button" accessibilityLabel={accessibilityLabel??label} accessibilityState={{ busy:loading }} disabled={disabled||loading} onPress={onPress} style={[s.button, secondary && s.secondary]}><View style={{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8}}>{loading&&<ActivityIndicator accessible={false} importantForAccessibility="no" aria-hidden size="small" color={secondary?colors.action:colors.onAction}/>}<Text style={[type.label, { flexShrink:1,color: secondary ? colors.text : colors.onAction, textAlign: 'center' }]}>{label}</Text></View></PressableMotion>; }
export function Chip({ label, selected, onPress, accessibilityLabel, disabled = false }: {
  label: string;
  selected: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  onPress: () => void;
}) { return <PressableMotion accessibilityRole="button" accessibilityLabel={accessibilityLabel??label} accessibilityState={{ selected }} disabled={disabled} onPress={onPress} style={[s.chip, selected && { backgroundColor: colors.action, borderColor: colors.action }]}><Text style={[type.label, selected && { color: colors.background }]}>{label}</Text></PressableMotion>; }
export function Field({ label, value, onChange, multiline = false, numeric = false, maxLength = 100, error, compact = false }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  numeric?: boolean;
  maxLength?: number;
  compact?: boolean;
  error?: string;
}) { return <View style={{ gap: 8 }}>{!compact&&<Text style={type.label}>{label}</Text>}<TextInput placeholder={compact?label:undefined} placeholderTextColor={colors.muted} aria-invalid={!!error} accessibilityLabel={label} value={value} onChangeText={onChange} multiline={multiline} keyboardType={numeric ? 'decimal-pad' : 'default'} maxLength={maxLength} style={[s.input,error&&{borderColor:colors.error,backgroundColor:colors.errorSurface}, multiline && { minHeight: 100, textAlignVertical: 'top' }]}/>{error&&<Text accessibilityRole="alert" style={{...type.caption,color:colors.error}}>{error}</Text>}</View>; }
export function Note({ children }: {
  children: ReactNode;
}) { return <View style={s.note}><Text style={type.caption}>{children}</Text></View>; }
export function Screen({ title, children, back = false, footer }: {
  title: string;
  children: ReactNode;
  back?: boolean;
  footer?: ReactNode;
}) { const session=useSession(); const { refresh, error, loading, stale, data } = useBarber(); const manager = useManager(); const pathname=usePathname(); const tab=['/queue','/appointments','/profile','/performance'].includes(pathname); return <SafeAreaView edges={tab?['top']:['top','bottom']} style={{ flex: 1, overflow:'hidden', backgroundColor: colors.background }}><View style={s.header}>{back && <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.canGoBack() ? router.back() : router.replace('/queue')} style={s.icon}><ChevronLeft size={22} color={colors.text}/></Pressable>}<Text style={[type.section, { flex: 1, minWidth: 0 }]}>{title}</Text>{!!manager.data?.salons.length && <Pressable accessibilityRole="button" accessibilityLabel="My salons" onPress={() => router.dismissTo('/manage')} style={s.icon}><Store size={22} color={colors.action}/></Pressable>}{manager.data&&<ActivityBell/>}{session.status==='authenticated'&&<RefreshAction label="Refresh work" onRefresh={refresh}/>}</View><RouteMotion><KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}><ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={s.content}>{data && stale && <Text accessibilityRole="alert" style={type.caption}>Data may be out of date. Refresh before making changes.</Text>}{error && <Note>{error}</Note>}{loading && data && <LoadingState compact label="Refreshing your chair…"/>}{children}</ScrollView>{footer&&<View style={s.footer}>{footer}</View>}</KeyboardAvoidingView></RouteMotion></SafeAreaView>; }
export function useRefresh() { const { refresh } = useBarber(); useFocusEffect(useCallback(() => { void refresh(); }, [refresh])); }
export function useAction() {
  const { mutate, busy, stale } = useBarber();
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
  return { run, busy:busy||stale, error, message,clearError:()=>setError(null) };
}
export const s = StyleSheet.create({ header: { minHeight: 64, paddingHorizontal: 20, paddingVertical: 8, flexDirection: 'row', gap: 8, alignItems: 'center' }, icon: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }, content: { padding: 20, gap: 20, paddingBottom: 40 }, footer: {padding:16,gap:8,borderTopWidth:1,borderColor:colors.divider,backgroundColor:colors.card}, button: { minHeight: 52, borderRadius: 22, padding: 16, backgroundColor: colors.action, alignItems: 'center', justifyContent: 'center' }, secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.divider }, chip: { minHeight: 44, paddingVertical: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 22, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' }, input: { minHeight: 54, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, fontFamily: fonts.regular, fontSize: 16, color: colors.text }, card: { boxShadow:shadows.card,padding: 16, borderWidth: 1, borderColor: colors.divider, borderRadius: 20, gap: 16, backgroundColor: colors.card }, note: { backgroundColor: colors.pendingSoft, padding: 16, borderRadius: 16 }, row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 } });
