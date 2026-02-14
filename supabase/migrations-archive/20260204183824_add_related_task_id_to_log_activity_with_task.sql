-- ============================================================================
-- Migration: Add related_task_id support to log_activity_with_task RPC
-- ============================================================================
-- Context: Task completion flow logs activities that should link back to the
--          completed task via related_task_id. The field exists in activities
--          table but the RPC function wasn't extracting/inserting it.
-- Fix: Add related_task_id to the activity INSERT column and VALUES list
-- ============================================================================

CREATE OR REPLACE FUNCTION log_activity_with_task(
  p_activity JSONB,
  p_task JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $$
DECLARE
  v_activity_id BIGINT;
  v_task_id BIGINT;
  v_current_sales_id BIGINT;
BEGIN
  -- Get current user's sales ID for created_by attribution
  v_current_sales_id := get_current_sales_id();

  IF v_current_sales_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated or sales record not found';
  END IF;

  -- Validate required activity fields
  IF p_activity IS NULL THEN
    RAISE EXCEPTION 'Activity data is required';
  END IF;

  IF p_activity->>'activity_type' IS NULL THEN
    RAISE EXCEPTION 'Activity type is required';
  END IF;

  IF p_activity->>'type' IS NULL THEN
    RAISE EXCEPTION 'Interaction type is required';
  END IF;

  IF p_activity->>'subject' IS NULL OR trim(p_activity->>'subject') = '' THEN
    RAISE EXCEPTION 'Activity subject is required';
  END IF;

  -- Validate contact_id OR organization_id is present (check_has_contact_or_org constraint)
  IF (p_activity->>'contact_id') IS NULL AND (p_activity->>'organization_id') IS NULL THEN
    RAISE EXCEPTION 'Activity must have either contact_id or organization_id';
  END IF;

  -- Insert activity
  INSERT INTO activities (
    activity_type,
    type,
    subject,
    description,
    activity_date,
    duration_minutes,
    contact_id,
    organization_id,
    opportunity_id,
    related_task_id,              -- ADDED: Link to completed task
    follow_up_required,
    follow_up_date,
    follow_up_notes,
    outcome,
    sentiment,
    location,
    created_by,
    created_at,
    updated_at
  ) VALUES (
    (p_activity->>'activity_type')::activity_type,
    (p_activity->>'type')::interaction_type,
    p_activity->>'subject',
    p_activity->>'description',
    COALESCE((p_activity->>'activity_date')::timestamptz, NOW()),
    (p_activity->>'duration_minutes')::integer,
    (p_activity->>'contact_id')::bigint,
    (p_activity->>'organization_id')::bigint,
    (p_activity->>'opportunity_id')::bigint,
    (p_activity->>'related_task_id')::bigint,  -- ADDED: Extract from JSONB
    COALESCE((p_activity->>'follow_up_required')::boolean, false),
    (p_activity->>'follow_up_date')::date,
    p_activity->>'follow_up_notes',
    p_activity->>'outcome',
    p_activity->>'sentiment',
    p_activity->>'location',
    v_current_sales_id,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_activity_id;

  -- Insert task if provided
  IF p_task IS NOT NULL THEN
    -- Validate required task fields
    IF p_task->>'title' IS NULL OR trim(p_task->>'title') = '' THEN
      RAISE EXCEPTION 'Task title is required when creating follow-up task';
    END IF;

    INSERT INTO tasks (
      title,
      description,
      due_date,
      reminder_date,
      priority,
      contact_id,
      opportunity_id,
      sales_id,
      type,
      created_at,
      updated_at
    ) VALUES (
      p_task->>'title',
      p_task->>'description',
      (p_task->>'due_date')::date,
      (p_task->>'reminder_date')::date,
      COALESCE((p_task->>'priority')::priority_level, 'medium'::priority_level),
      (p_task->>'contact_id')::bigint,
      (p_task->>'opportunity_id')::bigint,
      v_current_sales_id,
      COALESCE((p_task->>'type')::task_type, 'Follow-up'::task_type),
      NOW(),
      NOW()
    )
    RETURNING id INTO v_task_id;
  END IF;

  -- Return result with both IDs
  RETURN jsonb_build_object(
    'success', true,
    'activity_id', v_activity_id,
    'task_id', v_task_id
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Transaction will be rolled back automatically
    -- Re-raise with context for debugging
    RAISE EXCEPTION 'log_activity_with_task failed: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END;
$$;

-- Update documentation to include related_task_id field
COMMENT ON FUNCTION log_activity_with_task IS
'Atomically creates an activity and optionally a follow-up task in a single transaction.
Use this instead of separate dataProvider.create() calls to ensure consistency.

Parameters:
  p_activity (JSONB): Required. Activity data with fields:
    - activity_type: "engagement" or "interaction" (required)
    - type: interaction_type enum value (required)
    - subject: text (required)
    - description: text (optional)
    - activity_date: timestamptz (defaults to NOW())
    - contact_id: bigint (required if no organization_id)
    - organization_id: bigint (required if no contact_id)
    - opportunity_id: bigint (optional, required for "interaction" type)
    - related_task_id: bigint (optional, links activity to completed task)
    - other activity fields as needed

  p_task (JSONB): Optional. Follow-up task data with fields:
    - title: text (required if p_task provided)
    - description: text (optional)
    - due_date: date (optional)
    - priority: priority_level enum (defaults to "medium")
    - type: task_type enum (defaults to "Follow-up")
    - contact_id/opportunity_id: inherit from activity if not specified

Returns:
  JSONB with { success: true, activity_id: bigint, task_id: bigint|null }

Example:
  SELECT log_activity_with_task(
    ''{"activity_type": "engagement", "type": "call", "subject": "Follow-up call", "organization_id": 123, "related_task_id": 456}''::jsonb,
    ''{"title": "Schedule demo", "due_date": "2026-01-18", "priority": "high"}''::jsonb
  );
';
