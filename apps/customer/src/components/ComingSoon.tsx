import { router } from 'expo-router';
import { Text } from 'react-native';
import { Action, Notice, Screen } from './UI';
import { type } from '@/theme';
export function ComingSoon({ section, title, description }: { section: string; title: string; description: string }) {
  return <Screen title={section}>
    <Text accessibilityRole="header" style={type.title}>{title}</Text>
    <Text style={type.body}>{description}</Text>
    <Notice>Coming soon. This discovery preview cannot create queue entries or appointments yet.</Notice>
    <Action label="Explore salons" onPress={() => router.navigate('/salons')} />
  </Screen>;
}
