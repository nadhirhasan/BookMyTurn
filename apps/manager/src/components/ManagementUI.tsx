import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState, type ReactNode } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronRight, ImagePlus, RefreshCw, Scissors, Store, UserRound } from 'lucide-react-native';
import type { ImagePickerAsset } from 'expo-image-picker';
import { colors, fonts, type } from '@/theme';
import { useManager } from '@/providers/ManagerProvider';
import { pickPhoto } from '@/lib/photos';
export function ManagementScreen({ title, children, back = false }: {
  title: string;
  children: ReactNode;
  back?: boolean;
}) {
  const { refresh, error, loading } = useManager();
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));
  return <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.background }}><View style={m.header}>{back && <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.canGoBack() ? router.back() : router.replace('/manage')} style={m.icon}><ArrowLeft size={22} color={colors.text}/></Pressable>}<Text style={[type.section, { flex: 1 }]}>{title}</Text><Pressable accessibilityRole="button" accessibilityLabel="Refresh salons" onPress={() => { void refresh(); }} style={m.icon}><RefreshCw size={20} color={colors.text}/></Pressable>{!back && <Pressable accessibilityRole="button" accessibilityLabel="My account" onPress={() => router.push('/manage/account')} style={m.avatarSmall}><UserRound color={colors.text} size={21}/></Pressable>}</View><ScrollView keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets contentContainerStyle={m.content}>{error && <Text accessibilityRole="alert" style={type.body}>{error}</Text>}{loading && <ActivityIndicator color={colors.text}/>}{children}</ScrollView></SafeAreaView>;
}
export function Section({ title, subtitle, children }: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) { return <View style={{ gap: 14, marginTop: 8 }}><View style={{ gap: 4 }}><Text style={type.section}>{title}</Text>{subtitle && <Text style={type.caption}>{subtitle}</Text>}</View><View style={m.formGroup}>{children}</View></View>; }
export function Portrait({ uri, name, size = 60 }: {
  uri?: string | null;
  name: string;
  size?: number;
}) { return uri ? <Image accessibilityLabel={`${name} photo`} source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }}/> : <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}><Text style={[type.section, { fontSize: size / 3 }]}>{name.trim().slice(0, 2).toUpperCase() || 'ME'}</Text></View>; }
export function Cover({ uri, name }: {
  uri?: string | null;
  name: string;
}) { return uri ? <Image accessibilityLabel={`${name} cover photo`} source={{ uri }} style={m.cover}/> : <View style={[m.cover, { backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', gap: 8 }]}><Store color={colors.muted} size={32}/><Text style={type.caption}>Your salon, your space</Text></View>; }
export function PhotoPicker({ asset, url, onChange, cover = false, name = 'Profile' }: {
  asset: ImagePickerAsset | null;
  url?: string | null;
  onChange: (a: ImagePickerAsset | null) => void;
  cover?: boolean;
  name?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  return <View style={{ gap: 12 }}>{cover ? <Cover uri={asset?.uri ?? url} name={name}/> : <View style={{ alignSelf: 'center', padding: 8 }}><Portrait uri={asset?.uri ?? url} name={name} size={96}/></View>}<Pressable accessibilityRole="button" accessibilityLabel={cover ? 'Choose salon cover' : 'Choose profile photo'} onPress={() => { setError(null); void pickPhoto(cover).then(a => { if (a)
    onChange(a); }, e => setError(e instanceof Error ? e.message : 'Could not select photo.')); }} style={m.photoButton}><ImagePlus color={colors.text} size={19}/><Text style={type.label}>{asset ? 'Change selected photo' : cover ? 'Add a salon photo' : 'Choose profile photo'}</Text></Pressable>{asset && <Pressable accessibilityRole="button" onPress={() => onChange(null)} style={{ minHeight: 40, justifyContent: 'center', alignItems: 'center' }}><Text style={type.caption}>Discard selected photo</Text></Pressable>}{error && <Text accessibilityRole="alert" style={type.body}>{error}</Text>}<Text style={[type.caption, { textAlign: 'center' }]}>JPEG, PNG or WebP · Up to 2 MB · Uploads when you save</Text></View>;
}
export function EmptyTeam() { return <View style={m.empty}><Scissors size={30} color={colors.muted}/><Text style={type.section}>A chair for your first barber.</Text><Text style={[type.body, { textAlign: 'center' }]}>Add your team so customers can choose a barber and book a time.</Text></View>; }
export function MenuRow({ label, detail, onPress }: {
  label: string;
  detail?: string;
  onPress: () => void;
}) { return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={m.menu}><View style={{ flex: 1, gap: 3 }}><Text style={type.label}>{label}</Text>{detail && <Text style={type.caption}>{detail}</Text>}</View><ChevronRight color={colors.muted} size={20}/></Pressable>; }
export const m = StyleSheet.create({ header: { minHeight: 70, paddingHorizontal: 20, gap: 10, flexDirection: 'row', alignItems: 'center' }, content: { padding: 20, paddingBottom: 44, gap: 22 }, icon: { height: 44, width: 44, alignItems: 'center', justifyContent: 'center' }, avatarSmall: { height: 42, width: 42, borderRadius: 21, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }, cover: { width: '100%', height: 170, borderRadius: 18 }, salonCard: { borderWidth: 1, borderColor: colors.divider, borderRadius: 22, overflow: 'hidden', backgroundColor: colors.background }, cardBody: { padding: 18, gap: 12 }, formGroup: { padding: 18, borderWidth: 1, borderColor: colors.divider, borderRadius: 18, gap: 18 }, photoButton: { minHeight: 48, borderWidth: 1, borderColor: colors.border, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }, empty: { padding: 26, backgroundColor: colors.surface, borderRadius: 20, alignItems: 'center', gap: 12 }, menu: { minHeight: 64, padding: 16, borderRadius: 16, backgroundColor: colors.surface, flexDirection: 'row', gap: 10, alignItems: 'center' }, badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: colors.surface }, buttonText: { fontFamily: fonts.semibold, color: colors.text, fontSize: 14 } });
