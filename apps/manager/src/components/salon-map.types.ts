import type { SalonPoint } from '../../../customer/src/lib/salon-location';
export type { SalonPoint };
// A starting viewport, never a saved or automatically selected business location.
export const initialMapCenter: SalonPoint = { latitude: 7.368, longitude: 80.615 };
export type SalonMapProps = { value: SalonPoint | null; current: SalonPoint | null; focus: { point: SalonPoint; revision: number } | null; onChange: (point: SalonPoint) => void };
