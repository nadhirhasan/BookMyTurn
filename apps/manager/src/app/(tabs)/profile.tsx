import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import type { ImagePickerAsset } from 'expo-image-picker';
import { Button, Chip, Field, Note, Screen, s, useAction, useRefresh } from '@/components/UI';
import { useBarber } from '@/providers/BarberProvider';
import { auth } from '@/lib/api';
import { pickPhoto, uploadPhoto, removePhoto } from '@/lib/photos';

import { type } from '@/theme';
import {Portrait} from '@/components/ManagementUI';
import {experience as panels} from '@/components/StaffExperience';
import type { State } from '@/lib/types';
export default function Profile() { const { data } = useBarber(); useRefresh(); return <Screen title="Profile">{data && <><Button label="My work & reviews" secondary onPress={()=>router.navigate('/performance')}/><Button label="Join another salon" secondary onPress={()=>router.push('/invite')}/><ProfileForm key={data.barber.id} data={data}/></>}</Screen>; }
function ProfileForm({ data }: {
  data: State;
}) {
  const { contexts, select, refresh } = useBarber();
  const { run, busy, error, message } = useAction();
  const [name, setName] = useState(data.barber.display_name);
  const [bio, setBio] = useState(data.barber.bio ?? '');
  const [experience, setExperience] = useState(data.barber.experience_years?.toString() ?? '');
  const [specialities, setSpecialities] = useState(data.barber.specialities.join(', '));
  const [photo, setPhoto] = useState<ImagePickerAsset | null>(null);
  const [photoUrl, setPhotoUrl] = useState(data.barber.photo_url ?? '');
  const [localError, setLocalError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const pending = useRef(false);
  const [submitted,setSubmitted]=useState(false);
  const save = async () => {setSubmitted(true); if (pending.current)
    return; if (!name.trim() || experience && !/^\d{1,2}$/.test(experience) || Number(experience) > 80) {
    setLocalError('Enter your display name and experience between 0 and 80 years.');
    return;
  } pending.current = true; setSaving(true); setLocalError(null); let uploaded: {
    path: string;
    url: string;
  } | null = null; try {
    if (photo)
      uploaded = await uploadPhoto(data.barber.id, photo);
    const ok = await run('profile', { display_name: name.trim(), bio, experience_years: experience ? Number(experience) : null, specialities: specialities.split(',').map(x => x.trim()).filter(Boolean), photo_url: uploaded?.url ?? photoUrl });
    if (ok) {
      if (uploaded)
        setPhotoUrl(uploaded.url);
      setPhoto(null);
    }
    else if (uploaded)
      await removePhoto(uploaded.path);
  }
  catch (e) {
    setLocalError(e instanceof Error ? e.message : 'Could not save profile.');
    if (uploaded)
      await removePhoto(uploaded.path);
  }
  finally {
    pending.current = false;
    setSaving(false);
  } };
  return <><View style={panels.hero}><Text style={type.eyebrow}>YOUR PUBLIC PROFILE</Text><Text accessibilityRole="header" style={type.title}>{data.barber.display_name}</Text><Text style={type.body}>{data.salon.name}</Text></View>{contexts.length > 1 && <View style={s.row}>{contexts.map(c => <Chip key={c.barber_id} label={`${c.salon_name} · ${c.barber_name}`} selected={c.barber_id === data.barber.id} onPress={() => {void select(c.barber_id).catch(()=>setLocalError('Could not open this chair. Refresh and retry.'));}}/>)}</View>}
<View style={{alignItems:'center'}}><Portrait uri={photo?.uri??photoUrl} name={name} size={100}/></View><Button label="Choose profile photo" secondary disabled={saving || busy} onPress={() => { void pickPhoto().then(asset => { if (asset)
    setPhoto(asset); }, e => setLocalError(e instanceof Error ? e.message : 'Could not select that photo. Try another image.')); }}/><Text style={type.caption}>Your saved photo is public on the customer-facing barber profile.</Text>
<Field label="Display name" value={name} onChange={setName} maxLength={80} error={submitted&&!name.trim()?'Enter your name.':undefined}/><Field label="Bio" value={bio} onChange={setBio} maxLength={2000} multiline/><Field label="Years of experience" value={experience} onChange={setExperience} numeric error={submitted&&experience&&(!/^\d{1,2}$/.test(experience)||Number(experience)>80)?'Enter experience between 0 and 80 years.':undefined}/><Field label="Specialities (comma separated)" value={specialities} onChange={setSpecialities} maxLength={500}/>{(localError || error) && <Text accessibilityRole="alert" style={type.body}>{localError ?? error}</Text>}{message && <Note>{message}</Note>}<Button loading={saving} label={saving ? 'Saving profile…' : 'Save Profile'} disabled={saving || busy} onPress={() => { void save(); }}/>
<Text style={type.section}>Working hours</Text>{data.hours.map(h => <Text key={h.weekday} style={type.body}>{['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][h.weekday]} · {h.starts_at.slice(0, 5)}–{h.ends_at.slice(0, 5)}</Text>)}
<Note>Your profile updates in the customer app after saving.</Note><Button label="Sign out" secondary onPress={() => { void auth.signOut().then(() => refresh()); }}/>
</>;
}
