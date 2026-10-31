import {useEffect,useState}from 'react';
import {Image,Text,View}from 'react-native';
import {useBarber}from '@/providers/BarberProvider';
import {useSession}from '@/providers/SessionProvider';
import {db}from '@/lib/api';
import {s}from './UI';
import {type}from '@/theme';
function ReferencePhoto({photo}:{photo:{title:string;image_url:string|null;storage_path?:string|null}}){
 const session=useSession(),uid=session.session?.user.id;const [resolved,setResolved]=useState<{uid:string|undefined;path:string;url:string}|null>(null);
 useEffect(()=>{let active=true;if(photo.storage_path&&uid)void db().storage.from('customer-haircuts').createSignedUrl(photo.storage_path,60).then(({data,error})=>{if(active&&!error&&data)setResolved({uid,path:photo.storage_path!,url:data.signedUrl});});return()=>{active=false;};},[photo.storage_path,uid]);
 const uri=photo.storage_path?(resolved&&resolved.uid===uid&&resolved.path===photo.storage_path?resolved.url:null):photo.image_url;
 return <View style={{width:150,gap:5}}>{uri?<Image source={{uri}} accessibilityLabel={photo.title} style={{width:150,height:190,borderRadius:12}}/>:<Text style={type.caption}>Photo unavailable</Text>}<Text style={type.caption}>{photo.title}</Text></View>;
}
export function Preferences({id}:{id:string}){const {data}=useBarber();const requests=data?.styles.filter(r=>r.queue_entry_id===id||r.appointment_id===id)??[];return <>{requests.map(r=><View key={r.id} style={s.card}><Text style={type.label}>Customer haircut photo</Text><View style={s.row}>{r.images.map(photo=><ReferencePhoto key={photo.id} photo={photo}/>)}</View>{r.note&&<Text style={type.body}>{r.note}</Text>}</View>)}</>;}
