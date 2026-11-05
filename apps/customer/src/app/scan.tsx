import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useIsFocused } from 'expo-router';
import { useRef, useState } from 'react';
import { Linking, Platform, Text, View } from 'react-native';
import { ScanLine } from 'lucide-react-native';
import { Action, Screen } from '@/components/UI';
import { Field } from '@/components/CustomerUI';
import { scannedSalon } from '@/lib/scan-salon';
import { colors, type } from '@/theme';
export default function ScanSalon(){
 const [permission,requestPermission]=useCameraPermissions(),focused=useIsFocused();
 const [error,setError]=useState<string|null>(null),[link,setLink]=useState('');const navigating=useRef(false);
 const open=(value:string)=>{if(navigating.current)return;const slug=scannedSalon(value);if(!slug){setError('This is not a salon QR. Scan the BookMyTurn code displayed at the salon.');return;}navigating.current=true;router.replace({pathname:'/salon/[id]/join',params:{id:slug,source:'qr'}});};
 return <Screen title="Scan salon QR"><Text accessibilityRole="header" style={type.title}>Walk in.{'\n'}<Text style={{color:colors.action}}>Find your place.</Text></Text><Text style={type.body}>Scan the BookMyTurn QR displayed at your salon.</Text>
 {permission?.granted&&focused?<View style={{height:340,borderRadius:20,overflow:'hidden',borderWidth:1,borderColor:colors.border}}><CameraView style={{flex:1}} facing="back" barcodeScannerSettings={{barcodeTypes:['qr']}} onBarcodeScanned={({data})=>open(data)} onMountError={()=>setError('The camera could not open. Use your phone camera or paste the salon QR link below.')}/><View pointerEvents="none" style={{position:'absolute',top:60,left:40,right:40,bottom:60,borderRadius:18,borderWidth:2,borderColor:colors.action}}/></View>:<View style={{alignItems:'center',gap:18,paddingVertical:28}}><ScanLine size={64} color={colors.action}/><Text style={[type.caption,{textAlign:'center'}]}>Camera access is used only to read the salon QR.</Text><Action label={permission?.canAskAgain===false?'Open camera settings':'Allow camera'} onPress={()=>{if(permission?.canAskAgain===false&&Platform.OS!=='web')void Linking.openSettings();else void requestPermission();}}/></View>}
 <Field label="Salon QR link" value={link} onChange={v=>{setLink(v);setError(null);}}/><Action label="Open salon link" secondary onPress={()=>open(link)}/>{error&&<Text accessibilityRole="alert" style={[type.body,{color:colors.error}]}>{error}</Text>}
 </Screen>;
}
