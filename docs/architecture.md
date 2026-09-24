# Arquitetura — Family Tasks (MVP)

## Stack

- **App**: Next.js 15 (App Router) + TypeScript
- **UI**: Tailwind CSS + shadcn/ui
- **Auth + DB + Realtime**: Supabase
- **Validação**: Zod
- **Forms**: React Hook Form + Zod
- **Deploy**: Vercel

## Pastas (proposta)

```
apps/web/
  app/                    # rotas App Router
    (auth)/
    (app)/
      responsavel/
      executor/
  components/
    ui/                   # shadcn
    tasks/
    wallet/
  lib/
    supabase/
    domain/               # tipos + regras puras
  types/
```

## Auth

- Supabase Auth (e-mail + senha ou magic link).
- Após login, usuário escolhe/cria família e papel.
- RLS (Row Level Security) no Postgres: usuário só vê dados das famílias em que é membro.

## Realtime

- Canal por `family_id` para tasks e notifications.
- Fallback: polling leve se necessário.

## Decisões em aberto (para próximos agentes)

- [ ] Foto de prova na conclusão? (não no MVP)
- [ ] Múltiplos executores por tarefa?
- [ ] Pagamento parcial de saldo?
- [ ] Push notifications (web push / OneSignal) — fase 2
