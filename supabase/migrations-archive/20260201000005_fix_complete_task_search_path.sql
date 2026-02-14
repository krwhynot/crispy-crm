-- Security hardening: Fix search_path for complete_task_with_followup
--
-- This SECURITY DEFINER function previously used SET search_path TO 'public',
-- which still allows the function to resolve unqualified names via the public schema.
-- A malicious actor who can create objects in the public schema could shadow built-in
-- functions or tables, causing the DEFINER-privileged function to execute attacker code.
--
-- Fix: SET search_path = '' (empty) and fully qualify ALL object references.
-- This is the Supabase-recommended defense-in-depth pattern for SECURITY DEFINER functions.
-- Reference: https://supabase.com/docs/guides/database/hardening#set-search_path-for-functions

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
  v_opportunity_id BIGINT;
BEGIN
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
  -- Use opportunity_id from task (may be null)
  -- If task has opportunity, create interaction; otherwise create engagement
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
      auth.uid()::BIGINT
    ) RETURNING id INTO v_activity_id;

    v_opportunity_id := v_task.opportunity_id;
  ELSE
    -- Create engagement (no opportunity required)
    -- Engagement requires either contact_id or organization_id (enforced by check constraint)
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
      auth.uid()::BIGINT
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
    -- Re-raise with context
    RAISE EXCEPTION 'Failed to complete task: %', SQLERRM;
END;
$$;

COMMENT ON FUNCTION public.complete_task_with_followup IS 'Atomically completes a task, creates a linked activity, and optionally updates opportunity stage. Used by dashboard quick actions to ensure data consistency.';

GRANT EXECUTE ON FUNCTION public.complete_task_with_followup TO authenticated;
