import { router, useFocusEffect, usePathname } from 'expo-router';
import { useCallback, useState, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';
import { Action, Notice } from './UI';
import { useCustomer } from '@/providers/CustomerProvider';
import { useSession } from '@/providers/SessionProvider';
import { colors, fonts, type } from '@/theme';
export function useRefreshOnFocus() {
  const { refresh } = useCustomer();
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));
}
export function DataStatus() {
  const { catalog, loading, error, stale, refresh } = useCustomer();
  if (loading && !catalog)
    return <ActivityIndicator color={colors.text} accessibilityLabel="Loading salons"/>;
  if (error)
    return <><Notice>{error}</Notice><Action label="Retry connection" secondary onPress={() => { void refresh(); }}/></>;
  return stale ? <Notice>Availability may be out of date. Refresh before choosing your visit.</Notice> : null;
}
export function PrivateGate({ children }: {
  children: ReactNode;
}) {
  const session = useSession();
  const returnTo = usePathname();
  const { visitError, refresh } = useCustomer();
  if (session.status === 'loading')
    return <ActivityIndicator color={colors.text}/>;
  if (session.status !== 'authenticated')
    return <><Text style={type.section}>Keep your visits together</Text><Text style={type.body}>Sign in to manage remote queue entries and appointments. At the salon, use its QR code to join without an account.</Text><Action label="Sign in" onPress={() => router.push({ pathname: '/sign-in', params: { returnTo } })}/><Action label="Create an account" secondary onPress={() => router.push({ pathname: '/sign-up', params: { returnTo } })}/></>;
  return <>{visitError && <><Notice>{visitError}</Notice><Action label="Refresh visits" secondary onPress={() => { void refresh(); }}/></>}{children}</>;
}
export function Field({ label, value, onChange, maxLength = 80, multiline = false }: {
  label: string;
  value: string;
  onChange: (text: string) => void;
  maxLength?: number;
  multiline?: boolean;
}) {
  return <View style={{ gap: 8 }}><Text style={type.label}>{label}</Text><TextInput accessibilityLabel={label} value={value} onChangeText={onChange} maxLength={maxLength} multiline={multiline} style={[styles.input, multiline && { minHeight: 100, textAlignVertical: 'top' }]}/></View>;
}
export function useVisitAction() {
  const { mutate, busy } = useCustomer();
  const [error, setError] = useState<string | null>(null);
  const run = async (action: string, data: Record<string, string | string[] | number | boolean | null>, onSuccess?: (id: string) => void) => {
    setError(null);
    try {
      const result = await mutate(action, data);
      onSuccess?.(result.id);
      return true;
    }
    catch (e) {
      setError(e instanceof Error ? e.message : 'Please try again.');
      return false;
    }
  };
  return { run, error, busy, clearError: () => setError(null) };
}
export const styles = StyleSheet.create({
  card: { padding: 16, borderWidth: 1, borderColor: colors.divider, borderRadius: 14, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  photo: { width: '100%', height: 190, borderRadius: 14, backgroundColor: colors.surface },
  input: { fontFamily: fonts.regular, fontSize: 15, color: colors.text, minHeight: 50, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14 },
  divider: { height: 1, backgroundColor: colors.divider },
});
