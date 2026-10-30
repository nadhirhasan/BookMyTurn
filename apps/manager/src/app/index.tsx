import { Redirect } from 'expo-router';
import { Text } from 'react-native';
import { Auth } from '@/components/Auth';
import { Setup } from '@/components/Setup';
import { Screen, Button } from '@/components/UI';
import { useSession } from '@/providers/SessionProvider';
import { useBarber } from '@/providers/BarberProvider';
import { type } from '@/theme';
export default function Index() { const session = useSession(); const { data, loading, error, refresh } = useBarber(); if (session.status === 'loading')
  return <Screen title="BookMyTurn Barber"><Text style={type.body}>Restoring your session…</Text></Screen>; if (session.status !== 'authenticated')
  return <Auth />; if (data)
  return <Redirect href="/queue"/>; if (loading || error)
  return <Screen title="Your salon"><Text style={type.body}>{error ?? 'Loading your barber access…'}</Text><Button label="Retry" onPress={() => { void refresh(); }}/></Screen>; return <Setup />; }
