import { router, useLocalSearchParams } from 'expo-router';
import { CalendarDays, Clock3, Images, MapPin, Star, UserRound, Users } from 'lucide-react-native';
import { Image, Pressable, Text, View } from 'react-native';
import { Action, Screen, SectionHeading, StatusPill } from '@/components/UI';
import { MenuRow, Photo } from '@/components/Experience';
import { DataStatus, styles, useRefreshOnFocus } from '@/components/CustomerUI';
import { salonDisplay, waitLabel } from '@/data/salons';
import { useCustomer } from '@/providers/CustomerProvider';
import { colors, type } from '@/theme';

export default function SalonScreen() {
  const { id } = useLocalSearchParams<{id:string}>();
  const { catalog, stale } = useCustomer();
  useRefreshOnFocus();
  const salon = catalog?.salons.find(s => s.slug === id || s.id === id);
  if (!catalog || !salon) return <Screen title="Salon"><DataStatus/>{catalog&&<><Text style={type.section}>Salon not found</Text><Action label="Browse salons" onPress={()=>router.replace('/salons')}/></>}</Screen>;
  const display=salonDisplay(salon,catalog),staff=catalog.barbers.filter(b=>b.salon_id===salon.id),reviews=catalog.reviews.filter(r=>r.salon_id===salon.id);
  return <Screen title={salon.name} footer={<View style={{flexDirection:'row',gap:10}}><View style={{flex:1}}><Action label={salon.open_now?'Join Queue':'Salon closed'} disabled={!salon.open_now||stale} onPress={()=>router.push(`/salon/${salon.slug}/join`)}/></View><View style={{flex:1}}><Action label="Request Appointment" secondary onPress={()=>router.push(`/salon/${salon.slug}/appointment`)}/></View></View>}>
    <Photo source={display.photo} label={`${salon.name} photo`} height={220}/>
    <View style={{gap:8}}><StatusPill label={salon.open_now?'Open now':'Closed now'} tone={salon.open_now?'success':'neutral'}/><Text accessibilityRole="header" style={type.title}>{salon.name}</Text>
      <View style={styles.row}><Star size={17} color={colors.amber}/><Text style={type.caption}>{salon.review_count?`${salon.rating} · ${salon.review_count} reviews`:'No reviews yet'}</Text></View>
      <View style={{flexDirection:'row',gap:8}}><MapPin size={17} color={colors.muted}/><Text style={[type.body,{flex:1,color:colors.muted}]}>{salon.address??'Address not provided'}</Text></View>
    </View><DataStatus/>
    <View style={{padding:20,borderRadius:22,backgroundColor:colors.mint,gap:16}}><View style={styles.row}><Clock3 size={22} color={colors.green}/><Text style={[type.section,{color:colors.green}]}>{waitLabel(display)}</Text></View><View style={{flexDirection:'row',gap:20}}><View style={{flex:1,gap:4}}><Text style={type.title}>{display.earliest}</Text><Text style={type.caption}>Earliest estimated service</Text></View><View style={{gap:4}}><View style={styles.row}><Users size={20} color={colors.green}/><Text style={type.title}>{salon.waiting}</Text></View><Text style={type.caption}>physically waiting</Text></View></View><Text style={type.caption}>Waits are estimates and can change as haircuts finish.</Text></View>
    <MenuRow icon={CalendarDays} title="View calendar & times" subtitle="Pick a date, choose a time, request your visit." onPress={()=>router.push(`/salon/${salon.slug}/appointment`)}/>
    <SectionHeading title="Meet your barbers"/>
    {staff.map(b=><Pressable key={b.id} accessibilityRole="button" accessibilityLabel={`View ${b.display_name}`} onPress={()=>router.push(`/barber/${b.id}`)} style={({pressed})=>({flexDirection:'row',gap:14,alignItems:'center',paddingVertical:10,opacity:pressed?0.7:1})}>
      <View style={{width:64,height:64,borderRadius:22,backgroundColor:colors.peach,overflow:'hidden',alignItems:'center',justifyContent:'center'}}>{b.photo_url?<Image source={{uri:b.photo_url}} style={{width:64,height:64}}/>:<UserRound size={28} color={colors.action}/>}</View><View style={{flex:1,gap:5}}><Text style={type.section}>{b.display_name}</Text><Text style={type.caption}>{b.review_count?`${b.rating} · ${b.review_count} reviews`:'No reviews yet'}</Text><StatusPill label={b.availability==='available'?'Available':b.availability.replaceAll('_',' ')} tone={b.availability==='available'?'success':'neutral'}/></View>
    </Pressable>)}
    {!staff.length&&<Text style={type.body}>The salon is updating its barber team.</Text>}
    <MenuRow icon={Images} title="My haircut photos" subtitle="Bring your ideas to your next visit." onPress={()=>router.push('/hairstyles')}/>
    <SectionHeading title="Opening hours"/><View style={{gap:12}}>{catalog.hours.filter(h=>h.salon_id===salon.id).map(h=><View key={h.weekday} style={{flexDirection:'row',justifyContent:'space-between',gap:10}}><Text style={type.body}>{['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][h.weekday]}</Text><Text style={type.body}>{h.opens_at.slice(0,5)}–{h.closes_at.slice(0,5)}</Text></View>)}</View>
    <SectionHeading title="Recent reviews"/>{reviews.slice(0,10).map(r=><View key={r.id} style={styles.card}><View style={styles.row}><Star size={17} fill={colors.amber} color={colors.amber}/><Text style={type.label}>{r.rating}/5 · {catalog.barbers.find(b=>b.id===r.barber_id)?.display_name}</Text></View>{r.body&&<Text style={type.body}>{r.body}</Text>}</View>)}
    {!reviews.length&&<Text style={type.caption}>Reviews appear after completed haircuts.</Text>}
    {!!salon.photo_attribution&&<Text style={type.caption}>{salon.photo_attribution}</Text>}
  </Screen>;
}
