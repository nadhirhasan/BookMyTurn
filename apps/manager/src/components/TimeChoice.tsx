import { Text, View } from 'react-native';
import { Button, Chip, s } from './UI';
import { type } from '@/theme';

export function clockLabel(value: string) {
  const [hour, minute] = value.split(':').map(Number);
  return `${hour! % 12 || 12}:${String(minute??0).padStart(2,'0')} ${hour! >= 12 ? 'PM' : 'AM'}`;
}
export function TimeChoice({label,value,onChange,onClose}:{label:string;value:string;onChange:(value:string)=>void;onClose:()=>void}) {
  const [hour=9,minute=0]=value.split(':').map(Number);
  const change=(h:number,m:number)=>onChange(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
  const minutes=Array.from(new Set([0,5,10,15,20,25,30,35,40,45,50,55,minute])).sort((a,b)=>a-b);
  return <View style={s.card}><Text style={type.label}>{label} · {clockLabel(value)}</Text><View style={s.row}>{['AM','PM'].map((period,i)=><Chip key={period} label={period} accessibilityLabel={`${label} ${period}`} selected={Math.floor(hour/12)===i} onPress={()=>change(hour%12+i*12,minute)}/>)}</View><Text style={type.caption}>Hour</Text><View style={s.row}>{Array.from({length:12},(_,i)=>i+1).map(h=><Chip key={h} label={String(h)} accessibilityLabel={`${label} hour ${h}`} selected={(hour%12||12)===h} onPress={()=>change(h%12+Math.floor(hour/12)*12,minute)}/>)}</View><Text style={type.caption}>Minute</Text><View style={s.row}>{minutes.map(m=><Chip key={m} label={String(m).padStart(2,'0')} accessibilityLabel={`${label} minute ${m}`} selected={minute===m} onPress={()=>change(hour,m)}/>)}</View><Button label={`Done choosing ${label}`} secondary onPress={onClose}/></View>;
}
