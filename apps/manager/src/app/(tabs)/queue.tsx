import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { CalendarDays, Scissors, Settings2, Users } from 'lucide-react-native';
import { Button, Chip, Field, Note, Screen, s, useAction, useRefresh } from '@/components/UI';
import { Preferences } from '@/components/Preferences';
import { Portrait } from '@/components/ManagementUI';
import { EmptyState, StatusBadge, TaskRow, experience } from '@/components/StaffExperience';
import { useBarber } from '@/providers/BarberProvider';
import { statusLabel, time } from '@/lib/types';
import { colors, type } from '@/theme';

export default function QueueScreen() {
  const {data}=useBarber();useRefresh();
  const {run,error,busy,message,clearError}=useAction();
  const [reference,setReference]=useState(''),[submitted,setSubmitted]=useState(false),[showAvailability,setShowAvailability]=useState(false);
  const valid=/^\d{6}$/.test(reference);
  if(!data)return <Screen title="My Queue"><Text style={type.body}>Loading your chair…</Text></Screen>;
  const current=data.sessions.find(ss=>ss.status==='in_service');
  const waiting=data.queues.filter(q=>q.status==='arrived');
  const requests=data.appointments.filter(a=>a.status==='pending').length;
  const currentVisit=current&&(data.queues.find(q=>q.id===current.queue_entry_id)??data.appointments.find(a=>a.id===current.appointment_id));
  const visibleQueue=data.queues.filter(q=>q.status!=='in_service');
  const availability=<View style={s.card}><Text style={type.label}>Your availability</Text><View style={s.row}><Chip label="Available" disabled={busy} selected={data.barber.availability==='available'} onPress={()=>{void run('availability',{status:'available'});}}/><Chip label="Off duty" disabled={busy} selected={data.barber.availability==='off_duty'} onPress={()=>{void run('availability',{status:'off_duty'});}}/></View><Button label="Take a break" secondary disabled={busy} onPress={()=>router.push('/break')}/>{!!data.breaks.length&&<Note>Break until {time(data.breaks[0]!.ends_at)}. Tap Available when you return.</Note>}</View>;
  return <Screen title={data.salon.name}>
    <View style={{flexDirection:'row',gap:14,alignItems:'center'}}><Portrait uri={data.barber.photo_url} name={data.barber.display_name} size={56}/><View style={{flex:1,gap:5}}><Text style={type.eyebrow}>YOUR CHAIR</Text><Text style={type.label}>{data.barber.display_name} · {current?'in service':data.barber.availability.replaceAll('_',' ')}</Text></View>{!current&&!!waiting.length&&<Pressable accessibilityRole="button" accessibilityLabel="Change availability" accessibilityState={{expanded:showAvailability}} onPress={()=>setShowAvailability(v=>!v)} style={s.icon}><Settings2 size={22} color={colors.action}/></Pressable>}</View>
    <Text accessibilityRole="header" style={type.title}>{current?'In the chair.':`${waiting.length} waiting for you.`}</Text>
    {current?<View style={experience.active}><StatusBadge label="In service" tone="success"/><Text style={type.section}>{currentVisit?.customer_name||'Customer'}</Text><Text style={type.body}>{current.service_name_snapshot} · Started {time(current.started_at)}</Text><Button label="Finish Service" onPress={()=>router.push(`/finish/${current.id}`)}/><Preferences id={current.queue_entry_id??current.appointment_id??''}/></View>:!waiting.length||showAvailability||data.barber.availability!=='available'?availability:null}
    {!!requests&&<TaskRow title={`${requests} Pending Appointment Request${requests===1?'':'s'}`} detail="Review the time before confirming." icon={CalendarDays} tone="pending" onPress={()=>router.navigate('/appointments')}/>}
    {error&&<Text accessibilityRole="alert" style={[type.body,{color:colors.error}]}>{error}</Text>}{message&&<Text style={type.caption}>{message}</Text>}
    <View style={{gap:16}}><Text accessibilityRole="header" style={type.section}>Your queue</Text>
    {!visibleQueue.length&&<EmptyState icon={Users} title={current?'Your chair is the only active visit.':'No customers assigned yet.'} detail="QR arrivals and checked-in customers appear here when it is your turn to serve them."/>}
    {visibleQueue.map((q,index)=><View key={q.id} style={[s.card,index===0&&q.status==='arrived'&&{borderColor:colors.positive}]}><View style={{flexDirection:'row',gap:12,alignItems:'flex-start'}}><View style={{width:40,height:40,borderRadius:14,backgroundColor:colors.brandSoft,alignItems:'center',justifyContent:'center'}}><Scissors size={20} color={colors.action}/></View><View style={{flex:1,gap:6}}><Text style={type.section}>{q.customer_name??(q.source==='qr'?'QR visitor':'Customer')}</Text><StatusBadge label={q.status==='joined'?'On the way':statusLabel(q.status)} tone={q.status==='arrived'?'success':'pending'}/></View></View><Text selectable style={[type.label,{letterSpacing:2}]}>{q.reference}</Text>{q.estimated_start&&<Text style={type.caption}>Estimated {time(q.estimated_start)}</Text>}{q.status==='arrived'&&<Button label="Start Service" disabled={!!current||busy||data.barber.availability!=='available'} onPress={()=>router.push(`/start/${q.id}`)}/>}<Preferences id={q.id}/></View>)}
    </View>
    <View style={s.card}><Text style={type.section}>Check in an arrival</Text><Text style={type.caption}>Use their existing code to avoid a duplicate entry.</Text><Field label="Arriving customer queue code" value={reference} onChange={v=>{setReference(v.replace(/\D/g,''));clearError();setSubmitted(false);}} numeric maxLength={6} error={submitted&&(!valid||error)?error??'Enter the six-digit customer code.':undefined}/><Button label="Mark Arrived" secondary disabled={busy} onPress={()=>{setSubmitted(true);if(!valid)return;void run('check_in',{reference}).then(ok=>{if(ok){setReference('');setSubmitted(false);}});}}/></View>
    <Button label="+ Add Walk-In" secondary disabled={busy} onPress={()=>router.push('/walk-in')}/>
  </Screen>;
}
