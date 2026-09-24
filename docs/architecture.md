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

## Estado atual do scaffold (Epic 1 — agent-arena-2)

```
apps/web/
  app/
    page.tsx                 # landing (apresenta as duas faces)
    (auth)/login/            # placeholder → #13
    (app)/onboarding/        # placeholder → #13
    (app)/responsavel/       # layout aplica .theme-resp  → Epic 6
    (app)/executor/          # layout aplica .theme-game  → Epic 7
  components/ui/             # shadcn (new-york): button card input label badge dialog sonner progress avatar
  lib/
    utils.ts                 # cn()
    supabase/{env,client,server,middleware}.ts
    domain/{types,task-machine,money}.ts + domain.test.ts
  middleware.ts              # renova sessão Supabase; protege /responsavel /executor /onboarding
```

### Decisões tomadas

- **Temas por face**: mesmos componentes shadcn, CSS variables diferentes. `.theme-resp` (sóbrio) e `.theme-game` (escuro/vibrante) em `app/globals.css`. Tokens extras: `success`, `warning`, `coin`, `xp` (ex.: `text-coin`, `bg-xp/20`). Variantes extras: `Button variant="success" | size="xl"`, `Badge variant="success" | "warning"`.
- **Fonte local** via pacote `geist` (não usar `next/font/google` — build não pode depender de rede).
- **shadcn**: componentes em `components/ui`; `components.json` pronto para `npx shadcn add <comp>` quando houver rede.
- **Sem env do Supabase o app ainda sobe** (landing/preview); `createClient()` lança erro claro se chamado sem env.
- **Regras de negócio puras em `lib/domain`**, testadas com Vitest. Server Actions (#15, #16, #18) devem chamar `canTransition` / `canNegotiate` antes de gravar, e a RLS do banco é a segunda barreira.
- **Dev server** aceita hosts de preview `*.e2b.app` (`allowedDevOrigins`).

### Checagens antes de abrir PR (em `apps/web`)

`npm run typecheck` · `npm run lint` · `npm test` · `npm run build`
