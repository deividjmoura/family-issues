"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
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

function generateInviteCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [familyName, setFamilyName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace("/login");
        return;
      }
      setUserId(data.user.id);
      // Se já é membro de alguma família, vai pro app
      supabase
        .from("family_members")
        .select("id, role")
        .eq("user_id", data.user.id)
        .limit(1)
        .then(({ data: members }) => {
          if (members && members.length > 0) {
            const role = members[0].role;
            router.replace(role === "responsavel" ? "/responsavel" : "/executor");
          }
        });
    });
  }, [router]);

  async function createFamily(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const code = generateInviteCode();

    const { data: family, error: famErr } = await supabase
      .from("families")
      .insert({ name: familyName, invite_code: code, created_by: userId })
      .select("id")
      .single();

    if (famErr || !family) {
      setLoading(false);
      setError(famErr?.message ?? "Erro ao criar família");
      return;
    }

    const { error: memErr } = await supabase.from("family_members").insert({
      family_id: family.id,
      user_id: userId,
      role: "responsavel",
    });

    setLoading(false);
    if (memErr) {
      setError(memErr.message);
      return;
    }
    router.push("/responsavel");
    router.refresh();
  }

  async function joinFamily(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setError(null);
    setLoading(true);
    const supabase = createClient();

    const { data: family, error: findErr } = await supabase
      .from("families")
      .select("id")
      .eq("invite_code", inviteCode.trim().toUpperCase())
      .maybeSingle();

    if (findErr || !family) {
      setLoading(false);
      setError(findErr?.message ?? "Código inválido");
      return;
    }

    const { error: memErr } = await supabase.from("family_members").insert({
      family_id: family.id,
      user_id: userId,
      role: "executor",
    });

    setLoading(false);
    if (memErr) {
      setError(memErr.message);
      return;
    }
    router.push("/executor");
    router.refresh();
  }

  if (mode === "choose") {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Bem-vindo</CardTitle>
            <CardDescription>
              Crie uma família ou entre com o código de convite
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button onClick={() => setMode("create")} className="w-full">
              Criar família (sou responsável)
            </Button>
            <Button
              variant="outline"
              onClick={() => setMode("join")}
              className="w-full"
            >
              Entrar com código (sou executor)
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (mode === "create") {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
        <Card>
          <CardHeader>
            <CardTitle>Criar família</CardTitle>
            <CardDescription>
              Você será o responsável. Depois compartilhe o código de convite.
            </CardDescription>
          </CardHeader>
          <form onSubmit={createFamily}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="familyName">Nome da família</Label>
                <Input
                  id="familyName"
                  required
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  placeholder="Ex: Casa da Silva"
                />
              </div>
              {error && (
                <p className="text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setMode("choose")}
              >
                Voltar
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Criando…" : "Criar"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <Card>
        <CardHeader>
          <CardTitle>Entrar na família</CardTitle>
          <CardDescription>
            Digite o código de 8 caracteres que o responsável compartilhou
          </CardDescription>
        </CardHeader>
        <form onSubmit={joinFamily}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código de convite</Label>
              <Input
                id="code"
                required
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="ABCD1234"
                maxLength={8}
                className="font-mono tracking-widest"
              />
            </div>
            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setMode("choose")}
            >
              Voltar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Entrando…" : "Entrar"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
