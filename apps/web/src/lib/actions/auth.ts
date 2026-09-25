"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const AUTH_ERRORS: Record<string, string> = {
  "Invalid login credentials": "E-mail ou senha incorretos.",
  "Email not confirmed": "Confirme seu e-mail antes de entrar (veja a caixa de entrada).",
  "User already registered": "Este e-mail já está cadastrado. Faça login.",
  "Password should be at least 6 characters": "A senha precisa ter pelo menos 6 caracteres.",
  "Unable to validate email address: invalid format": "E-mail inválido.",
  "Signup requires a valid password": "Informe uma senha válida.",
  "Email rate limit exceeded": "Muitas tentativas. Aguarde um minuto.",
};

export function translateAuthError(message: string): string {
  if (AUTH_ERRORS[message]) return AUTH_ERRORS[message];
  const lower = message.toLowerCase();
  if (lower.includes("invalid login")) return "E-mail ou senha incorretos.";
  if (lower.includes("not confirmed")) return "Confirme seu e-mail antes de entrar.";
  if (lower.includes("already")) return "Este e-mail já está cadastrado.";
  if (lower.includes("password")) return "Senha inválida ou muito curta (mín. 6).",
  if (lower.includes("rate limit")) return "Muitas tentativas. Aguarde um minuto.";
  return message || "Não foi possível autenticar.";
}

export async function signInWithPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { ok: false as const, error: translateAuthError(error.message) };
  }
  redirect("/onboarding");
}

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const supabase = await createClient();

  const origin =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}` ||
    "http://localhost:3000";

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${origin}/auth/callback?next=/login`,
    },
  });
  if (error) {
    return { ok: false as const, error: translateAuthError(error.message) };
  }
  // Se confirmação de e-mail estiver ligada, não há session
  if (!data.session) {
    return {
      ok: true as const,
      needsConfirm: true as const,
      message:
        "Enviamos um link de confirmação para o seu e-mail. Depois de confirmar, faça login.",
    };
  }
  redirect("/onboarding");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function getGoogleOAuthUrl(): Promise<string | null> {
  const supabase = await createClient();
  const origin =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=/onboarding`,
      skipBrowserRedirect: true,
    },
  });
  if (error || !data.url) return null;
  return data.url;
}
