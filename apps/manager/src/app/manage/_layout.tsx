import { Redirect, Stack } from 'expo-router';
import { Text } from 'react-native';
import { useSession } from '@/providers/SessionProvider';
import { useManager } from '@/providers/ManagerProvider';
import { ManagementScreen } from '@/components/ManagementUI';
import { Button } from '@/components/UI';
import { auth } from '@/lib/api';
import { colors, type } from '@/theme';
import {useReduceMotion} from '../../../../customer/src/components/RouteMotion';
export default function ManageLayout() { const reduced=useReduceMotion(); const session = useSession(); const { data, error, refresh } = useManager(); if (session.status === 'loading')
  return null; if (session.status !== 'authenticated')
  return <Redirect href="/"/>; if (!data)
  return <ManagementScreen title="Your salons"><Text style={type.body}>{error ?? 'Loading your salons…'}</Text><Button label="Retry" onPress={() => { void refresh(); }}/><Button label="Sign out" secondary onPress={() => { void auth.signOut(); }}/></ManagementScreen>; return <Stack screenOptions={{ headerShown: false,animation:reduced?'none':'slide_from_right',animationDuration:280,contentStyle:{backgroundColor:colors.background} }}><Stack.Screen name="barber-access/[id]" options={{ presentation: 'modal' }}/></Stack>; }
