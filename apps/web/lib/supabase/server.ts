import "server-only";

import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import { assertSupabaseEnv, SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

/**
 * Cliente Supabase para Server Components, Server Actions e Route Handlers.
 * Respeita RLS (age como o usuário logado via cookies).
 * Uso: `const supabase = await createClient();`
 */
export async function createClient() {
  assertSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Chamado de um Server Component: não dá pra setar cookie aqui.
          // O middleware já renova a sessão, então pode ignorar.
        }
      },
    },
  });
}

/**
 * Cliente com SERVICE ROLE — ignora RLS. Só no servidor e só quando inevitável
 * (ex.: inserir notificação para outro usuário, se não houver policy/trigger).
 * NUNCA importar em código cliente.
 */
export function createAdminClient() {
  assertSupabaseEnv();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY não definido.");
  }
  return createSupabaseClient(SUPABASE_URL, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
