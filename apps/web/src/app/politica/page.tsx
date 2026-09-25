import Link from "next/link";

export default function PoliticaPage() {
  return (
    <main className="mx-auto max-w-2xl space-y-6 px-6 py-12 text-sm leading-relaxed text-foreground">
      <Link href="/" className="text-primary underline">
        ← Voltar
      </Link>
      <h1 className="text-2xl font-bold">Política de uso — Family Tasks</h1>
      <p className="text-muted-foreground">Última atualização: setembro de 2026</p>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">1. O que é o app</h2>
        <p>
          O Family Tasks é uma ferramenta para famílias organizarem tarefas
          domésticas com recompensas em valor (R$) e pontos, com verificação do
          responsável antes do pagamento.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">2. Contas e menores</h2>
        <p>
          Responsáveis devem supervisionar o uso por crianças e adolescentes.
          Não coletamos dados além do necessário para login, famílias e
          histórico de tarefas.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">3. Dados</h2>
        <p>
          Armazenamos e-mail, nome, tarefas, fotos de prova (opcionais) e
          notificações no Supabase. Você pode solicitar exclusão da conta
          contatando quem administra o projeto.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">4. Pagamentos</h2>
        <p>
          Valores em R$ no app são <strong>controle familiar</strong>, não um
          gateway de pagamento. O app não processa dinheiro real automaticamente.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">5. Conduta</h2>
        <p>
          É proibido uso ofensivo, conteúdo ilegal nas provas ou exploração de
          falhas do sistema. Podemos suspender contas em abuso.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">6. Contato</h2>
        <p>
          Dúvidas: use o repositório do projeto ou o e-mail do administrador da
          sua instância.
        </p>
      </section>
    </main>
  );
}
