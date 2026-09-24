-- Push subscriptions + e-mail no profile (opcional)

alter table public.profiles
  add column if not exists email text;

-- Backfill e-mail a partir de auth.users (quando possível via trigger)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do update
    set full_name = coalesce(excluded.full_name, public.profiles.full_name),
        email = coalesce(excluded.email, public.profiles.email),
        updated_at = now();
  return new;
end;
$$;

-- Atualiza e-mails existentes
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and (p.email is null or p.email = '');

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_id_idx
  on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists push_subs_select_own on public.push_subscriptions;
create policy push_subs_select_own on public.push_subscriptions
  for select using (auth.uid() = user_id);

drop policy if exists push_subs_insert_own on public.push_subscriptions;
create policy push_subs_insert_own on public.push_subscriptions
  for insert with check (auth.uid() = user_id);

drop policy if exists push_subs_update_own on public.push_subscriptions;
create policy push_subs_update_own on public.push_subscriptions
  for update using (auth.uid() = user_id);

drop policy if exists push_subs_delete_own on public.push_subscriptions;
create policy push_subs_delete_own on public.push_subscriptions
  for delete using (auth.uid() = user_id);
