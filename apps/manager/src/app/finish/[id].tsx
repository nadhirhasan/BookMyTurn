import {router,useLocalSearchParams}from 'expo-router';
import {useState}from 'react';
import {Text}from 'react-native';
import {Button,Field,Screen,useAction}from '@/components/UI';
import {useBarber}from '@/providers/BarberProvider';
import {minor,money,type Session}from '@/lib/types';
import {type}from '@/theme';
export default function Finish(){const {id}=useLocalSearchParams<{id:string}>(),{data}=useBarber();const session=data?.sessions.find(s=>s.id===id);return <Screen title="Complete haircut" back>{session?<FinishForm key={session.id} session={session}/>:<Text style={type.body}>This haircut is no longer assigned to your chair.</Text>}</Screen>;}
function FinishForm({session}:{session:Session}){const [amount,setAmount]=useState(''),[submitted,setSubmitted]=useState(false),{run,busy,error,clearError}=useAction();const value=minor(amount);
 if(session.status==='completed')return <><Text accessibilityRole="header" style={type.title}>Haircut completed.</Text><Text style={type.body}>{money(session.final_amount_minor??0)} recorded.</Text><Button label="Start next customer" onPress={()=>router.dismissTo('/queue')}/></>;
 return <><Text accessibilityRole="header" style={type.title}>Final price</Text><Field label="Final price (Rs.)" value={amount} onChange={value=>{setAmount(value);clearError();}} numeric error={submitted&&(value===null||error)?error??'Enter the final price.':undefined}/><Button label={busy?'Recording…':'Complete haircut'} disabled={busy} onPress={()=>{setSubmitted(true);if(value!==null)void run('finish_haircut',{id:session.id,final_amount_minor:value});}}/></>;
}
