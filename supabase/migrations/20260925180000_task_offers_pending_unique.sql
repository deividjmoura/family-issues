-- Garante no banco que cada usuário tenha no máximo uma proposta pendente por tarefa.
CREATE UNIQUE INDEX IF NOT EXISTS task_offers_one_pending_per_user
  ON public.task_offers (task_id, user_id)
  WHERE status = 'pending';
