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
  return <Screen title="Start haircut" back footer={visit?<Button label={busy?'Starting…':'Start haircut'} disabled={busy} onPress={()=>{void run('start_haircut',{id},()=>router.dismissTo('/queue'));}}/>:undefined}>
    {visit?<><View style={experience.hero}><Scissors size={28} color={colors.action}/><Text accessibilityRole="header" style={type.title}>{visit.customer_name||'Customer'}</Text><Text selectable style={[type.section,{letterSpacing:2}]}>{visit.reference}</Text><StatusBadge label="Ready for your chair" tone="success"/></View><Text style={type.body}>Review their haircut references before you start.</Text><Preferences id={id}/><Text style={type.caption}>Record the agreed final price when the haircut is complete.</Text>{error&&<Text accessibilityRole="alert" style={[type.body,{color:colors.error}]}>{error}</Text>}</>:<Text style={type.body}>This visit is no longer waiting for your chair.</Text>}
  </Screen>;
}
