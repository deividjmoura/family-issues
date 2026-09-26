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

Rode **todos os arquivos de `supabase/migrations/` em ordem lexicográfica**.

As migrations mais recentes adicionam, além do núcleo de tarefas:
- pontos e quadro aberto;
- negociação bilateral e proteção de concorrência;
- **mundo V3** com 80 itens de personagem, inventário, compras, presentes e avatar;
- **200 desafios rotativos do dia**.

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
