import {router,useLocalSearchParams}from 'expo-router';
import {Text}from 'react-native';
import {Button,Screen,useAction}from '@/components/UI';
import {Preferences}from '@/components/Preferences';
import {useBarber}from '@/providers/BarberProvider';
import {type}from '@/theme';
export default function Start(){const {id}=useLocalSearchParams<{id:string}>(),{data}=useBarber(),{run,busy,error}=useAction();const visit=data?.queues.find(q=>q.id===id)??data?.appointments.find(a=>a.id===id);
 return <Screen title="Start haircut" back>{visit?<><Text accessibilityRole="header" style={type.title}>{visit.customer_name||'Customer'}</Text><Text style={type.section}>{visit.reference}</Text><Preferences id={id}/>{error&&<Text accessibilityRole="alert" style={{...type.body,color:'#B42318'}}>{error}</Text>}<Button label={busy?'Starting…':'Start haircut'} disabled={busy} onPress={()=>{void run('start_haircut',{id},()=>router.dismissTo('/queue'));}}/></>:<Text style={type.body}>This visit is no longer waiting for your chair.</Text>}</Screen>;
}
