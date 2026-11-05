import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { Action, Notice, Screen } from '@/components/UI';
import { DataStatus, Field, PrivateGate, styles, useRefreshOnFocus, useVisitAction } from '@/components/CustomerUI';
import { Calendar, addDays } from '@/components/Calendar';
import { StepIndicator } from '@/components/Experience';
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
    void run('request_appointment',{salon_id:salon!.id,collection_id:haircut,barber_id:barber,starts_at:selected,customer_name:name,mobile,request_key:retry.current.key},entry=>router.replace(`/appointments?created=${entry}`));
  };
  return <Screen title="Request Appointment" scrollRef={scrollRef} footer={salon&&catalog?<>
    <Text style={type.label}>{selected?`${visitDate(selected)} · ${time(selected)}`:'Choose a time to continue'}</Text>
    {step===0?<Action label="Review appointment" disabled={busy||loading||stale} onPress={()=>{setSubmitted(true);if(canSubmit)goStep(1);else scrollRef.current?.scrollTo({y:timesY.current,animated:false});}}/>:session.status==='authenticated'?<Action label={busy?'Sending request…':'Request Appointment'} disabled={busy||loading||stale||!canSubmit} onPress={confirm}/>:null}
  </>:undefined}>
    {step===1&&<StepIndicator current={step}/>}<Text accessibilityRole="header" style={type.title}>{step===0?<>Make time{'\n'}<Text style={{color:colors.action}}>for yourself.</Text></>:'Make it your kind of haircut.'}</Text>
    <Text style={type.body}>{salon?.name??'Choose your visit'}</Text><DataStatus/>
    {catalog&&!salon&&<Text style={type.body}>Salon not found. Return to salons to choose another.</Text>}
    {catalog&&salon&&<>
      {step===0?<>
        <VisitSelection compact catalog={catalog} salon={salon.id} barber={barber} onBarber={v=>{setBarber(v);setSelected(null);}}/>
        <Calendar today={catalog.today} lastDay={addDays(catalog.today,salon.booking_horizon_days)} value={date} onChange={v=>{setDay(v);setSelected(null);}}/>
        <View onLayout={event=>{timesY.current=event.nativeEvent.layout.y;}}><Text accessibilityRole="header" style={type.section}>Available times · {visitDate(`${date}T12:00:00+05:30`)}</Text></View>
        <Text style={type.caption}>Sri Lanka time · Unavailable times cannot be selected.</Text>
        {loading&&<ActivityIndicator color={colors.action} accessibilityLabel="Loading available times"/>}
        {slotError&&<Notice>{slotError}</Notice>}
        <View style={{gap:18,borderWidth:submitted&&!canSubmit?1:0,borderColor:colors.error,borderRadius:16,padding:submitted&&!canSubmit?8:0}}>
          {['Morning','Afternoon','Evening'].map((label,i)=>{
            const group=grouped.filter(slot=>{const h=Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Colombo',hour:'2-digit',hourCycle:'h23'}).format(new Date(slot.start)));return i===0?h<12:i===1?h>=12&&h<17:h>=17;});
            return group.length?<View key={label} style={{gap:10}}><Text style={type.label}>{label}</Text><View style={styles.row}>{group.map(slot=><Pressable key={slot.start} accessibilityRole="button" accessibilityLabel={`${time(slot.start)}${slot.available?'':' unavailable'}`} accessibilityState={{disabled:!slot.available||loading,selected:slot.available&&selected===slot.start}} disabled={!slot.available||loading} onPress={()=>setSelected(slot.start)} style={({pressed})=>({minHeight:48,width:'31%',flexGrow:0,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:selected===slot.start?colors.action:colors.divider,borderRadius:10,padding:8,opacity:pressed?0.7:1,backgroundColor:!slot.available?colors.surface:selected===slot.start?colors.action:colors.card})}><Text style={[type.label,{color:selected===slot.start&&slot.available?colors.onAction:colors.text,textDecorationLine:slot.available?'none':'line-through'}]}>{time(slot.start)}</Text>{!slot.available&&<Text style={type.caption}>Unavailable</Text>}</Pressable>)}</View></View>:null;
          })}
        </View>
        {!loading&&loadedFor===signature&&!grouped.some(s=>s.available)&&<Notice>No times are available for this selection. Choose another day or barber.</Notice>}
        {submitted&&!selected&&<Text accessibilityRole="alert" style={[type.caption,{color:colors.error}]}>Choose an available time.</Text>}
        <Action label="Refresh times" secondary onPress={()=>{void refresh();}}/>
      </>:<>
        <View style={[styles.card,{backgroundColor:colors.brandSoft}]}><Text style={type.eyebrow}>YOUR APPOINTMENT REQUEST</Text><Text style={type.section}>{salon.name}</Text><Text style={type.body}>{selected?visitDate(selected):''} · {selected?time(selected):''}</Text><Text style={type.body}>{catalog.barbers.find(b=>b.id===barber)?.display_name??'Any Available Barber'}</Text><Text style={type.caption}>Sri Lanka time</Text><Action label="Change date, time or barber" secondary onPress={()=>goStep(0)}/></View>
        <Notice>This is a request. Your time is held while the salon reviews it. You will see their response in Bookings.</Notice>
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
