# Family Tasks (Family Issues)

Aplicação web para **delegar tarefas domésticas com recompensa em R$** e gamificação para quem executa.

## A ideia

Pais/responsáveis designam tarefas (ex.: lavar a louça do almoço — R$ 10,00, pagamento no sábado).
Filhos/outros membros da casa executam, marcam como feitas e **só recebem o selo “Realizada” depois da conferência visual + confirmação do responsável**.

- **Notificações** bidirecionais: solicitação chega ao executor; check chega ao solicitante.
- **Saldo** por executor: acumula o valor das tarefas aprovadas; zera quando o responsável registra o pagamento e o executor **confirma o recebimento**.
- **Histórico** completo de tarefas concluídas.
- **Negociação pós-execução**: depois de aprovada, o executor pode propor trocar o valor em dinheiro por algo (ex.: passeio na praia). O responsável aceita ou recusa.
- **Duas faces de UI**:
  - Responsável → interface séria, clara, focada em controle e saldo devido.
  - Executor → interface tipo game (progresso, saldo, conquistas, feedback visual forte).

## Papéis

| Papel | Quem | Pode |
|-------|------|------|
| `responsavel` | Pais / responsáveis | Criar tarefas, definir valor e data de pagamento, verificar, aprovar, registrar pagamento, negociar |
| `executor` | Filhos / demais | Ver tarefas atribuídas, marcar conclusão, negociar após aprovação, confirmar pagamento |

Famílias (grupos) unem responsáveis e executores.

## Fluxo principal da tarefa

```
[Criada] → [Atribuída] → [Em execução] → [Aguardando verificação]
       → [Aprovada / Rejeitada] → (opcional) [Negociação] → [Paga] → [Confirmada]
```

1. Responsável cria tarefa (título, descrição, valor R$, data de pagamento, executor).
2. Executor recebe notificação e marca “Concluí”.
3. Responsável verifica (visualmente) e confirma no app → status **Realizada** + valor entra no saldo do executor.
4. Opcional: executor abre **Negociar** e propõe troca (texto livre).
5. No dia do pagamento (ou quando quiser), responsável marca “Paguei”; executor confirma → saldo zera naquele ciclo.

## Stack proposta (MVP desta noite)

- **Frontend**: Next.js (App Router) + TypeScript + Tailwind + shadcn/ui
- **Backend / Auth / DB**: Supabase (Auth + Postgres + Realtime + Storage se precisar de fotos de prova)
- **Notificações**: Supabase Realtime + (opcional) e-mail/push depois
- **Deploy**: Vercel

## Estrutura do repositório

```
/
├── README.md                 ← este arquivo (visão do produto)
├── AGENTS.md                 ← protocolo de comunicação entre agentes (JSON)
├── docs/
│   ├── product.md            ← requisitos detalhados
│   ├── domain.md             ← modelo de domínio e estados
│   └── architecture.md       ← decisões técnicas
├── apps/web/                 ← app Next.js (a criar)
└── ...
```

## Comunicação entre agentes

**Leia `AGENTS.md` antes de qualquer trabalho.**  
Todas as mensagens entre agentes usam o formato JSON definido lá. Issues, PRs e commits seguem as labels e o padrão de título descritos no protocolo.

## Status

Projeto em construção — estrutura inicial e backlog criados nesta sessão.
