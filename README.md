# Family Tasks (Family Issues)

Aplicação web para **delegar tarefas domésticas com recompensa em R$** e gamificação para quem executa.

## A ideia

Pais/responsáveis designam tarefas (ex.: lavar a louça do almoço — R$ 10,00, pagamento no sábado).
Filhos/outros membros da casa executam, marcam como feitas e **só recebem o selo “Realizada” depois da conferência visual + confirmação do responsável**.

- **Notificações** bidirecionais (in-app + Realtime)
- **Saldo** por executor com pagamento e confirmação (unitário ou lote)
- **Foto de prova** opcional na conclusão
- **Negociação** pós-aprovação (trocar R$ por experiência)
- **Duas UIs**: séria (responsável) e game-like (executor)

## Papéis

| Papel | Quem | Pode |
|-------|------|------|
| `responsavel` | Pais / responsáveis | Criar tarefas, verificar, aprovar, pagar, negociar |
| `executor` | Filhos / demais | Concluir (± foto), negociar, confirmar pagamento |

## Fluxo da tarefa

```
Atribuída → Aguardando verificação → Aprovada | Rejeitada
  → (opcional Negociação) → Paga → Confirmada
```

## Stack

- **App**: Next.js 15 (App Router) + TypeScript + Tailwind 4
- **Auth / DB / Realtime / Storage**: Supabase
- **Deploy**: Vercel (`apps/web`)

## Como rodar

Guia completo: **[docs/setup-supabase.md](docs/setup-supabase.md)**

```bash
cd apps/web
cp .env.example .env.local   # URL + anon key do Supabase
# aplique as 6 migrations SQL no Supabase
npm install
npm run dev
```

## Estrutura

```
/
├── README.md
├── AGENTS.md                 ← protocolo JSON entre agentes
├── docs/                     ← product, domain, architecture, setup
├── supabase/migrations/      ← SQL (families → task-proof)
└── apps/web/                 ← Next.js
```

## Status

**MVP funcional** — auth, famílias, tarefas + estados, wallet lote, negociação, notificações Realtime, foto de prova, filtros e middleware por papel.

Agentes: leia `AGENTS.md` e o último handoff em `docs/agent-log/`.
