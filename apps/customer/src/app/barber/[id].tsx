import { router, useLocalSearchParams } from 'expo-router';
import { Image, Text, View } from 'react-native';
import { Action, Screen } from '@/components/UI';
import { DataStatus, styles, useRefreshOnFocus } from '@/components/CustomerUI';
import { time } from '@/lib/customer-types';
import { useCustomer } from '@/providers/CustomerProvider';
import { type } from '@/theme';
export default function BarberProfile() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();
  const { catalog } = useCustomer();
  useRefreshOnFocus();
  const barber = catalog?.barbers.find(b => b.id === id);
  const salon = catalog?.salons.find(s => s.id === barber?.salon_id);
  return <Screen title={barber?.display_name ?? 'Barber'}><DataStatus />{catalog && barber && salon ? <>
{barber.photo_url && <Image source={{ uri: barber.photo_url }} style={styles.photo}/>}<Text accessibilityRole="header" style={type.title}>{barber.display_name}</Text><Text style={type.body}>{salon.name}</Text><Text style={type.caption}>{barber.review_count ? `${barber.rating} · ${barber.review_count} reviews` : 'No reviews yet'} · {barber.availability === 'available' ? 'On duty' : barber.availability.replaceAll('_', ' ')}</Text><Text style={type.body}>{barber.bio}</Text>{barber.experience_years !== null && <Text style={type.caption}>{barber.experience_years} years experience</Text>}<Text style={type.caption}>{barber.specialities.join(' · ')}</Text>
<Action label="Choose Barber — Join Queue" disabled={!salon.open_now} onPress={() => router.push(`/salon/${salon.slug}/join?barber=${barber.id}`)}/><Action label="Request Appointment" secondary onPress={() => router.push(`/salon/${salon.slug}/appointment?barber=${barber.id}`)}/>
<Text style={type.caption}>{barber.waiting ?? 0} assigned waiting · {barber.earliest ? `Estimated service ${time(barber.earliest)}` : 'No estimated capacity today'}</Text>
<Text style={type.section}>Customer reviews</Text>{catalog.reviews.filter(r => r.barber_id === barber.id).map(r => <View key={r.id} style={styles.card}><Text style={type.label}>{r.rating}/5</Text>{r.body && <Text style={type.body}>{r.body}</Text>}</View>)}{!barber.review_count && <Text style={type.caption}>Reviews appear after completed haircuts.</Text>}
</> : catalog && <Text style={type.body}>Barber not found.</Text>}</Screen>;
}
