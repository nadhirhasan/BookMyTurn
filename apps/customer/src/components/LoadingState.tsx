import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SquareGrid } from './SquareGrid';
import { colors, type } from '@/theme';

export function LoadingState({ label = 'Loading…', detail, compact = false }: { label?: string; detail?: string; compact?: boolean }) {
  return <View accessibilityLiveRegion="polite" style={[s.state, compact && { paddingVertical: 4, alignItems: 'flex-start' }]}>
    <View style={s.row}><ActivityIndicator color={colors.action} accessibilityLabel={label}/><Text style={type.label}>{label}</Text></View>
    {detail && <Text style={[type.caption, { textAlign: compact ? 'left' : 'center' }]}>{detail}</Text>}
  </View>;
}
export function SalonSkeletons({ label = 'Loading salons' }: { label?: string }) {
  return <View accessibilityLabel={label} accessibilityState={{ busy: true }} style={{ gap: 16 }}>
    <LoadingState label={label} compact/>
    <View importantForAccessibility="no-hide-descendants" aria-hidden>
      <SquareGrid>{[0, 1].map(i => <View key={i} style={{ gap: 10 }}><View style={s.square}/><View style={s.line}/><View style={[s.line, { width: '60%' }]}/></View>)}</SquareGrid>
    </View>
  </View>;
}
const s = StyleSheet.create({ state: { alignItems: 'center', gap: 10, paddingVertical: 24 }, row: { flexDirection: 'row', alignItems: 'center', gap: 10 }, square: { width: '100%', aspectRatio: 1, borderRadius: 16, backgroundColor: colors.card }, line: { height: 12, width: '85%', borderRadius: 6, backgroundColor: colors.raised } });
