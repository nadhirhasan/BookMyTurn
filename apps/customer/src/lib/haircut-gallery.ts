import * as ImagePicker from 'expo-image-picker';
import {randomUUID} from 'expo-crypto';
import {getSupabaseClient} from './supabase/client';
import type {Json} from './supabase/database.types';
import type {PreviewPhoto} from '../../../../shared/ui/PhotoViewer';
export type HaircutPhoto=PreviewPhoto&{collection_id:string;hairstyle_id:string|null};
export type HaircutCollection={id:string;title:string;photos:HaircutPhoto[]};
function client(){const {client}=getSupabaseClient();if(!client)throw new Error('The database connection is not configured.');return client;}
const allowed=['Photo unavailable','Collection unavailable','Enter a photo name','Enter a collection name','Choose one to twenty photos','A collection can hold twenty photos'];
export async function galleryCommand(action:string,data:Record<string,string|null>={}) {
 const result=await client().rpc('customer_gallery',{p_action:action,p_data:data});
 if(result.error)throw new Error(allowed.includes(result.error.message)?result.error.message:'Could not update your photos. Please retry.');return result.data;
}
export async function collectionCommand(action:string,data:Json={}) {
 const result=await client().rpc('customer_collections',{p_action:action,p_data:data});
 if(result.error)throw new Error(allowed.includes(result.error.message)?result.error.message:'Could not update your collection. Please retry.');return result.data as unknown as {id:string};
}
export async function resolveHaircutPhoto(photo:PreviewPhoto):Promise<string|null> {
 if(!photo.storage_path)return photo.image_url??photo.url??null;
 const result=await client().storage.from('customer-haircuts').createSignedUrl(photo.storage_path,60);
 if(result.error)throw new Error('Photo unavailable');return result.data.signedUrl;
}
export async function loadCollections():Promise<HaircutCollection[]> {
 const {data,error}=await client().rpc('customer_collections',{p_action:'list',p_data:{}});
 if(error)throw new Error('Could not load your collections. Please retry.');
 return Promise.all((data as unknown as HaircutCollection[]).map(async c=>({...c,photos:await Promise.all(c.photos.map(async photo=>({...photo,url:await resolveHaircutPhoto(photo).catch(()=>null)})))})));
}
export async function uploadHaircuts(collection:string,remaining:number) {
 if(remaining<=0)throw new Error('A collection can hold twenty photos.');
 const picked=await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],allowsMultipleSelection:true,selectionLimit:remaining,orderedSelection:true,allowsEditing:false,quality:.8,base64:true});
 if(picked.canceled)return false;
 if(picked.assets.length>remaining)throw new Error(`Choose up to ${remaining} more photos.`);
 const {data,error}=await client().auth.getUser();if(error||!data.user)throw new Error('Sign in to save haircut photos.');
 const prepared=picked.assets.map((photo,index)=>{
  if(!photo.base64)throw new Error('Could not read this photo. Choose another image.');
  const bytes=Uint8Array.from(atob(photo.base64),c=>c.charCodeAt(0));
  if(bytes.byteLength>2097152)throw new Error(`Photo ${index+1} is larger than 2 MB. Choose a smaller image.`);
  const mime=bytes[0]===0xff&&bytes[1]===0xd8?'image/jpeg':bytes[0]===0x89&&bytes[1]===0x50?'image/png':String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP'?'image/webp':null;
  if(!mime)throw new Error('Choose JPEG, PNG or WebP images.');const ext=({'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}as const)[mime];
  const id=randomUUID();return {id,bytes,mime,storage_path:`${data.user!.id}/${id}.${ext}`,title:photo.fileName?.replace(/\.[^.]+$/,'').slice(0,100)||'My haircut'};
 });
 const uploaded:string[]=[];
 try {
  for(const photo of prepared){const result=await client().storage.from('customer-haircuts').upload(photo.storage_path,photo.bytes.buffer,{contentType:photo.mime,upsert:false});if(result.error)throw new Error('Could not upload these photos. Please retry.');uploaded.push(photo.storage_path);}
  await collectionCommand('add_photos',{id:collection,photos:prepared.map(({id,storage_path,title})=>({id,storage_path,title}))});return true;
 }catch(e){if(uploaded.length)await client().storage.from('customer-haircuts').remove(uploaded);throw e;}
}
