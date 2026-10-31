import {router}from 'expo-router';
import {randomUUID}from 'expo-crypto';
import {useState}from 'react';
import {Text}from 'react-native';
import {Button,Field,Screen,useAction}from '@/components/UI';
import {type}from '@/theme';
export default function WalkIn(){const {run,busy,error}=useAction(),[key]=useState(randomUUID),[name,setName]=useState('');return <Screen title="Add walk-in" back><Field label="Customer name (optional)" value={name} onChange={setName}/>{error&&<Text accessibilityRole="alert" style={type.body}>{error}</Text>}<Button label={busy?'Adding…':'Add arrived customer'} disabled={busy} onPress={()=>{void run('walk_in',{request_key:key,customer_name:name},()=>router.dismissTo('/queue'));}}/></Screen>;}
