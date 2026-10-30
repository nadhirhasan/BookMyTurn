import { useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { randomUUID } from 'expo-crypto';
import { Text, View } from 'react-native';
import type { ImagePickerAsset } from 'expo-image-picker';
import { ManagementScreen, PhotoPicker, Section } from '@/components/ManagementUI';
import { Button, Chip, Field, Note, s } from '@/components/UI';
import { useManager } from '@/providers/ManagerProvider';
import type { ManagedSalon, TeamMember } from '@/lib/management';
import { uploadManagedPhoto, removeManagedPhoto } from '@/lib/photos';
import { type } from '@/theme';
import {RecordActions} from '@/components/RecordActions';
export default function EditBarber() { const { id, salon: salonId } = useLocalSearchParams<{
  id: string;
  salon: string;
}>(); const { data } = useManager(); const salon = data?.salons.find(s => s.id === salonId), barber = salon?.barbers.find(b => b.id === id); return <ManagementScreen title={id === 'new' ? 'Add barber' : 'Edit barber'} back>{salon && (id === 'new' || barber) ? <BarberForm key={id} salon={salon} barber={barber}/> : <Note>This barber is unavailable in your account.</Note>}</ManagementScreen>; }
function BarberForm({ salon, barber }: {
  salon: ManagedSalon;
  barber?: TeamMember;
}) {
  const { save } = useManager();
  const [id] = useState(() => barber?.id ?? randomUUID());
  const created = useRef(!!barber), pending = useRef(false);
  const [name, setName] = useState(barber?.display_name ?? ''), [bio, setBio] = useState(barber?.bio ?? ''), [experience, setExperience] = useState(barber?.experience_years?.toString() ?? ''), [specialities, setSpecialities] = useState(barber?.specialities.join(', ') ?? ''), [serviceIds, setServiceIds] = useState(barber?.service_ids.filter(id=>salon.services.some(s=>s.id===id&&!s.archived_at&&s.is_active!==false)) ?? salon.services.filter(s=>!s.archived_at&&s.is_active!==false).map(s => s.id)), [active, setActive] = useState(barber?.is_active ?? true), [photo, setPhoto] = useState<ImagePickerAsset | null>(null), [photoUrl, setPhotoUrl] = useState(barber?.photo_url ?? ''), [saving, setSaving] = useState(false), [error, setError] = useState<string | null>(null);
  const submit = async () => {
    if (pending.current)
      return;
    if (!name.trim() || experience && !/^\d{1,2}$/.test(experience) || Number(experience) > 80 || !serviceIds.length) {
      setError('Enter a name, experience between 0 and 80 years, and at least one service.');
      return;
    }
    pending.current = true;
    setSaving(true);
    setError(null);
    let uploaded: Awaited<ReturnType<typeof uploadManagedPhoto>> | null = null;
    const details = { id, salon_id: salon.id, display_name: name.trim(), bio, experience_years: experience ? Number(experience) : null, specialities: specialities.split(',').map(x => x.trim()).filter(Boolean), service_ids: serviceIds, is_active: active };
    try {
      if (!created.current) {
        await save('create_barber', { ...details, photo_url: photoUrl });
        created.current = true;
      }
      if (photo)
        uploaded = await uploadManagedPhoto('barber', id, photo);
      await save('barber', { ...details, photo_url: uploaded?.url ?? photoUrl });
      if (uploaded?.url)
        setPhotoUrl(uploaded.url);
      setPhoto(null);
      router.dismissTo(`/manage/salon/${salon.id}`);
    }
    catch (e) {
      if (uploaded)
        await removeManagedPhoto(uploaded);
      setError(`${e instanceof Error ? e.message : 'Could not save.'}${created.current && !barber ? ' The barber profile exists; retry to finish saving.' : ''}`);
    }
    finally {
      pending.current = false;
      setSaving(false);
    }
  };
  if(barber?.archived_at||salon.archived_at)return <><Text style={type.title}>{barber?.display_name??salon.name}</Text>{salon.archived_at?<Note>Restore this salon before managing its team.</Note>:barber&&<RecordActions disabled={saving} kind="barber" id={id} salonId={salon.id} name={barber.display_name} archived/>}</>;
  return <><Text style={type.caption}>{salon.name}</Text><Text accessibilityRole="header" style={type.title}>{barber ? 'A familiar face, updated.' : 'Meet your next team member.'}</Text><PhotoPicker name={name || 'Barber'} asset={photo} url={photoUrl} onChange={setPhoto} disabled={saving} onRemove={()=>{setPhoto(null);setPhotoUrl('');}}/><Section title="Barber profile"><Field label="Barber name" value={name} onChange={setName} maxLength={80}/><Field label="Bio" value={bio} onChange={setBio} multiline maxLength={2000}/><Field label="Years of experience" value={experience} onChange={setExperience} numeric/><Field label="Specialities (comma separated)" value={specialities} onChange={setSpecialities} maxLength={500}/></Section><Section title="Services they offer" subtitle="Customers can book these services with this barber."><View style={s.row}>{salon.services.filter(v=>!v.archived_at&&v.is_active!==false).map(v => <Chip key={v.id} label={v.name} selected={serviceIds.includes(v.id)} onPress={() => setServiceIds(ids => ids.includes(v.id) ? ids.filter(x => x !== v.id) : [...ids, v.id])}/>)}</View></Section>{barber && <Section title="Team status"><View style={s.row}><Chip label="Active" selected={active} onPress={() => setActive(true)}/><Chip label="Inactive" selected={!active} onPress={() => setActive(false)}/></View><Text style={type.caption}>Active visits must be handled before a barber can become inactive.</Text></Section>}<Note>This profile belongs to {salon.name}. You can manage its queue and appointments from the salon team screen. No separate login or email is created.</Note>{error && <Text accessibilityRole="alert" style={type.body}>{error}</Text>}<Button label={saving ? 'Saving barber…' : barber ? 'Save barber' : 'Create barber'} disabled={saving} onPress={() => { void submit(); }}/>{barber&&<RecordActions disabled={saving} kind="barber" id={id} salonId={salon.id} name={barber.display_name}/>}</>;
}
