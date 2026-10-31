import {router,useLocalSearchParams}from 'expo-router';
import {useState}from 'react';
import {Image,Pressable,Text}from 'react-native';
import {Action,Screen}from '@/components/UI';
import {DataStatus,styles}from '@/components/CustomerUI';
import {SaveStyleDialog}from '@/components/SaveStyleDialog';
import {useHaircutCollections}from '@/hooks/useHaircutCollections';
import {resolveHaircutPhoto}from '@/lib/haircut-gallery';
import {useCustomer}from '@/providers/CustomerProvider';
import {PhotoViewer}from '../../../../../shared/ui/PhotoViewer';
import {type}from '@/theme';
export default function HairstyleDetails(){
 const {id}=useLocalSearchParams<{id:string}>(),{catalog}=useCustomer(),gallery=useHaircutCollections(),[preview,setPreview]=useState(false),[saving,setSaving]=useState(false);
 const style=catalog?.hairstyles.find(h=>h.id===id);
 return <Screen title={style?.title??'Hairstyle'}><DataStatus/>{style?<><Pressable accessibilityRole="button" accessibilityLabel={`Preview ${style.title}`} onPress={()=>setPreview(true)}><Image source={{uri:style.image_url}} accessibilityLabel={style.title} style={[styles.photo,{height:340}]}/></Pressable><Text accessibilityRole="header" style={type.title}>{style.title}</Text><Text style={type.caption}>{catalog?.categories.find(c=>c.id===style.category_id)?.name}</Text><Action label="Save to a collection" disabled={gallery.busy} onPress={()=>{if(gallery.signedIn)setSaving(true);else router.push({pathname:'/sign-in',params:{returnTo:'/hairstyles'}});}}/><Text style={type.caption}>{style.attribution}</Text><SaveStyleDialog key={saving?'open':'closed'} style={saving?style:null} gallery={gallery} onClose={()=>setSaving(false)}/><PhotoViewer photos={[style]} index={preview?0:null} onClose={()=>setPreview(false)} resolve={resolveHaircutPhoto}/></>:catalog&&<Text style={type.body}>This reference is not available.</Text>}</Screen>;
}
