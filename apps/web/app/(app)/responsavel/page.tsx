import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBRL } from "@/lib/domain/money";

/**
 * Esqueleto do painel do responsável (Epic 6). Dados fictícios só para fixar o tom visual:
 * sóbrio, tabular, foco em "quanto devo" e "o que falta conferir".
 */
const DEMO = {
  aConferir: 2,
  devoCents: 3500,
  proximoPagamento: "sábado, 27/09",
};

export default function ResponsavelPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Painel da família</h1>
          <p className="text-muted-foreground text-sm">Visão geral de tarefas, conferências e saldo devido.</p>
        </div>
        <Badge variant="outline">prévia — dados fictícios</Badge>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Aguardando sua conferência</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{DEMO.aConferir}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Total devido</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{formatBRL(DEMO.devoCents)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Próximo pagamento</CardDescription>
            <CardTitle className="text-xl">{DEMO.proximoPagamento}</CardTitle>
          </CardHeader>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Tarefas</CardTitle>
          <CardDescription>Lista, criação e conferência entram em #15 / Epic 6.</CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">—</CardContent>
      </Card>
    </main>
  );
}
