-- Board aberto + pontos + ofertas de negociação por usuário

alter table public.tasks
  add column if not exists points integer not null default 0 check (points >= 0);

-- Tarefas abertas: assignee pode ser null (status criada)
-- Policy: qualquer membro pode update claim (assignee null → eu)
drop policy if exists tasks_insert on public.tasks;
create policy tasks_insert on public.tasks
  for insert with check (
    public.is_family_member(family_id)
    and auth.uid() = created_by
  );

drop policy if exists tasks_update on public.tasks;
create policy tasks_update on public.tasks
  for update using (
    public.is_family_member(family_id)
    and (
      public.is_family_responsavel(family_id)
      or auth.uid() = assignee_id
      or (assignee_id is null and status = 'criada')
      or auth.uid() = created_by
    )
  );

-- Ofertas de valor (rebate) — uma thread por (task, user)
create table if not exists public.task_offers (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  proposed_value_cents integer not null check (proposed_value_cents >= 0),
  proposed_points integer not null default 0 check (proposed_points >= 0),
  message text,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'rejected', 'withdrawn', 'countered')),
  parent_offer_id uuid references public.task_offers(id) on delete set null,
  responded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists task_offers_task_id_idx on public.task_offers (task_id);
create index if not exists task_offers_user_id_idx on public.task_offers (user_id);

alter table public.task_offers enable row level security;

drop policy if exists task_offers_select on public.task_offers;
create policy task_offers_select on public.task_offers
  for select using (
    exists (
      select 1 from public.tasks t
      where t.id = task_id and public.is_family_member(t.family_id)
    )
  );

drop policy if exists task_offers_insert on public.task_offers;
create policy task_offers_insert on public.task_offers
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.tasks t
      where t.id = task_id and public.is_family_member(t.family_id)
    )
  );

drop policy if exists task_offers_update on public.task_offers;
create policy task_offers_update on public.task_offers
  for update using (
    exists (
      select 1 from public.tasks t
      where t.id = task_id and public.is_family_member(t.family_id)
    )
  );
