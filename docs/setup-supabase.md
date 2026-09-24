# Setup Supabase (Family Tasks)

Passo a passo mínimo para o app funcionar localmente.

## 1. Projeto

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Em **Project Settings → API**, copie:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (só server; e-mail/push)

## 2. Env local

```bash
cd apps/web
cp .env.example .env.local
# edite .env.local
```

## 3. Migrations (SQL Editor)

Rode **nesta ordem**:

1. `20260924000001_families.sql`
2. `20260924000002_tasks.sql`
3. `20260924000003_notifications.sql`
4. `20260924000004_negotiations.sql`
5. `20260924000005_profiles.sql`
6. `20260924000006_task_proof.sql` — foto de prova + bucket
7. `20260924000007_push_and_profile_email.sql` — e-mail no profile + push_subscriptions

## 4. Realtime

**Database → Replication**: habilite `notifications`.

## 5. Storage

Bucket `task-proofs` (migration 00006). Se falhar, crie manualmente (5 MB, jpeg/png/webp/heic).

## 6. Auth

Email provider on. Dev: desative “Confirm email” se quiser.

## 7. Rodar

```bash
cd apps/web
npm install
npm run dev
```

Deploy + PWA + e-mail + push: **[docs/deploy-vercel.md](./deploy-vercel.md)**
