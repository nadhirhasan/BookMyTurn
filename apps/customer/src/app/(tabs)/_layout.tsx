import { Tabs } from 'expo-router/js-tabs';
import { CalendarDays, Clock3, House, Store, Images } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '@/theme';
export default function TabLayout() {
  const insets = useSafeAreaInsets();
  return <Tabs screenOptions={{
    headerShown: false, tabBarActiveTintColor: colors.action, tabBarInactiveTintColor: colors.muted,
    tabBarLabelPosition: 'below-icon',
    tabBarIconStyle: { width: 24, height: 24 },
    tabBarLabelStyle: { fontFamily: fonts.semibold, fontSize: 11, lineHeight: 15, marginTop: 4, marginHorizontal: 0, paddingHorizontal: 0 },
    tabBarStyle: { backgroundColor: colors.background, borderTopColor: colors.divider, height: 60 + Math.max(insets.bottom, 12), paddingTop: 10, paddingBottom: Math.max(insets.bottom, 12) },
  }}>
    <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color }) => <House size={22} color={color} /> }} />
    <Tabs.Screen name="salons" options={{ title: 'Salons', tabBarIcon: ({ color }) => <Store size={22} color={color} /> }} />
    <Tabs.Screen name="hairstyles" options={{title:'Haircuts',tabBarIcon:({color})=><Images size={22} color={color}/>}}/>
    <Tabs.Screen name="queue" options={{ title: 'My Queue', tabBarIcon: ({ color }) => <Clock3 size={22} color={color} /> }} />
    <Tabs.Screen name="appointments" options={{ title: 'Bookings', tabBarIcon: ({ color }) => <CalendarDays size={22} color={color} /> }} />
  </Tabs>;
}
