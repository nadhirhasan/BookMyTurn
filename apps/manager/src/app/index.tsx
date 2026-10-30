import { Redirect } from 'expo-router';
import { Text } from 'react-native';
import { Auth } from '@/components/Auth';
import { useManager } from '@/providers/ManagerProvider';
import { Screen, Button } from '@/components/UI';
import { useSession } from '@/providers/SessionProvider';
import { useBarber } from '@/providers/BarberProvider';
import { type } from '@/theme';
import {auth} from '@/lib/api';
export default function Index() {
  const session = useSession();
  const { data, loading, error, refresh, contexts } = useBarber();
  const manager = useManager();
  if (session.status === 'loading')
    return <Screen title="BookMyTurn Manager"><Text style={type.body}>Restoring your session…</Text></Screen>;
  if (session.status !== 'authenticated')
    return <Auth />;
  if (manager.loading || manager.error)
    return <Screen title="Your account"><Text style={type.body}>{manager.error ?? 'Loading your salons…'}</Text><Button label="Retry" onPress={() => { void manager.refresh(); }}/><Button label="Sign out" secondary onPress={()=>{void auth.signOut();}}/></Screen>;
  if (manager.data?.salons.length || (!loading && !contexts.length && !error))
    return <Redirect href="/manage"/>;
  if (data)
    return <Redirect href="/queue"/>;
  if (loading || error)
    return <Screen title="Your salon"><Text style={type.body}>{error ?? 'Loading your barber access…'}</Text><Button label="Retry" onPress={() => { void refresh(); }}/><Button label="Sign out" secondary onPress={()=>{void auth.signOut();}}/></Screen>;
  return <Redirect href="/manage"/>;
}
