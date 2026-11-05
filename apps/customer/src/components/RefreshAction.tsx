import { useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { RefreshCw } from 'lucide-react-native';
import { PressableMotion } from './PressableMotion';
import { colors } from '@/theme';
export function RefreshAction({ label, onRefresh }: { label:string; onRefresh:()=>Promise<unknown> }) {
 const [busy,setBusy]=useState(false);
 return <PressableMotion accessibilityRole="button" accessibilityLabel={label} accessibilityState={{busy}} disabled={busy} style={{width:48,height:48,alignItems:'center',justifyContent:'center'}} onPress={()=>{if(busy)return;setBusy(true);void (async()=>{try{await onRefresh();}catch{/* The data provider displays its connection error and retains cached data. */}finally{setBusy(false);}})();}}>{busy?<ActivityIndicator accessible={false} importantForAccessibility="no" aria-hidden color={colors.action}/>:<RefreshCw size={19} color={colors.muted}/>}</PressableMotion>;
}
