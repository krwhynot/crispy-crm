-- Fix Sales UPDATE Policy Role
-- Root cause: update_sales grants to 'public' instead of 'authenticated'
-- Impact: Authenticated users (like admin@test.com) cannot update sales records
-- Ticket: admin@test.com cannot edit self in Sales SlideOver

BEGIN;

DROP POLICY IF EXISTS "update_sales" ON public.sales;

CREATE POLICY "update_sales" ON public.sales
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING (is_admin() OR (user_id = auth.uid()))
  WITH CHECK (is_admin() OR (user_id = auth.uid()));

COMMIT;
