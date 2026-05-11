import { supabase } from '../../config/supabase';

// Re-export the single Supabase client as supabaseAdmin for backwards compatibility.
// Both use SERVICE_ROLE_KEY — there is no separate "admin" client.
export const supabaseAdmin = supabase;
