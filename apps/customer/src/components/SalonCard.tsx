import { router } from 'expo-router';
import { Clock3, Star } from 'lucide-react-native';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { money, queueLabel, waitLabel, type Salon } from '@/data/salons';
import { colors, type } from '@/theme';
export function SalonCard({ salon, featured = false }: {
  salon: Salon;
  featured?: boolean;
}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`View ${salon.name}`} onPress={() => router.push(`/salon/${salon.id}`)} style={({ pressed }) => [featured ? s.featured : s.row, { opacity: pressed ? 0.75 : 1 }]}>
  <Image source={salon.photo} accessibilityLabel="Illustrative salon photo" style={featured ? s.hero : s.thumb}/>
  <View style={featured ? s.info : s.compactInfo}>
   <View style={s.nameRow}><Text style={featured ? type.section : type.label}>{salon.name}</Text>{featured && salon.rating !== null && <View style={s.rating}><Star size={14} color={colors.text}/><Text style={[type.caption, { color: colors.text }]}>{salon.rating}</Text></View>}</View>
   <Text style={type.caption}>{salon.reviews ? `${salon.rating} (${salon.reviews})` : 'No reviews yet'} · {salon.price === null ? 'Services not listed' : `From ${money(salon.price)}`}</Text>
   <View style={s.wait}>{featured && <Clock3 size={17} color={colors.text}/>}<Text style={type.label}>{waitLabel(salon)}</Text></View>
   <Text style={type.caption}>{queueLabel(salon)}</Text>
   {featured ? <View style={s.earliest}><Text style={type.caption}>Earliest service</Text><Text style={type.label}>{salon.earliest}</Text></View> : <Text style={type.caption}>{salon.open ? `Earliest service ${salon.earliest.toLowerCase()}` : 'No availability today'}</Text>}
  </View>
 </Pressable>;
}
const s = StyleSheet.create({
  featured: { borderWidth: 1, borderColor: colors.divider, borderRadius: 16, overflow: 'hidden' },
  hero: { width: '100%', height: 142, borderRadius: 12 }, info: { padding: 16, gap: 10 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }, rating: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  wait: { flexDirection: 'row', alignItems: 'center', gap: 8 }, earliest: { borderTopWidth: 1, borderColor: colors.divider, paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between' },
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' }, thumb: { width: 94, height: 110, borderRadius: 12 }, compactInfo: { flex: 1, gap: 5, minWidth: 0 },
});
