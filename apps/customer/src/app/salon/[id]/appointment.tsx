import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { Action, Notice, Screen } from '@/components/UI';
import { DataStatus, Field, PrivateGate, styles, useRefreshOnFocus, useVisitAction } from '@/components/CustomerUI';
import { Calendar, addDays } from '@/components/Calendar';
import { Photo } from '@/components/Experience';
import { CalendarDays, Clock3, UserRound, Star } from 'lucide-react-native';
import { useMotionPreference } from '@/components/RouteMotion';
import { useSession } from '@/providers/SessionProvider';
import {HaircutPicker} from '@/components/HaircutPicker';
import { VisitSelection } from '@/components/VisitSelection';
import { fetchSlots, requestKey } from '@/lib/customer-api';
import { time, visitDate, type Slot } from '@/lib/customer-types';
import { useCustomer } from '@/providers/CustomerProvider';
import { colors, type } from '@/theme';
export default function AppointmentScreen() {
  const { id, barber: preferred, day: initialDay, at, stage } = useLocalSearchParams<{
    id: string;
    barber?: string;
    day?: string;
    at?: string;
    stage?: string;
  }>();
  const { catalog, stale, refresh } = useCustomer();
  const reduced=useMotionPreference();
  useRefreshOnFocus();
  const salon = catalog?.salons.find(s => s.slug === id || s.id === id);
  const service=null;
  const session=useSession();
  const [step,setStep]=useState(stage==='review'&&at?1:0);
  const scrollRef=useRef<ScrollView>(null);
  const timesY=useRef(0);
  const goStep=(next:number)=>{setStep(next);scrollRef.current?.scrollTo({y:0,animated:false});};
  const [haircut,setHaircut]=useState<string|null>(null),[submitted,setSubmitted]=useState(false);
  const [barber, setBarber] = useState<string | null>(preferred || null);
  const [day, setDay] = useState(initialDay&&/^\d{4}-\d{2}-\d{2}$/.test(initialDay)&&Number.isFinite(Date.parse(`${initialDay}T12:00:00Z`))?initialDay:'');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotError, setSlotError] = useState<string | null>(null);
  const [settled, setSettled] = useState('');
  const [selected, setSelected] = useState<string | null>(at&&Number.isFinite(Date.parse(at))?at:null);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const { run, error, busy } = useVisitAction();
  const retry = useRef({ signature: '', key: requestKey() });
  const lastDay=catalog&&salon?addDays(catalog.today,salon.booking_horizon_days):'';
  const date = day&&catalog&&day>=catalog.today&&day<=lastDay?day:catalog?.today||'';
  const signature = [salon?.id, service, barber, date].join(':');
  const queryVersion = signature + catalog?.observed_at;
  const loading = !!salon && settled !== queryVersion;
  const [loadedFor, setLoadedFor] = useState('');
  useEffect(() => {
    if (!salon || !date)
      return;
    let alive = true;
    void fetchSlots(salon.id, service, date, barber).then(result => { if (alive) {
      setSlots(result);
      setSlotError(null);
      setLoadedFor(signature);
      setSettled(queryVersion);
    } }, () => { if (alive) {
      setSlotError('Could not load available times. Refresh and try again.');
      setSettled(queryVersion);
      setLoadedFor('');
    } });
    return () => { alive = false; };
  }, [salon, service, date, barber, signature, queryVersion]);
  const grouped = loadedFor === signature ? Array.from(new Set(slots.map(s => s.starts_at))).sort().map(start => ({ start, available: slots.some(s => s.starts_at === start && s.available) })) : [];
  const canSubmit = !!selected && grouped.some(s => s.start === selected && s.available) && !loading && !stale;
  const confirm = () => {
    setSubmitted(true); if(!canSubmit)return;
    const submission=JSON.stringify([signature,selected,haircut,name,mobile]);
    if(retry.current.signature!==submission)retry.current={signature:submission,key:requestKey()};
    void run('request_appointment',{salon_id:salon!.id,collection_id:haircut,barber_id:barber,starts_at:selected,customer_name:name,mobile,request_key:retry.current.key},entry=>router.replace(`/visits?created=${entry}`));
  };
  return <Screen title={step===0?"Request appointment":"Review appointment"} scrollRef={scrollRef} footer={salon&&catalog?<>
    <Text style={type.label}>{loading?'Finding available times…':selected?`${visitDate(selected)} · ${time(selected)}`:'Choose a time to continue'}</Text>
    {step===0?<Action label="Review appointment" disabled={busy||loading||stale} onPress={()=>{setSubmitted(true);if(canSubmit)goStep(1);else scrollRef.current?.scrollTo({y:timesY.current,animated:false});}}/>:session.status==='authenticated'?<Action loading={busy} label={busy?'Sending request…':'Request Appointment'} disabled={busy||loading||stale||!canSubmit} onPress={confirm}/>:null}
  </>:undefined}>
    {salon&&<View style={{flexDirection:'row',alignItems:'center',gap:14,paddingVertical:6}}><View style={{width:72}}><Photo source={salon.photo_url?{uri:salon.photo_url}:null} label={`${salon.name} photo`} height={72} radius={14}/></View><View style={{flex:1,gap:5}}><Text style={type.section}>{salon.name}</Text><Text numberOfLines={1} style={type.caption}>{salon.address??'Your salon'}</Text><View style={{flexDirection:'row',alignItems:'center',gap:5}}><Star size={14} color={colors.amber}/><Text style={type.caption}>{salon.review_count?`${salon.rating} (${salon.review_count})`:'No reviews yet'}</Text></View></View></View>}<DataStatus/>
    {catalog&&!salon&&<Text style={type.body}>Salon not found. Return to salons to choose another.</Text>}
    {catalog&&salon&&<>
      {step===0?<>
        <VisitSelection compact catalog={catalog} salon={salon.id} barber={barber} onBarber={v=>{setBarber(v);setSelected(null);}}/>
        <Text accessibilityRole="header" style={type.section}>Choose a date</Text>
        <Calendar today={catalog.today} lastDay={addDays(catalog.today,salon.booking_horizon_days)} value={date} onChange={v=>{setDay(v);setSelected(null);requestAnimationFrame(()=>scrollRef.current?.scrollTo({y:timesY.current,animated:!reduced}));}}/>
        <View onLayout={event=>{timesY.current=event.nativeEvent.layout.y;}}><Text accessibilityRole="header" style={type.section}>Choose a time</Text></View>
        <Text style={type.caption}>{visitDate(`${date}T12:00:00+05:30`)} · Sri Lanka time</Text>
        {loading&&<ActivityIndicator color={colors.action} accessibilityLabel="Loading available times"/>}
        {slotError&&<Notice>{slotError}</Notice>}
        <View style={{gap:18,borderWidth:submitted&&!canSubmit?1:0,borderColor:colors.error,borderRadius:16,padding:submitted&&!canSubmit?8:0}}>
          {['Morning','Afternoon','Evening'].map((label,i)=>{
            const group=grouped.filter(slot=>{const h=Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Colombo',hour:'2-digit',hourCycle:'h23'}).format(new Date(slot.start)));return i===0?h<12:i===1?h>=12&&h<17:h>=17;});
            return group.length?<View key={label} style={{gap:10}}><Text style={type.label}>{label}</Text><View style={styles.row}>{group.map(slot=><Pressable key={slot.start} accessibilityRole="button" accessibilityLabel={`${time(slot.start)}${slot.available?'':' unavailable'}`} accessibilityState={{disabled:!slot.available||loading,selected:slot.available&&selected===slot.start}} disabled={!slot.available||loading} onPress={()=>setSelected(slot.start)} style={({pressed})=>({minHeight:48,width:'31%',flexGrow:0,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:selected===slot.start?colors.action:colors.divider,borderRadius:22,padding:8,opacity:pressed?0.7:1,backgroundColor:!slot.available?colors.surface:selected===slot.start?colors.action:colors.card})}><Text style={[type.label,{color:selected===slot.start&&slot.available?colors.onAction:colors.text,textDecorationLine:slot.available?'none':'line-through'}]}>{time(slot.start)}</Text>{!slot.available&&<Text style={type.caption}>Unavailable</Text>}</Pressable>)}</View></View>:null;
          })}
        </View>
        {!loading&&loadedFor===signature&&!grouped.some(s=>s.available)&&<Notice>No times are available for this selection. Choose another day or barber.</Notice>}
        {submitted&&!selected&&<Text accessibilityRole="alert" style={[type.caption,{color:colors.error}]}>Choose an available time.</Text>}
        <Action label="Refresh times" secondary onPress={()=>{void refresh();}}/>
      </>:<>
        <View style={styles.card}>{[{Icon:CalendarDays,label:selected?visitDate(selected):'Choose a date'},{Icon:Clock3,label:selected?`${time(selected)} · Sri Lanka time`:'Choose a time'},{Icon:UserRound,label:catalog.barbers.find(b=>b.id===barber)?.display_name??'Any Available Barber'}].map(({Icon,label},i)=><View key={i} style={{flexDirection:'row',alignItems:'center',gap:12,minHeight:36}}><Icon size={21} color={colors.action}/><Text style={[type.body,{flex:1}]}>{label}</Text></View>)}<Action label="Change date, time or barber" secondary onPress={()=>goStep(0)}/></View>

        <Notice>This is a request. Your time is held while the salon reviews it. You will see their response in My visits.</Notice>
        <PrivateGate destination={`/salon/${salon.slug}/appointment?day=${date}&at=${encodeURIComponent(selected??'')}&barber=${barber??''}&stage=review`}><HaircutPicker value={haircut} onChange={setHaircut}/>
          <Text style={type.section}>Contact details</Text><Text style={type.caption}>Optional, if the salon needs to reach you.</Text>
          <Field label="Name (optional)" value={name} onChange={setName}/><Field label="Mobile (optional)" value={mobile} onChange={setMobile} maxLength={32}/>
        </PrivateGate>
      </>}
      {selected&&!canSubmit&&!loading&&!slotError&&<Notice>This selection is no longer available. Pick another time.</Notice>}
      {error&&<Text accessibilityRole="alert" style={[type.body,{color:colors.error}]}>{error}</Text>}
      {step===1&&(!canSubmit||error)&&<Action label="Refresh times" secondary onPress={()=>{void refresh();goStep(0);}}/>}
    </>}
  </Screen>;
}
