import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Fluxos de confirmação/OAuth que pediram um destino interno explícito
        // podem ser atendidos sem abrir um redirecionamento externo.
        if (next === "/login?confirmed=1") {
          return NextResponse.redirect(`${origin}/login?confirmed=1`);
        }
        if (next === "/onboarding") {
          return NextResponse.redirect(`${origin}/onboarding`);
        }

        const { data: membership } = await supabase
          .from("family_members")
          .select("role")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();

        if (!membership) {
          return NextResponse.redirect(`${origin}/onboarding`);
        }
        if (membership.role === "responsavel") {
          return NextResponse.redirect(`${origin}/responsavel`);
        }
        return NextResponse.redirect(`${origin}/executor`);
      }

      return NextResponse.redirect(`${origin}/onboarding`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
