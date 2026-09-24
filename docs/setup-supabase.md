# Setup Supabase (Family Tasks)

Passo a passo mínimo para o app funcionar localmente.

## 1. Projeto

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Em **Project Settings → API**, copie:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 2. Env local

```bash
cd apps/web
cp .env.example .env.local
# edite .env.local
```

## 3. Migrations (SQL Editor)

Rode **nesta ordem** no SQL Editor do Supabase:

1. `supabase/migrations/20260924000001_families.sql`
2. `supabase/migrations/20260924000002_tasks.sql`
3. `supabase/migrations/20260924000003_notifications.sql`
4. `supabase/migrations/20260924000004_negotiations.sql`
5. `supabase/migrations/20260924000005_profiles.sql`
6. `supabase/migrations/20260924000006_task_proof.sql` — coluna `proof_image_url` + bucket Storage `task-proofs`

## 4. Realtime

**Database → Replication** (ou Publication): habilite a tabela `notifications`.

## 5. Storage

A migration `00006` cria o bucket `task-proofs` (público para leitura, upload só no prefixo do próprio user).  
Se o insert do bucket falhar (permissões), crie manualmente em **Storage** com os mesmos limites (5 MB, jpeg/png/webp/heic) e aplique as policies do SQL.

## 6. Auth

Em **Authentication → Providers**, deixe Email habilitado.  
Para dev, em **Auth → Settings**, pode desativar “Confirm email” para testar sem inbox.

## 7. Rodar

```bash
cd apps/web
npm install
npm run dev
```

Abra http://localhost:3000 → criar conta → criar família → convidar executor com o código.

### Fluxo de teste rápido

1. Responsável cria tarefa (valor + executor)
2. Executor: **Concluí!** ou **📷 + prova**
3. Responsável: ver foto → **Aprovar**
4. (Opcional) Executor: **Negociar**
5. Responsável: **Paguei** (unitário ou lote)
6. Executor: **Confirmei recebimento**
