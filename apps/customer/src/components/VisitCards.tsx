import {router} from 'expo-router';
import {useState} from 'react';
import {CalendarDays, Check, Clock3, Scissors} from 'lucide-react-native';
import {Text,View} from 'react-native';
import {Action,Notice,StatusPill} from './UI';
import {styles,useVisitAction} from './CustomerUI';
import {activeQueue,statusLabel,time,visitDate,type QueueEntry,type Appointment} from '@/lib/customer-types';
import {useCustomer} from '@/providers/CustomerProvider';
import {useSession} from '@/providers/SessionProvider';
import {qrAction} from '@/lib/qr-visits';
import {colors,fonts,type} from '@/theme';

export function ReviewLink({queue,appointment}:{queue?:string;appointment?:string}) {
 const {visits}=useCustomer();
 const session=visits.sessions.find(s=>(!!queue&&s.queue_entry_id===queue)||(!!appointment&&s.appointment_id===appointment));
 if(!session||session.status!=='completed')return null;
 return visits.reviews.some(r=>r.service_session_id===session.id)?<Text style={type.caption}>Thanks for your review.</Text>:<Action label="Review your haircut" secondary onPress={()=>router.push(`/review/${session.id}`)}/>;
}
function VisitCode({reference}:{reference:string}) {
 return <View style={{gap:5,paddingVertical:18,borderTopWidth:1,borderBottomWidth:1,borderStyle:'dashed',borderColor:colors.border}}><Text style={type.eyebrow}>YOUR VISIT CODE</Text><Text selectable style={{fontFamily:fonts.bold,fontSize:36,lineHeight:44,letterSpacing:5,color:colors.text}}>{reference}</Text><Text style={type.caption}>Show this code to your barber.</Text></View>;
}
function QueueProgress({status}:{status:string}) {
 const stage=['joined','arrived','in_service','completed'].indexOf(status);
 if(stage<0)return null;
 return <View style={{gap:12}}>{[{label:'Joined',detail:'Your visit is registered',icon:Check},{label:'At the salon',detail:'Arrival recorded',icon:Clock3},{label:'In the chair',detail:'Your haircut is underway',icon:Scissors}].map((item,i)=><View key={item.label} style={{flexDirection:'row',gap:12,alignItems:'center'}}><View style={{width:32,height:32,borderRadius:16,backgroundColor:stage>=i?colors.mint:colors.surface,justifyContent:'center',alignItems:'center'}}><item.icon size={17} color={stage>=i?colors.green:colors.muted}/></View><View style={{flex:1}}><Text style={[type.label,{color:stage>=i?colors.text:colors.muted}]}>{item.label}</Text>{stage===i&&<Text style={type.caption}>{item.detail}</Text>}</View>{stage>i&&<Check size={18} color={colors.green}/>}</View>)}</View>;
}
export function QueueCard({entry,confirmation=false,qr=false}:{entry:QueueEntry;confirmation?:boolean;qr?:boolean}) {
 const {catalog,refresh}=useCustomer(),{run,error,busy}=useVisitAction(),session=useSession();
 const [pending,setPending]=useState(false),[qrError,setQrError]=useState<string|null>(null);
 const receiptAction=async(action:'cancel'|'link')=>{if(pending)return;setPending(true);setQrError(null);try{await qrAction(entry.id,action);await refresh();}catch(e){setQrError(e instanceof Error?e.message:'Please retry.');}finally{setPending(false);}};
 const salon=catalog?.salons.find(s=>s.id===entry.salon_id),barber=catalog?.barbers.find(b=>b.id===(entry.assigned_barber_id??entry.preferred_barber_id));
 return <View style={styles.card}>
   {confirmation&&<Text accessibilityRole="header" style={type.title}>{activeQueue(entry)?'You’re in the queue!':'Your queue visit'}</Text>}
   <StatusPill label={statusLabel(entry.status)} tone={['arrived','in_service','completed'].includes(entry.status)?'success':entry.status==='joined'?'warning':'neutral'}/>
   <Text style={type.section}>{salon?.name??entry.salon_name??'Salon'}</Text><Text style={type.body}>{barber?.display_name??entry.barber_name??'Any Available Barber'} · {entry.service_name??'Haircut'}</Text>
   <VisitCode reference={entry.reference}/>
   {activeQueue(entry)&&<><View style={{padding:14,borderRadius:14,backgroundColor:colors.mint,gap:4}}><Text style={type.caption}>Estimated start</Text><Text style={[type.section,{color:colors.green}]}>{entry.estimated_start?time(entry.estimated_start):'Check with your salon'}</Text></View><QueueProgress status={entry.status}/></>}
   {entry.status==='joined'&&<><Notice>Check in when you reach the salon to join the physical waiting list.</Notice><Action label="I’ve Arrived — Check In" disabled={busy} onPress={()=>{void run('check_in',{id:entry.id});}}/></>}
   {['joined','arrived'].includes(entry.status)&&<Action label="Cancel queue entry" secondary disabled={busy||pending} onPress={()=>{if(qr)void receiptAction('cancel');else void run('cancel_queue',{id:entry.id});}}/>}
   {qr&&session.status==='authenticated'&&entry.status==='arrived'&&<Action label="Link this visit to my account" secondary disabled={pending} onPress={()=>{void receiptAction('link');}}/>}
   {(error||qrError)&&<Text accessibilityRole="alert" style={[type.body,{color:colors.error}]}>{error??qrError}</Text>}<ReviewLink queue={entry.id}/>
 </View>;
}
export function AppointmentCard({entry}:{entry:Appointment}) {
 const {catalog,visits}=useCustomer(),{run,error,busy}=useVisitAction();
 const salon=catalog?.salons.find(s=>s.id===entry.salon_id),date=entry.confirmed_start??entry.requested_start,barber=catalog?.barbers.find(b=>b.id===(entry.confirmed_barber_id??entry.preferred_barber_id));
 const proposal=visits.proposals.filter(p=>p.appointment_id===entry.id).sort((a,b)=>b.suggested_at.localeCompare(a.suggested_at))[0];
 return <View style={styles.card}><StatusPill label={statusLabel(entry.status)} tone={['confirmed','completed'].includes(entry.status)?'success':['pending','alternative_suggested'].includes(entry.status)?'warning':'neutral'}/>
   <Text style={type.section}>{salon?.name??entry.salon_name??'Salon'}</Text><View style={{padding:16,borderRadius:16,backgroundColor:colors.peach,flexDirection:'row',gap:12,alignItems:'center'}}><CalendarDays size={28} color={colors.action}/><View style={{flex:1,gap:3}}><Text style={type.section}>{visitDate(date)}</Text><Text style={type.body}>{time(date)} · Sri Lanka time</Text></View></View><Text style={type.body}>{entry.service_name??'Haircut'} · {barber?.display_name??entry.barber_name??'Any Available Barber'}</Text>
   <VisitCode reference={entry.reference}/>
   {entry.status==='pending'&&<Text style={type.caption}>Your time is held while the salon reviews your request.</Text>}
   {entry.status==='alternative_suggested'&&proposal&&<><Notice>Alternative time: {visitDate(proposal.starts_at)} at {time(proposal.starts_at)}.</Notice><Action label="Accept alternative time" disabled={busy} onPress={()=>{void run('accept_alternative',{id:entry.id,proposal_id:proposal.id});}}/></>}
   {['pending','alternative_suggested','confirmed'].includes(entry.status)&&<Action label="Cancel appointment" secondary disabled={busy} onPress={()=>{void run('cancel_appointment',{id:entry.id});}}/>}
   {error&&<Text accessibilityRole="alert" style={[type.body,{color:colors.error}]}>{error}</Text>}<ReviewLink appointment={entry.id}/>
 </View>;
}
