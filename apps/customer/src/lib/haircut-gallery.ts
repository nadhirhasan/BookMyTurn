import * as ImagePicker from 'expo-image-picker';
import {Platform} from 'react-native';
import {randomUUID} from 'expo-crypto';
import {getSupabaseClient} from './supabase/client';
export type HaircutPhoto={id:string;title:string;storage_path:string|null;image_url:string|null;hairstyle_id:string|null;url?:string|null};
function client(){const {client}=getSupabaseClient();if(!client)throw new Error('The database connection is not configured.');return client;}
export async function galleryCommand(action:string,data:Record<string,string|null>={}){
 const result=await client().rpc('customer_gallery',{p_action:action,p_data:data});
 if(result.error){const allowed=['Photo unavailable','Enter a photo name','Choose one photo'];throw new Error(allowed.includes(result.error.message)?result.error.message:'Could not update your haircut photos. Please retry.');}return result.data;
}
export async function loadGallery():Promise<HaircutPhoto[]>{const rows=await galleryCommand('list')as unknown as HaircutPhoto[];return Promise.all(rows.map(async photo=>{
 if(!photo.storage_path)return {...photo,url:photo.image_url};const result=await client().storage.from('customer-haircuts').createSignedUrl(photo.storage_path,60);return {...photo,url:result.error?null:result.data.signedUrl};
}));}
export async function uploadHaircut(){
 const picked=await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],allowsEditing:true,quality:.7,base64:true});if(picked.canceled)return null;
 const photo=picked.assets[0];if(!photo?.base64)throw new Error('Could not read this photo. Choose another image.');
 const mime=Platform.OS==='web'?photo.mimeType??'image/jpeg':'image/jpeg';const ext=({'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}as Record<string,string>)[mime];
 if(!ext)throw new Error('Choose a JPEG, PNG or WebP photo.');const bytes=Uint8Array.from(atob(photo.base64),c=>c.charCodeAt(0));if(bytes.byteLength>2097152)throw new Error('Choose a photo smaller than 2 MB.');
 const {data,error}=await client().auth.getUser();if(error||!data.user)throw new Error('Sign in to save haircut photos.');const id=randomUUID(),path=`${data.user.id}/${id}.${ext}`;
 const result=await client().storage.from('customer-haircuts').upload(path,bytes.buffer,{contentType:mime,upsert:false});if(result.error)throw new Error('Could not upload this photo. Please retry.');
 try{await galleryCommand('save',{id,storage_path:path});return id;}catch(e){await client().storage.from('customer-haircuts').remove([path]);throw e;}
}
