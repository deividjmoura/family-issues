# Domínio — Family Tasks

## Entidades principais

### User
- id, email, name, avatar_url, created_at

### Family
- id, name, invite_code, created_by, created_at

### FamilyMember
- id, family_id, user_id, role (`responsavel` | `executor`), joined_at

### Task
- id, family_id, created_by (user_id responsável)
- title, description
- value_cents (inteiro, em centavos)
- payment_due_date (date)
- assignee_id (user_id executor) — MVP 1 executor por tarefa
- status (enum abaixo)
- completed_at, verified_at, verified_by
- rejection_reason
- paid_at, payment_confirmed_at
- created_at, updated_at

### Negotiation
- id, task_id, proposed_by (executor)
- proposal_text
- status: `pending` | `accepted` | `rejected`
- responded_by, responded_at, response_note
- created_at

### Wallet / Balance (derivado ou snapshot)
- family_id + user_id (executor)
- balance_cents (soma das tarefas aprovadas ainda não pagas/confirmadas)
- Ou calcular on-the-fly a partir das tasks

### Notification
- id, user_id, type, payload (json), read_at, created_at

## Máquina de estados da Task

```
criada
  └─(atribuir)→ atribuida
                   └─(executor marca done)→ aguardando_verificacao
                         ├─(responsável aprova)→ aprovada
                         │                         ├─(negociar ok)→ aprovada (flag swapped)
                         │                         └─(responsável paga)→ paga
                         │                                               └─(executor confirma)→ confirmada
                         └─(responsável rejeita)→ rejeitada  (pode voltar a atribuida se reabrir)
```

Transições permitidas apenas pelos papéis corretos.

## Regras de negócio

1. Valor sempre em centavos (evitar float).
2. Saldo do executor = Σ value_cents das tasks com status ∈ {aprovada, paga} menos as já confirmadas (ou conforme decisão de implementação).
3. Negociação só se status = `aprovada` e ainda não `paga`.
4. Uma task tem no máximo uma negociação ativa (`pending`).
5. Só membros da mesma família interagem.
