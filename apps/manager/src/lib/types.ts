import type { Json } from '@core/database.types';
export type { Json };
export type Context = {
  barber_id: string;
  salon_id: string;
  barber_name: string;
  salon_name: string;
  role: string;
};
export type Service = {
  archived_at?: string | null;
  is_active?: boolean;
  id: string;
  name: string;
  duration_minutes: number;
  price_min_minor: number;
  price_max_minor: number;
};
export type Queue = {
  id: string;
  reference: string;
  customer_name: string | null;
  mobile: string | null;
  service_id: string | null;
  status: string;
  source: string;
  estimated_start: string | null;
};
export type Appointment = {
  id: string;
  reference: string;
  customer_name: string | null;
  service_id: string | null;
  status: string;
  requested_start: string;
  confirmed_start: string | null;
};
export type Session = {
  id: string;
  queue_entry_id: string | null;
  appointment_id: string | null;
  service_id: string | null;
  status: string;
  started_at: string;
  completed_at: string | null;
  service_name_snapshot: string;
  price_min_minor_snapshot: number | null;
  price_max_minor_snapshot: number | null;
  agreed_price_minor: number | null;
  final_amount_minor: number | null;
  commission_disclosure_snapshot: string | null;
  commission_surcharge_minor: number;
};
export type StyleRequest = {
  collection_title?: string | null;
  id: string;
  queue_entry_id: string | null;
  appointment_id: string | null;
  note: string | null;
  viewed_at: string | null;
  images: {
    id: string;
    title: string;
    image_url: string | null;
    storage_path?: string | null;
  }[];
};
export type State = {
  observed_at: string;
  today: string;
  salon: {
    id: string;
    name: string;
    slug: string;
    is_open: boolean;
  };
  barber: {
    id: string;
    display_name: string;
    bio: string | null;
    experience_years: number | null;
    specialities: string[];
    photo_url: string | null;
    availability: string;
  };
  can_manage_catalog: boolean;
  queues: Queue[];
  appointments: Appointment[];
  sessions: Session[];
  services: Service[];
  styles: StyleRequest[];
  hours: {
    weekday: number;
    starts_at: string;
    ends_at: string;
  }[];
  reviews: {
    id: string;
    rating: number;
    body: string | null;
    created_at: string;
  }[];
  breaks: {
    id: string;
    starts_at: string;
    ends_at: string;
  }[];
  commission_rules: {
    id: string;
    surcharge_minor: number;
    disclosure: string;
    eligible_sources: string[];
  }[];
  performance: {
    today_count: number;
    today_revenue_minor: number;
    total_count: number;
    total_revenue_minor: number;
  };
};
export { money, time, visitDate, statusLabel } from '@customer/lib/customer-types';
export function minor(value: string): number | null { if (!/^\d{1,8}(\.\d{1,2})?$/.test(value.trim()))
  return null; const [whole, decimal = ''] = value.trim().split('.'); const result = Number(whole) * 100 + Number(decimal.padEnd(2, '0')); return Number.isSafeInteger(result) ? result : null; }
