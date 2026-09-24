-- Epic 3 / Issue #14: tasks + enum status + RLS + swapped

do $$ begin
  create type public.task_status as enum (
    'criada',
    'atribuida',
    'aguardando_verificacao',
    'aprovada',
    'rejeitada',
    'paga',
    'confirmada'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  title text not null,
  description text,
  value_cents integer not null check (value_cents >= 0),
  payment_due_date date,
  assignee_id uuid references auth.users(id) on delete restrict,
  status public.task_status not null default 'criada',
  completed_at timestamptz,
  verified_at timestamptz,
  verified_by uuid references auth.users(id) on delete set null,
  rejection_reason text,
  paid_at timestamptz,
  payment_confirmed_at timestamptz,
  swapped boolean not null default false,
  swapped_reward text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_family_id_idx on public.tasks (family_id);
create index if not exists tasks_assignee_id_idx on public.tasks (assignee_id);
create index if not exists tasks_status_idx on public.tasks (status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

alter table public.tasks enable row level security;

drop policy if exists tasks_select on public.tasks;
create policy tasks_select on public.tasks
  for select using (public.is_family_member(family_id));

drop policy if exists tasks_insert on public.tasks;
create policy tasks_insert on public.tasks
  for insert with check (
    public.is_family_responsavel(family_id)
    and auth.uid() = created_by
  );

drop policy if exists tasks_update on public.tasks;
create policy tasks_update on public.tasks
  for update using (
    public.is_family_member(family_id)
    and (
      public.is_family_responsavel(family_id)
      or auth.uid() = assignee_id
    )
  );

drop policy if exists tasks_delete on public.tasks;
create policy tasks_delete on public.tasks
  for delete using (public.is_family_responsavel(family_id));
