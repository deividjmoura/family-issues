-- Endurece leitura e escrita das ofertas: a negociação é privada entre as partes.

DROP POLICY IF EXISTS task_offers_select ON public.task_offers;
CREATE POLICY task_offers_select ON public.task_offers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.tasks t
      WHERE t.id = task_id
        AND (
          (SELECT auth.uid()) = t.created_by
          OR (SELECT auth.uid()) = t.assignee_id
          OR (SELECT auth.uid()) = user_id
        )
    )
  );

REVOKE UPDATE ON TABLE public.task_offers FROM anon, authenticated;
GRANT UPDATE (status, responded_by, updated_at)
  ON TABLE public.task_offers TO authenticated;

DROP POLICY IF EXISTS task_offers_insert ON public.task_offers;
CREATE POLICY task_offers_insert ON public.task_offers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND EXISTS (
      SELECT 1
      FROM public.tasks t
      JOIN public.family_members fm
        ON fm.family_id = t.family_id
       AND fm.user_id = (SELECT auth.uid())
       AND fm.role = 'executor'
      WHERE t.id = task_id
        AND t.status IN ('criada', 'atribuida')
        AND (t.assignee_id IS NULL OR t.assignee_id = (SELECT auth.uid()))
    )
  );

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
