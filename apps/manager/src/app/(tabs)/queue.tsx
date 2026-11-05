import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { CalendarDays, Plus, ScanLine, Settings2, Users } from 'lucide-react-native';
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
  const [reference,setReference]=useState(''),[submitted,setSubmitted]=useState(false),[showAvailability,setShowAvailability]=useState(false),[showCheckIn,setShowCheckIn]=useState(false);
  const valid=/^\d{6}$/.test(reference);
  if(!data)return <Screen title="My Queue"><Text style={type.body}>Loading your chair…</Text></Screen>;
  const current=data.sessions.find(ss=>ss.status==='in_service');
  const waiting=data.queues.filter(q=>q.status==='arrived');
  const completed=data.performance.today_count;
  const rating=data.reviews.length?(data.reviews.reduce((n,r)=>n+r.rating,0)/data.reviews.length).toFixed(1):'—';
  const requests=data.appointments.filter(a=>a.status==='pending').length;
  const currentVisit=current&&(data.queues.find(q=>q.id===current.queue_entry_id)??data.appointments.find(a=>a.id===current.appointment_id));
  const visibleQueue=data.queues.filter(q=>q.status!=='in_service');
  const availability=<View style={s.card}><Text style={type.label}>Your availability</Text><View style={s.row}><Chip label="Available" disabled={busy} selected={data.barber.availability==='available'} onPress={()=>{void run('availability',{status:'available'});}}/><Chip label="Off duty" disabled={busy} selected={data.barber.availability==='off_duty'} onPress={()=>{void run('availability',{status:'off_duty'});}}/></View><Button label="Take a break" secondary disabled={busy} onPress={()=>router.push('/break')}/>{!!data.breaks.length&&<Note>Break until {time(data.breaks[0]!.ends_at)}. Tap Available when you return.</Note>}</View>;
  return <Screen title={data.salon.name}>
    <View style={{flexDirection:'row',gap:14,alignItems:'center'}}><Portrait uri={data.barber.photo_url} name={data.barber.display_name} size={56}/><View style={{flex:1,gap:5}}><Text style={type.eyebrow}>YOUR CHAIR</Text><Text style={type.label}>{data.barber.display_name} · {current?'in service':data.barber.availability.replaceAll('_',' ')}</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Change availability" accessibilityState={{expanded:showAvailability}} onPress={()=>setShowAvailability(v=>!v)} style={s.icon}><Settings2 size={22} color={colors.action}/></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Find customer by code" accessibilityState={{expanded:showCheckIn}} onPress={()=>setShowCheckIn(v=>!v)} style={s.icon}><ScanLine size={22} color={colors.action}/></Pressable></View>
    <Text accessibilityRole="header" style={type.title}>{current?'A good haircut,\nin good hands.':waiting.length?'Your next customer\nis right here.':'Your chair is ready.\nGood things take time.'}</Text><Text style={type.caption}>{new Date(`${data.today}T12:00Z`).toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',timeZone:'UTC'})}</Text><View style={{flexDirection:'row',gap:16,paddingVertical:10,borderBottomWidth:1,borderColor:colors.divider}}>{[[waiting.length,'In your queue'],[completed,'Haircuts today'],[rating,'Your reviews']].map(([value,label])=><View key={label} style={{flex:1,gap:8}}><Text style={type.section}>{value}</Text><Text style={type.caption}>{label}</Text></View>)}</View>
    {current?<View style={experience.active}><StatusBadge label="In service" tone="success"/><Text style={type.section}>{currentVisit?.customer_name||'Customer'}</Text><Text style={type.body}>{current.service_name_snapshot} · Started {time(current.started_at)}</Text><Button label="Finish Service" onPress={()=>router.push(`/finish/${current.id}`)}/><Preferences id={current.queue_entry_id??current.appointment_id??''}/></View>:!waiting.length||showAvailability||data.barber.availability!=='available'?availability:null}
    {!!requests&&<TaskRow title={`${requests} Pending Appointment Request${requests===1?'':'s'}`} detail="Review the time before confirming." icon={CalendarDays} tone="pending" onPress={()=>router.navigate('/appointments')}/>}
    {error&&<Text accessibilityRole="alert" style={[type.body,{color:colors.error}]}>{error}</Text>}{message&&<Text style={type.caption}>{message}</Text>}

    {showCheckIn&&<View style={s.card}><Text style={type.section}>Verify customer code</Text><Text style={type.caption}>Use their existing code to avoid a duplicate entry.</Text><Field label="Customer queue code" value={reference} onChange={v=>{setReference(v.replace(/\D/g,''));clearError();setSubmitted(false);}} numeric maxLength={6} error={submitted&&(!valid||error)?error??'Enter the six-digit customer code.':undefined}/><Button label="Find customer" secondary disabled={busy} onPress={()=>{setSubmitted(true);if(!valid)return;void run('check_in',{reference},id=>router.push(`/start/${id}`)).then(ok=>{if(ok){setReference('');setSubmitted(false);setShowCheckIn(false);}});}}/></View>}
    <View style={{gap:16}}><View style={{flexDirection:'row',alignItems:'center',gap:8}}><Text accessibilityRole="header" style={[type.section,{flex:1}]}>Next in your chair</Text><Pressable accessibilityRole="button" accessibilityLabel="+ Add Walk-In" disabled={busy} onPress={()=>router.push('/walk-in')} style={{flexDirection:'row',alignItems:'center',gap:4,minHeight:44}}><Plus size={17} color={colors.action}/><Text style={[type.caption,{color:colors.action}]}>Walk-in</Text></Pressable></View>
    {!visibleQueue.length&&<EmptyState icon={Users} title={current?'Your chair is the only active visit.':'No customers assigned yet.'} detail="Customers appear here as soon as they join. Check their code before starting their haircut."/>}
    {visibleQueue.map((q,index)=><View key={q.id} style={[s.card,index===0&&q.status==='arrived'&&{padding:18}]}><View style={{flexDirection:'row',gap:12,alignItems:'flex-start'}}><Portrait name={q.customer_name??'Customer'} size={40}/><View style={{flex:1,gap:6}}><Text style={type.section}>{q.customer_name??(q.source==='qr'?'QR visitor':'Customer')}</Text><StatusBadge label={['joined','arrived'].includes(q.status)?'Waiting':statusLabel(q.status)} tone={q.status==='arrived'?'success':'pending'}/></View></View><Text selectable style={[type.label,{letterSpacing:2}]}>{q.reference}</Text>{q.estimated_start&&<Text style={type.caption}>Estimated {time(q.estimated_start)}</Text>}<Preferences compact id={q.id}/>{q.status==='arrived'&&<Button label="Verify customer code" disabled={!!current||busy||data.barber.availability!=='available'} onPress={()=>router.push(`/start/${q.id}`)}/>}<Text style={type.caption}>Check their six-digit code before starting.</Text></View>)}
    </View>

  </Screen>;
}
