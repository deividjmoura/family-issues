import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Placeholder visual — fluxo real (Supabase Auth + onboarding) em #13. */
export default function LoginPage() {
  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Entrar</CardTitle>
          <CardDescription>Acesse sua família no Family Tasks.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" placeholder="voce@familia.com" disabled />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" disabled />
            </div>
            <Button type="button" disabled>
              Entrar (em breve — #13)
            </Button>
            <Button variant="link" asChild>
              <Link href="/">Voltar</Link>
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
