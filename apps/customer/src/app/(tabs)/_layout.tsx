import { Tabs } from 'expo-router/js-tabs';
import { CalendarDays, House, UserRound, Images } from 'lucide-react-native';
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
    <Tabs.Screen name="index" options={{ title: 'Explore', tabBarIcon: ({ color }) => <House size={22} color={color} /> }} />
    <Tabs.Screen name="visits" options={{ title: 'My visits', tabBarIcon: ({ color }) => <CalendarDays size={22} color={color}/> }}/>
    <Tabs.Screen name="salons" options={{ href: null }}/>
    <Tabs.Screen name="hairstyles" options={{title:'My photos',tabBarIcon:({color})=><Images size={22} color={color}/>}}/>
    <Tabs.Screen name="profile" options={{ title: 'Account', tabBarIcon: ({color}) => <UserRound size={22} color={color}/> }}/>
    <Tabs.Screen name="queue" options={{ href: null }}/>
    <Tabs.Screen name="appointments" options={{ href: null }}/>
  </Tabs>;
}
