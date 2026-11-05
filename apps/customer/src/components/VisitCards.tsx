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
import {colors,fonts,shadows,type} from '@/theme';

export function ReviewLink({queue,appointment}:{queue?:string;appointment?:string}) {
 const {visits}=useCustomer();
 const session=visits.sessions.find(s=>(!!queue&&s.queue_entry_id===queue)||(!!appointment&&s.appointment_id===appointment));
 if(!session||session.status!=='completed')return null;
 return visits.reviews.some(r=>r.service_session_id===session.id)?<Text style={type.caption}>Thanks for your review.</Text>:<Action label="Review your haircut" secondary onPress={()=>router.push(`/review/${session.id}`)}/>;
}
export function VisitCode({reference}:{reference:string}) {
 return <View style={{gap:5,paddingVertical:18,borderTopWidth:1,borderBottomWidth:1,borderStyle:'dashed',borderColor:colors.border}}><Text style={type.eyebrow}>YOUR VISIT CODE</Text><Text selectable style={{fontFamily:fonts.bold,fontSize:36,lineHeight:44,letterSpacing:5,color:colors.text}}>{reference}</Text><Text style={type.caption}>Show this code to your barber.</Text></View>;
}
function QueueProgress({status}:{status:string}) {
 const stage=status==='joined'?0:['arrived','in_service','completed'].indexOf(status);
 if(stage<0)return null;
 return <View style={{gap:12}}>{[{label:'Waiting',detail:'Your place is registered',icon:Clock3},{label:'In the chair',detail:'Your barber has started your haircut',icon:Scissors},{label:'Completed',detail:'Your haircut is finished',icon:Check}].map((item,i)=><View key={item.label} style={{flexDirection:'row',gap:12,alignItems:'center'}}><View style={{width:32,height:32,borderRadius:16,backgroundColor:stage>=i?colors.mint:colors.surface,justifyContent:'center',alignItems:'center'}}><item.icon size={17} color={stage>=i?colors.green:colors.muted}/></View><View style={{flex:1}}><Text style={[type.label,{color:stage>=i?colors.text:colors.muted}]}>{item.label}</Text>{stage===i&&<Text style={type.caption}>{item.detail}</Text>}</View>{stage>i&&<Check size={18} color={colors.green}/>}</View>)}</View>;
}
export function QueueCard({entry,confirmation=false,qr=false,onCancelled}:{entry:QueueEntry;confirmation?:boolean;qr?:boolean;onCancelled?:()=>void}) {
 const {catalog,refresh}=useCustomer(),{run,error,busy}=useVisitAction(),session=useSession();
 const [pending,setPending]=useState(false),[qrError,setQrError]=useState<string|null>(null);
 const receiptAction=async(action:'cancel'|'link')=>{if(pending)return;setPending(true);setQrError(null);try{await qrAction(entry.id,action);await refresh();if(action==='cancel')onCancelled?.();}catch(e){setQrError(e instanceof Error?e.message:'Please retry.');}finally{setPending(false);}};
 const salon=catalog?.salons.find(s=>s.id===entry.salon_id),barber=catalog?.barbers.find(b=>b.id===(entry.assigned_barber_id??entry.preferred_barber_id));
 return <View style={{gap:18}}>
   {confirmation&&<View style={{alignItems:'center',gap:14,paddingVertical:8}}><View style={{width:62,height:62,borderRadius:31,backgroundColor:colors.action,alignItems:'center',justifyContent:'center'}}><Check size={32} color={colors.onAction}/></View><Text accessibilityRole="header" style={[type.title,{fontSize:28,lineHeight:34,textAlign:'center'}]}>{activeQueue(entry)?"You're in.\nWe'll take it from here.":'Your queue visit'}</Text><Text style={[type.caption,{textAlign:'center'}]}>Your place is saved. Show your code to your barber.</Text></View>}
   <View style={{boxShadow:shadows.card,backgroundColor:colors.ticket,borderRadius:20,overflow:'hidden'}}>
    <View style={{padding:22,gap:7}}><Text style={[type.eyebrow,{color:colors.ticketMuted}]}>YOUR VISIT CODE</Text><Text selectable style={{fontFamily:fonts.medium,fontSize:38,lineHeight:46,letterSpacing:5,color:colors.ticketInk}}>{entry.reference}</Text><Text style={[type.caption,{color:colors.ticketMuted}]}>Show this code to your barber.</Text></View>
    <View style={{borderTopWidth:1,borderStyle:'dashed',borderColor:colors.ticketDivider}}><View style={{position:'absolute',left:-9,top:-9,width:18,height:18,borderRadius:9,backgroundColor:colors.background}}/><View style={{position:'absolute',right:-9,top:-9,width:18,height:18,borderRadius:9,backgroundColor:colors.background}}/></View>
    <View style={{padding:22,gap:10}}><Text style={[type.section,{color:colors.ticketInk}]}>{salon?.name??entry.salon_name??'Salon'}</Text><Text style={[type.body,{color:colors.ticketMuted}]}>{barber?.display_name??entry.barber_name??'Any Available Barber'}{entry.service_name?` · ${entry.service_name}`:''}</Text><View style={{flexDirection:'row',gap:20,marginTop:8}}><View style={{flex:1,gap:5}}><Text style={[type.caption,{color:colors.ticketMuted}]}>Status</Text><Text style={[type.label,{color:colors.ticketInk}]}>{['joined','arrived'].includes(entry.status)?'Waiting':statusLabel(entry.status)}</Text></View>{activeQueue(entry)&&<View style={{flex:1,gap:5}}><Text style={[type.caption,{color:colors.ticketMuted}]}>Estimated start</Text><Text style={[type.label,{color:colors.ticketInk}]}>{entry.estimated_start?time(entry.estimated_start):'Check with salon'}</Text></View>}</View></View>
   </View>
   {activeQueue(entry)&&!confirmation&&<QueueProgress status={entry.status}/>}
   {['joined','arrived'].includes(entry.status)&&<Notice>You are in the waiting queue. Head to the salon and show this code to your barber. Staff will handle the rest; this screen updates automatically.</Notice>}
   {['joined','arrived'].includes(entry.status)&&<Action label="Cancel queue entry" secondary disabled={busy||pending} onPress={()=>{if(qr)void receiptAction('cancel');else void run('cancel_queue',{id:entry.id},()=>onCancelled?.());}}/>}
   {qr&&session.status==='authenticated'&&entry.status==='arrived'&&<Action label="Link this visit to my account" secondary disabled={pending} onPress={()=>{void receiptAction('link');}}/>}
   {(error||qrError)&&<Text accessibilityRole="alert" style={[type.body,{color:colors.error}]}>{error??qrError}</Text>}<ReviewLink queue={entry.id}/>
 </View>;
}
export function AppointmentCard({entry,onCancelled}:{entry:Appointment;onCancelled?:()=>void}) {
 const {catalog,visits}=useCustomer(),{run,error,busy}=useVisitAction();
 const salon=catalog?.salons.find(s=>s.id===entry.salon_id),date=entry.confirmed_start??entry.requested_start,barber=catalog?.barbers.find(b=>b.id===(entry.confirmed_barber_id??entry.preferred_barber_id));
 const proposal=visits.proposals.filter(p=>p.appointment_id===entry.id).sort((a,b)=>b.suggested_at.localeCompare(a.suggested_at))[0];
 return <View style={styles.card}><StatusPill label={statusLabel(entry.status)} tone={['confirmed','completed'].includes(entry.status)?'success':['pending','alternative_suggested'].includes(entry.status)?'warning':'neutral'}/>
   <Text style={type.section}>{salon?.name??entry.salon_name??'Salon'}</Text><View style={{padding:16,borderRadius:16,backgroundColor:colors.brandSoft,flexDirection:'row',gap:12,alignItems:'center'}}><CalendarDays size={28} color={colors.action}/><View style={{flex:1,gap:3}}><Text style={type.section}>{visitDate(date)}</Text><Text style={type.body}>{time(date)} · Sri Lanka time</Text></View></View><Text style={type.body}>{entry.service_name??'Haircut'} · {barber?.display_name??entry.barber_name??'Any Available Barber'}</Text>
   <VisitCode reference={entry.reference}/>
   {entry.status==='pending'&&<Text style={type.caption}>Your time is held while the salon reviews your request. Wait for confirmation here before travelling; you do not need to join the queue as well.</Text>}
   {entry.status==='confirmed'&&<Notice>Your time is confirmed. Show this code to staff when you arrive. They will check in this appointment; do not create another queue entry.</Notice>}
   {entry.status==='arrived'&&<Notice>You are checked in. Your barber will call you when your chair is ready.</Notice>}
   {entry.status==='in_service'&&<Text style={type.caption}>Your haircut is underway. You can leave a review after it is completed.</Text>}
   {['cancelled','declined','no_show'].includes(entry.status)&&salon&&<Action label="Choose another time" secondary onPress={()=>router.push(`/salon/${salon.id}/appointment`)}/>}
   {entry.status==='alternative_suggested'&&proposal&&<><Notice>Alternative time: {visitDate(proposal.starts_at)} at {time(proposal.starts_at)}.</Notice><Action label="Accept alternative time" disabled={busy} onPress={()=>{void run('accept_alternative',{id:entry.id,proposal_id:proposal.id});}}/></>}
   {['pending','alternative_suggested','confirmed'].includes(entry.status)&&<Action label="Cancel appointment" secondary disabled={busy} onPress={()=>{void run('cancel_appointment',{id:entry.id},()=>onCancelled?.());}}/>}
   {error&&<Text accessibilityRole="alert" style={[type.body,{color:colors.error}]}>{error}</Text>}<ReviewLink appointment={entry.id}/>
 </View>;
}
