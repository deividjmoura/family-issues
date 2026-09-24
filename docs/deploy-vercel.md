# Deploy na Vercel + PWA + E-mail + Push

## A. Deploy (passos)

### 1. Supabase pronto

1. Crie o projeto no [Supabase](https://supabase.com).
2. SQL Editor: rode as migrations **1 → 7** em ordem (`supabase/migrations/`).
3. **Replication**: habilite `notifications`.
4. **Auth → Providers**: Email on. Em dev, desative “Confirm email” se quiser.
5. **Auth → URL Configuration**:
   - Site URL: `https://SEU-APP.vercel.app`
   - Redirect URLs: `https://SEU-APP.vercel.app/**` e `http://localhost:3000/**`

### 2. Vercel

1. [vercel.com/new](https://vercel.com/new) → importe `deividjmoura/family-issues`.
2. **Root Directory**: `apps/web` (Import Settings → Edit).
3. Framework: Next.js.
4. **Environment Variables** (Production + Preview):

| Variável | Obrigatória | Onde pegar |
|----------|-------------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | sim | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | sim | mesma tela (`anon` `public`) |
| `SUPABASE_SERVICE_ROLE_KEY` | para e-mail/push | Settings → API (`service_role` — **nunca** no client) |
| `NEXT_PUBLIC_APP_URL` | recomendado | `https://seu-app.vercel.app` |
| `RESEND_API_KEY` | e-mail | [resend.com](https://resend.com) |
| `RESEND_FROM_EMAIL` | e-mail | domínio verificado no Resend |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | push | `npm run vapid` |
| `VAPID_PRIVATE_KEY` | push | mesmo comando |
| `VAPID_SUBJECT` | push | `mailto:seu@email.com` |

5. Deploy. Anote a URL.
6. Volte no Supabase e atualize Site URL / Redirect com a URL real.

### 3. Checklist pós-deploy

- [ ] Signup + login
- [ ] Criar família + **Copiar** convite
- [ ] Segunda conta entra como executor
- [ ] Tarefa → concluir (± foto) → aprovar → pagar → confirmar
- [ ] No mobile Chrome: “Instalar app” (PWA)
- [ ] (Opcional) Ativar push no painel
- [ ] (Opcional) Receber e-mail ao atribuir tarefa

---

## B. PWA

Já incluso:

- `manifest.ts` (nome, cores, ícones)
- `public/sw.js` (cache de shell + handlers de push)
- `PwaRegister` no layout

**Instalar no celular**

1. Abra o site no **Chrome** (Android) ou **Safari** (iOS).
2. Android: menu → “Instalar app” / banner.
3. iOS Safari: Compartilhar → “Adicionar à Tela de Início”.

**Ícones**

Coloque PNGs em:

- `apps/web/public/icons/icon-192.png`
- `apps/web/public/icons/icon-512.png`

(Se faltarem, o browser ainda instala, mas com ícone genérico.)

---

## C. E-mail (Resend)

1. Conta em [resend.com](https://resend.com).
2. API Key → `RESEND_API_KEY`.
3. Em produção, verifique um domínio e use `RESEND_FROM_EMAIL=Family Tasks <noreply@seudominio.com>`.
4. Em testes, o from padrão `onboarding@resend.dev` só envia para o e-mail da sua conta Resend.
5. Rode migration `00007` (grava `profiles.email`).
6. Cada `notify()` tenta enviar e-mail em background (não quebra o fluxo se falhar).

---

## D. Web Push

1. Local ou CI:
   ```bash
   cd apps/web
   npm install
   npm run vapid
   ```
2. Cole a **public** em `NEXT_PUBLIC_VAPID_PUBLIC_KEY` e a **private** em `VAPID_PRIVATE_KEY`.
3. Migration `00007` (`push_subscriptions`).
4. No painel (responsável/executor) aparece **Ativar notificações push** (`PushOptIn`).
5. HTTPS obrigatório (Vercel já é).

---

## E. Troubleshooting

| Problema | Solução |
|----------|---------|
| Build falha no middleware | Confira `NEXT_PUBLIC_SUPABASE_*` na Vercel |
| Login redireciona errado | Site URL no Supabase Auth |
| E-mail não chega | Resend dashboard + domínio; service role setada |
| Push não aparece | HTTPS, permissão do browser, VAPID, SW registrado |
| Foto de prova 403 | Migration `00006` + policies do bucket |
