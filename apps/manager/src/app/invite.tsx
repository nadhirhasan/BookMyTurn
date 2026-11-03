import { useEffect, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { Scissors } from 'lucide-react-native';
import { Auth } from '@/components/Auth';
import { Button, Field, Note, Screen } from '@/components/UI';
import { useSession } from '@/providers/SessionProvider';
import { useBarber } from '@/providers/BarberProvider';
import { useManager } from '@/providers/ManagerProvider';
import { invitationAction, invitationToken, type Invitation } from '@/lib/invitations';
import { colors, type } from '@/theme';
import { auth } from '@/lib/api';

export default function Invite() {
  const { token } = useLocalSearchParams<{ token?: string }>(), session = useSession();
  if (session.status === 'loading') return <Screen title="Join a salon"><Text style={type.body}>Restoring your account…</Text></Screen>;
  if (session.status !== 'authenticated') return <Auth invited />;
  return <InviteForm key={`${session.session?.user.id}:${token ?? ''}`} initial={token ?? ''} email={session.session?.user.email ?? ''} />;
}
function InviteForm({ initial, email }: { initial: string; email: string }) {
  const { refresh: refreshBarber, select } = useBarber(), { refresh: refreshManager } = useManager();
  const [value, setValue] = useState(initial), [invite, setInvite] = useState<Invitation | null>(null), [checked, setChecked] = useState('');
  const [submitted, setSubmitted] = useState(false), [busy, setBusy] = useState(() => !!invitationToken(initial)), [error, setError] = useState<string | null>(null);
  const pending = useRef(!!invitationToken(initial)), generation = useRef(0);
  useEffect(() => () => { generation.current++; }, []);
  const token = invitationToken(value);
  useEffect(() => {
    const suppliedToken = invitationToken(initial);
    if (!suppliedToken) return;
    let active = true;
    void invitationAction<Invitation>('preview', { token: suppliedToken }).then(result => {
      if (active) { setInvite(result); setChecked(suppliedToken); }
    }, e => {
      if (active) setError(e instanceof Error ? e.message : 'Could not open this invitation.');
    }).finally(() => {
      if (active) { pending.current = false; setBusy(false); }
    });
    return () => { active = false; };
  }, [initial]);
  const run = async (accept: boolean) => {
    setSubmitted(true); if (!token || pending.current) return;
    pending.current = true; setBusy(true); setError(null); const version = ++generation.current;
    try {
      const result = await invitationAction<Invitation>(accept ? 'accept' : 'preview', { token });
      if (version !== generation.current) return;
      setInvite(result); setChecked(token);
      if (accept) { await refreshManager(true); await refreshBarber(); await select(result.barber_id); router.replace('/queue'); }
    } catch (e) { if (version === generation.current) { setInvite(null); setError(e instanceof Error ? e.message : 'Could not open this invitation.'); } }
    finally { pending.current = false; if (version === generation.current) setBusy(false); }
  };
  return <Screen title="Join a salon" back><View style={{ gap: 12, paddingVertical: 12 }}><Scissors color={colors.text} size={30} /><Text accessibilityRole="header" style={type.title}>Your chair is waiting.</Text><Text style={type.body}>{initial?'Review the salon and your account, then accept to join your chair.':'Paste the private invitation your salon owner shared with you.'}</Text><Text style={type.caption}>Joining as {email}</Text></View>
    <Field label="Invitation link or token" value={value} maxLength={2000} onChange={v => { if (pending.current) return; generation.current++; setValue(v); setInvite(null); setError(null); }} error={submitted && !token ? 'Paste a valid invitation link or token.' : undefined} />
    {invite && checked === token ? <><View style={{ gap: 8 }}><Text style={type.section}>{invite.salon_name}</Text><Text style={type.body}>{invite.barber_name}</Text><Note>You’ll get your queue, appointments, hairstyle requests and profile. Owner finances stay private.</Note></View><Button label={busy ? 'Joining…' : 'Accept invitation'} disabled={busy} onPress={() => { void run(true); }} /></> : <Button label={busy ? 'Checking…' : 'Check invitation'} disabled={busy} onPress={() => { void run(false); }} />}
    {error && <><Text accessibilityRole="alert" style={type.body}>{error}</Text><Text style={type.caption}>Check your connection and retry. If this link has expired or was replaced, ask your manager for a new invitation.</Text></>}
    <Button label="Back to my account" secondary disabled={busy} onPress={() => router.replace('/')} />
    <Button label="Use a different account" secondary disabled={busy} onPress={() => { void auth.signOut(); }} />
  </Screen>;
}
