-- Epic 2 / Issue #12: families + family_members + RLS

-- Enum de papel
do $$ begin
  create type public.family_role as enum ('responsavel', 'executor');
exception when duplicate_object then null;
end $$;

-- Famílias
create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index if not exists families_invite_code_idx on public.families (invite_code);

-- Membros
create table if not exists public.family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.family_role not null,
  joined_at timestamptz not null default now(),
  unique (family_id, user_id)
);

create index if not exists family_members_user_id_idx on public.family_members (user_id);
create index if not exists family_members_family_id_idx on public.family_members (family_id);

-- Helper: usuário é membro da família
create or replace function public.is_family_member(fid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.family_members
    where family_id = fid and user_id = auth.uid()
  );
$$;

-- Helper: usuário é responsável na família
create or replace function public.is_family_responsavel(fid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.family_members
    where family_id = fid and user_id = auth.uid() and role = 'responsavel'
  );
$$;

alter table public.families enable row level security;
alter table public.family_members enable row level security;

-- families: membros leem; autenticados podem buscar por invite_code (join)
drop policy if exists families_select on public.families;
create policy families_select on public.families
  for select using (
    public.is_family_member(id)
    or auth.role() = 'authenticated'
  );

drop policy if exists families_insert on public.families;
create policy families_insert on public.families
  for insert with check (auth.uid() = created_by);

drop policy if exists families_update on public.families;
create policy families_update on public.families
  for update using (public.is_family_responsavel(id));

-- family_members: membros da família leem; usuário sempre lê as próprias linhas
drop policy if exists family_members_select on public.family_members;
create policy family_members_select on public.family_members
  for select using (
    public.is_family_member(family_id)
    or user_id = auth.uid()
  );

drop policy if exists family_members_insert on public.family_members;
create policy family_members_insert on public.family_members
  for insert with check (
    auth.uid() = user_id
    or public.is_family_responsavel(family_id)
  );

drop policy if exists family_members_update on public.family_members;
create policy family_members_update on public.family_members
  for update using (public.is_family_responsavel(family_id));

drop policy if exists family_members_delete on public.family_members;
create policy family_members_delete on public.family_members
  for delete using (public.is_family_responsavel(family_id));
