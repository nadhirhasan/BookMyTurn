import { createAuthActions } from './auth-actions';
import { getSupabaseClient } from './client';
export const customerAuth = createAuthActions({
  getClient: getSupabaseClient,
});
