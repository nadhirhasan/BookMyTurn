import { useState } from 'react';
import { Linking, Platform, Text, View } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { Action } from './UI';
import { directionsUrl, salonPoint } from '@/lib/salon-location';
import { colors, type } from '@/theme';

export function SalonDirections({ salon }: { salon: { name: string; address: string | null; latitude?: number | null; longitude?: number | null } }) {
  const point = salonPoint(salon), [error, setError] = useState<string | null>(null);
  const open = async (provider: 'google' | 'apple') => {
    if (!point) return; setError(null);
    try { await Linking.openURL(directionsUrl(point, provider, salon.name)); }
    catch { setError('Could not open Maps. Please try again.'); }
  };
  return <View style={{ gap: 12, padding: 18, backgroundColor: colors.surface, borderRadius: 20 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><MapPin color={colors.action} size={21} /><Text style={type.section}>Find the salon</Text></View>
    <Text style={type.body}>{salon.address ?? 'Address not provided'}</Text>
    {point ? <><Text style={type.caption}>Directions lead to the location pinned by the salon.</Text><Action label="Get directions in Google Maps" onPress={() => { void open('google'); }} />{Platform.OS === 'ios' && <Action label="Open in Apple Maps" secondary onPress={() => { void open('apple'); }} />}</> : <Text style={type.caption}>The salon has not added its map pin yet. Contact the salon to confirm its entrance.</Text>}
    {error && <Text accessibilityRole="alert" style={type.body}>{error}</Text>}
  </View>;
}
