import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { auth } from '@/lib/api';
import { validateCredentials } from '@core/auth-actions';
import { Button, Screen, s } from './UI';
import { colors, type } from '@/theme';
export function Auth() {
  const [signup, setSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (busy)
      return;
    const mode = signup ? 'sign-up' : 'sign-in';
    const errors = validateCredentials(mode, { email, password });
    setError(errors.email ?? errors.password ?? null);
    if (errors.email || errors.password)
      return;
    setBusy(true);
    try {
      const result = await auth.submit(mode, { email, password });
      if (!result.ok)
        setError(result.error);
      else
        setPassword('');
    }
    finally {
      setBusy(false);
    }
  };
  return <Screen title="BookMyTurn Manager"><View style={{ paddingVertical: 28, gap: 12 }}><Text style={type.caption}>GOOD DAYS START HERE.</Text><Text accessibilityRole="header" style={type.title}>{signup ? 'Your salons start here.' : 'Welcome back.'}</Text><Text style={type.body}>{signup ? 'One account for your salons, your barbers and your customers.' : 'Sign in to manage your salons and keep the day moving.'}</Text></View>
  <Text style={type.label}>Email address</Text><TextInput accessibilityLabel="Email address" placeholder="salon@example.com" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" editable={!busy} style={s.input}/>
  <Text style={type.label}>Password</Text><View style={[s.input, { flexDirection: 'row', alignItems: 'center', paddingVertical: 0 }]}><TextInput accessibilityLabel="Password" placeholder={signup ? 'At least 8 characters' : 'Your password'} value={password} onChangeText={setPassword} autoCapitalize="none" autoCorrect={false} secureTextEntry={!visible} editable={!busy} style={{ flex: 1, minHeight: 50, color: colors.text }} onSubmitEditing={() => { void submit(); }}/><Pressable accessibilityRole="button" accessibilityLabel={visible ? 'Hide password' : 'Show password'} onPress={() => setVisible(!visible)} style={s.icon}>{visible ? <EyeOff color={colors.text} size={20}/> : <Eye color={colors.text} size={20}/>}</Pressable></View>
  {error && <Text accessibilityRole="alert" style={type.body}>{error}</Text>}<Button label={busy ? 'Please wait…' : signup ? 'Create account' : 'Sign in'} disabled={busy} onPress={() => { void submit(); }}/><Button label={signup ? 'Already have an account? Sign in' : 'New here? Create an account'} secondary disabled={busy} onPress={() => { setSignup(!signup); setError(null); }}/>
  <Text style={type.caption}>No email verification for development testing. Manage multiple salons with one account. Assigned barber logins still work.</Text>
  </Screen>;
}
