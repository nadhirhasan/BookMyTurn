import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { CalendarDays, ChevronRight, Plus, Store, Users } from 'lucide-react-native';
import { Button, Chip } from '@/components/UI';
import { Cover, ManagementScreen, m } from '@/components/ManagementUI';
import { EmptyState, StatsGrid, StatusBadge } from '@/components/StaffExperience';
import { useManager } from '@/providers/ManagerProvider';
import { colors, type } from '@/theme';

export default function SalonList() { const { revision } = useLocalSearchParams<{revision?:string}>(); return <SalonListContent key={revision??'initial'}/>; }
function SalonListContent() {
  const {data,live}=useManager();
  const [archived,setArchived]=useState(false);
  const all=data?.salons??[], active=all.filter(s=>!s.archived_at);
  const salons=all.filter(s=>archived?!!s.archived_at:!s.archived_at);
  return <ManagementScreen title="BookMyTurn">
    <View style={{gap:8}}><Text style={type.eyebrow}>MANAGER WORKSPACE</Text><Text accessibilityRole="header" style={type.title}>Your salons.</Text><Text style={type.body}>{data?.profile.display_name?`Welcome back, ${data.profile.display_name}.`:'A clear view of your day.'}</Text><StatusBadge label={live?'Live updates connected':'Auto-refresh every 5 seconds'} tone={live?'success':'neutral'}/></View>
    {!all.length&&<View style={{gap:10,padding:18,borderRadius:20,backgroundColor:colors.brandSoft}}><Text style={type.section}>Joining an existing team?</Text><Text style={type.body}>Use the invitation your manager shared. You do not need to create a salon.</Text><Button label="Join a salon as a barber" onPress={()=>router.push('/invite')}/></View>}
    {!!active.length&&<StatsGrid items={[
      {label:'Waiting',value:active.reduce((n,s)=>n+s.waiting,0),icon:Users,tone:'mint'},
      {label:'Requests',value:active.reduce((n,s)=>n+s.pending,0),icon:CalendarDays,tone:'amber'},
    ]}/>}
    <View style={{flexDirection:'row',alignItems:'center',gap:12}}><Text style={[type.section,{flex:1}]}>Locations <Text style={type.caption}>{salons.length}</Text></Text><Pressable accessibilityRole="button" accessibilityLabel="+ Add salon" onPress={()=>router.push('/manage/salon/new')} style={({pressed})=>({minHeight:48,flexDirection:'row',alignItems:'center',gap:6,opacity:pressed?.7:1})}><Plus size={20} color={colors.action}/><Text style={[type.label,{color:colors.action}]}>Add salon</Text></Pressable></View>
    {all.some(s=>s.archived_at)&&<View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}><Chip label={`Active locations (${active.length})`} selected={!archived} onPress={()=>setArchived(false)}/><Chip label={`Archived locations (${all.length-active.length})`} selected={archived} onPress={()=>setArchived(true)}/></View>}
    {!salons.length&&<EmptyState icon={Store} title={archived?'No archived salons.':'Start with your first salon.'} detail={archived?'Restore a location to bring it back to your workspace.':'Create a location, add your team, and see every customer here.'}/>}
    {salons.map(salon=><Pressable key={salon.id} accessibilityRole="button" accessibilityLabel={`Manage ${salon.name}`} onPress={()=>router.push(`/manage/salon/${salon.id}`)} style={({pressed})=>[m.salonCard,{opacity:pressed?.8:1}]}>
      <Cover uri={salon.photo_url} name={salon.name}/>
      <View style={m.cardBody}><View style={{flexDirection:'row',gap:12,alignItems:'flex-start'}}><View style={{flex:1,gap:4}}><Text style={type.section}>{salon.name}</Text><Text style={type.caption}>{salon.address||'Address not provided'}</Text></View><ChevronRight size={22} color={colors.action}/></View><StatusBadge label={salon.archived_at?'Archived':salon.is_open?'Open':'Closed'} tone={salon.is_open&&!salon.archived_at?'success':'neutral'}/><Text style={type.body}>{salon.waiting} waiting · {salon.barbers.filter(b=>b.is_active).length} barbers</Text><View style={{borderTopWidth:1,borderColor:colors.divider,paddingTop:12,gap:4}}><Text style={type.caption}>{salon.in_service??0} in service</Text><Text style={[type.label,{color:salon.pending?colors.pending:colors.action}]}>{salon.pending?`${salon.pending} request${salon.pending===1?'':'s'} to review`:'Open salon workspace'}</Text></View></View>
    </Pressable>)}
    <Text style={type.caption}>Waiting counts every queue join. Staff verify the customer code before starting the haircut.</Text>
    {!!all.length&&<Button label="Join a salon as a barber" secondary onPress={()=>router.push('/invite')}/>}
  </ManagementScreen>;
}
