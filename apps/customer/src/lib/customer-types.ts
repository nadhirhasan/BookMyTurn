export type SalonRecord = {
  id: string;
  slug: string;
  name: string;
  address: string | null;
  photo_url: string | null;
  photo_attribution: string | null;
  open_now: boolean;
  waiting: number;
  earliest: string | null;
  rating: number | null;
  review_count: number;
  simulation_enabled: boolean;
  booking_horizon_days: number;
};
export type Barber = {
  id: string;
  salon_id: string;
  display_name: string;
  bio: string | null;
  experience_years: number | null;
  photo_url: string | null;
  specialities: string[];
  availability: string;
  rating: number | null;
  review_count: number;
  earliest?: string | null;
  waiting?: number;
};
export type Service = {
  id: string;
  salon_id: string;
  name: string;
  price_min_minor: number;
  price_max_minor: number;
  duration_minutes: number;
};
export type Hairstyle = {
  id: string;
  category_id: string;
  title: string;
  image_url: string;
  attribution: string;
};
export type PublishedReview = {
  id: string;
  salon_id: string;
  barber_id: string;
  rating: number;
  body: string | null;
  created_at: string;
};
export type Catalog = {
  observed_at: string;
  today: string;
  salons: SalonRecord[];
  barbers: Barber[];
  services: Service[];
  barber_services: {
    barber_id: string;
    service_id: string;
    duration_minutes: number | null;
    price_min_minor: number | null;
    price_max_minor: number | null;
  }[];
  hours: {
    salon_id: string;
    weekday: number;
    opens_at: string;
    closes_at: string;
  }[];
  categories: {
    id: string;
    name: string;
  }[];
  hairstyles: Hairstyle[];
  reviews: PublishedReview[];
};
export type VisitLabels = {salon_name?:string|null;service_name?:string|null;barber_name?:string|null};
export type QueueEntry = VisitLabels & {
  id: string;
  salon_id: string;
  reference: string;
  preferred_barber_id: string | null;
  assigned_barber_id: string | null;
  service_id: string | null;
  source: string;
  status: string;
  created_at: string;
  estimated_start: string | null;
};
export type Appointment = VisitLabels & {
  id: string;
  salon_id: string;
  reference: string;
  service_id: string;
  preferred_barber_id: string | null;
  status: string;
  requested_start: string;
  confirmed_start: string | null;
  confirmed_barber_id: string | null;
};
export type VisitState = {
  queues: QueueEntry[];
  appointments: Appointment[];
  proposals: {
    id: string;
    appointment_id: string;
    barber_id: string;
    starts_at: string;
    ends_at: string;
    suggested_at: string;
  }[];
  sessions: {
    id: string;
    queue_entry_id: string | null;
    appointment_id: string | null;
    barber_id: string;
    salon_id: string;
    status: string;
    service_name_snapshot: string;
  }[];
  reviews: {
    id: string;
    service_session_id: string;
  }[];
  style_requests: {
    id: string;
    queue_entry_id: string | null;
    appointment_id: string | null;
    hairstyle_ids: string[];
    note: string | null;
  }[];
  notifications: {
    id: string;
    title: string;
    body: string;
    created_at: string;
    read_at: string | null;
  }[];
};
export type Slot = {
  starts_at: string;
  ends_at: string;
  barber_id: string;
  available: boolean;
};
export const emptyVisits = (): VisitState => ({ queues: [], appointments: [], proposals: [], sessions: [], reviews: [], style_requests: [], notifications: [] });
export const money = (minor: number) => `Rs. ${(minor / 100).toLocaleString('en-LK')}`;
export const time = (value: string) => new Date(value).toLocaleTimeString('en-LK', { timeZone: 'Asia/Colombo', hour: 'numeric', minute: '2-digit' });
export const visitDate = (value: string) => new Date(value).toLocaleDateString('en-LK', { timeZone: 'Asia/Colombo', day: 'numeric', month: 'short', year: 'numeric' });
export const activeQueue = (q: QueueEntry) => ['joined', 'arrived', 'in_service'].includes(q.status);
export const statusLabel = (status: string) => ({ joined: 'Joined — not yet arrived', arrived: 'Arrived — waiting', pending: 'Pending salon confirmation', alternative_suggested: 'Alternative time suggested', confirmed: 'Confirmed', in_service: 'In service', completed: 'Completed', cancelled: 'Cancelled', declined: 'Declined', no_show: 'Not attended' })[status] ?? status;
