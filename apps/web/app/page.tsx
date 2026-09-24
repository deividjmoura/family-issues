import { ArrowRight, BadgeCheck, Bell, Coins, Handshake, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const FLOW = [
  { icon: ShieldCheck, title: "Responsável cria", text: "Tarefa, valor em R$ e dia do pagamento." },
  { icon: Bell, title: "Executor recebe", text: "Notificação na hora. Faz e marca “Concluí”." },
  { icon: BadgeCheck, title: "Conferência", text: "O responsável confere e aprova: selo “Realizada”." },
  { icon: Handshake, title: "Negociação", text: "Depois de aprovada, dá pra trocar o dinheiro por outra coisa." },
  { icon: Coins, title: "Pagamento", text: "Responsável marca “Paguei”, executor confirma, saldo zera." },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl space-y-16 px-6 py-16">
      <section className="space-y-6 text-center">
        <p className="text-muted-foreground text-sm font-medium uppercase tracking-widest">Family Tasks</p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Tarefa de casa vira missão.
          <br />
          Missão cumprida vira recompensa.
        </h1>
        <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
          Pais e responsáveis delegam, conferem e acompanham quanto devem. Filhos executam, sobem de nível e
          negociam a recompensa.
        </p>
        <div className="flex justify-center gap-3">
          <Button size="lg" asChild>
            <Link href="/login">
              Começar <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Link href="/responsavel" className="group">
          <Card className="theme-resp h-full transition-shadow group-hover:shadow-md">
            <CardHeader>
              <CardDescription>Para quem delega</CardDescription>
              <CardTitle className="text-xl">Painel do Responsável</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm">
              Interface séria e direta: o que falta conferir, quanto você deve e quando paga.
            </CardContent>
          </Card>
        </Link>
        <Link href="/executor" className="group">
          <Card className="theme-game h-full border-2 transition-transform group-hover:-translate-y-1">
            <CardHeader>
              <CardDescription className="flex items-center gap-1 font-bold uppercase tracking-widest">
                <Sparkles className="size-3" /> Para quem executa
              </CardDescription>
              <CardTitle className="text-xl font-black">Modo Missão</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm">
              Saldo em moedas, níveis, sequência de dias e feedback visual a cada tarefa aprovada.
            </CardContent>
          </Card>
        </Link>
      </section>

      <section className="space-y-6">
        <h2 className="text-center text-2xl font-semibold tracking-tight">Como funciona</h2>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {FLOW.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="bg-card rounded-xl border p-4">
              <div className="text-muted-foreground mb-2 flex items-center gap-2 text-xs font-medium">
                <span className="bg-primary text-primary-foreground grid size-5 place-items-center rounded-full">
                  {i + 1}
                </span>
                <Icon className="size-4" />
              </div>
              <p className="font-medium">{title}</p>
              <p className="text-muted-foreground mt-1 text-sm">{text}</p>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
