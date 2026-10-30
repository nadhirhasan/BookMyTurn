import { getSupabaseClient } from './client';

const columns = 'id, display_name, created_at, updated_at' as const;

async function requireCustomer() {
  const { client, error } = getSupabaseClient();
  if (!client) throw new Error(error ?? 'Supabase is not configured.');
  const result = await client.auth.getUser();
  if (result.error || !result.data.user) throw new Error('Please sign in to access your profile.');
  return { client, userId: result.data.user.id };
}

export async function getMyProfile() {
  const { client, userId } = await requireCustomer();
  const { data, error } = await client.from('customer_profiles').select(columns).eq('id', userId).single();
  if (error) throw new Error('Your profile could not be loaded. Please try again.');
  return data;
}

export async function updateMyDisplayName(value: string | null) {
  const displayName = value?.trim() || null;
  if (displayName && [...displayName].length > 80) throw new Error('Use a display name of 80 characters or fewer.');
  const { client, userId } = await requireCustomer();
  const { data, error } = await client.from('customer_profiles').update({ display_name: displayName })
    .eq('id', userId).select(columns).single();
  if (error) throw new Error('Your display name could not be saved. Please try again.');
  return data;
}
