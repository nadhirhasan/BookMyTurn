import { useRef, useState } from 'react';
import { router } from 'expo-router';
import { randomUUID } from 'expo-crypto';
import { Text, View } from 'react-native';
import type { ImagePickerAsset } from 'expo-image-picker';
import { Field, Button, Chip, Note, s } from './UI';
import { PhotoPicker, Section } from './ManagementUI';
import { useManager } from '@/providers/ManagerProvider';
import { uploadManagedPhoto, removeManagedPhoto } from '@/lib/photos';
import type { ManagedSalon } from '@/lib/management';
import { minor } from '@/lib/types';
import { type } from '@/theme';
import {RecordActions} from './RecordActions';
import {WeeklyHours,validHours} from './WeeklyHours';
export function SalonEditor({ salon }: {
  salon?: ManagedSalon;
}) {
  const { save } = useManager();
  const [id] = useState(() => salon?.id ?? randomUUID());
  const created = useRef(!!salon), pending = useRef(false);
  const [name, setName] = useState(salon?.name ?? ''), [address, setAddress] = useState(salon?.address ?? ''), [open, setOpen] = useState(salon?.is_open ?? true), [photo, setPhoto] = useState<ImagePickerAsset | null>(null), [photoUrl, setPhotoUrl] = useState(salon?.photo_url ?? '');
  const [service, setService] = useState('Haircut'), [lo, setLo] = useState(''), [hi, setHi] = useState(''), [duration, setDuration] = useState('30'), [opens, setOpens] = useState('09:00'), [closes, setCloses] = useState('20:00'), [days, setDays] = useState([0, 1, 2, 3, 4, 5, 6]), [saving, setSaving] = useState(false), [error, setError] = useState<string | null>(null);
  const [hours,setHours]=useState(salon?.hours.map(h=>({...h,opens_at:h.opens_at.slice(0,5),closes_at:h.closes_at.slice(0,5)}))??[]);
  const submit = async () => {
    if (pending.current)
      return;
    const min = minor(lo), max = minor(hi);
    if (salon && !validHours(hours)) {setError('Check each working day: closing time must be after opening time.');return;}
    if (!name.trim() || !address.trim() || (!created.current && (!service.trim() || min === null || max === null || max < min || !/^\d+$/.test(duration) || Number(duration) < 1 || Number(duration) > 480 || !/^([01]\d|2[0-3]):[0-5]\d$/.test(opens) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(closes) || closes <= opens || !days.length))) {
      setError('Check the salon details, first service prices and opening hours.');
      return;
    }
    pending.current = true;
    setSaving(true);
    setError(null);
    let uploaded: Awaited<ReturnType<typeof uploadManagedPhoto>> | null = null;
    try {
      if (!created.current) {
        await save('create_salon', { id, name: name.trim(), address, service_name: service.trim(), price_min_minor: min, price_max_minor: max, duration_minutes: Number(duration), opens_at: opens, closes_at: closes, weekdays: days });
        created.current = true;
      }
      if (photo)
        uploaded = await uploadManagedPhoto('salon', id, photo);
      await save('salon', { salon_id: id, name: name.trim(), address, photo_url: uploaded?.url ?? photoUrl, is_open: open, ...(salon?{hours}:{} ) });
      if (uploaded?.url)
        setPhotoUrl(uploaded.url);
      setPhoto(null);
      router.dismissTo(`/manage/salon/${id}`);
    }
    catch (e) {
      if (uploaded)
        await removeManagedPhoto(uploaded);
      setError(`${e instanceof Error ? e.message : 'Could not save.'}${created.current && !salon ? ' Your salon has been created; retry to finish saving these details.' : ''}`);
    }
    finally {
      pending.current = false;
      setSaving(false);
    }
  };
  if(salon?.archived_at)return <><Text style={type.title}>{salon.name}</Text><RecordActions disabled={saving} kind="salon" id={id} salonId={id} name={salon.name} archived/></>;
  return <><Text accessibilityRole="header" style={type.title}>{salon ? 'Make it feel like you.' : 'A new home for great hair.'}</Text><Text style={type.body}>{salon ? 'Keep your salon details welcoming and up to date.' : 'Add your salon first. Your team comes next.'}</Text><PhotoPicker cover name={name || 'Salon'} asset={photo} url={photoUrl} onChange={setPhoto} disabled={saving} onRemove={()=>{setPhoto(null);setPhotoUrl('');}}/><Section title="Salon details"><Field label="Salon name" value={name} onChange={setName}/><Field label="Address in Akurana" value={address} onChange={setAddress} maxLength={500}/>{salon && <View style={s.row}><Chip label="Open for customers" selected={open} onPress={() => setOpen(true)}/><Chip label="Closed" selected={!open} onPress={() => setOpen(false)}/></View>}</Section>{!salon && <><Section title="Your first service" subtitle="Set a fair range. Add more services anytime."><Field label="Service name" value={service} onChange={setService}/><Field label="Minimum price (Rs.)" numeric value={lo} onChange={setLo}/><Field label="Maximum price (Rs.)" numeric value={hi} onChange={setHi}/><Field label="Service duration (minutes)" numeric value={duration} onChange={setDuration}/></Section><Section title="Opening hours" subtitle="New barbers start with these working hours."><View style={s.row}>{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label, d) => <Chip key={label} label={label} selected={days.includes(d)} onPress={() => setDays(v => v.includes(d) ? v.filter(x => x !== d) : [...v, d])}/>)}</View><Field label="Opens at (24h HH:MM)" value={opens} onChange={setOpens}/><Field label="Closes at (24h HH:MM)" value={closes} onChange={setCloses}/></Section></>}{salon&&<WeeklyHours value={hours} onChange={setHours}/>}<Note>{salon?'Your salon photo and opening hours are visible to customers.':'Your salon photo is public in the customer app. Queues and appointments start empty.'}</Note>{error && <Text accessibilityRole="alert" style={type.body}>{error}</Text>}<Button label={saving ? 'Saving salon…' : salon ? 'Save salon' : 'Create salon'} disabled={saving} onPress={() => { void submit(); }}/>{salon&&<RecordActions disabled={saving} kind="salon" id={id} salonId={id} name={salon.name}/>}</>;
}
