import { Coins, Flame, Trophy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatBRL } from "@/lib/domain/money";

/**
 * Esqueleto da tela do executor (Epic 7). Dados fictícios só para fixar o tom visual:
 * escuro, vibrante, moedas/XP/nível, feedback forte.
 */
const DEMO = { saldoCents: 2500, nivel: 3, xp: 65, sequencia: 4, missoes: 2 };

export default function ExecutorPage() {
  return (
    <main className="mx-auto max-w-md space-y-5 p-5">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-black tracking-tight">Minhas missões</h1>
        <Badge variant="outline" className="border-border text-muted-foreground">prévia</Badge>
      </header>

      <Card className="border-2 border-coin/60 bg-gradient-to-br from-card to-secondary">
        <CardContent className="flex items-center gap-4">
          <div className="bg-coin/20 text-coin animate-coin-pop grid size-16 place-items-center rounded-full">
            <Coins className="size-9" />
          </div>
          <div>
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Seu saldo</p>
            <p className="text-coin text-4xl font-black tabular-nums">{formatBRL(DEMO.saldoCents)}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card className="gap-2 py-4">
          <CardHeader className="px-4">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Trophy className="text-xp size-4" /> Nível {DEMO.nivel}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <Progress value={DEMO.xp} className="bg-xp/20 [&>div]:bg-xp h-3" />
          </CardContent>
        </Card>
        <Card className="gap-2 py-4">
          <CardHeader className="px-4">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Flame className="text-warning size-4" /> Sequência
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 text-2xl font-black">{DEMO.sequencia} dias</CardContent>
        </Card>
      </div>

      <p className="text-muted-foreground text-center text-sm">
        {DEMO.missoes} missões esperando por você — lista real em #15 / Epic 7.
      </p>
    </main>
  );
}
