export type SalonPoint = { latitude: number; longitude: number };
export function salonPoint(salon: { latitude?: number | null; longitude?: number | null }): SalonPoint | null {
  const { latitude, longitude } = salon;
  return typeof latitude === 'number' && typeof longitude === 'number' && Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180 ? { latitude, longitude } : null;
}
export function directionsUrl(point: SalonPoint, provider: 'google' | 'apple' = 'google', name = '') {
  if (!salonPoint(point)) throw new Error('Salon location is unavailable.');
  const destination = encodeURIComponent(`${point.latitude},${point.longitude}`);
  return provider === 'apple' ? `https://maps.apple.com/?daddr=${destination}&q=${encodeURIComponent(name)}` : `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
}
