import Link from "next/link";

const responsibleSteps = [
  {
    number: "01",
    title: "Cadastre a conta",
    text: "Crie a conta usando um e-mail válido. A confirmação desse e-mail é necessária para liberar o acesso.",
  },
  {
    number: "02",
    title: "Organize a família",
    text: "Defina o espaço da família e os participantes. O responsável acompanha o que foi criado e realizado.",
  },
  {
    number: "03",
    title: "Delegue e verifique",
    text: "Crie tarefas, acompanhe as execuções e confirme o que foi realmente concluído antes da recompensa ser liberada.",
  },
  {
    number: "04",
    title: "Acompanhe recompensas",
    text: "O saldo e o histórico registram as recompensas recebidas, mantendo o processo claro para todos.",
  },
];

const playerFeatures = [
  {
    icon: "⚔️",
    title: "Aceite missões",
    text: "Receba tarefas, conclua os objetivos e envie cada conquista para verificação.",
  },
  {
    icon: "✨",
    title: "Ganhe recompensas",
    text: "Cada tarefa aprovada pode gerar recompensa. Seu progresso fica registrado no seu saldo.",
  },
  {
    icon: "🎯",
    title: "Suba o nível da jornada",
    text: "Missões, bônus e outros elementos de progressão fazem parte da evolução da experiência.",
    future: true,
  },
  {
    icon: "🛍️",
    title: "Use seus pontos",
    text: "A futura loja permitirá trocar pontos acumulados por itens e recompensas.",
    future: true,
  },
  {
    icon: "🎁",
    title: "Compartilhe pontos",
    text: "O sistema está sendo preparado para permitir que responsáveis presenteiem jogadores com pontos.",
    future: true,
  },
  {
    icon: "🧑‍🎤",
    title: "Monte seu avatar",
    text: "A personalização do personagem faz parte da evolução visual da experiência do jogador.",
    future: true,
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen w-full">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <section className="grid flex-1 items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div className="space-y-7">
            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                Family Tasks
              </p>
              <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Transforme responsabilidades em uma jornada de conquistas.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                Uma forma organizada de distribuir tarefas, acompanhar
                responsabilidades e transformar resultados em recompensas —
                com uma experiência séria para quem administra e mais
                envolvente para quem executa.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
              >
                Criar minha conta
              </Link>
              <Link
                href="/login"
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground shadow-sm transition hover:bg-muted"
              >
                Já tenho uma conta
              </Link>
            </div>

            <div className="rounded-2xl border border-border bg-card/70 p-5 shadow-sm">
              <p className="text-sm font-semibold text-foreground">
                Antes de começar
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                O acesso começa com o cadastro de um e-mail válido. Depois do
                cadastro, é necessário confirmar esse e-mail para poder acessar
                a conta. Isso mantém a entrada no sistema vinculada a um
                endereço de e-mail que você controla.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                Para responsáveis
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight">
                Organização clara, do início à recompensa.
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                O responsável define as regras da rotina e valida as entregas.
                O objetivo é deixar cada etapa visível e compreensível para a
                família.
              </p>
            </div>

            <div className="space-y-4">
              {responsibleSteps.map((step) => (
                <div key={step.number} className="flex gap-4">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground">
                    {step.number}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {step.title}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {step.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-12 rounded-3xl border border-border bg-muted/20 p-5 sm:p-7 lg:p-9">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              Para quem joga
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Sua rotina. Seus objetivos. Sua próxima conquista.
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              Aqui, tarefa não precisa parecer apenas mais uma obrigação.
              Você recebe objetivos, cumpre desafios, acompanha o resultado e
              transforma cada entrega aprovada em progresso.
            </p>
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {playerFeatures.map((feature) => (
              <article
                key={feature.title}
                className="rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-3xl" aria-hidden="true">
                    {feature.icon}
                  </span>
                  {feature.future && (
                    <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Em breve
                    </span>
                  )}
                </div>
                <h3 className="mt-4 font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {feature.text}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 flex flex-col gap-4 rounded-2xl border border-border p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2 className="font-semibold">Pronto para começar?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Cadastre seu e-mail, confirme a conta e entre na jornada.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Criar conta
            </Link>
            <Link
              href="/politica"
              className="inline-flex min-h-10 items-center justify-center rounded-lg px-5 py-2.5 text-sm font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              Política de uso
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
