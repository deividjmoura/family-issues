import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-8 px-6 py-16">
      <div className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-wide text-primary">
          Family Tasks
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Tarefas de casa com recompensa real
        </h1>
        <p className="text-lg text-muted-foreground">
          Responsáveis delegam. Executores concluem, negociam e acumulam saldo em
          R$. Verificação antes do pagamento — sério para quem manda, game para
          quem faz.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/login"
          className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
        >
          Entrar
        </Link>
        <Link
          href="/signup"
          className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground shadow-sm transition hover:bg-muted"
        >
          Criar conta
        </Link>
      </div>

      <ul className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
        <li className="rounded-lg border border-border bg-card p-4">
          <strong className="block text-foreground">Verificação</strong>
          Só vira “realizada” depois do aceite do responsável.
        </li>
        <li className="rounded-lg border border-border bg-card p-4">
          <strong className="block text-foreground">Saldo em R$</strong>
          Acumula, paga e confirma — histórico completo.
        </li>
        <li className="rounded-lg border border-border bg-card p-4">
          <strong className="block text-foreground">Negociação</strong>
          Depois de aprovada, troque dinheiro por experiência.
        </li>
        <li className="rounded-lg border border-border bg-card p-4">
          <strong className="block text-foreground">Duas UIs</strong>
          Séria para pais. Game-like para quem executa.
        </li>
      </ul>
    </main>
  );
}
