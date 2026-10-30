import { DMSans_400Regular } from '@expo-google-fonts/dm-sans/400Regular';
import { DMSans_500Medium } from '@expo-google-fonts/dm-sans/500Medium';
import { DMSans_600SemiBold } from '@expo-google-fonts/dm-sans/600SemiBold';
import { DMSans_700Bold } from '@expo-google-fonts/dm-sans/700Bold';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SessionProvider } from '@/providers/SessionProvider';
import { ManagerProvider } from '@/providers/ManagerProvider';
import { BarberProvider } from '@/providers/BarberProvider';
import {StaffAlertBanner} from '@/components/StaffAlerts';
import { colors, layout } from '@/theme';
export default function Layout() {
  const [loaded] = useFonts({ DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold, DMSans_700Bold });
  if (!loaded)
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}><ActivityIndicator color={colors.text}/></View>;
  return <SafeAreaProvider><StatusBar style="dark"/><SessionProvider><ManagerProvider><BarberProvider><View style={{ flex: 1, alignItems: 'center', backgroundColor: colors.canvas }}><View style={{ flex: 1, width: '100%', maxWidth: layout.maxWidth, backgroundColor: colors.background }}><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}/><StaffAlertBanner/></View></View></BarberProvider></ManagerProvider></SessionProvider></SafeAreaProvider>;
}
