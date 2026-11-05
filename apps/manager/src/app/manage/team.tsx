import { useState } from 'react';
import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { ManagementScreen, Portrait, EmptyTeam } from '@/components/ManagementUI';
import { Button, Chip } from '@/components/UI';
import { StatusBadge } from '@/components/StaffExperience';
import { useTeamLoginStatus, loginStatus, TeamLoginRetry } from '@/components/TeamLoginStatus';
import { useManager } from '@/providers/ManagerProvider';
import type { ManagedSalon } from '@/lib/management';
import { colors, type } from '@/theme';
export default function Team(){
 const {data}=useManager();const [id,setId]=useState<string|null>(null);const salons=data?.salons.filter(s=>!s.archived_at)??[],salon=salons.find(s=>s.id===id)??salons[0];
 return <ManagementScreen title="Your team"><Text accessibilityRole="header" style={type.title}>Good people.{'\n'}<Text style={{color:colors.action}}>Great haircuts.</Text></Text><Text style={type.body}>Your team, connected to their own chair.</Text>{salons.length>1&&<ScrollView horizontal contentContainerStyle={{gap:8}}>{salons.map(s=><Chip key={s.id} label={s.name} selected={salon?.id===s.id} onPress={()=>setId(s.id)}/>)}</ScrollView>}{salon?<TeamMembers key={salon.id} salon={salon}/>:<><EmptyTeam/><Button label="Add your first salon" onPress={()=>router.push('/manage/salon/new')}/></>}</ManagementScreen>;
}
function TeamMembers({salon}:{salon:ManagedSalon}){
 const manager=useManager(),login=useTeamLoginStatus(salon.id,true,manager.lastUpdated);const [archived,setArchived]=useState(false);
 return <><Text style={type.eyebrow}>{salon.name.toUpperCase()}</Text><View style={{flexDirection:'row',gap:8}}><Chip label="Current team" selected={!archived} onPress={()=>setArchived(false)}/><Chip label="Archived team" selected={archived} onPress={()=>setArchived(true)}/></View>{login.error&&<TeamLoginRetry retry={login.retry}/>}{salon.barbers.filter(b=>archived?!!b.archived_at:!b.archived_at).map(b=>{
 const status=login.members?loginStatus(login.members.find(a=>a.barber_id===b.id)):null;
 return <View key={b.id} style={{padding:16,borderRadius:16,borderWidth:1,borderColor:colors.divider,backgroundColor:colors.card,gap:16}}><View style={{flexDirection:'row',alignItems:'center',gap:12}}><Portrait uri={b.photo_url} name={b.display_name} size={44}/><View style={{flex:1,gap:4}}><Text style={type.label}>{b.display_name}</Text><Text style={type.caption}>{login.error?'Login status unavailable':status??'Checking login…'}</Text></View><StatusBadge label={b.archived_at?'Archived':b.availability.replaceAll('_',' ')} tone={b.availability==='available'?'success':'neutral'}/></View><View style={{height:1,backgroundColor:colors.divider}}/><View style={{flexDirection:'row',gap:8}}><View style={{flex:1}}><Button label="Edit profile" accessibilityLabel={`Edit ${b.display_name}`} secondary onPress={()=>router.push(`/manage/barber/${b.id}?salon=${salon.id}`)}/></View><View style={{flex:1}}>{!b.archived_at?<Button label={status==='Invitation needed'?'Invite barber':status?.includes('Invitation')?'Share invitation':'Login access'} onPress={()=>router.push(`/manage/barber-access/${b.id}?salon=${salon.id}`)}/>:<Button label="Performance" secondary onPress={()=>router.push({pathname:'/manage/analytics',params:{salon:salon.id,barber:b.id}})}/>}</View></View></View>;
 })}{!salon.barbers.length&&<EmptyTeam/>}<Button label="+ Add barber" secondary onPress={()=>router.push(`/manage/barber/new?salon=${salon.id}`)}/><Button label="Open salon workspace" secondary onPress={()=>router.push(`/manage/salon/${salon.id}?tab=team`)}/></>;
}
