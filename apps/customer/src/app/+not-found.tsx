import { router } from 'expo-router';
import { Text } from 'react-native';
import { Action, Screen } from '@/components/UI';
import { type } from '@/theme';
export default function NotFoundScreen() {
  return <Screen title="BookMyTurn"><Text style={type.title}>Let’s get you back.</Text><Text style={type.body}>This screen is not part of the app.</Text><Action label="Back to Home" onPress={() => router.replace('/')} /></Screen>;
}
