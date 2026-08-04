import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/**
 * `null` quando as env vars não estão configuradas — o app inteiro sabe cair pro modo
 * mock nesse caso (ver lib/mockPipeline.ts) em vez de quebrar. Isso permite `npm run dev`
 * funcionar imediatamente, mesmo sem um projeto Supabase criado ainda.
 */
export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL as string, SUPABASE_ANON_KEY as string, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;
