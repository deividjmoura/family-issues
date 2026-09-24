-- Epic 8 / Issue #18: negotiations

do $$ begin
  create type public.negotiation_status as enum ('pending', 'accepted', 'rejected');
exception when duplicate_object then null;
end $$;

create table if not exists public.negotiations (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  proposed_by uuid not null references auth.users(id) on delete restrict,
  proposal_text text not null,
  status public.negotiation_status not null default 'pending',
  responded_by uuid references auth.users(id) on delete set null,
  responded_at timestamptz,
  response_note text,
  created_at timestamptz not null default now()
);

create index if not exists negotiations_task_id_idx on public.negotiations (task_id);

-- no máximo uma pending por task (índice parcial)
create unique index if not exists negotiations_one_pending_per_task
  on public.negotiations (task_id)
  where status = 'pending';

alter table public.negotiations enable row level security;

drop policy if exists negotiations_select on public.negotiations;
create policy negotiations_select on public.negotiations
  for select using (
    exists (
      select 1 from public.tasks t
      where t.id = task_id and public.is_family_member(t.family_id)
    )
  );

drop policy if exists negotiations_insert on public.negotiations;
create policy negotiations_insert on public.negotiations
  for insert with check (
    auth.uid() = proposed_by
    and exists (
      select 1 from public.tasks t
      where t.id = task_id
        and t.assignee_id = auth.uid()
        and t.status = 'aprovada'
        and public.is_family_member(t.family_id)
    )
  );

drop policy if exists negotiations_update on public.negotiations;
create policy negotiations_update on public.negotiations
  for update using (
    exists (
      select 1 from public.tasks t
      where t.id = task_id and public.is_family_responsavel(t.family_id)
    )
  );
