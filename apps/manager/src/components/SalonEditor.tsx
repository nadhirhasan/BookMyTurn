import {useRef,useState}from 'react';
import {router}from 'expo-router';
import {randomUUID}from 'expo-crypto';
import {Text,View}from 'react-native';
import type {ImagePickerAsset}from 'expo-image-picker';
import {Field,Button,Chip,s}from './UI';
import {PhotoPicker,Section}from './ManagementUI';
import {RecordActions}from './RecordActions';
import {WeeklyHours,validHours}from './WeeklyHours';
import {useManager}from '@/providers/ManagerProvider';
import {uploadManagedPhoto,removeManagedPhoto}from '@/lib/photos';
import type {ManagedSalon}from '@/lib/management';
import {type}from '@/theme';
import {SalonLocationField}from './salon-location-field';
import {salonPoint,type SalonPoint}from '../../../customer/src/lib/salon-location';
export function SalonEditor({salon}:{salon?:ManagedSalon}){
 const {save}=useManager();const [id]=useState(()=>salon?.id??randomUUID());const created=useRef(!!salon),pending=useRef(false);
 const [name,setName]=useState(salon?.name??''),[address,setAddress]=useState(salon?.address??''),[open,setOpen]=useState(salon?.is_open??true),[photo,setPhoto]=useState<ImagePickerAsset|null>(null),[url,setUrl]=useState(salon?.photo_url??'');
 const [hours,setHours]=useState(salon?.hours.map(h=>({...h,opens_at:h.opens_at.slice(0,5),closes_at:h.closes_at.slice(0,5)}))??Array.from({length:7},(_,weekday)=>({weekday,opens_at:'09:00',closes_at:'20:00'})));
 const [saving,setSaving]=useState(false),[error,setError]=useState<string|null>(null),[submitted,setSubmitted]=useState(false);
 const [location,setLocation]=useState<SalonPoint|null>(()=>salonPoint(salon??{}));
 const submit=async()=>{if(pending.current)return;setSubmitted(true);setError(null);if(!name.trim()||!address.trim()||!validHours(hours)||!location)return;
  pending.current=true;setSaving(true);let uploaded:Awaited<ReturnType<typeof uploadManagedPhoto>>|null=null;
  try{if(!created.current){await save('create_salon',{id,name:name.trim(),address:address.trim(),...location,weekdays:hours.map(h=>h.weekday),opens_at:hours[0]!.opens_at,closes_at:hours[0]!.closes_at});created.current=true;}
   if(photo)uploaded=await uploadManagedPhoto('salon',id,photo);
   await save('salon',{salon_id:id,name:name.trim(),address:address.trim(),...location,is_open:open,photo_url:uploaded?.url??url,hours});
   setPhoto(null);if(uploaded?.url)setUrl(uploaded.url);router.dismissTo(`/manage/salon/${id}?tab=${salon?'details':'team'}`);
  }catch(e){if(uploaded)await removeManagedPhoto(uploaded);setError(e instanceof Error?e.message:'Could not save your salon.');}finally{pending.current=false;setSaving(false);}
 };
 if(salon?.archived_at)return <><Text style={type.title}>{salon.name}</Text><RecordActions disabled={saving} kind="salon" id={id} salonId={id} name={salon.name} archived/></>;
 return <><PhotoPicker cover name={name||'Salon'} asset={photo} url={url} onChange={setPhoto} disabled={saving} onRemove={()=>{setPhoto(null);setUrl('');}}/><Section title="Salon details"><Field label="Salon name" value={name} onChange={setName} error={submitted&&!name.trim()?'Enter a salon name.':undefined}/><Field label="Address in Akurana" value={address} onChange={setAddress} maxLength={500} error={submitted&&!address.trim()?'Enter the salon address.':undefined}/><SalonLocationField value={location} onChange={setLocation} address={address} disabled={saving} error={submitted&&!location?'Pin the salon entrance on the map.':undefined}/>{salon&&<View style={s.row}><Chip label="Open for customers" selected={open} onPress={()=>setOpen(true)}/><Chip label="Closed" selected={!open} onPress={()=>setOpen(false)}/></View>}</Section><WeeklyHours value={hours} onChange={setHours} showErrors={submitted}/>{error&&<Text accessibilityRole="alert" style={{...type.body,color:'#B42318'}}>{error}</Text>}<Button label={saving?'Saving salon…':salon?'Save salon':'Create salon'} disabled={saving} onPress={()=>{void submit();}}/>{salon&&<RecordActions disabled={saving} kind="salon" id={id} salonId={id} name={salon.name}/>}</>;
}
