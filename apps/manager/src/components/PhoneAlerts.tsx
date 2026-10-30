import {useEffect,useState} from 'react';
import {Platform,Text,View} from 'react-native';
import {Bell} from 'lucide-react-native';
import {useSession} from '@/providers/SessionProvider';
import {enablePhoneAlerts,phoneAlertsEnabled,disablePhoneAlerts} from '@/lib/device-alerts';
import {Button} from './UI';
import {colors,type} from '@/theme';
export function PhoneAlerts(){const session=useSession();const uid=session.session?.user.id;const [enabled,setEnabled]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState<string|null>(null);
 useEffect(()=>{let active=true;if(uid)void phoneAlertsEnabled(uid).then(value=>{if(active)setEnabled(value);},()=>{});return()=>{active=false;};},[uid]);
 const toggle=async()=>{if(!uid||busy)return;setBusy(true);setMessage(null);try{if(enabled){await disablePhoneAlerts(uid);setEnabled(false);}else{const allowed=await enablePhoneAlerts(uid);setEnabled(allowed);if(!allowed)setMessage('Allow notifications in your phone settings, then try again.');}}catch{setMessage('Could not change phone alerts. In-app activity will still update.');}finally{setBusy(false);}};
 return <View style={{padding:16,borderWidth:1,borderColor:colors.divider,borderRadius:14,gap:12,backgroundColor:'#fff'}}><View style={{flexDirection:'row',gap:8,alignItems:'center'}}><Bell size={20} color={colors.positive}/><Text style={type.section}>Phone alerts</Text></View><Text style={type.body}>Get a sound and banner for new salon activity while the app is open. Your Activity inbox stays saved while you are away.</Text>{Platform.OS==='web'?<Text style={type.caption}>Enable phone alerts from the mobile app.</Text>:<Button label={enabled?'Turn off phone alerts':'Enable phone alerts while open'} secondary disabled={busy} onPress={()=>{void toggle();}}/>}{message&&<Text style={type.caption}>{message}</Text>}</View>;
}
