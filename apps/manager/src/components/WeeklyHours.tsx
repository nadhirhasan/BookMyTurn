import {useState} from 'react';
import {Pressable,Text,View} from 'react-native';
import {Clock} from 'lucide-react-native';
import {Chip,s} from './UI';
import {Section} from './ManagementUI';
import {TimeChoice,clockLabel} from './TimeChoice';
import type {ManagedSalon} from '@/lib/management';
import {colors,type} from '@/theme';
export type Hours=ManagedSalon['hours'];
export function validHours(hours:Hours){return hours.length>0&&hours.every(h=>/^([01]\d|2[0-3]):[0-5]\d$/.test(h.opens_at)&&/^([01]\d|2[0-3]):[0-5]\d$/.test(h.closes_at)&&h.closes_at>h.opens_at);}
export function WeeklyHours({value,onChange,showErrors=false}:{value:Hours;onChange:(hours:Hours)=>void;showErrors?:boolean}){
 const [editing,setEditing]=useState<{day:number;field:'opens_at'|'closes_at'}|null>(null);
 const update=(day:number,patch:Partial<Hours[number]>)=>onChange(value.map(h=>h.weekday===day?{...h,...patch}:h));
 return <Section title="Weekly opening hours" subtitle="Changes also update every barber's working hours. Existing appointments must fit inside the new hours.">
  {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map((day,weekday)=>{
   const h=value.find(v=>v.weekday===weekday),invalid=!!h&&showErrors&&!validHours([h]);
   return <View key={day} style={{gap:12,paddingBottom:16,borderBottomWidth:1,borderBottomColor:colors.divider}}>
    <View style={{flexDirection:'row',alignItems:'center',gap:10}}><Text style={[type.label,{flex:1}]}>{day}</Text><Chip label={h?'Open':'Closed'} accessibilityLabel={`${day} ${h?'Open':'Closed'}`} selected={!!h} onPress={()=>{setEditing(null);onChange(h?value.filter(v=>v.weekday!==weekday):[...value,{weekday,opens_at:'09:00',closes_at:'20:00'}].sort((a,b)=>a.weekday-b.weekday));}}/></View>
    {h&&<><View style={{flexDirection:'row',gap:10}}>{(['opens_at','closes_at'] as const).map(field=><Pressable key={field} accessibilityRole="button" accessibilityLabel={`${day} ${field==='opens_at'?'opens':'closes'}`} accessibilityState={{expanded:editing?.day===weekday&&editing.field===field}} aria-invalid={invalid} onPress={()=>setEditing(editing?.day===weekday&&editing.field===field?null:{day:weekday,field})} style={({pressed})=>[s.input,{flex:1,gap:4,opacity:pressed?.7:1},invalid&&{borderColor:colors.error,backgroundColor:colors.errorSurface}]}><Clock size={18} color={colors.action}/><Text style={type.caption}>{field==='opens_at'?'Opens':'Closes'}</Text><Text style={type.label}>{clockLabel(h[field])}</Text></Pressable>)}</View>
    {editing?.day===weekday&&<TimeChoice label={`${day} ${editing.field==='opens_at'?'opens':'closes'}`} value={h[editing.field]} onChange={v=>update(weekday,{[editing.field]:v})} onClose={()=>setEditing(null)}/>}
    {invalid&&<Text accessibilityRole="alert" style={[type.caption,{color:colors.error}]}>Closing time must follow opening time.</Text>}</>}
   </View>;
  })}
  {showErrors&&!value.length&&<Text accessibilityRole="alert" style={[type.caption,{color:colors.error}]}>Choose at least one working day.</Text>}
 </Section>;
}
