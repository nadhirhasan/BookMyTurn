import { createAuthActions } from './auth-actions';
import { getSupabaseClient } from './client';
import { parseSupabaseConfiguration } from './config';
import { checkImmediateSignup } from './signup-policy';

export const customerAuth = createAuthActions({
  getClient: getSupabaseClient,
  canSignUpImmediately: async () => {
    const { configuration } = parseSupabaseConfiguration(
      process.env.EXPO_PUBLIC_SUPABASE_URL,
      process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    );
    return configuration ? checkImmediateSignup(configuration.url, configuration.publishableKey) : false;
  },
});
