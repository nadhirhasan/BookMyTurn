import {createContext,useCallback,useContext,useEffect,useRef,useState,type ReactNode} from 'react';
import {AppState} from 'react-native';
import {management,manage,visit,readAlert,type Management,type StaffAlert} from '@/lib/management';
import {getSupabaseClient} from '@/lib/client';
import {showPhoneAlert} from '@/lib/device-alerts';
import type {Json} from '@/lib/types';
import {useFreshness} from '@/hooks/useFreshness';
import {useSession} from './SessionProvider';
type Value={data:Management|null;loading:boolean;error:string|null;busy:boolean;stale:boolean;lastUpdated:number|null;live:boolean;liveVersion:number;toast:StaffAlert|null;dismissToast:()=>void;refresh:(force?:boolean)=>Promise<void>;save:(action:string,data:Json)=>Promise<{id:string}>;act:(salon:string,action:string,id:string)=>Promise<void>;read:(id:string|null)=>Promise<void>};
const ManagerContext=createContext<Value|null>(null);
export function ManagerProvider({children}:{children:ReactNode}){
 const session=useSession();const uid=session.status==='authenticated'?session.session?.user.id??null:null;
 const [snapshot,setSnapshot]=useState<{uid:string|null;data:Management|null;checkedAt:number|null}>({uid:null,data:null,checkedAt:null});
 const [loading,setLoading]=useState(true),[error,setError]=useState<string|null>(null),[busy,setBusy]=useState(false),[live,setLive]=useState<{uid:string|null;connected:boolean}>({uid:null,connected:false}),[liveVersion,setLiveVersion]=useState(0),[notice,setNotice]=useState<{uid:string;alert:StaffAlert}|null>(null);
 const identity=useRef<string|null>(null);
 const generation=useRef(0),pending=useRef(false),flight=useRef<{uid:string|null;promise:Promise<void>}|null>(null),seen=useRef<{uid:string|null;ids:Set<string>}>({uid:null,ids:new Set()});
 const freshness=useFreshness(snapshot.uid===uid?snapshot.checkedAt:null,error);
 const refresh=useCallback(async function refreshData(force=false):Promise<void>{
  if(identity.current!==uid)return;
  const existing=flight.current;if(existing&&existing.uid===uid){await existing.promise;if(force)return refreshData();return;}
  const version=++generation.current;
  const request=(async()=>{try{const data=uid?await management():null;if(version!==generation.current)return;
   if(uid&&data){const alerts=data.alerts??[];if(seen.current.uid===uid){const fresh=alerts.find(a=>!a.read_at&&!seen.current.ids.has(a.id));if(fresh){setNotice({uid,alert:fresh});void showPhoneAlert(uid,fresh).catch(()=>{});}}else seen.current={uid,ids:new Set()};for(const a of alerts)seen.current.ids.add(a.id);}
   setSnapshot({uid,data,checkedAt:Date.now()});setError(null);
  }catch(e){if(version!==generation.current)return;const code=(e as {code?:string}).code;if(code==='42501'||code==='PGRST301')setSnapshot({uid,data:null,checkedAt:null});setError(e instanceof Error?e.message:'Could not refresh your salons.');}finally{if(version===generation.current)setLoading(false);}})();
  flight.current={uid,promise:request};await request;if(flight.current?.promise===request)flight.current=null;
 },[uid]);
 useEffect(()=>{identity.current=uid;void Promise.resolve().then(()=>refresh());const timer=setInterval(()=>{if(AppState.currentState==='active')void refresh();},5000);const sub=AppState.addEventListener('change',state=>{if(state==='active')void refresh(true);});const invalidate=()=>{generation.current++;};return()=>{invalidate();clearInterval(timer);sub.remove();};},[refresh,uid]);
 useEffect(()=>{if(!uid)return;const {client}=getSupabaseClient();if(!client)return;let active=true;let timer:ReturnType<typeof setTimeout>|null=null;
  const channel=client.channel(`staff:${uid}`,{config:{private:true}}).on('broadcast',{event:'changed'},()=>{if(timer)clearTimeout(timer);timer=setTimeout(()=>{if(active){setLiveVersion(v=>v+1);void refresh(true);}},100);}).subscribe(status=>{if(active)setLive({uid,connected:status==='SUBSCRIBED'});});
  return()=>{active=false;if(timer)clearTimeout(timer);void client.removeChannel(channel).catch(()=>{});};
 },[uid,refresh]);
 const dismissToast=useCallback(()=>setNotice(null),[]);
 const perform=async<T,>(job:()=>Promise<T>)=>{if(pending.current)throw new Error('Please wait for the current request.');pending.current=true;setBusy(true);try{const result=await job();await refresh(true);setLiveVersion(v=>v+1);return result;}finally{pending.current=false;setBusy(false);}};
 return <ManagerContext.Provider value={{data:snapshot.uid===uid?snapshot.data:null,loading:loading||snapshot.uid!==uid,error,busy,...freshness,live:!!uid&&live.uid===uid&&live.connected,liveVersion,toast:notice?.uid===uid?notice.alert:null,dismissToast,refresh,save:(action,data)=>perform(()=>manage(action,data)),act:(salon,action,id)=>perform(()=>{if(freshness.stale||!snapshot.checkedAt||Date.now()-snapshot.checkedAt>45000)throw new Error('Your salon data is out of date. Refresh before making changes.');return visit(salon,action,id);}),read:id=>perform(()=>readAlert(id))}}>{children}</ManagerContext.Provider>;
}
export function useManager(){const value=useContext(ManagerContext);if(!value)throw new Error('ManagerProvider missing');return value;}
