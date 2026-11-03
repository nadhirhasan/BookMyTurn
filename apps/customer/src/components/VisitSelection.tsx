import { useState } from 'react';
import { Check, Shuffle, UserRound } from 'lucide-react-native';
import { Image, Pressable, Text, View } from 'react-native';
import type { Catalog } from '@/lib/customer-types';
import { colors, type } from '@/theme';

export function VisitSelection({catalog,salon,barber,onBarber,compact=false}:{catalog:Catalog;salon:string;barber:string|null;onBarber:(id:string|null)=>void;compact?:boolean}) {
  const [expanded,setExpanded]=useState(!compact);
  const choices=[{id:null,display_name:'Any Available Barber',photo_url:null,detail:'More choice of available times'},...catalog.barbers.filter(b=>b.salon_id===salon).map(b=>({...b,detail:b.review_count?`${b.rating} · ${b.review_count} reviews`:'Choose your preferred barber'}))];
  return <View style={{gap:10}}><View style={{flexDirection:'row',alignItems:'center',gap:8}}><Text accessibilityRole="header" style={[type.section,{flex:1}]}>Your barber</Text>{compact&&<Pressable accessibilityRole="button" accessibilityLabel={expanded?'Close barber choices':'Change barber'} accessibilityState={{expanded}} onPress={()=>setExpanded(!expanded)} style={{minHeight:48,justifyContent:'center'}}><Text style={[type.label,{color:colors.action}]}>{expanded?'Done':'Change'}</Text></Pressable>}</View>{choices.filter(b=>expanded||b.id===barber).map(b=><Pressable key={b.id??'any'} accessibilityRole="button" accessibilityLabel={b.display_name} accessibilityState={{selected:barber===b.id}} onPress={()=>{if(!expanded){setExpanded(true);return;}onBarber(b.id);if(compact)setExpanded(false);}} style={({pressed})=>({flexDirection:'row',alignItems:'center',gap:12,padding:14,borderRadius:18,borderWidth:barber===b.id?2:1,borderColor:barber===b.id?colors.action:colors.divider,backgroundColor:barber===b.id?colors.brandSoft:colors.card,opacity:pressed?0.75:1,minHeight:76})}>
    <View style={{width:44,height:44,borderRadius:22,backgroundColor:colors.surface,alignItems:'center',justifyContent:'center',overflow:'hidden'}}>{b.photo_url?<Image source={{uri:b.photo_url}} style={{width:44,height:44}}/>:b.id?<UserRound size={22} color={colors.muted}/>:<Shuffle size={22} color={colors.action}/>}</View>
    <View style={{flex:1,gap:3}}><Text style={type.label}>{b.display_name}</Text><Text style={type.caption}>{b.detail}</Text></View>{barber===b.id&&<Check size={21} color={colors.action}/>}
  </Pressable>)}</View>;
}
