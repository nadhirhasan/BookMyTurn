import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Platform} from 'react-native';
import type {StaffAlert} from './management';
const key=(uid:string)=>`bookmyturn.staff-alerts.${uid}`;
Notifications.setNotificationHandler({handleNotification:async()=>({shouldShowBanner:true,shouldShowList:true,shouldPlaySound:true,shouldSetBadge:false})});
export async function phoneAlertsEnabled(uid:string){return (await AsyncStorage.getItem(key(uid)))==='true';}
export async function disablePhoneAlerts(uid:string){await AsyncStorage.setItem(key(uid),'false');}
export async function enablePhoneAlerts(uid:string){if(Platform.OS==='android')await Notifications.setNotificationChannelAsync('salon-activity',{name:'Salon activity',importance:Notifications.AndroidImportance.HIGH});const permission=await Notifications.requestPermissionsAsync({ios:{allowAlert:true,allowSound:true,allowBadge:false}});const allowed=permission.granted||permission.ios?.status===Notifications.IosAuthorizationStatus.PROVISIONAL;await AsyncStorage.setItem(key(uid),allowed?'true':'false');return allowed;}
export async function showPhoneAlert(uid:string,alert:StaffAlert){if(!await phoneAlertsEnabled(uid))return;const permission=await Notifications.getPermissionsAsync();if(!permission.granted&&permission.ios?.status!==Notifications.IosAuthorizationStatus.PROVISIONAL)return;await Notifications.scheduleNotificationAsync({identifier:`salon-${alert.id}`,content:{title:`${alert.salon_name}: ${alert.title}`,body:'Open BookMyTurn to view the update.',sound:'default',data:{user_id:uid,salon_id:alert.salon_id}},trigger:Platform.OS==='android'?{channelId:'salon-activity'}:null});}

export function listenPhoneAlerts(uid:string,callback:()=>void){const listener=Notifications.addNotificationResponseReceivedListener(response=>{if(response.notification.request.content.data?.user_id===uid)callback();});return ()=>listener.remove();}
