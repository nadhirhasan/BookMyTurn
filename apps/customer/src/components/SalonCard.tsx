import { router } from 'expo-router';
import { Clock3, Star, Users } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { waitLabel, type Salon } from '@/data/salons';
import { Photo } from './Experience';
import { StatusPill } from './UI';
import { colors, type } from '@/theme';

export function SalonCard({ salon, featured = false }: { salon: Salon; featured?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`View ${salon.name}`} onPress={() => router.push(`/salon/${salon.id}`)} style={({ pressed }) => [s.card, { opacity: pressed ? 0.8 : 1 }]}>
    <Photo source={salon.photo} label={`${salon.name} photo`} height={featured?160:130}/>
    <View style={s.info}>
      <View style={s.line}><Text style={[type.section,{flex:1}]}>{salon.name}</Text><StatusPill label={salon.open?'Open':'Closed'} tone={salon.open?'success':'neutral'}/></View>
      <View style={s.line}><Star size={15} color={colors.amber}/><Text style={type.caption}>{salon.reviews ? `${salon.rating} (${salon.reviews} reviews)` : 'No reviews yet'}</Text></View>
      <View style={s.availability}><Clock3 size={18} color={colors.green}/><View style={{flex:1,gap:2}}><Text style={[type.label,{color:colors.green}]}>{waitLabel(salon)}</Text><Text style={type.caption}>Earliest service: {salon.earliest}</Text></View><View style={s.count}><Users size={16} color={colors.muted}/><Text style={type.caption}>{salon.waiting} waiting</Text></View></View>
    </View>
  </Pressable>;
}
const s=StyleSheet.create({card:{borderWidth:1,borderColor:colors.divider,borderRadius:22,overflow:'hidden',backgroundColor:colors.card},info:{padding:16,gap:12},line:{flexDirection:'row',alignItems:'center',gap:8},availability:{flexDirection:'row',alignItems:'center',gap:10,borderTopWidth:1,borderTopColor:colors.divider,paddingTop:12},count:{alignItems:'center',gap:4}});
