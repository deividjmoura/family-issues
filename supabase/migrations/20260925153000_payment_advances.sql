-- Adiantamentos parciais do responsável para um executor
-- Reduzem o "a pagar" até serem consumidos no acerto (payAll).

create table if not exists public.payment_advances (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  executor_id uuid not null references auth.users(id) on delete cascade,
  amount_cents integer not null check (amount_cents > 0),
  applied_cents integer not null default 0 check (applied_cents >= 0),
  paid_by uuid not null references auth.users(id) on delete restrict,
  note text,
  created_at timestamptz not null default now(),
  constraint payment_advances_applied_lte_amount
    check (applied_cents <= amount_cents)
);

create index if not exists payment_advances_family_executor_idx
  on public.payment_advances (family_id, executor_id);

create index if not exists payment_advances_open_idx
  on public.payment_advances (family_id, executor_id)
  where applied_cents < amount_cents;

alter table public.payment_advances enable row level security;

drop policy if exists payment_advances_select on public.payment_advances;
create policy payment_advances_select on public.payment_advances
  for select using (public.is_family_member(family_id));

drop policy if exists payment_advances_insert on public.payment_advances;
create policy payment_advances_insert on public.payment_advances
  for insert with check (
    public.is_family_responsavel(family_id)
    and auth.uid() = paid_by
  );

drop policy if exists payment_advances_update on public.payment_advances;
create policy payment_advances_update on public.payment_advances
  for update using (public.is_family_responsavel(family_id));
