import { Redirect } from 'expo-router';
import { Text } from 'react-native';
import { Auth } from '@/components/Auth';
import { useManager } from '@/providers/ManagerProvider';
import { Screen, Button } from '@/components/UI';
import { useSession } from '@/providers/SessionProvider';
import { useBarber } from '@/providers/BarberProvider';
import { LoadingState } from '../../../customer/src/components/LoadingState';
import { type } from '@/theme';
import {auth} from '@/lib/api';
export default function Index() {
  const session = useSession();
  const { data, loading, error, refresh, contexts } = useBarber();
  const manager = useManager();
  if (session.status === 'loading')
    return <Screen title="BookMyTurn Manager"><LoadingState label="Restoring your session…"/></Screen>;
  if (session.status !== 'authenticated')
    return <Auth />;
  if(manager.loading&&!manager.error)return <Screen title="Your account"><LoadingState label="Opening your workspace…" detail="Loading your salons and team access."/></Screen>;
  if (manager.error)
    return <Screen title="Your account"><Text style={type.body}>{manager.error ?? 'Loading your salons…'}</Text><Button label="Retry" onPress={() => { void manager.refresh(); }}/><Button label="Sign out" secondary onPress={()=>{void auth.signOut();}}/></Screen>;
  if (manager.data?.salons.length || (!loading && !contexts.length && !error))
    return <Redirect href="/manage"/>;
  if (data)
    return <Redirect href="/queue"/>;
  if(loading&&!error)return <Screen title="Your salon"><LoadingState label="Opening your chair…" detail="Loading your queue and appointments."/></Screen>;
  if (error)
    return <Screen title="Your salon"><Button label="Retry" onPress={() => { void refresh(); }}/><Button label="Sign out" secondary onPress={()=>{void auth.signOut();}}/></Screen>;
  return <Redirect href="/manage"/>;
}
