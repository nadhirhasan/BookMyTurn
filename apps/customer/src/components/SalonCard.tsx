import { router } from 'expo-router';
import { Star } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { waitLabel, type Salon } from '@/data/salons';
import { SquareGrid } from './SquareGrid';
import { PressableMotion } from './PressableMotion';
import { Photo } from './Experience';
import { StatusPill } from './UI';
import { colors, shadows, type } from '@/theme';
export function PhotoFade() {
  return <Svg pointerEvents="none" width="100%" height="100%" style={StyleSheet.absoluteFill}><Defs><LinearGradient id="photoFade" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={colors.background} stopOpacity="0"/><Stop offset="0.45" stopColor={colors.background} stopOpacity="0.18"/><Stop offset="1" stopColor={colors.background} stopOpacity="0.98"/></LinearGradient></Defs><Rect width="100%" height="100%" fill="url(#photoFade)"/></Svg>;
}
export function SalonGrid({salons}:{salons:Salon[]}) {
 return <SquareGrid>{salons.map(salon=><SalonCard key={salon.id} salon={salon}/>)}</SquareGrid>;
}
export function SalonCard({salon}:{salon:Salon;featured?:boolean}) {
 return <PressableMotion accessibilityRole="button" accessibilityLabel={`View ${salon.name}`} onPress={()=>router.push(`/salon/${salon.id}`)} style={s.tile}>
  <View style={{width:'100%',aspectRatio:1}}><Photo square radius={0} source={salon.photo} label={`${salon.name} photo`}/><View style={{position:'absolute',top:10,left:10}}><StatusPill label={salon.open?'Open':'Closed'} tone={salon.open?'success':'neutral'}/></View></View>
  <View style={{padding:12,gap:8}}><Text numberOfLines={2} style={type.label}>{salon.name}</Text><View style={s.line}><Star size={12} color={colors.action}/><Text style={type.caption}>{salon.reviews?`${salon.rating} (${salon.reviews})`:'No reviews yet'}</Text></View><Text style={[type.caption,{color:salon.open?colors.green:colors.muted}]}>{waitLabel(salon)}</Text><Text style={type.caption}>{salon.waiting} waiting · {salon.earliest}</Text></View>
 </PressableMotion>;
}
const s=StyleSheet.create({line:{flexDirection:'row',alignItems:'center',gap:6},tile:{boxShadow:shadows.card,backgroundColor:colors.card,borderRadius:16,borderWidth:1,borderColor:colors.divider,overflow:'hidden',flex:1},feature:{height:210,borderRadius:19,overflow:'hidden',backgroundColor:colors.card,justifyContent:'flex-end'},featureBody:{padding:18,gap:9},arrow:{width:36,height:36,borderRadius:18,backgroundColor:colors.action,alignItems:'center',justifyContent:'center'}});
