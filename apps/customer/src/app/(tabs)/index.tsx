import { router } from 'expo-router';
import { ArrowUpRight, CalendarDays, Clock3, Store } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SalonCard } from '@/components/SalonCard';
import { Screen, SearchField, SectionHeading, StatusPill } from '@/components/UI';
import { EmptyState, ImageBanner } from '@/components/Experience';
import { DataStatus, useRefreshOnFocus } from '@/components/CustomerUI';
import { salonDisplay, searchSalons } from '@/data/salons';
import { activeAppointment, activeQueue, statusLabel, time, visitDate } from '@/lib/customer-types';
import { useCustomer } from '@/providers/CustomerProvider';
import { colors, type } from '@/theme';

export default function HomeScreen() {
  const [query, setQuery] = useState('');
  const { catalog, visits, qrQueues } = useCustomer();
  useRefreshOnFocus();
  const salons = catalog?.salons.map(s => salonDisplay(s, catalog)).sort((a, b) => Number(b.open) - Number(a.open) || (a.wait?.[0] ?? Infinity) - (b.wait?.[0] ?? Infinity)) ?? [];
  const results = searchSalons(salons, query);
  const queue = [...visits.queues, ...qrQueues].find(activeQueue);
  const booking = visits.appointments.filter(activeAppointment).sort((a,b) => (a.confirmed_start ?? a.requested_start).localeCompare(b.confirmed_start ?? b.requested_start))[0];
  return <Screen title="BookMyTurn" home tab>
    <SearchField value={query} onChange={setQuery} onSubmit={() => router.navigate({ pathname: '/salons', params: { q: query } })}/>
    <DataStatus/>
    {!query.trim() && <>
      {queue && <Pressable accessibilityRole="button" accessibilityLabel="Track my queue" onPress={() => router.push(`/queue-entry/${queue.id}`)} style={s.active}>
        <StatusPill label={statusLabel(queue.status)} tone="success"/><View style={s.line}><View style={{flex:1,gap:4}}><Text style={type.section}>Your turn is on its way</Text><Text style={type.caption}>{catalog?.salons.find(s=>s.id===queue.salon_id)?.name ?? queue.salon_name ?? 'Your salon'} · Code {queue.reference}</Text></View><ArrowUpRight color={colors.green} size={24}/></View>
      </Pressable>}
      {!queue && booking && <Pressable accessibilityRole="button" accessibilityLabel="View my appointment" onPress={() => router.navigate('/appointments')} style={s.active}><StatusPill label={statusLabel(booking.status)} tone={booking.status==='confirmed'?'success':'warning'}/><Text style={type.section}>{visitDate(booking.confirmed_start??booking.requested_start)} · {time(booking.confirmed_start??booking.requested_start)}</Text><Text style={type.caption}>View your appointment</Text></Pressable>}
      {!queue&&!booking&&<ImageBanner compact title="Good hair. Less waiting." subtitle=""/>}
      <View style={s.intents}>{[{title:'Go now',detail:'Compare live waits',icon:Clock3,bg:colors.mint,intent:'now'},{title:'Plan a visit',detail:'Choose a date & time',icon:CalendarDays,bg:colors.butter,intent:'plan'}].map(({title,detail,icon:Icon,bg,intent})=><Pressable key={title} accessibilityRole="button" accessibilityLabel={title} onPress={()=>router.navigate({pathname:'/salons',params:{intent}})} style={({pressed})=>[s.intent,{backgroundColor:bg,opacity:pressed?0.75:1}]}><Icon size={24} color={intent==='now'?colors.green:colors.amber}/><Text style={type.label}>{title}</Text><Text style={type.caption}>{detail}</Text></Pressable>)}</View>
    </>}
    <SectionHeading title={query.trim() ? 'Matching salons' : 'Find your salon'} action="See all" onPress={()=>router.navigate('/salons')}/>
    {(query.trim() ? results : results.slice(0, 3)).map(salon => <SalonCard key={salon.id} salon={salon} featured/>)}
    {catalog && !results.length && <EmptyState icon={Store} title={query.trim()?'No matching salons':'Salons will appear here'} description={query.trim()?'Try another salon or barber name.':'Check back as salons open their doors on BookMyTurn.'}/>}
    {!query.trim() && <ImageBanner title="Save it. Show it. Love it." subtitle="Keep haircut ideas together and share them with your barber." onPress={()=>router.navigate('/hairstyles')}/>}
  </Screen>;
}
const s=StyleSheet.create({location:{flexDirection:'row',alignItems:'center',gap:6},intents:{flexDirection:'row',gap:12},intent:{flex:1,padding:16,borderRadius:20,gap:8},active:{padding:18,borderRadius:20,gap:12,backgroundColor:colors.mint},line:{flexDirection:'row',alignItems:'center',gap:12}});
