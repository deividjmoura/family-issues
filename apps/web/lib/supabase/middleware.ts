import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { hasSupabaseEnv, SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

/** Rotas que exigem login. Ajustar em #13 (onboarding). */
const PROTECTED_PREFIXES = ["/responsavel", "/executor", "/onboarding"];

/**
 * Renova a sessão do Supabase a cada request e protege rotas autenticadas.
 * Sem env configurado, deixa passar (útil pra preview da landing).
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!hasSupabaseEnv()) return response;

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Não colocar lógica entre createServerClient e getUser() (recomendação do @supabase/ssr).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some((p) => path.startsWith(p));

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  return response;
}
