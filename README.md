# Family Tasks

App web para **delegar tarefas domésticas com recompensa em R$**, verificação do responsável e gamificação para quem executa.

> Repositório: [deividjmoura/family-issues](https://github.com/deividjmoura/family-issues)

## O que já funciona (MVP)

| Área | Status |
|------|--------|
| Cadastro / login (Supabase Auth) | ✅ |
| Família + código de convite + papéis | ✅ |
| Tarefas + máquina de estados + RLS | ✅ |
| Verificação (aprovar / rejeitar) | ✅ |
| Foto de prova opcional | ✅ |
| Saldo + pagar/confirmar (unitário e lote) | ✅ |
| Negociação pós-aprovação | ✅ |
| Notificações in-app + Realtime | ✅ |
| E-mail (Resend, opcional) | ✅ |
| Web Push (VAPID, opcional) | ✅ |
| PWA (manifest + service worker) | ✅ |
| UI responsável (séria) / executor (game) | ✅ |

## Fluxo

```
Atribuída → Concluída (± foto) → Aguardando verificação
  → Aprovada | Rejeitada → (Negociação?) → Paga → Confirmada
```

## Stack

- Next.js 15 · TypeScript · Tailwind 4
- Supabase (Auth, Postgres, Realtime, Storage)
- Vercel · Resend (e-mail) · Web Push

## Subir em 15 minutos

1. **Supabase** — rode as migrations `01` → `07` em `supabase/migrations/`  
   Detalhes: [docs/setup-supabase.md](docs/setup-supabase.md)

2. **Local**
   ```bash
   cd apps/web
   cp .env.example .env.local   # URL + anon key
   npm install
   npm run dev
   ```

3. **Produção** — Root Directory `apps/web` na Vercel  
   Passo a passo: [docs/deploy-vercel.md](docs/deploy-vercel.md)

## Estrutura

```
apps/web/          → Next.js (App Router)
supabase/          → SQL migrations
docs/              → product, domain, setup, deploy
AGENTS.md          → protocolo entre agentes (JSON)
```

## Agentes

Leia `AGENTS.md` e o último arquivo em `docs/agent-log/` antes de codar.

---

Feito para famílias que querem clareza no que foi feito e motivação de verdade pra quem faz.
