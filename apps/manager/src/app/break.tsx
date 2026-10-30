import { router } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';
import { Button, Field, Note, Screen, useAction } from '@/components/UI';
import { type } from '@/theme';
export default function BreakScreen() { const [minutes, setMinutes] = useState('15'); const { run, error, busy } = useAction(); return <Screen title="Take a break" back><Text accessibilityRole="header" style={type.title}>A moment for yourself.</Text><Field label="Break duration (minutes)" value={minutes} onChange={setMinutes} numeric/><Note>Existing customers stay in the queue. An overlapping appointment must be handled before taking this break.</Note>{error && <Text accessibilityRole="alert" style={type.body}>{error}</Text>}<Button label="Start break" disabled={busy || !/^\d+$/.test(minutes) || Number(minutes) < 1 || Number(minutes) > 240} onPress={() => { void run('availability', { status: 'on_break', minutes: Number(minutes) }, () => router.dismissTo('/queue')); }}/></Screen>; }
