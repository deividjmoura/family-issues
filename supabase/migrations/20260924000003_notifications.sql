-- Epic 5 / Issue #17: notifications + RLS

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_id_idx
  on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists notifications_select on public.notifications;
create policy notifications_select on public.notifications
  for select using (auth.uid() = user_id);

drop policy if exists notifications_insert on public.notifications;
create policy notifications_insert on public.notifications
  for insert with check (
    -- qualquer autenticado pode inserir (actions validam destinatário);
    -- tipicamente o server action cria para outro membro da família
    auth.role() = 'authenticated'
  );

drop policy if exists notifications_update on public.notifications;
create policy notifications_update on public.notifications
  for update using (auth.uid() = user_id);

drop policy if exists notifications_delete on public.notifications;
create policy notifications_delete on public.notifications
  for delete using (auth.uid() = user_id);

-- Realtime (habilitar no dashboard se ainda não): tabela public.notifications
