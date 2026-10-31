import {useCallback,useEffect,useRef,useState}from 'react';
import {useFocusEffect}from 'expo-router';
import {randomUUID}from 'expo-crypto';
import {useSession}from '@/providers/SessionProvider';
import {collectionCommand,galleryCommand,loadCollections,uploadHaircuts,type HaircutCollection}from '@/lib/haircut-gallery';
export function useHaircutCollections(){
 const session=useSession(),uid=session.status==='authenticated'?session.session?.user.id??null:null;
 const [snapshot,setSnapshot]=useState<{uid:string|null;collections:HaircutCollection[]}>({uid:null,collections:[]}),[error,setError]=useState<string|null>(null),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true);
 const generation=useRef(0),pending=useRef(false),identity=useRef(uid);useEffect(()=>{identity.current=uid;},[uid]);
 const refresh=useCallback(async()=>{const version=++generation.current;if(!uid){setLoading(false);return;}try{const collections=await loadCollections();if(version===generation.current&&identity.current===uid){setSnapshot({uid,collections});setError(null);}}catch(e){if(version===generation.current&&identity.current===uid)setError(e instanceof Error?e.message:'Could not load your collections.');}finally{if(version===generation.current)setLoading(false);}},[uid]);
 useFocusEffect(useCallback(()=>{void refresh();return()=>{generation.current++;};},[refresh]));
 async function perform<T>(job:()=>Promise<T>):Promise<T|null>{if(pending.current)return null;pending.current=true;setBusy(true);setError(null);try{const result=await job();if(identity.current!==uid)return null;await refresh();return result;}catch(e){if(identity.current===uid)setError(e instanceof Error?e.message:'Could not update your collections.');return null;}finally{pending.current=false;setBusy(false);}}
 const collections=snapshot.uid===uid?snapshot.collections:[];
 return {collections,photos:collections.flatMap(c=>c.photos),error,busy,loading,signedIn:!!uid,uid,refresh,
  create:(title:string)=>perform(async()=>{const r=await collectionCommand('create',{id:randomUUID(),title});return r.id;}),
  rename:(id:string,title:string)=>perform(async()=>{await collectionCommand('rename',{id,title});return true;}),
  remove:(id:string)=>perform(async()=>{await collectionCommand('remove',{id});return true;}),
  upload:(id:string)=>perform(()=>uploadHaircuts(id,20-(collections.find(c=>c.id===id)?.photos.length??0))),
  renamePhoto:(id:string,title:string)=>perform(async()=>{await galleryCommand('rename',{id,title});return true;}),
  removePhoto:(id:string)=>perform(async()=>{await galleryCommand('remove',{id});return true;}),
  saveStyle:(id:string,style:string,title:string)=>perform(async()=>{await collectionCommand('add_photos',{id,photos:[{id:randomUUID(),hairstyle_id:style,title}]});return true;})};
}
export type CollectionGallery=ReturnType<typeof useHaircutCollections>;
