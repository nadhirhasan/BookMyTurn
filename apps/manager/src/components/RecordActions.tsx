import {useRef,useState} from 'react';
import {router} from 'expo-router';
import {Text,View} from 'react-native';
import {Archive,ArchiveRestore,Trash2} from 'lucide-react-native';
import {useManager} from '@/providers/ManagerProvider';
import {Button,Field,Note} from './UI';
import {Section} from './ManagementUI';
import {colors,type} from '@/theme';

export function RecordActions({kind,id,salonId,name,archived=false,disabled=false}:{kind:'salon'|'barber'|'service';id:string;salonId:string;name:string;archived?:boolean;disabled?:boolean}){
 const {save,busy}=useManager();const [action,setAction]=useState<'archive'|'delete'|'restore'|null>(null),[confirmation,setConfirmation]=useState(''),[error,setError]=useState<string|null>(null);const pending=useRef(false);
 const choose=(value:typeof action)=>{setAction(value);setConfirmation('');setError(null);};
 const submit=async()=>{if(!action||pending.current||action==='delete'&&confirmation.trim()!==name.trim())return;pending.current=true;setError(null);try{await save(`${action}_${kind}`,{id,salon_id:salonId});router.dismissTo(kind==='salon'?`/manage?revision=${Date.now()}`:`/manage/salon/${salonId}?tab=${kind==='barber'?'team':'details'}&revision=${Date.now()}`);}catch(e){setError(e instanceof Error?e.message:'Could not complete this action. Please retry.');}finally{pending.current=false;}};
 return <Section title={archived?'Archived record':'Manage this record'} subtitle={archived?'Hidden from customers. Its history is kept.':'Removal is blocked while this record has active visits.'}>
  {!action?<><View style={{flexDirection:'row',alignItems:'center',gap:9}}>{archived?<ArchiveRestore size={19} color={colors.text}/>:<Archive size={19} color={colors.text}/>}<Text style={[type.body,{flex:1}]}>{archived?'Restore when you need it again.':'Archive to keep history and hide this record.'}</Text></View><Button label={`${archived?'Restore':'Archive'} ${kind}`} secondary disabled={busy||disabled} onPress={()=>choose(archived?'restore':'archive')}/><View style={{flexDirection:'row',alignItems:'center',gap:9}}><Trash2 size={18} color={colors.muted}/><Text style={[type.caption,{flex:1}]}>Permanent deletion is available only for unused records.</Text></View><Button label={`Delete ${kind}`} secondary disabled={busy||disabled} onPress={()=>choose('delete')}/></>:<View style={{gap:14}}><Text accessibilityRole="header" style={type.section}>{action==='delete'?`Delete ${name} permanently?`:`${action==='archive'?'Archive':'Restore'} ${name}?`}</Text><Note>{action==='delete'?`This cannot be undone. ${kind==='salon'?'The unused team, services and settings in this salon will also be deleted. ':''}Records with history must be archived instead.`:action==='archive'?'Customers will no longer be able to find or book this record. Existing history is kept. You can restore it later.':kind==='salon'?'The salon returns closed. Check its team, services and hours before reopening.':'This record returns to the active catalogue and can be booked again.'}</Note>{action==='delete'&&<Field label={`Type ${name} to confirm`} value={confirmation} onChange={setConfirmation} maxLength={100}/>}<Button label={busy?'Please wait…':`Confirm ${action}`} disabled={busy||disabled||action==='delete'&&confirmation.trim()!==name.trim()} onPress={()=>{void submit();}}/><Button label="Cancel" secondary disabled={busy||disabled} onPress={()=>choose(null)}/></View>}
  {error&&<Text accessibilityRole="alert" style={type.body}>{error}</Text>}
 </Section>;
}
