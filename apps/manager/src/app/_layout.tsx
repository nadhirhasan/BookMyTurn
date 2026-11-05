import { DMSans_400Regular } from '@expo-google-fonts/dm-sans/400Regular';
import { DMSans_500Medium } from '@expo-google-fonts/dm-sans/500Medium';
import { DMSans_600SemiBold } from '@expo-google-fonts/dm-sans/600SemiBold';
import { DMSans_700Bold } from '@expo-google-fonts/dm-sans/700Bold';
import { useFonts } from 'expo-font';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SessionProvider } from '@/providers/SessionProvider';
import { ManagerProvider } from '@/providers/ManagerProvider';
import { BarberProvider } from '@/providers/BarberProvider';
import {StaffAlertBanner} from '@/components/StaffAlerts';
import { colors, layout } from '@/theme';
import { useReduceMotion } from '../../../customer/src/components/RouteMotion';
export default function Layout() {
  const reduced = useReduceMotion();
  const [loaded] = useFonts({ DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold, DMSans_700Bold });
  if (!loaded)
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}><ActivityIndicator color={colors.text}/></View>;
  return <SafeAreaProvider><ThemeProvider value={{...DarkTheme,colors:{...DarkTheme.colors,background:colors.background,card:colors.card,text:colors.text,primary:colors.action,border:colors.divider}}}><StatusBar style="light"/><SessionProvider><ManagerProvider><BarberProvider><View style={{ flex: 1, alignItems: 'center', backgroundColor: colors.canvas }}><View style={{ flex: 1, width: '100%', maxWidth: layout.maxWidth, backgroundColor: colors.background }}><Stack screenOptions={{ headerShown: false, animation: reduced ? 'none' : 'slide_from_right', animationDuration: 280, gestureEnabled: true, contentStyle: { backgroundColor: colors.background } }}><Stack.Screen name="finish/[id]" options={{presentation:'formSheet',sheetAllowedDetents:[0.85,1],sheetGrabberVisible:true,sheetCornerRadius:24}}/></Stack><StaffAlertBanner/></View></View></BarberProvider></ManagerProvider></SessionProvider></ThemeProvider></SafeAreaProvider>;
}
