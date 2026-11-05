import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { CalendarDays } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { Screen, Chip, Action, Notice } from '@/components/UI';
import { DataStatus, PrivateGate, useRefreshOnFocus } from '@/components/CustomerUI';
import { EmptyState } from '@/components/Experience';
import { AppointmentCard, QueueCard } from '@/components/VisitCards';
import { useCustomer } from '@/providers/CustomerProvider';
import { activeQueue, activeAppointment } from '@/lib/customer-types';
import { useSession } from '@/providers/SessionProvider';
import { type, colors } from '@/theme';
export default function Visits() {
 const {created}=useLocalSearchParams<{created?:string}>();
 const {visits,qrQueues}=useCustomer();useRefreshOnFocus();const [past,setPast]=useState(false);
 const session=useSession(),uid=session.status==='authenticated'?session.session?.user.id??null:null;
 const [feedback,setFeedback]=useState<{uid:string|null}|null>(null);
 const cancelled=()=>setFeedback({uid});
 const queues=[...visits.queues,...qrQueues.filter(q=>!visits.queues.some(v=>v.id===q.id))].filter(q=>activeQueue(q)!==past);
 const appointments=visits.appointments.filter(a=>activeAppointment(a)!==past);
 return <Screen title="My visits" tab><Text accessibilityRole="header" style={type.title}>Good things,{'\n'}<Text style={{color:colors.action}}>coming up.</Text></Text><View style={{flexDirection:'row',gap:8}}><Chip label="Upcoming" selected={!past} onPress={()=>{setPast(false);setFeedback(null);}}/><Chip label="Past visits" selected={past} onPress={()=>{setPast(true);setFeedback(null);}}/></View><DataStatus/>{feedback&&feedback.uid===uid&&!past&&<View accessibilityLiveRegion="polite" style={{padding:16,borderRadius:16,backgroundColor:colors.brandSoft,gap:5}}><Text style={type.label}>Cancelled</Text><Text style={type.caption}>Your visit was cancelled. You can find it in Past visits.</Text></View>}{created&&visits.appointments.some(a=>a.id===created&&a.status==='pending')&&<Notice>Appointment request sent. Your time is held while the salon reviews it.</Notice>}{queues.map(q=><QueueCard key={q.id} entry={q} onCancelled={cancelled} qr={qrQueues.some(v=>v.id===q.id)}/>)}<PrivateGate>{appointments.map(a=><AppointmentCard key={a.id} entry={a} onCancelled={cancelled}/>)}{!queues.length&&!appointments.length&&<EmptyState icon={CalendarDays} title={past?'Your story starts here.':'Nothing planned yet.'} description="Find a salon, join a queue or request a time that suits you."><Action label="Explore salons" onPress={()=>router.navigate('/salons')}/></EmptyState>}<View style={{flexDirection:'row',gap:10}}><View style={{flex:1}}><Action label="My queue" secondary onPress={()=>router.navigate('/queue')}/></View><View style={{flex:1}}><Action label="Appointments" secondary onPress={()=>router.navigate('/appointments')}/></View></View></PrivateGate></Screen>;
}
