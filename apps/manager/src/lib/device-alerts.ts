import type {StaffAlert} from './management';
export async function enablePhoneAlerts(_uid:string):Promise<boolean>{return false;}
export async function phoneAlertsEnabled(_uid:string):Promise<boolean>{return false;}
export async function disablePhoneAlerts(_uid:string):Promise<void>{}
export async function showPhoneAlert(_uid:string,_alert:StaffAlert):Promise<void>{}

export function listenPhoneAlerts(_uid:string,_callback:()=>void):()=>void{return ()=>{};}
