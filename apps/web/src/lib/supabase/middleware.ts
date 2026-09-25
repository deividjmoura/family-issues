import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC = ["/", "/login", "/signup"];

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return supabaseResponse;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC.includes(path);

  if (!user && !isPublic && path !== "/onboarding") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", path);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && (path === "/login" || path === "/signup" || path === "/")) {
    const { data: membership } = await supabase
      .from("family_members")
      .select("role")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    const dest = request.nextUrl.clone();
    if (!membership) {
      dest.pathname = "/onboarding";
    } else if (membership.role === "responsavel") {
      dest.pathname = "/responsavel";
    } else {
      dest.pathname = "/executor";
    }
    return NextResponse.redirect(dest);
  }

  if (user && (path.startsWith("/responsavel") || path.startsWith("/executor"))) {
    const { data: membership } = await supabase
      .from("family_members")
      .select("role")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (!membership) {
      const dest = request.nextUrl.clone();
      dest.pathname = "/onboarding";
      return NextResponse.redirect(dest);
    }
    if (path.startsWith("/responsavel") && membership.role !== "responsavel") {
      const dest = request.nextUrl.clone();
      dest.pathname = "/executor";
      return NextResponse.redirect(dest);
    }
    if (path.startsWith("/executor") && membership.role !== "executor") {
      const dest = request.nextUrl.clone();
      dest.pathname = "/responsavel";
      return NextResponse.redirect(dest);
    }
  }

  return supabaseResponse;
}
