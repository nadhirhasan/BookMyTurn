import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Button } from './UI';
import { teamAccess, type TeamAccess } from '@/lib/invitations';
import { type } from '@/theme';

export function useTeamLoginStatus(salonId: string, enabled: boolean, updated: number | null) {
  const [members, setMembers] = useState<TeamAccess[] | null>(null);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    void teamAccess(salonId).then(items => {
      if (active) { setMembers(items); setError(false); }
    }, () => { if (active) setError(true); });
    return () => { active = false; };
  }, [salonId, enabled, updated, retry]);
  return { members, error, retry: () => setRetry(n => n + 1) };
}

export function loginStatus(member: TeamAccess | undefined) {
  if (member?.connected) return 'Account connected';
  const invitation = member?.invitation;
  if (invitation?.status === 'pending' && new Date(invitation.expires_at).getTime() > Date.now()) return 'Invitation pending';
  if (invitation?.status === 'expired' || invitation?.status === 'pending') return 'Invitation expired';
  return 'Invitation needed';
}

export function TeamLoginRetry({ retry }: { retry: () => void }) {
  return <View style={{ gap: 8 }}><Text accessibilityRole="alert" style={type.caption}>Could not check team login status. Your team profiles are still available.</Text><Button label="Retry team access" secondary onPress={retry}/></View>;
}
