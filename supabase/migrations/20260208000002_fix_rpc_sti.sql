-- ============================================================================
-- Migration: Fix log_activity_with_task RPC to use activities table (STI)
-- ============================================================================
-- Context: The RPC currently inserts tasks into the deprecated tasks table
--          (renamed to tasks_deprecated by migration 20260121000005). It needs
--          to insert into the activities table with activity_type='task' using
--          the Single Table Inheritance (STI) pattern.
-- Fix: Change INSERT from tasks -> activities with proper column mapping
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
    related_task_id,
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
    (p_activity->>'related_task_id')::bigint,
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

  -- Insert task as activity with activity_type='task' (STI pattern)
  IF p_task IS NOT NULL THEN
    -- Validate required task fields
    IF p_task->>'title' IS NULL OR trim(p_task->>'title') = '' THEN
      RAISE EXCEPTION 'Task title is required when creating follow-up task';
    END IF;

    -- Map task_type to interaction_type
    -- task_type enum: 'Call', 'Email', 'Meeting', 'Follow-up', 'Demo', 'Proposal'
    -- interaction_type enum: lowercase versions exist (call, email, meeting, demo, proposal, follow_up)
    INSERT INTO activities (
      activity_type,        -- STI discriminator
      type,                 -- Maps from task.type
      subject,              -- Maps from task.title
      description,          -- Maps from task.description
      due_date,             -- Task-specific column
      reminder_date,        -- Task-specific column
      priority,             -- Task-specific column
      contact_id,           -- Maps from task.contact_id
      organization_id,      -- Inherit from activity if not provided
      opportunity_id,       -- Maps from task.opportunity_id
      sales_id,             -- Task-specific: assigned user
      created_by,           -- Creator
      created_at,
      updated_at
    ) VALUES (
      'task'::activity_type,  -- STI: tasks identified by activity_type='task'
      CASE
        -- Map task_type to interaction_type (lowercase conversion)
        WHEN (p_task->>'type')::text = 'Call' THEN 'call'::interaction_type
        WHEN (p_task->>'type')::text = 'Email' THEN 'email'::interaction_type
        WHEN (p_task->>'type')::text = 'Meeting' THEN 'meeting'::interaction_type
        WHEN (p_task->>'type')::text = 'Follow-up' THEN 'follow_up'::interaction_type
        WHEN (p_task->>'type')::text = 'Demo' THEN 'demo'::interaction_type
        WHEN (p_task->>'type')::text = 'Proposal' THEN 'proposal'::interaction_type
        WHEN (p_task->>'type')::text = 'Other' THEN 'other'::interaction_type
        ELSE 'other'::interaction_type  -- Default fallback for unknown types
      END,
      p_task->>'title',               -- task.title -> activity.subject
      p_task->>'description',
      (p_task->>'due_date')::date,
      (p_task->>'reminder_date')::date,
      COALESCE((p_task->>'priority')::priority_level, 'medium'::priority_level),
      (p_task->>'contact_id')::bigint,
      -- Inherit organization_id from parent activity if task doesn't specify
      COALESCE((p_task->>'organization_id')::bigint, (p_activity->>'organization_id')::bigint),
      (p_task->>'opportunity_id')::bigint,
      COALESCE((p_task->>'sales_id')::bigint, v_current_sales_id),  -- Assigned user or creator
      v_current_sales_id,             -- Creator
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

-- Update documentation to reflect STI pattern
COMMENT ON FUNCTION log_activity_with_task IS
'Atomically creates an activity and optionally a follow-up task in a single transaction.
Tasks are stored in the activities table using Single Table Inheritance (activity_type=task).
Use this instead of separate dataProvider.create() calls to ensure consistency.

Parameters:
  p_activity (JSONB): Required. Activity data with fields:
    - activity_type: "activity" (required, simplified model)
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
    - title: text (required if p_task provided) -> maps to activities.subject
    - description: text (optional)
    - due_date: date (optional)
    - reminder_date: date (optional)
    - priority: priority_level enum (defaults to "medium")
    - type: task_type enum (defaults to "Follow-up") -> maps to interaction_type
    - contact_id/organization_id/opportunity_id: inherit from activity if not specified
    - sales_id: bigint (assigned user, defaults to creator)

Returns:
  JSONB with { success: true, activity_id: bigint, task_id: bigint|null }

Example:
  SELECT log_activity_with_task(
    ''{"activity_type": "engagement", "type": "call", "subject": "Follow-up call", "organization_id": 123, "related_task_id": 456}''::jsonb,
    ''{"title": "Schedule demo", "due_date": "2026-01-18", "priority": "high", "type": "Demo"}''::jsonb
  );
';
