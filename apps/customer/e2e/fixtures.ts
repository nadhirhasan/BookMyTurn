import { expect, type Page } from '@playwright/test';
import type { Catalog } from '../src/lib/customer-types';
const id = (n: number) => `b08f0000-0000-4000-8000-${String(n).padStart(12, '0')}`;
export const salonId = id(1), serviceId = id(40), barberId = id(20), queueId = id(60), appointmentId = id(70), sessionId = id(80);
const photo = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="500" height="300"><rect width="500" height="300" fill="#ddd8d1"/></svg>');
export function fixtureCatalog(): Catalog {
  const names = ['Royal Saloon', 'MrG Akurana 6', 'MrG Akurana 7', 'MrG Akurana 8', 'Neel1', 'Neel2', 'Neel3', 'Saloon Chami', 'Mr Handsome', 'Saloon Kumar', 'Mr.perfect', 'Noire', 'Saloon Bhai'];
  return { observed_at: new Date().toISOString(), today: '2026-10-30', salons: names.map((name, i) => ({ id: id(i + 1), slug: i === 0 ? 'royal-saloon' : name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name, address: 'Akurana · test fixture', photo_url: photo, photo_attribution: 'Test image', open_now: i !== 12, waiting: 0, earliest: i === 12 ? null : new Date().toISOString(), rating: null, review_count: 0, simulation_enabled: true, booking_horizon_days: 30 })),
    barbers: [{ id: barberId, salon_id: salonId, display_name: 'Sameer', bio: 'Fictional fixture barber', experience_years: 5, photo_url: null, specialities: ['Haircut'], availability: 'available', rating: null, review_count: 0 }],
    services: names.map((_, i) => ({ id: id(40 + i), salon_id: id(i + 1), name: 'Haircut', price_min_minor: 120000 - i * 1000, price_max_minor: 140000, duration_minutes: 30 })),
    barber_services: [{ barber_id: barberId, service_id: serviceId, duration_minutes: null, price_min_minor: null, price_max_minor: null }],
    hours: [{ salon_id: salonId, weekday: 5, opens_at: '08:00:00', closes_at: '22:00:00' }], categories: [{ id: id(90), name: 'Low Fade' }], hairstyles: [{ id: id(91), category_id: id(90), title: 'Low Fade', image_url: photo, attribution: 'Test image' }], reviews: [] };
}
export async function mockDatabase(page: Page, options: {twoBarbers?: boolean} = {}) {
  const catalog = fixtureCatalog();
  const otherBarberId = id(21);
  if(options.twoBarbers){catalog.barbers.push({...catalog.barbers[0]!,id:otherBarberId,display_name:'Nimal'});catalog.barber_services.push({...catalog.barber_services[0]!,barber_id:otherBarberId});}
  let queue: any = null;
  let appointment: any = null;
  let session: any = null;
  let review: any = null;
  let shared: any = null;
  let reserved = false;
  const photos:any[]=[];
  const calls: {
    action: string;
    data: any;
  }[] = [];
  await page.route('**/rest/v1/rpc/**', async (route) => {
    expect(new URL(route.request().url()).host).toBe('example.supabase.co');
    if (route.request().method() === 'OPTIONS')
      return route.fulfill({ status: 204 });
    const name = new URL(route.request().url()).pathname.split('/').at(-1);
    if(name==='customer_gallery'){const {p_action,p_data}=route.request().postDataJSON();if(p_action==='list')return route.fulfill({json:photos});if(p_action==='save'){const id=p_data.id??crypto.randomUUID();photos.push({...p_data,id,title:p_data.title??'My haircut',image_url:p_data.hairstyle_id?catalog.hairstyles.find(h=>h.id===p_data.hairstyle_id)?.image_url:null,storage_path:p_data.storage_path??null});return route.fulfill({json:{id}});}if(p_action==='remove'){const i=photos.findIndex(p=>p.id===p_data.id);if(i>=0)photos.splice(i,1);}if(p_action==='rename'){const p=photos.find(p=>p.id===p_data.id);if(p)p.title=p_data.title;}return route.fulfill({json:{id:p_data.id}});}
    if (name === 'customer_catalog')
      return route.fulfill({ json: { ...catalog, observed_at: new Date().toISOString() } });
    if (name === 'customer_state')
      return route.fulfill({ json: { queues: queue ? [queue] : [], appointments: appointment ? [appointment] : [], proposals: [], sessions: session ? [session] : [], reviews: review ? [review] : [], style_requests: shared ? [shared] : [], notifications: [] } });
    if (name === 'customer_quote')
      return route.fulfill({ json: { barber_id: barberId, starts_at: new Date().toISOString() } });
    if (name === 'qr_visit') {
      const { p_action: action, p_token: token } = route.request().postDataJSON();
      if (action === 'join') {
        queue ??= { id: queueId, salon_id: salonId, reference: '384205', preferred_barber_id: null, assigned_barber_id: null, service_id: null, source: 'qr', status: 'arrived', created_at: new Date().toISOString(), estimated_start: new Date().toISOString(), linked_to_account: false };
        catalog.salons[0]!.waiting = 1;
      }
      if (action === 'cancel') {
        queue.status = 'cancelled';
        catalog.salons[0]!.waiting = 0;
      }
      expect(token).toMatch(/^[0-9a-f-]{36}:[0-9a-f-]{36}$/);
      return route.fulfill({ json: queue });
    }
    if (name === 'customer_slots') {
      const body = route.request().postDataJSON();
      const date = body.p_day;
      const staff=options.twoBarbers?[barberId,otherBarberId]:[barberId];
      return route.fulfill({ json: staff.filter(b=>!body.p_barber||body.p_barber===b).flatMap(b=>[{ starts_at: `${date}T03:30:00Z`, ends_at: `${date}T04:00:00Z`, barber_id: b, available: !reserved }, { starts_at: `${date}T04:00:00Z`, ends_at: `${date}T04:30:00Z`, barber_id: b, available: false }]) });
    }
    expect(name).toBe('customer_command');
    const { p_action: action, p_data: data } = route.request().postDataJSON();
    calls.push({ action, data });
    if (action === 'join_queue') {
      queue ??= { id: queueId, salon_id: salonId, reference: '184205', preferred_barber_id: data.barber_id, assigned_barber_id: null, service_id: data.service_id, source: data.source, status: data.present ? 'arrived' : 'joined', created_at: new Date().toISOString(), estimated_start: new Date().toISOString() };
    }
    else if (action === 'check_in') {
      queue.status = 'arrived';
      catalog.salons[0]!.waiting = 1;
    }
    else if (action === 'cancel_queue') {
      queue.status = 'cancelled';
      catalog.salons[0]!.waiting = 0;
    }
    else if (action === 'request_appointment') {
      if (reserved)
        return route.fulfill({ status: 409, json: { code: '23P01', message: 'Conflict' } });
      reserved = true;
      appointment = { id: appointmentId, salon_id: salonId, reference: '284205', service_id: serviceId, preferred_barber_id: data.barber_id, status: 'pending', requested_start: data.starts_at, confirmed_start: null, confirmed_barber_id: null };
    }
    else if (action === 'cancel_appointment') {
      appointment.status = 'cancelled';
      reserved = false;
    }
    else if (action === 'demo_accept') {
      appointment.status = 'confirmed';
      appointment.confirmed_start = appointment.requested_start;
      appointment.confirmed_barber_id = barberId;
    }
    else if (action === 'demo_finish_queue' || action === 'demo_finish_appointment') {
      session = { id: sessionId, queue_entry_id: action === 'demo_finish_queue' ? queueId : null, appointment_id: action === 'demo_finish_appointment' ? appointmentId : null, barber_id: barberId, salon_id: salonId, status: 'completed', service_name_snapshot: 'Haircut' };
      if (action === 'demo_finish_queue') {
        queue.status = 'completed';
        catalog.salons[0]!.waiting = 0;
      }
      else
        appointment.status = 'completed';
    }
    else if (action === 'review') {
      review = { id: id(81), service_session_id: sessionId };
      catalog.reviews = [{ id: review.id, salon_id: salonId, barber_id: barberId, rating: data.rating, body: data.body, created_at: new Date().toISOString() }];
      catalog.salons[0]!.rating = data.rating;
      catalog.salons[0]!.review_count = 1;
    }
    else if (action === 'share_styles')
      shared = { id: id(82), queue_entry_id: data.kind === 'queue' ? data.id : null, appointment_id: data.kind === 'appointment' ? data.id : null, hairstyle_ids: data.hairstyle_ids, note: data.note };
    return route.fulfill({ json: { id: action === 'join_queue' ? queueId : action === 'request_appointment' ? appointmentId : data.id ?? id(99) } });
  });
  return { catalog, calls,photos,finishQueue:()=>{queue.status='completed';session={id:sessionId,queue_entry_id:queueId,appointment_id:null,barber_id:barberId,salon_id:salonId,status:'completed',service_name_snapshot:'Haircut'};},acceptAppointment:()=>{appointment.status='confirmed';appointment.confirmed_start=appointment.requested_start;appointment.confirmed_barber_id=barberId;}, reserve: () => { reserved = true; } };
}
export async function signInFixture(page: Page) {
  const user = { id: 'b04f0000-0000-4000-8000-000000000001', aud: 'authenticated', role: 'authenticated', email: 'pipeline@example.invalid', app_metadata: { provider: 'email' }, user_metadata: {}, identities: [], created_at: '2026-10-30T00:00:00Z' };
  const token = `${Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')}.${Buffer.from(JSON.stringify({ sub: user.id, aud: 'authenticated', role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')}.fixture`;
  await page.route('**/auth/v1/**', route => {
    expect(new URL(route.request().url()).host).toBe('example.supabase.co');
    if (route.request().method() === 'OPTIONS')
      return route.fulfill({ status: 204 });
    if (new URL(route.request().url()).pathname.endsWith('/user'))
      return route.fulfill({ json: user });
    return route.fulfill({ json: { user, access_token: token, refresh_token: 'fixture-refresh', token_type: 'bearer', expires_in: 3600 } });
  });
  await page.route('**/rest/v1/customer_profiles?**', r => r.fulfill({ json: { id: user.id, display_name: null, created_at: user.created_at, updated_at: user.created_at } }));
  await page.goto('/sign-in');
  await page.getByLabel('Email address', { exact: true }).fill(user.email);
  await page.getByLabel('Password', { exact: true }).fill('Fixture password 123');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'You’re signed in' })).toBeVisible();
}
