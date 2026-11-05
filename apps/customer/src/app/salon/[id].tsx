import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Images, MapPin, Star } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { PhotoFade } from '@/components/SalonCard';
import { VisitSelection } from '@/components/VisitSelection';
import { Action, Screen, SectionHeading, StatusPill } from '@/components/UI';
import { MenuRow, Photo } from '@/components/Experience';
import { DataStatus, styles, useRefreshOnFocus } from '@/components/CustomerUI';
import { salonDisplay, waitLabel } from '@/data/salons';
import { useCustomer } from '@/providers/CustomerProvider';
import { SalonDirections } from '@/components/salon-directions';
import { colors, type } from '@/theme';

export default function SalonScreen() {
  const { id } = useLocalSearchParams<{id:string}>();
  const [barber,setBarber] = useState<string|null>(null);
  const { catalog, stale } = useCustomer();
  useRefreshOnFocus();
  const salon = catalog?.salons.find(s => s.slug === id || s.id === id);
  if (!catalog || !salon) return <Screen title="Salon"><DataStatus/>{catalog&&<><Text style={type.section}>Salon not found</Text><Action label="Browse salons" onPress={()=>router.replace('/salons')}/></>}</Screen>;
  const display=salonDisplay(salon,catalog),reviews=catalog.reviews.filter(r=>r.salon_id===salon.id);
  return <Screen title={salon.name} header={null} contentStyle={{paddingTop:0}} footer={<View style={{flexDirection:'row',gap:10}}><View style={{flex:1}}><Action label={salon.open_now?'Join Queue':'Salon closed'} disabled={!salon.open_now||stale} onPress={()=>router.push(`/salon/${salon.slug}/join?barber=${barber??''}`)}/></View><View style={{flex:1}}><Action label="Request a time" secondary onPress={()=>router.push(`/salon/${salon.slug}/appointment?barber=${barber??''}`)}/></View></View>}>
    <View style={{height:230,marginHorizontal:-20,backgroundColor:colors.card}}><Photo source={display.photo} label={`${salon.name} photo`} height={230} radius={0}/><PhotoFade/><Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={()=>router.canGoBack()?router.back():router.replace('/')} style={{position:'absolute',top:12,left:20,width:44,height:44,borderRadius:22,backgroundColor:colors.photoScrim,alignItems:'center',justifyContent:'center'}}><ArrowLeft size={22} color={colors.onPhoto}/></Pressable></View>
    <View style={{gap:8}}><StatusPill label={salon.open_now?'Open now':'Closed now'} tone={salon.open_now?'success':'neutral'}/><Text accessibilityRole="header" style={type.title}>{salon.name}</Text>
      <View style={styles.row}><Star size={17} color={colors.amber}/><Text style={type.caption}>{salon.review_count?`${salon.rating} · ${salon.review_count} reviews`:'No reviews yet'}</Text></View>
      <View style={{flexDirection:'row',gap:8}}><MapPin size={17} color={colors.muted}/><Text style={[type.body,{flex:1,color:colors.muted}]}>{salon.address??'Address not provided'}</Text></View>
    </View><DataStatus/>
    <View style={{padding:18,borderRadius:16,backgroundColor:colors.card,borderWidth:1,borderColor:colors.divider,flexDirection:'row',gap:18}}><View style={{flex:1,gap:5}}><Text style={type.caption}>Current queue</Text><Text style={[type.section,{color:colors.green}]}>{salon.waiting===0?'No queue':`${salon.waiting} waiting`}</Text></View><View style={{width:1,backgroundColor:colors.divider}}/><View style={{flex:1,gap:5}}><Text style={type.caption}>Earliest chair</Text><Text style={type.section}>{display.earliest==='Now'?'Ready now':display.earliest}</Text></View></View>
    <Text style={type.caption}>{waitLabel(display)} · Waits can change as haircuts finish.</Text>
    <VisitSelection horizontal catalog={catalog} salon={salon.id} barber={barber} onBarber={setBarber}/>
    {catalog.barbers.filter(b=>b.salon_id===salon.id&&b.id===barber).map(b=><Action key={b.id} label={`View ${b.display_name}`} secondary onPress={()=>router.push(`/barber/${b.id}`)}/>)}
    <SalonDirections salon={salon}/>
    <MenuRow icon={Images} title="My haircut photos" subtitle="Bring your ideas to your next visit." onPress={()=>router.push('/hairstyles')}/>
    <SectionHeading title="Opening hours"/><View style={{gap:12}}>{catalog.hours.filter(h=>h.salon_id===salon.id).map(h=><View key={h.weekday} style={{flexDirection:'row',justifyContent:'space-between',gap:10}}><Text style={type.body}>{['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][h.weekday]}</Text><Text style={type.body}>{h.opens_at.slice(0,5)}–{h.closes_at.slice(0,5)}</Text></View>)}</View>
    <SectionHeading title="Recent reviews"/>{reviews.slice(0,10).map(r=><View key={r.id} style={styles.card}><View style={styles.row}><Star size={17} fill={colors.amber} color={colors.amber}/><Text style={type.label}>{r.rating}/5 · {catalog.barbers.find(b=>b.id===r.barber_id)?.display_name}</Text></View>{r.body&&<Text style={type.body}>{r.body}</Text>}</View>)}
    {!reviews.length&&<Text style={type.caption}>Reviews appear after completed haircuts.</Text>}
    {!!salon.photo_attribution&&<Text style={type.caption}>{salon.photo_attribution}</Text>}
  </Screen>;
}
