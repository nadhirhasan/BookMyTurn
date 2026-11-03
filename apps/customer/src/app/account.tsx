import { Redirect, router } from 'expo-router';
import { MenuRow } from '@/components/Experience';
import { CalendarDays, Clock3, Images, Store, UserRound } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Action, Screen } from '@/components/UI';
import { customerAuth } from '@/lib/supabase/auth';
import type { CustomerProfile } from '@/lib/supabase/database.types';
import { getMyProfile } from '@/lib/supabase/profiles';
import { useSession } from '@/providers/SessionProvider';
import { colors, type } from '@/theme';
export default function Account() {
  const session = useSession();
  const user = session.status === 'authenticated' ? session.session?.user : null;
  const userId = user?.id;
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [profileIssueFor, setProfileIssueFor] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pending = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    if (!userId)
      return;
    let active = true;
    void getMyProfile().then(value => { if (active) {
      setProfile(value);
      setProfileIssueFor(null);
    } })
      .catch(() => { if (active)
      setProfileIssueFor(userId); });
    return () => { active = false; };
  }, [userId, retry]);
  const signOut = async () => {
    if (pending.current)
      return;
    pending.current = true;
    setBusy(true);
    setError(null);
    try {
      const result = await customerAuth.signOut();
      if (mounted.current && !result.ok)
        setError(result.error);
    }
    finally {
      pending.current = false;
      if (mounted.current)
        setBusy(false);
    }
  };
  if (session.status === 'loading')
    return <Screen title="Your account"><ActivityIndicator color={colors.action} accessibilityLabel="Restoring your session"/></Screen>;
  if (!user)
    return <Redirect href="/sign-in"/>;
  return <Screen title="Your account">
  <View style={s.intro}>
   <View style={s.avatar}><UserRound size={28} color={colors.text}/></View>
   <Text accessibilityRole="header" style={type.title}>{profile?.id === user.id && profile.display_name ? profile.display_name : 'You’re signed in'}</Text>
   <Text style={[type.body, s.email]}>{user.is_anonymous ? 'Guest on this device' : user.email}</Text>
   {user.is_anonymous && <Text style={type.caption}>Signing out removes access to guest visits. Use an email account for testing across devices.</Text>}
  </View>
  {profileIssueFor === user.id && <View style={s.notice}>
   <Text accessibilityRole="alert" style={type.body}>Your profile could not be loaded. You can keep browsing and try again.</Text>
   <Action label="Retry profile" secondary onPress={() => { setProfileIssueFor(null); setRetry(value => value + 1); }}/>
  </View>}
  <View><MenuRow icon={Clock3} title="My queue" subtitle="Track your turn and arrival" onPress={()=>router.navigate('/queue')}/><MenuRow icon={CalendarDays} title="My appointments" subtitle="Requests, confirmations and past visits" onPress={()=>router.navigate('/appointments')}/><MenuRow icon={Images} title="My haircut collections" subtitle="Ideas to share with your barber" onPress={()=>router.navigate('/hairstyles')}/><MenuRow icon={Store} title="Explore salons" subtitle="Find your next haircut" onPress={()=>router.navigate('/salons')}/></View>
  {error && <Text accessibilityRole="alert" style={type.body}>{error}</Text>}
  <Action label={busy ? 'Signing out…' : 'Sign out'} secondary disabled={busy} onPress={() => { void signOut(); }}/>
 </Screen>;
}
const s = StyleSheet.create({
  intro: { alignItems: 'center', gap: 12, paddingVertical: 24 }, avatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.brandSoft },
  email: { textAlign: 'center', color: colors.muted }, details: { gap: 8, backgroundColor: colors.surface, borderRadius: 16, padding: 20 },
  notice: { padding: 16, borderWidth: 1, borderColor: colors.border, borderRadius: 12, gap: 4 },
});
