import { useRef, useState } from 'react';
import { router } from 'expo-router';
import { Image, Text, View } from 'react-native';
import type { ImagePickerAsset } from 'expo-image-picker';
import { Button, Chip, Field, Note, Screen, s, useAction, useRefresh } from '@/components/UI';
import { useBarber } from '@/providers/BarberProvider';
import { auth } from '@/lib/api';
import { pickPhoto, uploadPhoto, removePhoto } from '@/lib/photos';
import { money } from '@/lib/types';
import { type } from '@/theme';
import type { State } from '@/lib/types';
export default function Profile() { const { data } = useBarber(); useRefresh(); return <Screen title="Profile">{data && <ProfileForm key={data.barber.id} data={data}/>}</Screen>; }
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
  const save = async () => { if (pending.current)
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
  return <><Text accessibilityRole="header" style={type.title}>{data.barber.display_name}</Text><Text style={type.body}>{data.salon.name}</Text>{contexts.length > 1 && <View style={s.row}>{contexts.map(c => <Chip key={c.barber_id} label={`${c.salon_name} · ${c.barber_name}`} selected={c.barber_id === data.barber.id} onPress={() => {void select(c.barber_id).catch(()=>setLocalError('Could not open this chair. Refresh and retry.'));}}/>)}</View>}
{(photo?.uri || photoUrl) && <Image source={{ uri: photo?.uri ?? photoUrl }} style={{ width: 100, height: 100, borderRadius: 50 }}/>}<Button label="Choose profile photo" secondary disabled={saving || busy} onPress={() => { void pickPhoto().then(asset => { if (asset)
    setPhoto(asset); }, e => setLocalError(e instanceof Error ? e.message : 'Could not select that photo. Try another image.')); }}/><Text style={type.caption}>Your saved photo is public on the customer-facing barber profile.</Text>
<Field label="Display name" value={name} onChange={setName} maxLength={80}/><Field label="Bio" value={bio} onChange={setBio} maxLength={2000} multiline/><Field label="Years of experience" value={experience} onChange={setExperience} numeric/><Field label="Specialities (comma separated)" value={specialities} onChange={setSpecialities} maxLength={500}/>{(localError || error) && <Text accessibilityRole="alert" style={type.body}>{localError ?? error}</Text>}{message && <Note>{message}</Note>}<Button label={saving ? 'Saving profile…' : 'Save Profile'} disabled={saving || busy} onPress={() => { void save(); }}/>
<Text style={type.section}>Services & price ranges</Text>{data.services.map(service => <View key={service.id} style={s.card}><Text style={type.label}>{service.name} · {service.duration_minutes} min</Text><Text style={type.body}>{money(service.price_min_minor)}–{money(service.price_max_minor)}</Text>{data.can_manage_catalog && <Button label={`Edit ${service.name}`} secondary onPress={() => router.push(`/service/${service.id}`)}/>}</View>)}
{data.can_manage_catalog && <><Button label="+ Add service" secondary onPress={() => router.push('/service/new')}/><Button label={data.salon.is_open ? 'Close salon' : 'Open salon'} secondary disabled={busy} onPress={() => { void run('salon_open', { is_open: !data.salon.is_open }); }}/></>}
<Text style={type.section}>Working hours</Text>{data.hours.map(h => <Text key={h.weekday} style={type.body}>{['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][h.weekday]} · {h.starts_at.slice(0, 5)}–{h.ends_at.slice(0, 5)}</Text>)}
<Note>Services and hours are controlled by the salon owner. Your public bio updates in the customer app after saving.</Note><Button label="Sign out" secondary onPress={() => { void auth.signOut().then(() => refresh()); }}/>
</>;
}
