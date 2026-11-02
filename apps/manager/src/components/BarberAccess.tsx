import { useCallback, useEffect, useRef, useState } from 'react';
import { Share, Text, TextInput, View } from 'react-native';
import { UserRoundCheck, UserRoundPlus } from 'lucide-react-native';
import { Section } from './ManagementUI';
import { Button, Note, s } from './UI';
import { invitationAction, invitationLink, newInvitation, teamAccess, type TeamAccess } from '@/lib/invitations';
import { useManager } from '@/providers/ManagerProvider';
import { useSession } from '@/providers/SessionProvider';
import { colors, type } from '@/theme';

export function BarberAccess({ salonId, barberId }: { salonId: string; barberId: string }) {
  const session = useSession();
  const uid = session.status === 'authenticated' ? session.session?.user.id : null;
  return <AccessForm key={`${uid}:${barberId}`} salonId={salonId} barberId={barberId} />;
}
function AccessForm({ salonId, barberId }: { salonId: string; barberId: string }) {
  const { refresh, lastUpdated } = useManager();
  const [access, setAccess] = useState<TeamAccess | null>(null), [loading, setLoading] = useState(true), [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null), [secret, setSecret] = useState<ReturnType<typeof newInvitation> | null>(null);
  const [confirm, setConfirm] = useState(false);
  const pending = useRef(false), retry = useRef<ReturnType<typeof newInvitation> | null>(null);
  const load = useCallback(async () => { const items = await teamAccess(salonId); setAccess(items.find(a => a.barber_id === barberId) ?? null); }, [salonId, barberId]);
  useEffect(() => { let active = true; teamAccess(salonId).then(items => { if (active) setAccess(items.find(a => a.barber_id === barberId) ?? null); }, e => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [salonId, barberId, lastUpdated]);
  const run = async (action: 'create' | 'cancel' | 'revoke') => {
    if (pending.current) return;
    pending.current = true; setBusy(true); setError(null);
    try {
      if (action === 'create') {
        const draft = retry.current ?? newInvitation(); retry.current = draft;
        await invitationAction('create', { ...draft, salon_id: salonId, barber_id: barberId });
        setSecret(draft); retry.current = null;
      } else {
        await invitationAction(action, { salon_id: salonId, barber_id: barberId, id: access?.invitation?.id ?? null });
        setSecret(null); retry.current = null; setConfirm(false);
      }
      await load(); await refresh(true);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not update barber access.'); }
    finally { pending.current = false; setBusy(false); }
  };
  return <Section title="Barber login" subtitle="One personal account for this chair.">
    <View style={s.row}>{access?.connected ? <UserRoundCheck size={22} color={colors.positive} /> : <UserRoundPlus size={22} color={colors.muted} />}<Text style={type.label}>{loading ? 'Checking access…' : access?.connected ? 'Account connected' : 'No account connected'}</Text></View>
    {access?.connected ? <><Text style={type.body}>{access.account_email}</Text><Text style={type.caption}>Queue, appointments, hairstyle requests and personal profile. Owner finances stay private.</Text>{confirm ? <><Note>Remove this account’s access? The chair, customers and haircut history stay in your salon.</Note><Button label="Confirm remove access" disabled={busy} onPress={() => { void run('revoke'); }} /><Button label="Keep access" secondary disabled={busy} onPress={() => setConfirm(false)} /></> : <Button label="Remove barber access" secondary disabled={busy} onPress={() => setConfirm(true)} />}</> : <>
      {access?.invitation && <Text style={type.caption}>Invitation {access.invitation.status} · {new Date(access.invitation.expires_at).toLocaleDateString()}</Text>}
      {secret && <><Text style={type.label}>Private invitation link</Text><TextInput accessibilityLabel="Private invitation link" value={invitationLink(secret.token)} editable={false} selectTextOnFocus multiline style={[s.input, { minHeight: 128, fontSize: 13, lineHeight: 20 }]} /><Button label="Share invitation" secondary onPress={() => { void Share.share({ message: invitationLink(secret.token) }).catch(() => setError('Could not open sharing. Select and copy the link above.')); }} /><Text style={type.caption}>Share only with your barber. They can also paste this link into Join a salon. Expires in seven days.</Text></>}
      <Button label={busy ? 'Please wait…' : access?.invitation?.status === 'pending' ? 'Replace invitation' : 'Create invitation'} disabled={busy || loading} onPress={() => { void run('create'); }} />
      {access?.invitation?.status === 'pending' && <Button label="Cancel invitation" secondary disabled={busy} onPress={() => { void run('cancel'); }} />}
    </>}
    {error && <Text accessibilityRole="alert" style={type.body}>{error}</Text>}
    {!access && !loading && <Button label="Retry access check" secondary disabled={busy} onPress={() => { setError(null); void load().catch(e => setError(e.message)); }} />}
  </Section>;
}
