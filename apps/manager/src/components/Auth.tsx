import { useState } from 'react';
import { router } from 'expo-router';
import { Image, Pressable, Text, TextInput, View } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { auth } from '@/lib/api';
import { validateCredentials,type CredentialErrors } from '@core/auth-actions';
import { Button, Screen, s } from './UI';
import { colors, type } from '@/theme';
export function Auth({ invited = false }: { invited?: boolean }) {
  const [signup, setSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [fields,setFields]=useState<CredentialErrors>({});
  const submit = async () => {
    if (busy)
      return;
    const mode = signup ? 'sign-up' : 'sign-in';
    const errors = validateCredentials(mode, { email, password });
    setFields(errors);setError(null);
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
  return <Screen title={invited ? 'Join a salon' : 'BookMyTurn Manager'}><View style={{backgroundColor:colors.peach,borderRadius:22,overflow:'hidden'}}><Image source={require('../../../customer/assets/images/salon.jpg')} accessible={false} style={{width:'100%',height:130}}/><View style={{padding:20,gap:12}}><Text style={type.caption}>YOUR SALON. YOUR TEAM.</Text><Text accessibilityRole="header" style={type.title}>{signup ? invited ? 'Make yourself at home.' : 'Your salons start here.' : 'Welcome back.'}</Text><Text style={type.body}>{invited ? 'Sign in or create your own account, then accept your barber invitation.' : signup ? 'One account for your salons, your barbers and your customers.' : 'Sign in to your salon and keep the day moving.'}</Text></View></View>
  <Text style={type.label}>Email address</Text><TextInput accessibilityLabel="Email address" placeholder="salon@example.com" value={email} aria-invalid={!!fields.email} onChangeText={value=>{setEmail(value);setFields(f=>({...f,email:undefined}));}} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" editable={!busy} style={[s.input,fields.email&&{borderColor:'#B42318',backgroundColor:'#FFF6F5'}]}/>{fields.email&&<Text accessibilityRole="alert" style={{...type.caption,color:'#B42318'}}>{fields.email}</Text>}
  <Text style={type.label}>Password</Text><View style={[s.input,fields.password&&{borderColor:'#B42318',backgroundColor:'#FFF6F5'}, { flexDirection: 'row', alignItems: 'center', paddingVertical: 0 }]}><TextInput accessibilityLabel="Password" placeholder={signup ? 'At least 8 characters' : 'Your password'} value={password} aria-invalid={!!fields.password} onChangeText={value=>{setPassword(value);setFields(f=>({...f,password:undefined}));}} autoCapitalize="none" autoCorrect={false} secureTextEntry={!visible} editable={!busy} style={{ flex: 1, minHeight: 50, color: colors.text }} onSubmitEditing={() => { void submit(); }}/><Pressable accessibilityRole="button" accessibilityLabel={visible ? 'Hide password' : 'Show password'} onPress={() => setVisible(!visible)} style={s.icon}>{visible ? <EyeOff color={colors.text} size={20}/> : <Eye color={colors.text} size={20}/>}</Pressable></View>
  {fields.password&&<Text accessibilityRole="alert" style={{...type.caption,color:'#B42318'}}>{fields.password}</Text>}{error && <Text accessibilityRole="alert" style={type.body}>{error}</Text>}<Button label={busy ? 'Please wait…' : signup ? 'Create account' : 'Sign in'} disabled={busy} onPress={() => { void submit(); }}/><Button label={signup ? 'Already have an account? Sign in' : 'New here? Create an account'} secondary disabled={busy} onPress={() => { setSignup(!signup); setError(null); }}/>
  {!invited && <Button label="Invited barber? Join a salon" secondary onPress={() => router.push('/invite')} />}
  </Screen>;
}
