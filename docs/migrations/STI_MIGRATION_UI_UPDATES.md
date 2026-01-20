# STI Migration: UI Component Updates

**Created:** 2026-01-21
**Migration:** Tasks → Activities (Single Table Inheritance)
**Status:** Handler complete, UI updates pending

## Summary

After the STI migration, tasks are stored in the `activities` table with `activity_type = 'task'`. The handler layer (`tasksHandler.ts`) provides backwards compatibility by:

1. Auto-filtering to `activity_type = 'task'` on reads
2. Auto-setting `activity_type = 'task'` on creates
3. Mapping `title ↔ subject` for field compatibility
4. Mapping `task_type ↔ interaction_type` for type compatibility

**Most UI components should continue working without changes** thanks to the handler wrapper.

---

## Components Requiring Updates

### Priority 1: Likely Working (Verify Only)

These components use the `tasks` resource through React Admin, which routes through `tasksHandler.ts`:

| Component | File | Expected Status |
|-----------|------|-----------------|
| `TaskList.tsx` | `src/atomic-crm/tasks/TaskList.tsx` | ✅ Should work |
| `TaskCreate.tsx` | `src/atomic-crm/tasks/TaskCreate.tsx` | ✅ Should work |
| `TaskEdit.tsx` | `src/atomic-crm/tasks/TaskEdit.tsx` | ✅ Should work |
| `TaskSlideOver.tsx` | `src/atomic-crm/tasks/TaskSlideOver.tsx` | ✅ Should work |
| `TaskShow.tsx` | `src/atomic-crm/tasks/TaskShow.tsx` | ✅ Should work |
| `TaskCompactForm.tsx` | `src/atomic-crm/tasks/TaskCompactForm.tsx` | ✅ Should work |

**Action:** Run manual E2E tests to verify.

### Priority 2: May Need Field Updates

Components that directly access database fields may need to be aware of the new column structure:

| Component | File | Potential Issue |
|-----------|------|-----------------|
| `TasksIterator.tsx` | `src/atomic-crm/tasks/TasksIterator.tsx` | Check field names |
| `TasksDatagridHeader.tsx` | `src/atomic-crm/tasks/TasksDatagridHeader.tsx` | Check field names |
| `TaskActionMenu.tsx` | `src/atomic-crm/tasks/components/TaskActionMenu.tsx` | Check field names |

**Action:** Review for direct field access. Handler maps `subject ↔ title`.

### Priority 3: Timeline Components (Simplified)

The `entity_timeline` view is now simpler (no UNION ALL), which may affect these components:

| Component | File | Expected Change |
|-----------|------|-----------------|
| `UnifiedTimeline.tsx` | `src/atomic-crm/timeline/UnifiedTimeline.tsx` | May be simplified |
| `TimelineEntry.tsx` | `src/atomic-crm/timeline/TimelineEntry.tsx` | Check entry_type handling |

**Action:** Timeline queries should be faster. Verify rendering is correct.

### Priority 4: Dashboard Components

Components displaying priority tasks or task summaries:

| Component | File | Expected Status |
|-----------|------|-----------------|
| Dashboard widgets | Various | Use `priority_tasks` view |
| `NextTaskBadge.tsx` | Various | Should work via view |

**Action:** Verify priority_tasks view data is correct.

---

## Field Mapping Reference

| UI Field (tasks) | DB Field (activities) | Handler Maps? |
|-----------------|----------------------|---------------|
| `title` | `subject` | ✅ Yes |
| `type` (Title Case) | `type` (snake_case) | ✅ Yes |
| `due_date` | `due_date` | ➖ Same |
| `completed` | `completed` | ➖ Same |
| `priority` | `priority` | ➖ Same |
| `sales_id` | `sales_id` | ➖ Same |
| `snooze_until` | `snooze_until` | ➖ Same |
| `contact_id` | `contact_id` | ➖ Same |
| `opportunity_id` | `opportunity_id` | ➖ Same |
| `organization_id` | `organization_id` | ➖ Same |

---

## New Computed Fields (Available in Views)

The `tasks_summary` and `priority_tasks` views include these computed fields:

- `contact_name` - From contacts table join
- `organization_name` - From organizations table join
- `opportunity_name` - From opportunities table join
- `assignee_name` - From sales table join (via sales_id)
- `assignee_email` - From sales table join
- `creator_name` - From sales table join (via created_by)
- `is_overdue` - Boolean computed from due_date
- `days_until_due` - Integer computed from due_date

---

## Testing Checklist

### Manual E2E Tests (see plan for full details)

- [ ] **Test 1:** Create task with full linking (Contact + Opportunity)
- [ ] **Test 2:** Verify 360° visibility (same task on Contact AND Opportunity timelines)
- [ ] **Test 3:** Complete task → becomes completed activity
- [ ] **Test 4:** Log activity with follow-up → creates linked task
- [ ] **Test 5:** Cross-entity links work (clickable entity names)

### Automated Tests

Run existing task tests to verify backwards compatibility:

```bash
npm run test -- --grep "Task"
```

---

## Rollback Instructions

If issues are found:

1. Rename `tasks_deprecated` back to `tasks`:
   ```sql
   ALTER TABLE tasks_deprecated RENAME TO tasks;
   ```

2. Drop task columns from activities (optional - they're nullable):
   ```sql
   ALTER TABLE activities
     DROP COLUMN due_date,
     DROP COLUMN reminder_date,
     DROP COLUMN completed,
     DROP COLUMN completed_at,
     DROP COLUMN priority,
     DROP COLUMN sales_id,
     DROP COLUMN snooze_until,
     DROP COLUMN overdue_notified_at,
     DROP COLUMN related_task_id;
   ```

3. Restore original handler:
   ```bash
   git checkout HEAD~1 -- src/atomic-crm/providers/supabase/handlers/tasksHandler.ts
   ```

4. Drop new views:
   ```sql
   DROP VIEW IF EXISTS tasks_v;
   DROP VIEW IF EXISTS tasks_summary;
   DROP VIEW IF EXISTS priority_tasks;
   DROP VIEW IF EXISTS activities_with_task_details;
   ```

---

## Timeline

- **2026-01-21:** Migration applied, handlers updated
- **2026-02-21:** Verification complete, deprecation notice active
- **2026-03-21:** Remove `tasks_deprecated` table and `task_id_mapping` table

---

## Related Files

| Purpose | Path |
|---------|------|
| Migration 1 | `supabase/migrations/20260121000001_add_task_columns_to_activities.sql` |
| Migration 2 | `supabase/migrations/20260121000002_migrate_tasks_to_activities.sql` |
| Migration 3 | `supabase/migrations/20260121000003_create_compatibility_views.sql` |
| Migration 4 | `supabase/migrations/20260121000004_update_activities_rls_for_tasks.sql` |
| Migration 5 | `supabase/migrations/20260121000005_deprecate_tasks_table.sql` |
| Handler | `src/atomic-crm/providers/supabase/handlers/tasksHandler.ts` |
| Callbacks | `src/atomic-crm/providers/supabase/callbacks/activitiesCallbacks.ts` |
| Validation | `src/atomic-crm/validation/activities.ts` |
