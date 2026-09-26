-- Endurece o RLS das ofertas: somente as partes da tarefa podem responder.

DROP POLICY IF EXISTS task_offers_update ON public.task_offers;
CREATE POLICY task_offers_update ON public.task_offers
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.tasks t
      WHERE t.id = task_id
        AND (
          (SELECT auth.uid()) = t.created_by
          OR (SELECT auth.uid()) = t.assignee_id
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.tasks t
      WHERE t.id = task_id
        AND (
          (SELECT auth.uid()) = t.created_by
          OR (SELECT auth.uid()) = t.assignee_id
        )
    )
  );
