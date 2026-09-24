# Deploy na Vercel

## 1. Projeto

1. Importe o repo `deividjmoura/family-issues` na [Vercel](https://vercel.com).
2. **Root Directory**: `apps/web`
3. Framework: Next.js (detectado automaticamente)

## 2. Environment variables

Em **Settings → Environment Variables** (Production + Preview):

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | chave `anon` `public` |

`SUPABASE_SERVICE_ROLE_KEY` **não** é necessária no client; não coloque no front.

## 3. Supabase Auth URLs

Em **Supabase → Authentication → URL Configuration**:

- **Site URL**: `https://seu-app.vercel.app`
- **Redirect URLs**: `https://seu-app.vercel.app/**` e `http://localhost:3000/**`

## 4. Deploy

Push na `main` ou clique **Deploy**.  
Se o build falhar por falta de env no middleware, confira se as duas `NEXT_PUBLIC_*` estão setadas.

## 5. Checklist pós-deploy

- [ ] Signup + login
- [ ] Criar família + copiar convite
- [ ] Segunda conta entra como executor
- [ ] Criar tarefa → concluir → aprovar → pagar → confirmar
