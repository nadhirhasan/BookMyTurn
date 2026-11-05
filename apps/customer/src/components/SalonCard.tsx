import { router } from 'expo-router';
import { ArrowUpRight, Star } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { waitLabel, type Salon } from '@/data/salons';
import { Photo } from './Experience';
import { StatusPill } from './UI';
import { colors, type } from '@/theme';
export function PhotoFade() {
  return <Svg pointerEvents="none" width="100%" height="100%" style={StyleSheet.absoluteFill}><Defs><LinearGradient id="photoFade" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={colors.background} stopOpacity="0"/><Stop offset="0.45" stopColor={colors.background} stopOpacity="0.18"/><Stop offset="1" stopColor={colors.background} stopOpacity="0.98"/></LinearGradient></Defs><Rect width="100%" height="100%" fill="url(#photoFade)"/></Svg>;
}
export function SalonFeature({salon}:{salon:Salon}) {
 const ready=salon.open&&salon.wait?.[0]===0;
 return <Pressable accessibilityRole="button" accessibilityLabel={`View ${salon.name}`} onPress={()=>router.push(`/salon/${salon.id}`)} style={({pressed})=>[s.feature,{opacity:pressed?.85:1}]}>
  <View style={StyleSheet.absoluteFill}><Photo source={salon.photo} label={`${salon.name} photo`} height={210}/></View><PhotoFade/>
  <View style={s.featureBody}><StatusPill label={ready?'READY WHEN YOU ARE':salon.open?'OPEN NOW':'PLAN YOUR NEXT VISIT'} tone={ready||salon.open?'success':'neutral'}/><Text style={[type.title,{fontSize:26,lineHeight:31}]}>{ready?'Your chair is ready.':salon.open?'A little time for you.':'Your next good hair day.'}</Text><View style={s.line}><View style={{flex:1,gap:2}}><Text style={type.label}>{salon.name}</Text><Text style={type.caption}>{waitLabel(salon)} · {salon.waiting} waiting</Text></View><View style={s.arrow}><ArrowUpRight size={21} color={colors.onAction}/></View></View></View>
 </Pressable>;
}
export function SalonCard({salon}:{salon:Salon;featured?:boolean}) {
 return <Pressable accessibilityRole="button" accessibilityLabel={`View ${salon.name}`} onPress={()=>router.push(`/salon/${salon.id}`)} style={({pressed})=>[s.row,{opacity:pressed?.8:1}]}>
  <View style={{width:83}}><Photo source={salon.photo} label={`${salon.name} photo`} height={75}/></View>
  <View style={{flex:1,gap:5}}><Text style={type.label}>{salon.name}</Text><View style={s.line}><Star size={12} color={colors.action}/><Text style={type.caption}>{salon.reviews?`${salon.rating} (${salon.reviews})`:'No reviews yet'}</Text><Text style={type.caption}>· {salon.open?'Open':'Closed'}</Text></View><Text style={[type.caption,{color:salon.open?colors.green:colors.muted}]}>{waitLabel(salon)} · {salon.waiting} waiting</Text></View><ArrowUpRight size={19} color={colors.action}/>
 </Pressable>;
}
const s=StyleSheet.create({line:{flexDirection:'row',alignItems:'center',gap:6},row:{flexDirection:'row',alignItems:'center',gap:13,paddingVertical:10,borderBottomWidth:1,borderBottomColor:colors.divider},feature:{height:210,borderRadius:19,overflow:'hidden',backgroundColor:colors.card,justifyContent:'flex-end'},featureBody:{padding:18,gap:9},arrow:{width:36,height:36,borderRadius:18,backgroundColor:colors.action,alignItems:'center',justifyContent:'center'}});
