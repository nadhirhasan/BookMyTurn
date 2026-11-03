import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { CheckCircle2, Scissors } from 'lucide-react-native';
import { Button, Field, Screen, useAction } from '@/components/UI';
import { experience } from '@/components/StaffExperience';
import { useBarber } from '@/providers/BarberProvider';
import { minor, type Session } from '@/lib/types';
import { colors, type } from '@/theme';
export default function Finish(){const {id}=useLocalSearchParams<{id:string}>(),{data}=useBarber();const session=data?.sessions.find(s=>s.id===id);return session?<FinishForm key={session.id} session={session}/>:<Screen title="Complete haircut" back><Text style={type.body}>This haircut is no longer assigned to your chair.</Text></Screen>;}
function FinishForm({session}:{session:Session}){
  const [amount,setAmount]=useState(''),[submitted,setSubmitted]=useState(false),{run,busy,error,clearError}=useAction();const value=minor(amount);
  if(session.status==='completed')return <Screen title="Complete haircut" back><View style={experience.active}><CheckCircle2 size={40} color={colors.positive}/><Text accessibilityRole="header" style={type.title}>Haircut completed.</Text><Text style={type.body}>The final price was recorded in your salon.</Text></View><Text style={type.section}>What would you like to do next?</Text><Button label="Start next customer" onPress={()=>router.dismissTo('/queue')}/><Button label="Take a break" secondary onPress={()=>router.replace('/break')}/></Screen>;
  return <Screen title="Complete haircut" back footer={<Button label={busy?'Recording…':'Complete haircut'} disabled={busy} onPress={()=>{setSubmitted(true);if(value!==null)void run('finish_haircut',{id:session.id,final_amount_minor:value});}}/>}>
    <View style={experience.hero}><Scissors size={28} color={colors.action}/><Text accessibilityRole="header" style={type.title}>All done. One last detail.</Text><Text style={type.body}>Enter the final price agreed with the customer.</Text></View>
    <Field label="Final price (Rs.)" value={amount} onChange={v=>{setAmount(v);clearError();}} numeric error={submitted&&(value===null||error)?error??'Enter the final price.':undefined}/><Text style={type.caption}>Completing the haircut records the sale automatically.</Text>
  </Screen>;
}
