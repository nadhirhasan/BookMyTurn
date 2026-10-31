import {useEffect,useState}from 'react';
import {Image,Pressable,ScrollView,Text,View}from 'react-native';
import {useBarber}from '@/providers/BarberProvider';
import {useSession}from '@/providers/SessionProvider';
import {db}from '@/lib/api';
import type {StyleRequest}from '@/lib/types';
import {PhotoViewer,type PreviewPhoto}from '../../../../shared/ui/PhotoViewer';
import {s}from './UI';
import {type}from '@/theme';
async function resolveReference(photo:PreviewPhoto){if(!photo.storage_path)return photo.image_url??null;const {data,error}=await db().storage.from('customer-haircuts').createSignedUrl(photo.storage_path,60);if(error)throw new Error('Photo unavailable');return data.signedUrl;}
function ReferencePhoto({photo,onPress}:{photo:PreviewPhoto;onPress:()=>void}){
 const session=useSession(),uid=session.session?.user.id;const [resolved,setResolved]=useState<{uid:string|undefined;path:string;url:string}|null>(null);
 useEffect(()=>{let active=true;if(photo.storage_path&&uid)void resolveReference(photo).then(url=>{if(active&&url)setResolved({uid,path:photo.storage_path!,url});},()=>{});return()=>{active=false;};},[photo,uid]);
 const uri=photo.storage_path?(resolved&&resolved.uid===uid&&resolved.path===photo.storage_path?resolved.url:null):photo.image_url;
 return <Pressable accessibilityRole="button" accessibilityLabel={`Preview ${photo.title}`} onPress={onPress} style={{width:130,gap:6}}>{uri?<Image source={{uri}} accessibilityLabel={photo.title} style={{width:130,height:170,borderRadius:12}}/>:<View style={{width:130,height:170,justifyContent:'center',padding:10,backgroundColor:'#F2F2ED',borderRadius:12}}><Text style={type.caption}>Tap to load photo</Text></View>}<Text style={type.caption}>{photo.title}</Text></Pressable>;
}
function ReferenceSet({request}:{request:StyleRequest}){const [preview,setPreview]=useState<number|null>(null),session=useSession();return <View style={s.card}><Text style={type.label}>{request.collection_title??'Customer haircut photo'}</Text>{request.images.length>1&&<Text style={type.caption}>{request.images.length} reference photos</Text>}<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:12}}>{request.images.map((photo,index)=><ReferencePhoto key={photo.id} photo={photo} onPress={()=>setPreview(index)}/>)}</ScrollView>{request.note&&<Text style={type.body}>{request.note}</Text>}<PhotoViewer key={session.session?.user.id} photos={request.images} index={preview} onClose={()=>setPreview(null)} resolve={resolveReference}/></View>;}
export function Preferences({id}:{id:string}){const {data}=useBarber();return <>{data?.styles.filter(r=>r.queue_entry_id===id||r.appointment_id===id).map(r=><ReferenceSet key={r.id} request={r}/>)}</>;}
