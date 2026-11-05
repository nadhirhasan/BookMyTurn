import { Redirect, Stack } from 'expo-router';
import { Text, View } from 'react-native';
import { LoadingState, SalonSkeletons } from '../../../../customer/src/components/LoadingState';
import { useSession } from '@/providers/SessionProvider';
import { useManager } from '@/providers/ManagerProvider';
import { ManagementScreen } from '@/components/ManagementUI';
import { Button } from '@/components/UI';
import { auth } from '@/lib/api';
import { colors, type } from '@/theme';
import {useMotionPreference} from '../../../../customer/src/components/RouteMotion';
export default function ManageLayout() { const reduced=useMotionPreference(); const session = useSession(); const { data, error, refresh } = useManager(); if (session.status === 'loading')
  return <View style={{flex:1,padding:20,backgroundColor:colors.background}}><LoadingState label="Restoring your session…"/></View>; if (session.status !== 'authenticated')
  return <Redirect href="/"/>; if (!data)
  return <ManagementScreen title="Your salons">{error?<><Text style={type.body}>{error}</Text><Button label="Retry" onPress={() => { void refresh(); }}/><Button label="Sign out" secondary onPress={() => { void auth.signOut(); }}/></>:<SalonSkeletons label="Opening your salons…"/>}</ManagementScreen>; return <Stack screenOptions={{ headerShown: false,animation:reduced?'none':'slide_from_right',animationDuration:280,contentStyle:{backgroundColor:colors.background} }}><Stack.Screen name="barber-access/[id]" options={{ presentation: 'modal' }}/></Stack>; }
