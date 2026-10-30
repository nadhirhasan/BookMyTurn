import type { ImageSourcePropType } from 'react-native';
const photos = { salon: require('../../assets/images/salon.jpg'), barber: require('../../assets/images/barber.jpg'), royal: require('../../assets/images/royal.jpg') };
export type Salon = {
  id: string; name: string; rating: number; reviews: number; price: number;
  wait: readonly [number, number]; waiting: number; barbers: number; available: number;
  earliest: string; open: boolean; photo: ImageSourcePropType; barberNames: string[];
};
// Fixed fictional snapshot at 2:00 pm, Asia/Colombo. No live availability is implied.
export const salons: Salon[] = [
  { id: 'royal-saloon', name: 'Royal Saloon', rating: 4.8, reviews: 124, price: 1200, wait: [0, 5], waiting: 0, barbers: 2, available: 1, earliest: 'Now', open: true, photo: photos.salon, barberNames: ['Sameer', 'Nimal'] },
  { id: 'noire', name: 'Noire', rating: 4.9, reviews: 62, price: 1400, wait: [10, 15], waiting: 0, barbers: 2, available: 0, earliest: '2:15 pm', open: true, photo: photos.barber, barberNames: ['Ashan', 'Fazil'] },
  { id: 'mrg-akurana-6', name: 'MrG Akurana 6', rating: 4.7, reviews: 86, price: 1100, wait: [20, 30], waiting: 2, barbers: 2, available: 0, earliest: '2:25 pm', open: true, photo: photos.royal, barberNames: ['Rizwan', 'Kamal'] },
  { id: 'saloon-chami', name: 'Saloon Chami', rating: 4.6, reviews: 93, price: 1000, wait: [30, 40], waiting: 3, barbers: 2, available: 0, earliest: '2:40 pm', open: true, photo: photos.salon, barberNames: ['Chami', 'Dilan'] },
  ...([
    ['mrg-akurana-7', 'MrG Akurana 7', 1150], ['mrg-akurana-8', 'MrG Akurana 8', 1200],
    ['neel1', 'Neel1', 900], ['neel2', 'Neel2', 950], ['neel3', 'Neel3', 1000],
    ['mr-handsome', 'Mr Handsome', 1300], ['saloon-kumar', 'Saloon Kumar', 850],
    ['mr-perfect', 'Mr.perfect', 1250], ['saloon-bhai', 'Saloon Bhai', 800],
  ] as const).map(([id, name, price], index): Salon => ({
    id, name, price, rating: 4.5, reviews: 30 + index * 7, wait: [40 + index * 5, 50 + index * 5],
    waiting: 2 + index % 3, barbers: 2, available: 0,
    earliest: formatTime(14 * 60 + 45 + index * 5), open: index !== 8,
    photo: index % 2 ? photos.barber : photos.royal, barberNames: [`Barber ${index + 1}`],
  })),
];
function formatTime(minutes: number) { return `${Math.floor(minutes / 60) % 12 || 12}:${String(minutes % 60).padStart(2, '0')} pm`; }
export const money = (amount: number) => `Rs. ${amount.toLocaleString('en-LK')}`;
export const waitLabel = (salon: Salon) => salon.open ? `${salon.wait[0]}–${salon.wait[1]} min` : 'Closed';
export const queueLabel = (salon: Salon) => {
  if (!salon.open) return 'Opens tomorrow at 9:00 am';
  if (salon.available) return `${salon.waiting} waiting · ${salon.available} barber available`;
  return `${salon.waiting} waiting · ${salon.waiting === 0 ? 'Barbers in service' : `${salon.barbers} barbers`}`;
};
export function searchSalons(query: string) {
  const term = query.trim().toLocaleLowerCase();
  return salons.filter(salon => [salon.name, ...salon.barberNames].some(value => value.toLocaleLowerCase().includes(term)));
}
