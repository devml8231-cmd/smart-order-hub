import { createClient, SupabaseClient } from '@supabase/supabase-js';
import config from './index';

// Create Supabase client with anon key (for client-side operations)
export const supabase: SupabaseClient = createClient(
  config.supabase.url,
  config.supabase.anonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: false,
    },
  }
);

// Create Supabase admin client with service role key (for server-side operations)
export const supabaseAdmin: SupabaseClient = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Real-time subscription helper
export const subscribeToChannel = (
  channelName: string,
  table: string,
  callback: (payload: any) => void
) => {
  return supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table },
      callback
    )
    .subscribe();
};

export default supabase;
