import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import { parseSupabaseConfiguration } from './config';
import type { Database } from './database.types';

let client: SupabaseClient<Database> | null = null;

// Called after mount, never during static rendering. Only public configuration
// goes into the app; administrative keys must never be added here.
export function getSupabaseClient() {
  const result = parseSupabaseConfiguration(
    process.env.EXPO_PUBLIC_SUPABASE_URL,
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
  if (!result.configuration) return { client: null, error: result.error };
  if (!client) {
    client = createClient<Database>(result.configuration.url, result.configuration.publishableKey, {
      auth: {
        ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
        storageKey: `bookmyturn.customer.auth.${new URL(result.configuration.url).host}`,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        flowType: 'pkce',
      },
    });
  }
  return { client, error: null };
}
