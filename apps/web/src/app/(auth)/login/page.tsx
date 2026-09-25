"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { translateAuthError } from "@/lib/auth-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

async function routeAfterLogin(
  supabase: ReturnType<typeof createClient>,
  router: ReturnType<typeof useRouter>,
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    router.replace("/login");
    return;
  }
  const { data: membership } = await supabase
    .from("family_members")
    .select("role")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membership) {
    router.replace("/onboarding");
  } else if (membership.role === "responsavel") {
    router.replace("/responsavel");
  } else {
    router.replace("/executor");
  }
  router.refresh();
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    params.get("error") === "auth"
      ? "Não foi possível confirmar o login. Tente de novo."
      : null,
  );
  const [info, setInfo] = useState<string | null>(
    params.get("confirmed") === "1"
      ? "E-mail confirmado! Agora você pode entrar."
      : null,
  );
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    const supabase = createClient();
    const { error: signError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signError) {
      setLoading(false);
      setError(translateAuthError(signError.message));
      return;
    }
    await routeAfterLogin(supabase, router);
    setLoading(false);
  }

  async function signInGoogle() {
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const origin = window.location.origin;
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback?next=/`,
      },
    });
    setLoading(false);
    if (oauthError) {
      setError(
        translateAuthError(oauthError.message) +
          " (ative o provedor Google no Supabase → Authentication → Providers)",
      );
    }
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center px-4 py-8 sm:px-6">
      <Card className="w-full max-w-md">
      <Card className="w-full shrink-0 lg:max-w-md">
        <CardHeader>
          <CardTitle>Entrar</CardTitle>
          <CardDescription>Acesse sua conta Family Tasks</CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
            {info && (
              <p className="text-sm text-green-600" role="status">
                {info}
              </p>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando…" : "Entrar"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              disabled={loading}
              onClick={() => void signInGoogle()}
            >
              Continuar com Google
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Não tem conta?{" "}
              <Link
                href="/signup"
                className="font-medium text-primary underline"
              >
                Criar conta
              </Link>
            </p>
            <p className="text-center text-xs text-muted-foreground">
              <Link href="/politica" className="underline">
                Política de uso
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-screen max-w-md items-center justify-center px-4">
          <p className="text-sm text-muted-foreground">Carregando…</p>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
