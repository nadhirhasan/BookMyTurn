import { router } from 'expo-router';
import { ArrowUpRight, CalendarCheck2, Clock3, ScanLine, Store, Sun, UserRound } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SalonGrid } from '@/components/SalonCard';
import { Screen, SearchField, SectionHeading, StatusPill } from '@/components/UI';
import { EmptyState } from '@/components/Experience';
import { DataStatus, useRefreshOnFocus } from '@/components/CustomerUI';
import { salonDisplay, searchSalons } from '@/data/salons';
import { activeAppointment, activeQueue, statusLabel, time, visitDate } from '@/lib/customer-types';
import { useCustomer } from '@/providers/CustomerProvider';
import { PressableMotion } from '@/components/PressableMotion';
import { useSession } from '@/providers/SessionProvider';
import { getMyProfile } from '@/lib/supabase/profiles';
import { colors, fonts, type } from '@/theme';
export default function HomeScreen() {
 const [query,setQuery]=useState(''),[filter,setFilter]=useState('All salons');
 const {catalog,visits,qrQueues}=useCustomer();useRefreshOnFocus();
 const session=useSession(),uid=session.status==='authenticated'?session.session?.user.id:null;
 const [greeting,setGreeting]=useState<{uid:string;name:string}|null>(null);
 useEffect(()=>{if(!uid)return;let active=true;void getMyProfile().then(p=>{if(active&&p?.display_name)setGreeting({uid,name:p.display_name.trim().split(/\s+/)[0]!});},()=>{});return()=>{active=false;};},[uid]);
 const salons=catalog?.salons.map(s=>salonDisplay(s,catalog)).sort((a,b)=>Number(b.open)-Number(a.open)||(a.wait?.[0]??Infinity)-(b.wait?.[0]??Infinity))??[];
 const results=searchSalons(salons,query).filter(s=>filter==='All salons'||filter==='Open now'&&s.open||filter==='No queue'&&s.open&&s.waiting===0&&s.wait?.[0]===0);
 const queue=[...visits.queues,...qrQueues].find(activeQueue),booking=visits.appointments.filter(activeAppointment).sort((a,b)=>(a.confirmed_start??a.requested_start).localeCompare(b.confirmed_start??b.requested_start))[0];
 return <Screen title="BookMyTurn" home tab brandHeader header={<View style={{backgroundColor:colors.background}}><View style={s.hero}>
  <View style={s.header}><CalendarCheck2 size={27} color={colors.onAction}/><Text style={[type.section,{flex:1,fontSize:20,color:colors.onAction}]}>BookMyTurn</Text><PressableMotion accessibilityRole="button" accessibilityLabel="Scan salon QR" onPress={()=>router.push('/scan')} style={s.icon}><ScanLine size={22} color={colors.onAction}/></PressableMotion><PressableMotion accessibilityRole="button" accessibilityLabel="Account" onPress={()=>router.navigate('/profile')} style={[s.icon,{backgroundColor:colors.card,borderRadius:22}]}><UserRound size={21} color={colors.action}/></PressableMotion></View>
  <View style={{gap:7,paddingTop:12,paddingBottom:18}}><Text accessibilityRole="header" numberOfLines={1} style={{fontFamily:fonts.bold,fontSize:27,lineHeight:34,color:colors.onAction}}>Hi {greeting&&greeting.uid===uid?greeting.name:'there'} 👋</Text><Text style={[type.body,{color:colors.onBrandMuted}]}>Find your next haircut. Skip the long wait.</Text></View>
  <SearchField value={query} onChange={setQuery} onSubmit={()=>router.navigate({pathname:'/salons',params:{q:query}})}/>
 </View></View>}>
  <DataStatus skeleton/>
  <View style={{flexDirection:'row',justifyContent:'space-around',gap:14}}>{[{label:'All salons',Icon:Store},{label:'No queue',Icon:Clock3},{label:'Open now',Icon:Sun}].map(({label,Icon})=><PressableMotion key={label} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{selected:filter===label}} onPress={()=>setFilter(label)} style={{alignItems:'center',gap:8,flex:1}}><View style={{width:66,height:66,borderRadius:20,backgroundColor:filter===label?colors.action:colors.raised,alignItems:'center',justifyContent:'center'}}><Icon size={27} strokeWidth={1.6} color={filter===label?colors.onAction:colors.action}/></View><Text style={[type.caption,{color:filter===label?colors.action:colors.text,fontFamily:fonts.semibold}]}>{label}</Text></PressableMotion>)}</View>
  {!query.trim()&&queue&&<Pressable accessibilityRole="button" accessibilityLabel="Track my queue" onPress={()=>router.push(`/queue-entry/${queue.id}`)} style={s.active}><StatusPill label={['joined','arrived'].includes(queue.status)?'Waiting':statusLabel(queue.status)} tone="success"/><View style={s.line}><View style={{flex:1,gap:4}}><Text style={type.section}>Your turn is on its way</Text><Text style={type.caption}>{catalog?.salons.find(s=>s.id===queue.salon_id)?.name??queue.salon_name??'Your salon'} · Code {queue.reference}</Text></View><ArrowUpRight color={colors.green} size={23}/></View></Pressable>}
  {!query.trim()&&!queue&&booking&&<Pressable accessibilityRole="button" accessibilityLabel="View my appointment" onPress={()=>router.navigate('/appointments')} style={s.active}><StatusPill label={statusLabel(booking.status)} tone={booking.status==='confirmed'?'success':'warning'}/><Text style={type.section}>{visitDate(booking.confirmed_start??booking.requested_start)} · {time(booking.confirmed_start??booking.requested_start)}</Text><Text style={type.caption}>View your appointment</Text></Pressable>}
  <SectionHeading title={query.trim()?'Matching salons':'Salons for you'} action="See all" onPress={()=>router.navigate('/salons')}/>
  <SalonGrid salons={query.trim()?results:results.slice(0,4)}/>
  {catalog&&!results.length&&<EmptyState icon={Store} title={query.trim()?'No matching salons':'No salons for this selection'} description="Try another name or filter, or check back as salons open their doors."/>}
 </Screen>;
}
const s=StyleSheet.create({hero:{backgroundColor:colors.action,borderBottomLeftRadius:32,borderBottomRightRadius:32,paddingHorizontal:20,paddingTop:8,paddingBottom:24},header:{minHeight:56,flexDirection:'row',alignItems:'center',gap:9},icon:{width:44,height:44,alignItems:'center',justifyContent:'center'},line:{flexDirection:'row',alignItems:'center',gap:12},active:{padding:16,borderRadius:20,backgroundColor:colors.mint,gap:10}});
