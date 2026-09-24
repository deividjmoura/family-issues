import { createBrowserClient } from "@supabase/ssr";

import { assertSupabaseEnv, SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

/**
 * Cliente Supabase para Client Components ("use client").
 * Uso: `const supabase = createClient();`
 * TODO(#14): tipar com `Database` gerado (`supabase gen types typescript`).
 */
export function createClient() {
  assertSupabaseEnv();
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
