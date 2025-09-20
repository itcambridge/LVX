import { createBrowserClient } from '@supabase/ssr';

// Use the same client creation method as in lib/supabase/client.ts
// This avoids multiple GoTrueClient instances in the browser
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
