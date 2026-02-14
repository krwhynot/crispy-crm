-- Migration: Fix auth.uid()::BIGINT unsafe cast in complete_task_with_followup
--
-- Problem: Migration 20260201000005 regressed from the Nov 10 fix (20251110125720).
-- It removed the v_sales_id lookup and reintroduced direct UUID-to-BIGINT casting
-- at lines 84 and 114.
--
-- Fix: Restore the sales lookup pattern while keeping search_path hardening.
-- This replaces the function in-place (CREATE OR REPLACE).

CREATE OR REPLACE FUNCTION public.complete_task_with_followup(
  p_task_id BIGINT,
  p_activity_data JSONB,
  p_opportunity_stage TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_task RECORD;
  v_activity_id BIGINT;
  v_sales_id BIGINT;  -- RESTORED: proper lookup variable
  v_opportunity_id BIGINT;
BEGIN
  -- RESTORED: Look up sales_id for current user (fixes auth.uid()::BIGINT regression)
  SELECT id INTO v_sales_id
  FROM public.sales
  WHERE user_id = auth.uid();

  IF v_sales_id IS NULL THEN
    RAISE EXCEPTION 'No sales record found for current user';
  END IF;

  -- Validate inputs
  IF p_task_id IS NULL THEN
    RAISE EXCEPTION 'task_id is required';
  END IF;

  IF p_activity_data IS NULL OR p_activity_data->>'description' IS NULL THEN
    RAISE EXCEPTION 'activity description is required';
  END IF;

  -- Get task details
  SELECT * INTO v_task
  FROM public.tasks
  WHERE id = p_task_id
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task not found or already deleted: %', p_task_id;
  END IF;

  IF v_task.completed = TRUE THEN
    RAISE EXCEPTION 'Task is already completed: %', p_task_id;
  END IF;

  -- 1. Mark task complete
  UPDATE public.tasks
  SET
    completed = TRUE,
    completed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_task_id;

  -- 2. Create activity linked to task
  IF v_task.opportunity_id IS NOT NULL THEN
    -- Create interaction (requires opportunity)
    INSERT INTO public.activities (
      activity_type,
      type,
      subject,
      description,
      activity_date,
      opportunity_id,
      contact_id,
      organization_id,
      related_task_id,
      created_by
    ) VALUES (
      'interaction',
      COALESCE((p_activity_data->>'type')::public.interaction_type, 'follow_up'),
      COALESCE(p_activity_data->>'subject', v_task.title),
      p_activity_data->>'description',
      COALESCE((p_activity_data->>'activity_date')::TIMESTAMPTZ, NOW()),
      v_task.opportunity_id,
      v_task.contact_id,
      (SELECT principal_organization_id FROM public.opportunities WHERE id = v_task.opportunity_id),
      p_task_id,
      v_sales_id  -- FIXED: was auth.uid()::BIGINT
    ) RETURNING id INTO v_activity_id;

    v_opportunity_id := v_task.opportunity_id;
  ELSE
    -- Create engagement (no opportunity required)
    IF v_task.contact_id IS NULL AND v_task.organization_id IS NULL THEN
      RAISE EXCEPTION 'Task must have either contact_id or organization_id to create activity';
    END IF;

    INSERT INTO public.activities (
      activity_type,
      type,
      subject,
      description,
      activity_date,
      contact_id,
      organization_id,
      related_task_id,
      created_by
    ) VALUES (
      'engagement',
      COALESCE((p_activity_data->>'type')::public.interaction_type, 'follow_up'),
      COALESCE(p_activity_data->>'subject', v_task.title),
      p_activity_data->>'description',
      COALESCE((p_activity_data->>'activity_date')::TIMESTAMPTZ, NOW()),
      v_task.contact_id,
      v_task.organization_id,
      p_task_id,
      v_sales_id  -- FIXED: was auth.uid()::BIGINT
    ) RETURNING id INTO v_activity_id;

    v_opportunity_id := NULL;
  END IF;

  -- 3. Update opportunity stage (if provided and task has opportunity)
  IF p_opportunity_stage IS NOT NULL AND v_opportunity_id IS NOT NULL THEN
    UPDATE public.opportunities
    SET
      stage = p_opportunity_stage::public.opportunity_stage,
      stage_changed_at = NOW(),
      updated_at = NOW()
    WHERE id = v_opportunity_id
      AND deleted_at IS NULL;
  END IF;

  -- Return result
  RETURN jsonb_build_object(
    'task_id', p_task_id,
    'activity_id', v_activity_id,
    'opportunity_id', v_opportunity_id,
    'success', true
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to complete task: %', SQLERRM;
END;
$$;

COMMENT ON FUNCTION public.complete_task_with_followup IS
  'Atomically completes a task, creates a linked activity, and optionally updates opportunity stage. '
  'Fixed: uses v_sales_id lookup instead of auth.uid()::BIGINT cast (regression from 20260201000005).';

GRANT EXECUTE ON FUNCTION public.complete_task_with_followup TO authenticated;
