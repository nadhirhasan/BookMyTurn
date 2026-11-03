import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, type } from '@/theme';

export function StatusBadge({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'success' | 'pending' }) {
  const color = tone === 'success' ? colors.positive : tone === 'pending' ? colors.pending : colors.muted;
  return <View style={[v.badge, { backgroundColor: tone === 'success' ? colors.positiveSoft : tone === 'pending' ? colors.pendingSoft : colors.surface }]}><View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }}/><Text style={[type.caption, { color, flexShrink: 1 }]}>{label}</Text></View>;
}
export function StatsGrid({ items }: { items: { label: string; value: number | string; icon: LucideIcon; tone?: 'peach' | 'mint' | 'amber' }[] }) {
  return <View style={v.grid}>{items.map(({label,value,icon:Icon,tone})=><View key={label} style={[v.stat,{backgroundColor:tone==='mint'?colors.positiveSoft:tone==='amber'?colors.pendingSoft:colors.peach}]}><Icon size={20} color={tone==='mint'?colors.positive:tone==='amber'?colors.pending:colors.action}/><Text style={[type.title,{fontVariant:['tabular-nums']}]}>{value}</Text><Text style={type.caption}>{label}</Text></View>)}</View>;
}
export function TaskRow({ title, detail, icon: Icon, onPress, tone = 'plain' }: { title: string; detail?: string; icon: LucideIcon; onPress: () => void; tone?: 'plain' | 'pending' }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={({pressed})=>[v.task,{backgroundColor:tone==='pending'?colors.pendingSoft:colors.card,opacity:pressed?.7:1}]}><Icon size={24} color={tone==='pending'?colors.pending:colors.action}/><View style={{flex:1,gap:4}}><Text style={type.label}>{title}</Text>{detail&&<Text style={type.caption}>{detail}</Text>}</View><ChevronRight size={20} color={colors.muted}/></Pressable>;
}
export function EmptyState({ title, detail, icon: Icon, children }: { title: string; detail: string; icon: LucideIcon; children?: ReactNode }) {
  return <View style={v.empty}><View style={v.emptyIcon}><Icon size={28} color={colors.action}/></View><Text style={[type.section,{textAlign:'center'}]}>{title}</Text><Text style={[type.body,{color:colors.muted,textAlign:'center'}]}>{detail}</Text>{children}</View>;
}
export const experience = StyleSheet.create({
  hero: { backgroundColor: colors.peach, borderRadius: 22, padding: 20, gap: 12 },
  active: { backgroundColor: colors.positiveSoft, borderRadius: 22, padding: 20, gap: 16 },
});
const v = StyleSheet.create({
  badge: {alignSelf:'flex-start',flexDirection:'row',alignItems:'center',gap:6,paddingHorizontal:10,paddingVertical:6,borderRadius:24,maxWidth:'100%'},
  grid:{flexDirection:'row',flexWrap:'wrap',gap:12},
  stat:{flexGrow:1,flexBasis:'44%',minWidth:112,borderRadius:18,padding:16,gap:6},
  task:{flexDirection:'row',alignItems:'center',gap:14,padding:16,borderWidth:1,borderColor:colors.divider,borderRadius:18,minHeight:76},
  empty:{padding:24,gap:12,alignItems:'center',backgroundColor:colors.card,borderRadius:20,borderWidth:1,borderColor:colors.divider},
  emptyIcon:{width:64,height:64,borderRadius:22,backgroundColor:colors.peach,alignItems:'center',justifyContent:'center'},
});
