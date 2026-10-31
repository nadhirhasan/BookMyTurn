import { Redirect, router, useLocalSearchParams, type Href } from 'expo-router';
import { Eye, EyeOff } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Action, Header } from '@/components/UI';
import { customerAuth } from '@/lib/supabase/auth';
import { validateCredentials, type AuthMode, type CredentialErrors } from '@/lib/supabase/auth-actions';
import { useSession } from '@/providers/SessionProvider';
import { colors, fonts, type } from '@/theme';
export default function AuthScreen({ mode }: {
  mode: AuthMode;
}) {
  const session = useSession();
  const { returnTo: rawReturn } = useLocalSearchParams<{
    returnTo?: string;
  }>();
  const returnTo = rawReturn && /^\/(?:salon\/|hairstyles$|queue$|appointments$|queue-entry\/|review\/)/.test(rawReturn) ? rawReturn : '/account';
  const signup = mode === 'sign-up';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [fields, setFields] = useState<CredentialErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const mounted = useRef(true);
  const passwordInput = useRef<TextInput>(null);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const submit = async () => {
    if (pending.current || session.status === 'loading' || session.status === 'unconfigured')
      return;
    const nextErrors = validateCredentials(mode, { email, password });
    setFields(nextErrors);
    setError(null);
    if (nextErrors.email || nextErrors.password)
      return;
    pending.current = true;
    setBusy(true);
    try {
      const result = await customerAuth.submit(mode, { email, password });
      if (!mounted.current)
        return;
      if (!result.ok)
        setError(result.error);
      else
        setPassword('');
    }
    finally {
      pending.current = false;
      if (mounted.current)
        setBusy(false);
    }
  };
  if (session.status === 'authenticated')
    return <Redirect href={returnTo as Href}/>;
  const unavailable = session.status === 'unconfigured';
  return <SafeAreaView edges={['top', 'bottom']} style={s.screen}>
  <Header title="BookMyTurn"/>
  <KeyboardAvoidingView style={s.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
   <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>
    <View style={s.intro}>
     <Text style={s.eyebrow}>YOUR ACCOUNT</Text>
     <Text accessibilityRole="header" style={s.title}>{signup ? 'Create your account' : 'Welcome back'}</Text>
     <Text style={[type.body, s.muted]}>{signup ? 'Start with your email and a password.' : 'Sign in to your BookMyTurn account.'}</Text>
    </View>
    <View style={s.form}>
     <View style={s.field}>
      <Text style={type.label}>Email address</Text>
      <TextInput accessibilityLabel="Email address" aria-invalid={!!fields.email} value={email} onChangeText={value => { setEmail(value); setFields(current => ({ ...current, email: undefined })); setError(null); }} placeholder="you@example.com" placeholderTextColor={colors.muted} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" returnKeyType="next" onSubmitEditing={() => passwordInput.current?.focus()} editable={!busy} maxLength={254} style={[s.input, fields.email && s.invalid]}/>
      {fields.email && <Text accessibilityRole="alert" style={s.fieldError}>{fields.email}</Text>}
     </View>
     <View style={s.field}>
      <Text style={type.label}>Password</Text>
      <View style={[s.passwordRow, fields.password && s.invalid]}>
       <TextInput ref={passwordInput} accessibilityLabel="Password" aria-invalid={!!fields.password} value={password} onChangeText={value => { setPassword(value); setFields(current => ({ ...current, password: undefined })); setError(null); }} placeholder={signup ? 'Create a password' : 'Enter your password'} placeholderTextColor={colors.muted} secureTextEntry={!visible} autoCapitalize="none" autoCorrect={false} autoComplete={signup ? 'new-password' : 'current-password'} returnKeyType="done" onSubmitEditing={() => { void submit(); }} editable={!busy} maxLength={1024} style={s.password}/>
       <Pressable accessibilityRole="button" accessibilityLabel={visible ? 'Hide password' : 'Show password'} aria-pressed={visible} onPress={() => setVisible(value => !value)} style={s.eye}>
        {visible ? <EyeOff size={20} color={colors.muted}/> : <Eye size={20} color={colors.muted}/>}
       </Pressable>
      </View>
      {fields.password ? <Text accessibilityRole="alert" style={s.fieldError}>{fields.password}</Text>
      : signup && <Text style={type.caption}>At least 8 characters.</Text>}
     </View>
     {(error || unavailable || session.status === 'error') && <View style={s.errorBox}>
      <Text accessibilityRole="alert" style={type.body}>{error ?? (unavailable
        ? 'Account access is unavailable right now. You can still browse salons.' : session.error)}</Text>
     </View>}
     <Action label={busy ? (signup ? 'Creating account…' : 'Signing in…') : (signup ? 'Create account' : 'Sign in')} onPress={() => { void submit(); }} disabled={busy || unavailable || session.status === 'loading'}/>
     {session.status === 'loading' && <ActivityIndicator color={colors.action} accessibilityLabel="Restoring your session"/>}
    </View>
    <View style={s.switchRow}>
     <Text style={type.body}>{signup ? 'Already have an account?' : 'New to BookMyTurn?'}</Text>
     <Pressable accessibilityRole="link" disabled={busy} onPress={() => router.replace({ pathname: signup ? '/sign-in' : '/sign-up', params: { returnTo } })} style={s.link}>
      <Text style={s.linkText}>{signup ? 'Sign in' : 'Create an account'}</Text>
     </Pressable>
    </View>
    <View style={s.guest}>
     <Action label="Continue without an account" secondary onPress={() => router.replace('/')}/>
     <Text style={[type.caption, s.center]}>You can explore salons without signing in.</Text>
    </View>
   </ScrollView>
  </KeyboardAvoidingView>
 </SafeAreaView>;
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background }, keyboard: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 36, paddingBottom: 28, gap: 28 },
  intro: { gap: 10 }, eyebrow: { fontFamily: fonts.medium, fontSize: 11, letterSpacing: 1.3, color: colors.muted },
  title: { fontFamily: fonts.bold, fontSize: 28, lineHeight: 36, color: colors.text }, muted: { color: colors.muted },
  form: { gap: 20 }, field: { gap: 8 },
  input: { minHeight: 54, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontFamily: fonts.regular, fontSize: 16, color: colors.text },
  passwordRow: { minHeight: 54, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 12 },
  password: { flex: 1, minWidth: 0, paddingLeft: 16, paddingVertical: 14, fontFamily: fonts.regular, fontSize: 16, color: colors.text },
  eye: { width: 48, minHeight: 52, alignItems: 'center', justifyContent: 'center' }, invalid: { borderColor: '#B42318', borderWidth: 2 },
  fieldError: { ...type.caption, color: '#B42318' }, errorBox: { padding: 14, borderRadius: 12, backgroundColor: colors.surface },
  switchRow: { alignItems: 'center', gap: 2 }, link: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12 },
  linkText: { ...type.label, textDecorationLine: 'underline' },
  guest: { borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: 14, gap: 2 }, center: { textAlign: 'center' },
});
