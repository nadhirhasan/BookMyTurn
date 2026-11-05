import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { Plus, Store } from 'lucide-react-native';
import { Button, Chip } from '@/components/UI';
import { Cover, ManagementScreen, MenuRow, m } from '@/components/ManagementUI';
import { EmptyState, StatusBadge } from '@/components/StaffExperience';
import { useManager } from '@/providers/ManagerProvider';
import { SquareGrid } from '../../../../customer/src/components/SquareGrid';
import { PressableMotion } from '../../../../customer/src/components/PressableMotion';
import { colors, type } from '@/theme';
import { OwnerOverview } from '@/components/OwnerOverview';

export default function SalonList() { const { revision } = useLocalSearchParams<{revision?:string}>(); return <SalonListContent key={revision??'initial'}/>; }
function SalonListContent() {
  const {data}=useManager();
  const [archived,setArchived]=useState(false);
  const all=data?.salons??[], active=all.filter(s=>!s.archived_at);
  const salons=all.filter(s=>archived?!!s.archived_at:!s.archived_at);
  return <ManagementScreen title="BookMyTurn">
    <View style={{gap:12}}><Text style={type.eyebrow}>MANAGER WORKSPACE</Text><Text accessibilityRole="header" style={type.title}>A clear view{'\n'}<Text style={{color:colors.action}}>of your day.</Text></Text><Text style={type.caption}>{data?.today?new Date(`${data.today}T12:00Z`).toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',timeZone:'UTC'}):'Loading your workspace…'}</Text></View>
    {!all.length&&<View style={{gap:10,padding:18,borderRadius:20,backgroundColor:colors.brandSoft}}><Text style={type.section}>Joining an existing team?</Text><Text style={type.body}>Use the invitation your manager shared. You do not need to create a salon.</Text><Button label="Join a salon as a barber" onPress={()=>router.push('/invite')}/></View>}
    {!!active.length&&<View style={{flexDirection:'row',gap:12,paddingVertical:8}}>{[['waiting',active.reduce((n,s)=>n+s.waiting,0)],['in service',active.reduce((n,s)=>n+(s.in_service??0),0)],['requests',active.reduce((n,s)=>n+s.pending,0)]].map(([label,value])=><View key={label} style={{flex:1,flexDirection:'row',gap:6,alignItems:'center'}}><Text style={type.label}>{value}</Text><Text style={type.caption}>{label}</Text></View>)}</View>}
    {!!all.length&&<OwnerOverview/>}
    {!!all.length&&<MenuRow label="Team performance" detail="Haircuts, revenue and daily trends for every barber" onPress={()=>router.push('/manage/analytics')}/> }
    <View style={{flexDirection:'row',alignItems:'center',gap:12}}><Text style={[type.section,{flex:1}]}>Locations <Text style={type.caption}>{salons.length}</Text></Text><Pressable accessibilityRole="button" accessibilityLabel="+ Add salon" onPress={()=>router.push('/manage/salon/new')} style={({pressed})=>({minHeight:48,flexDirection:'row',alignItems:'center',gap:6,opacity:pressed?.7:1})}><Plus size={20} color={colors.action}/><Text style={[type.label,{color:colors.action}]}>Add salon</Text></Pressable></View>
    {all.some(s=>s.archived_at)&&<View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}><Chip label={`Active locations (${active.length})`} selected={!archived} onPress={()=>setArchived(false)}/><Chip label={`Archived locations (${all.length-active.length})`} selected={archived} onPress={()=>setArchived(true)}/></View>}
    {!salons.length&&<EmptyState icon={Store} title={archived?'No archived salons.':'Start with your first salon.'} detail={archived?'Restore a location to bring it back to your workspace.':'Create a location, add your team, and see every customer here.'}/>}
    <SquareGrid>{salons.map(salon=><PressableMotion key={salon.id} accessibilityRole="button" accessibilityLabel={`Manage ${salon.name}`} onPress={()=>router.push(`/manage/salon/${salon.id}`)} style={[m.salonCard,{flex:1,borderRadius:16}]}>
      <View style={{width:'100%',aspectRatio:1}}><Cover square uri={salon.photo_url} name={salon.name}/><View style={{position:'absolute',left:10,top:10}}><StatusBadge label={salon.archived_at?'Archived':salon.is_open?'Open':'Closed'} tone={salon.is_open&&!salon.archived_at?'success':'neutral'}/></View></View>
      <View style={{padding:12,gap:8}}><Text numberOfLines={2} style={type.label}>{salon.name}</Text><Text numberOfLines={1} style={type.caption}>{salon.address||'Address not provided'}</Text><Text style={type.caption}>{salon.waiting} waiting · {salon.in_service??0} in service</Text><Text style={type.caption}>{salon.barbers.filter(b=>b.is_active).length} barbers</Text><Text style={[type.caption,{color:salon.pending?colors.pending:colors.action}]}>{salon.pending?`${salon.pending} request${salon.pending===1?'':'s'} to review`:'Open workspace'}</Text></View>
    </PressableMotion>)}</SquareGrid>
    <Text style={type.caption}>Waiting counts every queue join. Staff verify the customer code before starting the haircut.</Text>
    {!!all.length&&<Button label="Join a salon as a barber" secondary onPress={()=>router.push('/invite')}/>}
  </ManagementScreen>;
}
