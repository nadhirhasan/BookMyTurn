import { router } from 'expo-router';
import { ArrowUpRight, MapPin, ScanLine, Store, UserRound } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SalonCard, SalonFeature } from '@/components/SalonCard';
import { Chip, Screen, SearchField, SectionHeading, StatusPill } from '@/components/UI';
import { EmptyState } from '@/components/Experience';
import { DataStatus, useRefreshOnFocus } from '@/components/CustomerUI';
import { salonDisplay, searchSalons } from '@/data/salons';
import { activeAppointment, activeQueue, statusLabel, time, visitDate } from '@/lib/customer-types';
import { useCustomer } from '@/providers/CustomerProvider';
import { colors, type } from '@/theme';
export default function HomeScreen() {
 const [query,setQuery]=useState(''),[filter,setFilter]=useState('All salons');
 const {catalog,visits,qrQueues}=useCustomer();useRefreshOnFocus();
 const salons=catalog?.salons.map(s=>salonDisplay(s,catalog)).sort((a,b)=>Number(b.open)-Number(a.open)||(a.wait?.[0]??Infinity)-(b.wait?.[0]??Infinity))??[];
 const results=searchSalons(salons,query).filter(s=>filter==='All salons'||filter==='Open now'&&s.open||filter==='No queue'&&s.open&&s.waiting===0&&s.wait?.[0]===0);
 const queue=[...visits.queues,...qrQueues].find(activeQueue),booking=visits.appointments.filter(activeAppointment).sort((a,b)=>(a.confirmed_start??a.requested_start).localeCompare(b.confirmed_start??b.requested_start))[0];
 return <Screen title="BookMyTurn" home tab header={<View style={s.header}><MapPin size={18} color={colors.action}/><View style={{flex:1}}><Text style={type.caption}>YOUR NEXT GOOD HAIR DAY</Text><Text style={type.label}>Find your salon</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Scan salon QR" onPress={()=>router.push('/scan')} style={s.icon}><ScanLine size={22} color={colors.text}/></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Account" onPress={()=>router.navigate('/profile')} style={[s.icon,{backgroundColor:colors.card,borderRadius:24}]}><UserRound size={21} color={colors.action}/></Pressable></View>}>
  <Text accessibilityRole="header" style={type.title}>Good hair.{'\n'}<Text style={{color:colors.action}}>Less waiting.</Text></Text>
  <SearchField value={query} onChange={setQuery} onSubmit={()=>router.navigate({pathname:'/salons',params:{q:query}})}/><DataStatus/>
  <View style={{flexDirection:'row',gap:8,flexWrap:'wrap'}}>{['All salons','No queue','Open now'].map(label=><Chip key={label} label={label} selected={filter===label} onPress={()=>setFilter(label)}/>)}</View>
  {!query.trim()&&queue&&<Pressable accessibilityRole="button" accessibilityLabel="Track my queue" onPress={()=>router.push(`/queue-entry/${queue.id}`)} style={s.active}><StatusPill label={['joined','arrived'].includes(queue.status)?'Waiting':statusLabel(queue.status)} tone="success"/><View style={s.line}><View style={{flex:1,gap:4}}><Text style={type.section}>Your turn is on its way</Text><Text style={type.caption}>{catalog?.salons.find(s=>s.id===queue.salon_id)?.name??queue.salon_name??'Your salon'} · Code {queue.reference}</Text></View><ArrowUpRight color={colors.green} size={23}/></View></Pressable>}
  {!query.trim()&&!queue&&booking&&<Pressable accessibilityRole="button" accessibilityLabel="View my appointment" onPress={()=>router.navigate('/appointments')} style={s.active}><StatusPill label={statusLabel(booking.status)} tone={booking.status==='confirmed'?'success':'warning'}/><Text style={type.section}>{visitDate(booking.confirmed_start??booking.requested_start)} · {time(booking.confirmed_start??booking.requested_start)}</Text><Text style={type.caption}>View your appointment</Text></Pressable>}
  {!query.trim()&&results[0]&&<SalonFeature salon={results[0]}/>}
  <SectionHeading title={query.trim()?'Matching salons':'Salons for you'} action="See all" onPress={()=>router.navigate('/salons')}/>
  <View>{(query.trim()?results:results.slice(0,3)).map(salon=><SalonCard key={salon.id} salon={salon}/>)}</View>
  {catalog&&!results.length&&<EmptyState icon={Store} title={query.trim()?'No matching salons':'No salons for this selection'} description="Try another name or filter, or check back as salons open their doors."/>}
 </Screen>;
}
const s=StyleSheet.create({header:{paddingHorizontal:20,minHeight:68,flexDirection:'row',alignItems:'center',gap:9},icon:{width:44,height:44,alignItems:'center',justifyContent:'center'},line:{flexDirection:'row',alignItems:'center',gap:12},active:{padding:16,borderRadius:16,backgroundColor:colors.mint,gap:10}});
