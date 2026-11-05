import { useState } from 'react';
import { router } from 'expo-router';
import { CalendarDays } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { Screen, Chip, Action } from '@/components/UI';
import { DataStatus, PrivateGate, useRefreshOnFocus } from '@/components/CustomerUI';
import { EmptyState } from '@/components/Experience';
import { AppointmentCard, QueueCard } from '@/components/VisitCards';
import { useCustomer } from '@/providers/CustomerProvider';
import { activeQueue, activeAppointment } from '@/lib/customer-types';
import { type, colors } from '@/theme';
export default function Visits() {
 const {visits,qrQueues}=useCustomer();useRefreshOnFocus();const [past,setPast]=useState(false);
 const queues=[...visits.queues,...qrQueues.filter(q=>!visits.queues.some(v=>v.id===q.id))].filter(q=>activeQueue(q)!==past);
 const appointments=visits.appointments.filter(a=>activeAppointment(a)!==past);
 return <Screen title="My visits" tab><Text accessibilityRole="header" style={type.title}>Good things,{'\n'}<Text style={{color:colors.action}}>coming up.</Text></Text><View style={{flexDirection:'row',gap:8}}><Chip label="Upcoming" selected={!past} onPress={()=>setPast(false)}/><Chip label="Past visits" selected={past} onPress={()=>setPast(true)}/></View><DataStatus/>{queues.map(q=><QueueCard key={q.id} entry={q} qr={qrQueues.some(v=>v.id===q.id)}/>)}<PrivateGate>{appointments.map(a=><AppointmentCard key={a.id} entry={a}/>)}{!queues.length&&!appointments.length&&<EmptyState icon={CalendarDays} title={past?'Your story starts here.':'Nothing planned yet.'} description="Find a salon, join a queue or request a time that suits you."><Action label="Explore salons" onPress={()=>router.navigate('/salons')}/></EmptyState>}<View style={{flexDirection:'row',gap:10}}><View style={{flex:1}}><Action label="My queue" secondary onPress={()=>router.navigate('/queue')}/></View><View style={{flex:1}}><Action label="Appointments" secondary onPress={()=>router.navigate('/appointments')}/></View></View></PrivateGate></Screen>;
}
