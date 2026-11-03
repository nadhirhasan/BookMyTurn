import { ArrowUpRight, ChevronRight, type LucideIcon, Scissors } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Image, Pressable, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import { colors, type } from '@/theme';

export function Photo({ source, label, height = 200 }: { source?: ImageSourcePropType | null; label: string; height?: number }) {
  const identity=JSON.stringify(source);
  const [failed, setFailed] = useState<string|null>(null);
  return <View style={[s.photo, { height }]}>{source && failed!==identity ? <Image source={source} accessibilityLabel={label} onError={() => setFailed(identity)} style={{ width: '100%', height: '100%' }}/> : <View style={s.placeholder}><Scissors size={32} color={colors.action}/><Text style={type.caption}>Photo coming soon</Text></View>}</View>;
}
export function ImageBanner({ title, subtitle, onPress, compact = false }: { title: string; subtitle: string; onPress?: () => void; compact?: boolean }) {
  const content = <><View style={{ flex: 1, padding: compact ? 16 : 20, gap: 8 }}><Text style={type.eyebrow}>YOUR NEXT LOOK</Text><Text accessibilityRole="header" style={compact ? type.section : type.title}>{title}</Text>{!!subtitle&&<Text style={type.caption}>{subtitle}</Text>}{onPress && <ArrowUpRight size={24} color={colors.action}/>}</View><View style={{ width: compact ? '32%' : '37%', alignSelf: 'stretch' }}><Image source={require('../../assets/images/salon.jpg')} accessible={false} resizeMode="cover" style={{ position: 'absolute', width: '100%', height: '100%' }}/></View></>;
  return onPress ? <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={({ pressed }) => [s.banner, {minHeight:compact?112:170}, pressed && { opacity: 0.8 }]}>{content}</Pressable> : <View style={[s.banner,{minHeight:compact?112:170}]}>{content}</View>;
}
export function EmptyState({ icon: Icon, title, description, children }: { icon: LucideIcon; title: string; description: string; children?: ReactNode }) {
  return <View style={s.empty}><View style={s.emptyIcon}><Icon size={30} color={colors.action}/></View><Text style={[type.section, { textAlign: 'center' }]}>{title}</Text><Text style={[type.body, { textAlign: 'center', color: colors.muted }]}>{description}</Text>{children}</View>;
}
export function MenuRow({ icon: Icon, title, subtitle, onPress }: { icon: LucideIcon; title: string; subtitle?: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={({ pressed }) => [s.menu, pressed && { opacity: 0.7 }]}><View style={s.menuIcon}><Icon size={22} color={colors.action}/></View><View style={{ flex: 1, gap: 3 }}><Text style={type.label}>{title}</Text>{subtitle && <Text style={type.caption}>{subtitle}</Text>}</View><ChevronRight size={20} color={colors.muted}/></Pressable>;
}
export function StepIndicator({ current }: { current: number }) {
  return <View accessibilityLabel={`Step ${current + 1} of 2`} style={{ flexDirection: 'row', gap: 12 }}>{['Choose a time', 'Review & request'].map((label, i) => <View key={label} style={{ flex: 1, gap: 8 }}><View style={{ height: 4, borderRadius: 2, backgroundColor: i <= current ? colors.action : colors.divider }}/><Text style={[type.caption, { color: i === current ? colors.action : colors.muted }]}>{i + 1}. {label}</Text></View>)}</View>;
}
const s = StyleSheet.create({
  photo: { width: '100%', borderRadius: 20, backgroundColor: colors.brandSoft, overflow: 'hidden' }, placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  banner: { backgroundColor: colors.brandSoft, borderRadius: 22, overflow: 'hidden', flexDirection: 'row', minHeight: 170 },
  empty: { alignItems: 'center', paddingVertical: 24, gap: 14 }, emptyIcon: { width: 72, height: 72, borderRadius: 24, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  menu: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.divider, minHeight: 72 },
  menuIcon: { width: 44, height: 44, backgroundColor: colors.surface, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
