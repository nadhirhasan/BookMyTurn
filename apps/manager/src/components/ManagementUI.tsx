import { router, useFocusEffect, usePathname } from 'expo-router';
import { useCallback, useState, type ReactNode, type RefObject } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, CalendarCheck2, ChevronRight, ImagePlus, Scissors, Store, UserRound, Bell, Wallet, ChartNoAxesCombined, Users } from 'lucide-react-native';
import type { ImagePickerAsset } from 'expo-image-picker';
import { colors, fonts, shadows, type } from '@/theme';
import { RefreshAction } from '../../../customer/src/components/RefreshAction';
import { LoadingState } from '../../../customer/src/components/LoadingState';
import { RouteMotion } from '../../../customer/src/components/RouteMotion';
import { useManager } from '@/providers/ManagerProvider';
import {useBarber} from '@/providers/BarberProvider';
import {ActivityBell} from './StaffAlerts';
import { pickPhoto } from '@/lib/photos';
export function ManagementScreen({title,children,back=false,navigation=false,scrollRef,showFreshness=true}:{title:string;children:ReactNode;back?:boolean;navigation?:boolean;scrollRef?:RefObject<ScrollView|null>;showFreshness?:boolean}){
 const {refresh,error,loading,stale,data}=useManager();const pathname=usePathname();const barber=useBarber();const staffOnly=!!barber.data&&!data?.salons.length;
 useFocusEffect(useCallback(()=>{void refresh();},[refresh]));
 const tabs=staffOnly?[{label:'My chair',path:'/queue' as const,Icon:Scissors},{label:'Activity',path:'/manage/activity' as const,Icon:Bell},{label:'Profile',path:'/profile' as const,Icon:UserRound}]:[{label:'Overview',path:'/manage' as const,Icon:ChartNoAxesCombined},...(data?.salons.length?[{label:'Team',path:'/manage/team' as const,Icon:Users},{label:'Finance',path:'/manage/finance' as const,Icon:Wallet}]:[]),{label:'Account',path:'/manage/account' as const,Icon:UserRound}];
 return <SafeAreaView edges={['top','bottom']} style={{flex:1,overflow:'hidden',backgroundColor:colors.background}}><View style={m.header}>{title==='BookMyTurn'&&<CalendarCheck2 size={25} color={colors.action}/ >}{back&&<Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={()=>router.canGoBack()?router.back():router.replace(staffOnly?'/queue':'/manage')} style={m.icon}><ArrowLeft size={21} color={colors.text}/></Pressable>}<Text style={[type.section,{flex:1,minWidth:0}]}>{title}</Text><RefreshAction label="Refresh salons" onRefresh={()=>refresh(true)}/><ActivityBell/>{!back&&<Pressable accessibilityRole="button" accessibilityLabel="My account" onPress={()=>router.push('/manage/account')} style={m.avatarSmall}><UserRound color={colors.text} size={20}/></Pressable>}</View><RouteMotion><KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}><ScrollView ref={scrollRef} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={m.content}>{showFreshness&&data&&stale&&<Text accessibilityRole="alert" style={type.caption}>Data may be out of date. Refresh before changing the queue.</Text>}{error&&<Text accessibilityRole="alert" style={type.caption}>{error} Pull up the latest data with Refresh.</Text>}{loading&&data&&<LoadingState compact label="Refreshing your workspace…"/>}{children}</ScrollView></KeyboardAvoidingView></RouteMotion>{(!back||navigation)&&<View style={{flexDirection:'row',borderTopWidth:1,borderColor:colors.divider,backgroundColor:colors.background,paddingVertical:9}}>{tabs.map(({label,path,Icon})=>{const selected=path==='/manage'?!pathname.includes('/activity')&&!pathname.includes('/account')&&!pathname.includes('/finance')&&!pathname.includes('/analytics')&&!pathname.includes('/team'):pathname.startsWith(path);return <Pressable key={path} accessibilityRole="button" accessibilityLabel={label==='Team'?'Team workspace':label} accessibilityState={{selected}} onPress={()=>router.navigate(path)} style={{flex:1,alignItems:'center',justifyContent:'center',minHeight:52,gap:4}}><Icon size={21} color={selected?colors.action:colors.muted}/><Text style={[type.caption,{fontSize:12,color:selected?colors.action:colors.muted}]}>{label}</Text></Pressable>;})}</View>}</SafeAreaView>;
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
}) { const [failed,setFailed]=useState<string|null>(null); return uri&&failed!==uri ? <Image onError={()=>setFailed(uri)} accessibilityLabel={`${name} photo`} source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }}/> : <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.raised, alignItems: 'center', justifyContent: 'center' }}><Text style={[type.section, { fontSize: size / 3 }]}>{name.trim().slice(0, 2).toUpperCase() || 'ME'}</Text></View>; }
export function Cover({ uri, name, square=false }: { uri?:string|null;name:string;square?:boolean }) {
 const [failed,setFailed]=useState<string|null>(null),[loaded,setLoaded]=useState<string|null>(null);
 const shape=square?{width:'100%' as const,aspectRatio:1,overflow:'hidden' as const}:m.cover;
 return <View style={shape}>{uri&&failed!==uri?<><Image key={uri} onError={()=>setFailed(uri)} onLoadEnd={()=>setLoaded(uri)} accessibilityLabel={`${name} cover photo`} source={{uri}} style={{width:'100%',height:'100%'}}/>{loaded!==uri&&<View pointerEvents="none" style={[StyleSheet.absoluteFill,{alignItems:'center',justifyContent:'center',backgroundColor:colors.surface}]}><ActivityIndicator accessibilityLabel={`Loading ${name} photo`} color={colors.action}/></View>}</>:<View style={{flex:1,backgroundColor:colors.surface,alignItems:'center',justifyContent:'center',gap:8,padding:12}}><Store color={colors.muted} size={32}/><Text style={[type.caption,{textAlign:'center'}]}>Your salon, your space</Text></View>}</View>;
}
export function PhotoPicker({ asset, url, onChange, cover = false, name = 'Profile', onRemove, disabled = false }: {
  onRemove?: () => void;
  disabled?: boolean;
  asset: ImagePickerAsset | null;
  url?: string | null;
  onChange: (a: ImagePickerAsset | null) => void;
  cover?: boolean;
  name?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  return <View style={{ gap: 12 }}>{cover ? <Cover uri={asset?.uri ?? url} name={name}/> : <View style={{ alignSelf: 'center', padding: 8 }}><Portrait uri={asset?.uri ?? url} name={name} size={96}/></View>}<Pressable accessibilityRole="button" disabled={disabled} accessibilityLabel={cover ? 'Choose salon cover' : 'Choose profile photo'} onPress={() => { setError(null); void pickPhoto(cover).then(a => { if (a)
    onChange(a); }, e => setError(e instanceof Error ? e.message : 'Could not select photo.')); }} style={({pressed})=>[m.photoButton,{opacity:disabled?.45:pressed?.7:1}]}><ImagePlus color={colors.text} size={19}/><Text style={type.label}>{asset ? 'Change selected photo' : cover ? 'Add a salon photo' : 'Choose profile photo'}</Text></Pressable>{!asset && !!url && onRemove && <Pressable accessibilityRole="button" disabled={disabled} onPress={onRemove} style={{ minHeight:48, alignItems:'center', justifyContent:'center' }}><Text style={type.label}>Remove photo</Text></Pressable>}{asset && <Pressable disabled={disabled} accessibilityRole="button" onPress={() => onChange(null)} style={{ minHeight: 48, justifyContent: 'center', alignItems: 'center' }}><Text style={type.caption}>Discard selected photo</Text></Pressable>}{error && <Text accessibilityRole="alert" style={type.body}>{error}</Text>}<Text style={[type.caption, { textAlign: 'center' }]}>JPEG, PNG or WebP · Up to 2 MB · Uploads when you save</Text></View>;
}
export function EmptyTeam() { return <View style={m.empty}><Scissors size={30} color={colors.muted}/><Text style={type.section}>A chair for your first barber.</Text><Text style={[type.body, { textAlign: 'center' }]}>Add your team so customers can choose a barber and book a time.</Text></View>; }
export function MenuRow({ label, detail, onPress }: {
  label: string;
  detail?: string;
  onPress: () => void;
}) { return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({pressed})=>[m.menu,{opacity:pressed?.7:1}]}><View style={{ flex: 1, gap: 3 }}><Text style={type.label}>{label}</Text>{detail && <Text style={type.caption}>{detail}</Text>}</View><ChevronRight color={colors.muted} size={20}/></Pressable>; }
export const m = StyleSheet.create({ header: { minHeight: 70, paddingHorizontal: 20, gap: 10, flexDirection: 'row', alignItems: 'center' }, content: { padding: 20, paddingBottom: 44, gap: 18 }, icon: { height: 48, width: 48, alignItems: 'center', justifyContent: 'center' }, avatarSmall: { height: 48, width: 48, borderRadius: 24, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }, cover: { width: '100%', height: 144, borderRadius: 20 }, salonCard: { boxShadow:shadows.card,borderWidth: 1, borderColor: colors.divider, borderRadius: 20, overflow: 'hidden', backgroundColor: colors.card }, cardBody: { padding: 18, gap: 12 }, formGroup: { backgroundColor: colors.card, padding: 16, borderWidth: 1, borderColor: colors.divider, borderRadius: 20, gap: 18 }, photoButton: { minHeight: 48, borderWidth: 1, borderColor: colors.border, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }, empty: { padding: 26, backgroundColor: colors.surface, borderRadius: 20, alignItems: 'center', gap: 12 }, menu: { minHeight: 64, padding: 16, borderRadius: 16, backgroundColor: colors.surface, flexDirection: 'row', gap: 10, alignItems: 'center' }, badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: colors.surface }, buttonText: { fontFamily: fonts.semibold, color: colors.text, fontSize: 14 } });
