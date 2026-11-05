import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, type } from '@/theme';
import { money } from '@/lib/types';
import { dateSpan, shortDay, type PerformanceBucket } from '@/lib/performance';

export function PerformanceChart({ rows, metric }: { rows: PerformanceBucket[]; metric: 'revenue_minor' | 'completed_count' }) {
  const [selected, setSelected] = useState<string | null>(null);
  const active = rows.find(r => r.day === selected) ?? rows[rows.length - 1];
  const maximum = Math.max(0, ...rows.map(r => r[metric]));
  const minimum = Math.min(0, ...rows.map(r => r[metric]));
  const extent = maximum - minimum || 1, height = 160, zero = height * maximum / extent;
  const value = (n: number) => metric === 'revenue_minor' ? money(n) : `${n} haircut${n === 1 ? '' : 's'}`;
  return <View style={{ gap: 14 }}>
    <View accessibilityLiveRegion="polite" testID="chart-selection" style={c.selection}>
      <Text style={type.caption}>{active ? dateSpan(active.day, active.until ?? active.day) : 'No dates'}</Text>
      <Text style={[type.section, { color: colors.action }]}>{value(active?.[metric] ?? 0)}</Text>
    </View>
    {!maximum && !minimum && <Text style={type.caption}>No {metric === 'revenue_minor' ? 'revenue' : 'completed haircuts'} in this period yet.</Text>}
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={type.caption}>Scale: {value(minimum)}</Text><Text style={type.caption}>{value(maximum)}</Text>
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{ flexGrow: 1 }}>
      <View style={{ flexDirection: 'row', flexGrow: 1, paddingTop: 4 }}>
        {rows.map(row => {
          const amount = row[metric], barHeight = Math.abs(amount) / extent * height, chosen = active?.day === row.day;
          return <Pressable key={row.day} accessibilityRole="button" accessibilityLabel={`${dateSpan(row.day, row.until ?? row.day)}: ${value(amount)}`} accessibilityState={{ selected: chosen }} onPress={() => setSelected(row.day)} style={[c.column, { flex: rows.length <= 7 ? 1 : undefined }]}>
            <View style={{ height, width: '100%' }}>
              <View style={[c.baseline, { top: zero }]} />
              {!!amount && <View testID={amount < 0 ? 'negative-bar' : undefined} style={{ position: 'absolute', top: amount >= 0 ? zero - barHeight : zero, height: barHeight, left: 10, right: 10, borderRadius: 5, backgroundColor: amount < 0 ? colors.pending : colors.action, opacity: chosen ? 1 : 0.55 }} />}
              {!amount && <View style={{ position: 'absolute', top: Math.min(zero, height - 2), left: 20, right: 20, height: 2, backgroundColor: colors.border }} />}
            </View>
            <Text style={[c.tick, { color: chosen ? colors.action : colors.muted }]}>{shortDay(row.day)}</Text>
            <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: chosen ? colors.action : 'transparent' }} />
          </Pressable>;
        })}
      </View>
    </ScrollView>
    <Text style={type.caption}>Tap a bar for the exact value.{rows.length > 7 ? ' Swipe to see more dates.' : ''}{minimum < 0 ? ' Amber bars show net corrections below zero.' : ''}</Text>
  </View>;
}
const c = StyleSheet.create({
  selection: { gap: 4, padding: 14, backgroundColor: colors.brandSoft, borderRadius: 14 },
  column: { minWidth: 48, alignItems: 'center', gap: 8, paddingBottom: 8 },
  baseline: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: colors.border },
  tick: { fontSize: 11, fontFamily: fonts.medium },
});
