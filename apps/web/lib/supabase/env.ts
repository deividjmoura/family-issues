/**
 * Leitura centralizada das variáveis públicas do Supabase.
 * `hasSupabaseEnv()` permite que o app suba (ex.: preview/landing) mesmo sem .env.local.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function hasSupabaseEnv(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export function assertSupabaseEnv(): void {
  if (!hasSupabaseEnv()) {
    throw new Error(
      "Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY em apps/web/.env.local (veja .env.example).",
    );
  }
}
