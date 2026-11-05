import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { Scissors, CalendarDays, UserRound } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSession } from '@/providers/SessionProvider';
import { useBarber } from '@/providers/BarberProvider';
import { useMotionPreference } from '../../../../customer/src/components/RouteMotion';
import { colors, fonts } from '@/theme';
export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const reduced = useMotionPreference();
  const session = useSession();
  const { data, loading } = useBarber();
  if (session.status !== 'authenticated' || (!loading && !data))
    return <Redirect href="/"/>;
  return <Tabs screenOptions={{ headerShown: false, animation: reduced ? 'none' : 'fade', transitionSpec: { animation: 'timing', config: { duration: 180 } }, tabBarActiveTintColor: colors.action, tabBarInactiveTintColor: colors.muted, tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 12 }, tabBarStyle: { height: 60 + Math.max(insets.bottom, 12), paddingTop: 8, paddingBottom: Math.max(insets.bottom, 12), backgroundColor: colors.background, borderTopColor: colors.divider } }}>
<Tabs.Screen name="queue" options={{ title: 'My chair', tabBarIcon: ({ color }) => <Scissors color={color} size={22}/> }}/><Tabs.Screen name="appointments" options={{ title: 'Requests', tabBarIcon: ({ color }) => <CalendarDays color={color} size={22}/> }}/><Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color }) => <UserRound color={color} size={22}/> }}/><Tabs.Screen name="performance" options={{href:null}}/>
</Tabs>;
}
