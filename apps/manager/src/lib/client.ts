import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { parseSupabaseConfiguration } from '@core/config';
import type { Database } from './database';
let client: SupabaseClient<Database> | null = null;
// Called after mount, never during static rendering. Only public configuration
// goes into the app; administrative keys must never be added here.
export function getSupabaseClient() {
  const result = parseSupabaseConfiguration(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  if (!result.configuration)
    return { client: null, error: result.error };
  if (!client) {
    client = createClient<Database>(result.configuration.url, result.configuration.publishableKey, {
      auth: {
        ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
        storageKey: `bookmyturn.barber.auth.${new URL(result.configuration.url).host}`,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        // Password-only signup returns a session directly. Supabase does not
        // support PKCE email signup with auto-confirm enabled. No redirect or
        // URL-token handling is enabled; verified-link/OAuth flows are deferred.
        flowType: 'implicit',
      },
    });
  }
  return { client, error: null };
}
