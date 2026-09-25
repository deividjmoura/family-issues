-- Habilita Realtime nas tabelas usadas pelo app
-- (roda no SQL Editor se a migration não aplicar sozinha)

do $$
begin
  -- tasks
  begin
    alter publication supabase_realtime add table public.tasks;
  exception when duplicate_object then null;
  end;

  -- notifications
  begin
    alter publication supabase_realtime add table public.notifications;
  exception when duplicate_object then null;
  end;

  -- negotiations
  begin
    alter publication supabase_realtime add table public.negotiations;
  exception when duplicate_object then null;
  end;

  -- task_offers (pode não existir em bases antigas)
  begin
    alter publication supabase_realtime add table public.task_offers;
  exception
    when undefined_table then null;
    when duplicate_object then null;
  end;
end $$;
