# Activity Auto-Generation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Auto-generate activity entries when opportunity stage/status changes

**Architecture:** Database triggers on opportunities table insert activity records automatically

**Tech Stack:** PostgreSQL triggers, activities table (exists)
**Effort:** 3 days | **Priority:** MEDIUM | **Status:** Manual logging 100%, auto 0%

---

## Implementation

### Step 1-3: Create Trigger Function (Day 1)

**File:** `supabase/migrations/*_auto_generate_activities.sql`

```sql
-- Function to auto-generate activity on stage change
CREATE OR REPLACE FUNCTION auto_generate_stage_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger on UPDATE when stage changes
  IF TG_OP = 'UPDATE' AND OLD.stage IS DISTINCT FROM NEW.stage THEN
    INSERT INTO activities (
      activity_type,
      type,
      subject,
      description,
      opportunity_id,
      created_by,
      created_at
    ) VALUES (
      'engagement',
      'note',
      'Stage changed to ' || NEW.stage,
      'Opportunity stage automatically updated from ' || OLD.stage || ' to ' || NEW.stage,
      NEW.id,
      NEW.updated_by,
      NOW()
    );
  END IF;

  -- Trigger on status change
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO activities (
      activity_type,
      type,
      subject,
      description,
      opportunity_id,
      created_by,
      created_at
    ) VALUES (
      'engagement',
      'note',
      'Status changed to ' || NEW.status,
      'Opportunity status automatically updated from ' || OLD.status || ' to ' || NEW.status,
      NEW.id,
      NEW.updated_by,
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER trigger_auto_generate_stage_activity
  AFTER UPDATE ON opportunities
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_stage_activity();
```

### Step 4-6: Test Trigger (Day 2)

```bash
npm run db:local:reset

# Test stage change
psql $DATABASE_URL -c "UPDATE opportunities SET stage = 'qualified' WHERE id = (SELECT id FROM opportunities LIMIT 1);"

# Verify activity created
psql $DATABASE_URL -c "SELECT * FROM activities WHERE subject LIKE 'Stage changed%' ORDER BY created_at DESC LIMIT 1;"
```

### Step 7-9: Add UI Indicator for Auto Activities (Day 3)

**File:** `src/atomic-crm/activity/ActivityLog.tsx`

```typescript
// Add visual indicator for auto-generated activities
<Chip
  label={activity.created_by ? 'Manual' : 'Auto'}
  size="small"
  color={activity.created_by ? 'default' : 'info'}
  sx={{ ml: 1 }}
/>
```

### Step 10: Commit

```bash
git add supabase/migrations/*_auto_generate_activities.sql
git add src/atomic-crm/activity/ActivityLog.tsx
git commit -m "feat: auto-generate activities on stage/status changes

- Create trigger function for automatic activity logging
- Trigger on opportunity stage changes
- Trigger on opportunity status changes
- Add UI indicator for auto vs manual activities

Automatic audit trail for opportunity lifecycle

🤖 Generated with Claude Code"
```

---

**Plan Status:** ✅ Ready | **Time:** 3 days | **Impact:** MEDIUM (Auto audit trail)
