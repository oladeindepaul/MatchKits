import './local-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

// Same Supabase project as the website, so accounts, carts, wishlists and orders are shared.
// The session is saved on the device, so shoppers stay logged in after closing the app.
export const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL!, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!, {
  auth: {
    // undefined only while the web build pre-renders pages on the server
    storage: typeof localStorage === 'undefined' ? undefined : localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

AppState.addEventListener('change', (state) => {
  if (state === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});
