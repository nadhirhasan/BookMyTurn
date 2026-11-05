import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowUpRight } from 'lucide-react-native';
import { useFinanceResource } from '@/hooks/useFinanceResource';
import { performanceRange, comparison, type PerformanceReport } from '@/lib/performance';
import { money } from '@/lib/types';
import { colors, fonts, type } from '@/theme';
import { Portrait } from './ManagementUI';
import { Chip, Button, Note } from './UI';
import { PerformanceChart } from './PerformanceChart';

// Render only inside the owner workspace. Barber screens never request this API.
export function OwnerOverview() {
 const [period,setPeriod]=useState<'today'|'week'|'month'>('today');
 const report=useFinanceResource<PerformanceReport>('performance',performanceRange(period));
 const data=report.data;
 return <View style={{gap:20}}>

  {report.stale&&data&&<Note>Reports may be out of date. Refresh before relying on these figures.</Note>}
  {report.error&&<><Text accessibilityRole="alert" style={type.caption}>{report.error}</Text><Button label="Retry overview" secondary onPress={()=>{void report.refresh();}}/></>}
  <View style={{flexDirection:'row',gap:10}}>
   <View style={s.revenue}><Text style={[type.caption,{color:colors.ticketInk}]}>Completed haircut revenue</Text><Text style={[s.amount,{color:colors.ticketInk}]}>{data?money(data.summary.revenue_minor):'—'}</Text><Text style={[type.caption,{color:colors.ticketInk}]}>{data?comparison(data.summary.revenue_minor,data.previous.revenue_minor):'Loading report…'}</Text></View>
   <View style={s.cuts}><Text style={type.caption}>Haircuts completed</Text><Text style={s.amount}>{data?.summary.completed_count??'—'}</Text><Text style={type.caption}>{data?`${data.previous.completed_count} in previous period`:'Loading report…'}</Text></View>
  </View>
  <View style={{flexDirection:'row',gap:7}}>{(['today','week','month'] as const).map(p=><View key={p} style={{flex:1}}><Chip label={{today:'Today',week:'This week',month:'This month'}[p]} selected={period===p} onPress={()=>setPeriod(p)}/></View>)}</View>
  {data&&<><View style={{gap:14}}><View style={s.row}><Text accessibilityRole="header" style={[type.section,{flex:1}]}>Haircuts {period==='today'?'today':period==='week'?'this week':'this month'}</Text><Pressable accessibilityRole="button" accessibilityLabel="View full analytics" onPress={()=>router.push('/manage/analytics')} style={s.icon}><ArrowUpRight color={colors.action} size={20}/></Pressable></View><PerformanceChart rows={data.daily} metric="completed_count" compact/></View>
  <View style={{gap:4}}><Text accessibilityRole="header" style={type.section}>Your team, at a glance</Text>{[...data.team].sort((a,b)=>b.completed_count-a.completed_count).slice(0,3).map(b=><Pressable accessibilityRole="button" accessibilityLabel={`View performance: ${b.display_name}`} key={b.id} onPress={()=>router.push({pathname:'/manage/analytics',params:{barber:b.id,salon:b.salon_id}})} style={s.team}><Portrait uri={b.photo_url} name={b.display_name} size={38}/><View style={{flex:1,gap:3}}><Text style={type.label}>{b.display_name}</Text><Text style={type.caption}>{b.salon_name}</Text></View><View style={{alignItems:'flex-end',gap:3}}><Text style={type.label}>{b.completed_count} haircuts</Text><Text style={[type.caption,{color:colors.action}]}>{money(b.revenue_minor)}</Text></View></Pressable>)}</View></>}
 </View>;
}
const s=StyleSheet.create({row:{flexDirection:'row',alignItems:'center',gap:12},icon:{width:44,height:44,alignItems:'center',justifyContent:'center'},revenue:{flex:1.2,minHeight:156,borderRadius:16,padding:17,backgroundColor:colors.action,justifyContent:'space-between',gap:14},cuts:{flex:1,minHeight:156,borderRadius:16,padding:17,backgroundColor:colors.card,borderWidth:1,borderColor:colors.divider,justifyContent:'space-between',gap:14},amount:{fontFamily:fonts.medium,fontSize:26,lineHeight:33,letterSpacing:-1,color:colors.text},team:{flexDirection:'row',gap:10,alignItems:'center',paddingVertical:14,borderBottomWidth:1,borderBottomColor:colors.divider}});
