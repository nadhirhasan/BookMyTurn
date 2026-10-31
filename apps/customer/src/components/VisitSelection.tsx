import {Text,View}from 'react-native';
import {Chip}from './UI';
import {styles}from './CustomerUI';
import type {Catalog}from '@/lib/customer-types';
import {type}from '@/theme';
export function VisitSelection({catalog,salon,barber,onBarber}:{catalog:Catalog;salon:string;barber:string|null;onBarber:(id:string|null)=>void}){
 return <><Text style={type.section}>Barber</Text><View style={styles.row}><Chip label="Any Available Barber" selected={!barber} onPress={()=>onBarber(null)}/>{catalog.barbers.filter(b=>b.salon_id===salon).map(b=><Chip key={b.id} label={b.display_name} selected={barber===b.id} onPress={()=>onBarber(b.id)}/>)}</View></>;
}
