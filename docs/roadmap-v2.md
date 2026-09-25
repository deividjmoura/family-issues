# Roadmap v2 — pedidos do produto

Issues: #25 board/pontos · #26 rebate · #27 UI · #28 auth/PWA

## Ordem sugerida

1. **Migration 00008** no Supabase (obrigatório)
2. Auth PT + callback e-mail + Google (docs)
3. Board aberto + claim + pontos na criação
4. Prova em miniatura / modal
5. Leaderboard
6. Ofertas bilaterais (rebate)
7. Temas CodePen-like + toggle
8. PWA install prompt + política de uso

## Migration nova

Arquivo: `supabase/migrations/20260925000008_open_board_points_offers.sql`

Rode no SQL Editor depois das 1–7.

## Google OAuth (Supabase)

1. Authentication → Providers → Google → Enable
2. Client ID / Secret do Google Cloud Console
3. Redirect: `https://SEU_PROJECT.supabase.co/auth/v1/callback`
4. Em Auth URL Configuration, Site URL = URL Vercel

## E-mail confirmação

Templates (Authentication → Email Templates) podem ser editados em PT.
`emailRedirectTo` aponta para `/auth/callback?next=/login`.
