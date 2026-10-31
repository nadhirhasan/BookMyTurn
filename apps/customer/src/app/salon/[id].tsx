import { router, useLocalSearchParams } from 'expo-router';
import { Image, Text, View } from 'react-native';
import { Action, Screen } from '@/components/UI';
import { DataStatus, styles, useRefreshOnFocus } from '@/components/CustomerUI';
import { salonDisplay, waitLabel } from '@/data/salons';
import { useCustomer } from '@/providers/CustomerProvider';
import { type } from '@/theme';
export default function SalonScreen() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();
  const { catalog, stale } = useCustomer();
  useRefreshOnFocus();
  const salon = catalog?.salons.find(s => s.slug === id || s.id === id);
  if (!catalog || !salon)
    return <Screen title="Salon"><DataStatus />{catalog && <><Text style={type.section}>Salon not found</Text><Action label="Browse salons" onPress={() => router.replace('/salons')}/></>}</Screen>;
  const display = salonDisplay(salon, catalog);
  const staff = catalog.barbers.filter(b => b.salon_id === salon.id);
  const reviews = catalog.reviews.filter(r => r.salon_id === salon.id);
  return <Screen title={salon.name} footer={<><Action label={salon.open_now ? 'Join Queue' : 'Salon closed'} disabled={!salon.open_now || stale} onPress={() => router.push(`/salon/${salon.slug}/join`)}/><Action label="Request Appointment" secondary onPress={() => router.push(`/salon/${salon.slug}/appointment`)}/></>}>
 <Image source={display.photo} style={styles.photo} accessibilityLabel={`${salon.name} illustrative photo`}/>
 <Text accessibilityRole="header" style={type.title}>{salon.name}</Text><Text style={type.caption}>{reviews.length ? `${salon.rating} · ${reviews.length} reviews` : 'No reviews yet'} · {salon.open_now ? 'Open now' : 'Closed now'}</Text>
 <Text style={type.caption}>{salon.address ?? 'Address not provided'}</Text>
 <View style={styles.card}><Text style={type.title}>{salon.waiting}</Text><Text style={type.caption}>physically waiting</Text><Text style={type.section}>{waitLabel(display)}</Text><Text style={type.caption}>Earliest estimated service: {display.earliest}</Text></View>
 <Text style={type.section}>Plan your visit</Text><Text style={type.body}>Choose a date on the calendar, then pick an available time.</Text><Action label="View calendar & times" secondary onPress={() => router.push(`/salon/${salon.slug}/appointment`)}/>
 <Text style={type.section}>Your barbers</Text>{staff.map(b => <View key={b.id} style={styles.card}><Text style={type.section}>{b.display_name}</Text><Text style={type.caption}>{b.availability === 'available' ? 'On duty' : b.availability.replaceAll('_', ' ')} · {b.review_count ? `${b.rating} (${b.review_count})` : 'No reviews yet'}</Text><Action label={`View ${b.display_name}`} secondary onPress={() => router.push(`/barber/${b.id}`)}/></View>)}
 <Action label="My haircut photos" secondary onPress={() => router.push(`/hairstyles?salon=${salon.id}`)}/>
 <Text style={type.section}>Opening hours</Text>{catalog.hours.filter(h => h.salon_id === salon.id).map(h => <Text key={h.weekday} style={type.caption}>{['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][h.weekday]} · {h.opens_at.slice(0, 5)}–{h.closes_at.slice(0, 5)}</Text>)}
 <Text style={type.section}>Recent reviews</Text>{reviews.slice(0, 10).map(r => <View key={r.id} style={styles.card}><Text style={type.label}>{r.rating}/5 · {catalog.barbers.find(b => b.id === r.barber_id)?.display_name}</Text>{r.body && <Text style={type.body}>{r.body}</Text>}</View>)}{!reviews.length && <Text style={type.caption}>Be the first to review after a completed haircut.</Text>}
 <Text style={type.caption}>{salon.photo_attribution}</Text>
</Screen>;
}
