export type SupabaseConfiguration = { url: string; publishableKey: string };
export type ConfigurationResult =
  | { configuration: SupabaseConfiguration; error: null }
  | { configuration: null; error: string };

export function parseSupabaseConfiguration(urlValue?: string, keyValue?: string): ConfigurationResult {
  const url = urlValue?.trim();
  const publishableKey = keyValue?.trim();
  try {
    if (!url) throw new Error();
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password ||
      parsed.search || parsed.hash || (parsed.pathname !== '/' && parsed.pathname !== '')) {
      throw new Error();
    }
  } catch {
    return { configuration: null, error: 'Set EXPO_PUBLIC_SUPABASE_URL to your HTTPS project URL in the root .env, then restart Expo.' };
  }
  if (!publishableKey || !/^sb_publishable_[a-zA-Z0-9_-]+$/.test(publishableKey)) {
    return { configuration: null, error: 'Set EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY to a Supabase publishable key in the root .env, then restart Expo.' };
  }
  return { configuration: { url: url!.replace(/\/$/, ''), publishableKey }, error: null };
}
