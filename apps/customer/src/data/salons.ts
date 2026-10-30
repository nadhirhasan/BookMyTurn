import type { ImageSourcePropType } from 'react-native';
import type { Catalog, SalonRecord } from '@/lib/customer-types';
import { time } from '@/lib/customer-types';
export { money } from '@/lib/customer-types';
export type Salon = {
  id: string;
  name: string;
  rating: number | null;
  reviews: number;
  price: number | null;
  wait: readonly [
    number,
    number
  ] | null;
  waiting: number;
  barbers: number;
  available: number;
  earliest: string;
  open: boolean;
  photo: ImageSourcePropType;
  barberNames: string[];
};
// Display projection only. No synthetic catalogue, rating or availability fallback.
export function salonDisplay(salon: SalonRecord, catalog: Catalog): Salon {
  const staff = catalog.barbers.filter(b => b.salon_id === salon.id);
  const prices = catalog.services.filter(v => v.salon_id === salon.id).map(v => v.price_min_minor);
  const minutes = salon.earliest ? Math.max(0, Math.ceil((new Date(salon.earliest).getTime() - new Date(catalog.observed_at).getTime()) / 60000)) : null;
  return { id: salon.slug, name: salon.name, rating: salon.rating, reviews: salon.review_count,
    price: prices.length ? Math.min(...prices) : null, wait: minutes === null ? null : [minutes, minutes],
    waiting: salon.waiting, barbers: staff.length, available: staff.filter(b => b.availability === 'available').length,
    earliest: salon.earliest ? minutes === 0 ? 'Now' : time(salon.earliest) : 'No capacity today', open: salon.open_now,
    photo: salon.photo_url ? { uri: salon.photo_url } : require('../../assets/images/salon.jpg'), barberNames: staff.map(b => b.display_name) };
}
export const waitLabel = (salon: Salon) => !salon.open ? 'Closed' : salon.wait ? salon.wait[0] === 0 ? 'No estimated wait' : `About ${salon.wait[0]} min` : 'No capacity today';
export const queueLabel = (salon: Salon) => `${salon.waiting} physically waiting · ${salon.barbers} barbers`;
export function searchSalons(salons: Salon[], query: string) {
  const term = query.trim().toLocaleLowerCase();
  return salons.filter(salon => [salon.name, ...salon.barberNames].some(value => value.toLocaleLowerCase().includes(term)));
}
