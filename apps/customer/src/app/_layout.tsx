import { DMSans_400Regular } from '@expo-google-fonts/dm-sans/400Regular';
import { DMSans_500Medium } from '@expo-google-fonts/dm-sans/500Medium';
import { DMSans_600SemiBold } from '@expo-google-fonts/dm-sans/600SemiBold';
import { DMSans_700Bold } from '@expo-google-fonts/dm-sans/700Bold';
import { useFonts } from 'expo-font';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSyncExternalStore } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors, layout } from '@/theme';
import { SessionProvider } from '@/providers/SessionProvider';
const theme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, primary: colors.action, background: colors.background, card: colors.background, text: colors.text, border: colors.border } };
const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;
export default function RootLayout() {
  // Keep the server and hydration render identical. Do not expose controls
  // before their client handlers are attached on a cold browser load.
  const interactive = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  const [loaded, error] = useFonts({ DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold, DMSans_700Bold });
  if (!interactive || (!loaded && !error)) return <View style={styles.loading}><ActivityIndicator color={colors.action} accessibilityLabel="Loading BookMyTurn" /></View>;
  if (error) return <View style={styles.loading}><Text>Could not load the app fonts. Please restart BookMyTurn.</Text></View>;
  return <SafeAreaProvider><ThemeProvider value={theme}><StatusBar style="dark" />
    <SessionProvider><View style={styles.canvas}><View style={styles.app}><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} /></View></View></SessionProvider>
  </ThemeProvider></SafeAreaProvider>;
}
const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, padding: 24 },
  canvas: { flex: 1, backgroundColor: colors.canvas, alignItems: 'center' },
  app: { flex: 1, width: '100%', maxWidth: layout.maxWidth, backgroundColor: colors.background },
});
