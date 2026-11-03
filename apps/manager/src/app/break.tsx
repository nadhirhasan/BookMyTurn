import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Coffee } from 'lucide-react-native';
import { Button, Chip, Field, Note, Screen, s, useAction } from '@/components/UI';
import { experience } from '@/components/StaffExperience';
import { colors, type } from '@/theme';
export default function BreakScreen(){
  const [minutes,setMinutes]=useState('15'),[submitted,setSubmitted]=useState(false);
  const valid=/^\d+$/.test(minutes)&&Number(minutes)>=1&&Number(minutes)<=240;
  const {run,error,busy}=useAction();
  return <Screen title="Take a break" back footer={<Button label="Start break" disabled={busy} onPress={()=>{setSubmitted(true);if(valid)void run('availability',{status:'on_break',minutes:Number(minutes)},()=>router.dismissTo('/queue'));}}/>}>
    <View style={experience.hero}><Coffee size={32} color={colors.action}/><Text accessibilityRole="header" style={type.title}>A moment for yourself.</Text><Text style={type.body}>How long will you be away?</Text></View><View style={s.row}>{['10','15','30','60'].map(value=><Chip key={value} label={`${value} min`} selected={minutes===value} onPress={()=>setMinutes(value)}/>)}</View><Field label="Break duration (minutes)" value={minutes} onChange={setMinutes} numeric error={submitted&&!valid?'Enter a duration from 1 to 240 minutes.':undefined}/><Note>Existing customers stay in the queue. An overlapping appointment must be handled before taking this break.</Note>{error&&<Text accessibilityRole="alert" style={[type.body,{color:colors.error}]}>{error}</Text>}
  </Screen>;
}
