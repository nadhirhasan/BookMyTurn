import {Text,View} from 'react-native';
import {Chip,Field} from './UI';
import {Section} from './ManagementUI';
import type {ManagedSalon} from '@/lib/management';
import {type} from '@/theme';
export type Hours=ManagedSalon['hours'];
export function validHours(hours:Hours){return hours.length>0&&hours.every(h=>/^([01]\d|2[0-3]):[0-5]\d$/.test(h.opens_at)&&/^([01]\d|2[0-3]):[0-5]\d$/.test(h.closes_at)&&h.closes_at>h.opens_at);}
export function WeeklyHours({value,onChange}:{value:Hours;onChange:(hours:Hours)=>void}){
 const update=(day:number,patch:Partial<Hours[number]>)=>onChange(value.map(h=>h.weekday===day?{...h,...patch}:h));
 return <Section title="Weekly opening hours" subtitle="Changes also update every barber's working hours. Existing appointments must fit inside the new hours.">{['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map((day,weekday)=>{const h=value.find(v=>v.weekday===weekday);return <View key={day} style={{gap:10}}><View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:10}}><Text style={type.label}>{day}</Text><Chip label={h?'Open':'Closed'} accessibilityLabel={`${day} ${h?'Open':'Closed'}`} selected={!!h} onPress={()=>onChange(h?value.filter(v=>v.weekday!==weekday):[...value,{weekday,opens_at:'09:00',closes_at:'20:00'}].sort((a,b)=>a.weekday-b.weekday))}/></View>{h&&<View style={{flexDirection:'row',gap:10}}><View style={{flex:1}}><Field label={`${day} opens`} value={h.opens_at} onChange={opens_at=>update(weekday,{opens_at})} maxLength={5}/></View><View style={{flex:1}}><Field label={`${day} closes`} value={h.closes_at} onChange={closes_at=>update(weekday,{closes_at})} maxLength={5}/></View></View>}</View>;})}<Text style={type.caption}>Use 24-hour times, for example 09:00 and 18:30. Keep at least one working day.</Text></Section>;
}
