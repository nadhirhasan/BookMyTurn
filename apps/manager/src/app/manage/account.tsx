import { useEffect, useRef, useState } from 'react';
import { Text } from 'react-native';
import type { ImagePickerAsset } from 'expo-image-picker';
import { ManagementScreen, PhotoPicker, Section } from '@/components/ManagementUI';
import { Button, Field, Note } from '@/components/UI';
import { useManager } from '@/providers/ManagerProvider';
import { useSession } from '@/providers/SessionProvider';
import { accountPhoto, uploadManagedPhoto, removeManagedPhoto } from '@/lib/photos';
import {PhoneAlerts} from '@/components/PhoneAlerts';
import { auth } from '@/lib/api';
import { type } from '@/theme';
export default function Account() { const { data } = useManager(); return <ManagementScreen title="My account" back navigation>{data && <AccountForm profile={data.profile}/>}</ManagementScreen>; }
function AccountForm({ profile }: {
  profile: {
    display_name: string;
    avatar_path: string | null;
  };
}) {
  const { save } = useManager();
  const session = useSession();
  const [name, setName] = useState(profile.display_name), [photo, setPhoto] = useState<ImagePickerAsset | null>(null), [url, setUrl] = useState<string | null>(null), [saving, setSaving] = useState(false), [error, setError] = useState<string | null>(null), [saved, setSaved] = useState(false);
  const pending = useRef(false);
  const [removed,setRemoved]=useState(false);
  useEffect(() => { let active = true; if (profile.avatar_path)
    void accountPhoto(profile.avatar_path).then(value => { if (active)
      setUrl(value); }, () => { if (active)
      setError('Could not load your photo. You can still save your profile.'); }); return () => { active = false; }; }, [profile.avatar_path]);
  const submit = async () => { if (pending.current)
    return; if (!name.trim()) {
    setError('Enter your name.');
    return;
  } pending.current = true; setSaving(true); setError(null); setSaved(false); let uploaded: Awaited<ReturnType<typeof uploadManagedPhoto>> | null = null; try {
    if (photo)
      uploaded = await uploadManagedPhoto('manager', '', photo);
    await save('profile', { display_name: name.trim(), avatar_path: uploaded?.path ?? (removed?null:profile.avatar_path) });
    setPhoto(null);
    setRemoved(false);
    if(!uploaded&&removed)setUrl(null);
    setSaved(true);
  }
  catch (e) {
    if (uploaded)
      await removeManagedPhoto(uploaded);
    setError(e instanceof Error ? e.message : 'Could not save profile.');
  }
  finally {
    pending.current = false;
    setSaving(false);
  } };
  return <><Text accessibilityRole="header" style={type.title}>The person behind the salons.</Text><Text style={type.body}>One account. Every salon you manage.</Text><PhotoPicker name={name || 'Me'} asset={photo} url={removed?null:url} onChange={a=>{setPhoto(a);if(a)setRemoved(false);}} disabled={saving} onRemove={()=>{setPhoto(null);setRemoved(true);}}/><Section title="Your profile"><Field label="Your name" value={name} onChange={setName} maxLength={80}/><Text style={type.caption}>Signed in as</Text><Text style={type.body}>{session.session?.user.email}</Text></Section><Note>Your account photo is private. Salon and barber photos are shown to customers.</Note>{error && <Text accessibilityRole="alert" style={type.body}>{error}</Text>}{saved && <Note>Profile saved.</Note>}<Button label={saving ? 'Saving profile…' : 'Save account profile'} disabled={saving} onPress={() => { void submit(); }}/><PhoneAlerts/><Button label="Sign out" secondary disabled={saving} onPress={() => { void auth.signOut(); }}/></>;
}
