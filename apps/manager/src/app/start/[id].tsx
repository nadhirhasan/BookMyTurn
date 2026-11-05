import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { Scissors } from 'lucide-react-native';
import { Button, Screen, useAction } from '@/components/UI';
import { Preferences } from '@/components/Preferences';
import { experience, StatusBadge } from '@/components/StaffExperience';
import { useBarber } from '@/providers/BarberProvider';
import { colors, type } from '@/theme';
export default function Start(){
  const {id}=useLocalSearchParams<{id:string}>(),{data}=useBarber(),{run,busy,error}=useAction();
  const visit=data?.queues.find(q=>q.id===id)??data?.appointments.find(a=>a.id===id);
  const current=data?.sessions.find(session=>session.status==='in_service');
  const ready=visit?.status==='arrived'&&!current&&data?.barber.availability==='available';
  const nextStep=current?'Finish your current haircut first.':data?.barber.availability!=='available'?'Set your chair to Available before starting.':'This visit is not waiting to start.';
  return <Screen title="Start haircut" back footer={visit?(ready?<Button loading={busy} label={busy?'Starting…':'Start haircut'} disabled={busy} onPress={()=>{void run('start_haircut',{id},()=>router.dismissTo('/queue'));}}/>:<Button label="Return to your chair" onPress={()=>router.dismissTo('/queue')}/>):undefined}>
    {visit?<><View style={experience.hero}><Scissors size={28} color={colors.action}/><Text accessibilityRole="header" style={type.title}>{visit.customer_name||'Customer'}</Text><Text selectable style={[type.section,{letterSpacing:2}]}>{visit.reference}</Text><StatusBadge label={ready?'Ready for your chair':'Visit found'} tone={ready?'success':'pending'}/></View><Text style={type.body}>Match this code with the customer in front of you, review their haircut references, then start. No confirmation is needed in the customer app.</Text>{!ready&&<Text style={type.body}>{nextStep}</Text>}<Preferences id={id}/><Text style={type.caption}>Record the agreed final price when the haircut is complete.</Text>{error&&<Text accessibilityRole="alert" style={[type.body,{color:colors.error}]}>{error}</Text>}</>:<Text style={type.body}>This visit is no longer waiting for your chair.</Text>}
  </Screen>;
}
