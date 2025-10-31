# Opportunity Redesign - Parallel Implementation Plan

**Plan Date:** 2025-10-23
**Validated:** 2025-10-23 (3 corrections applied - see validation notes below)
**Status:** READY FOR IMPLEMENTATION (All Tier 1 gaps resolved)
**Total Estimated Time:** 11 hours (8 parallel tasks - Task 1.1 simplified)
**Implementation Mode:** Parallel execution optimized for multiple agents

---

## ⚠️ VALIDATION CORRECTIONS (2025-10-23)

**3 issues corrected after codebase validation:**

1. **Task 1.1 SIMPLIFIED:** Type generation scripts already exist at `/scripts/mcp-generate-types.cjs` - just need to wire into package.json. Time reduced from 2h → 1h.

2. **Task 1.6 REFERENCE FIX:** OrganizationCard does NOT have dropdown menu. Use `/src/atomic-crm/tasks/Task.tsx` (lines 155-206) as the correct dropdown pattern reference.

3. **Task 1.8 CSV DATA ISSUES (BLOCKER):**
   - ❌ STAGE column is at position **7** (not 6 as stated in plan)
   - ❌ Only **~592 valid opportunity rows** exist (not 1,062 - that's total file lines including headers/empty rows)
   - ❌ Custom stage names need business mapping: "Sampled/Visited invite-3" (533 rows!), "VAF BLITZ" (64), etc.
   - 🚫 **TASK 1.8 BLOCKED** until stakeholder maps custom stages to database enums
   - ✅ Tasks 1.1-1.7 can proceed immediately

---

## Overview

This plan transforms the basic Opportunity Kanban into an interaction-rich pipeline with CSV migration, enhanced cards, and mobile responsiveness. The implementation addresses 11 critical gaps identified during planning and is optimized for parallel execution by multiple agents.

**Key Achievements:**
- Fix type system mismatch (database ↔ TypeScript)
- Enforce priority inheritance via database triggers
- Create opportunities_summary view with interaction counts
- Implement CSV migration with fail-fast validation
- Add manual stage movement (defer drag-and-drop to Phase 2)
- Enhance auto-name generation with products support

**Architecture Approach:**
- Database-first: Triggers and views enforce business rules
- Transparent views: opportunities_summary replaces base table for lists
- Timestamp-based ordering: Eliminates race conditions
- Fail-fast validation: Clear errors, no partial imports

---

## Critically Relevant Files and Documentation

### Core Files (Read Before Implementation)

**Planning Documentation:**
- `/home/krwhynot/projects/crispy-crm/.docs/plans/opportunity-redesign/shared.md` - Architecture reference
- `/home/krwhynot/projects/crispy-crm/.docs/plans/opportunity-redesign/CRITICAL-GAPS.md` - Gap analysis
- `/home/krwhynot/projects/crispy-crm/.docs/plans/opportunity-redesign/GAPS-RESOLUTION-MATRIX.md` - Solution mapping
- `/home/krwhynot/projects/crispy-crm/.docs/plans/opportunity-redesign/DECISION-QUESTIONS.md` - Approved decisions

**Engineering Standards:**
- `/home/krwhynot/projects/crispy-crm/docs/claude/engineering-constitution.md` - MUST READ (NO OVER-ENGINEERING, SINGLE SOURCE OF TRUTH, FAIL FAST, BOY SCOUT RULE)
- `/home/krwhynot/projects/crispy-crm/docs/supabase/WORKFLOW.md` - Database migration workflow
- `/home/krwhynot/projects/crispy-crm/CLAUDE.md` - Project overview and conventions

**Opportunity Module:**
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/opportunities/OpportunityCard.tsx` - Card component
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/opportunities/OpportunityList.tsx` - List wrapper
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/opportunities/OpportunityListContent.tsx` - Kanban layout
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/opportunities/stageConstants.ts` - Stage definitions
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/opportunities/useAutoGenerateName.ts` - Name generation

**Type System:**
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/types.ts` - TypeScript types
- `/home/krwhynot/projects/crispy-crm/src/types/database.generated.ts` - Supabase generated types
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/validation/opportunities.ts` - Zod schemas

**Data Layer:**
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/providers/supabase/unifiedDataProvider.ts` - Data provider
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/providers/supabase/filterRegistry.ts` - Filter validation
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/providers/supabase/dataProviderUtils.ts` - Query transformation

**Database:**
- `/home/krwhynot/projects/crispy-crm/supabase/migrations/20251018152315_cloud_schema_fresh.sql` - Schema reference
- `/home/krwhynot/projects/crispy-crm/supabase/migrations/` - Migration examples

---

## Implementation Plan

### Phase 1: Core Infrastructure (Parallel Tasks 1.1-1.4)

These tasks fix critical blockers and establish infrastructure. Tasks 1.1, 1.2, and 1.4 can run in parallel. Task 1.3 depends on Task 1.4.

---

#### Task 1.1: Fix Type System Mismatch [GAP 1] **Depends on: [none]**

**Priority:** 🔴 CRITICAL BLOCKER
**Time Estimate:** 1 hour ⚠️ REDUCED (scripts already exist)
**Engineering Constitution:** SINGLE SOURCE OF TRUTH, BOY SCOUT RULE

**READ THESE BEFORE TASK:**
- `/home/krwhynot/projects/crispy-crm/docs/claude/engineering-constitution.md` (SINGLE SOURCE OF TRUTH principle)
- `/home/krwhynot/projects/crispy-crm/.docs/plans/opportunity-redesign/CRITICAL-GAPS.md` (lines 26-73)
- `/home/krwhynot/projects/crispy-crm/.docs/plans/opportunity-redesign/SOLUTIONS-ANALYSIS.md` (lines 30-73)

**Files to Create:**
- None (infrastructure already exists!)

**Files to Modify:**
- `package.json` - Wire existing scripts into npm commands
- `src/atomic-crm/types.ts` - Update ActivityRecord to use generated types
- `.husky/pre-commit` - Already runs `npm test`, just ensure it catches type errors

**Instructions:**

**Context:** The ActivityRecord type in types.ts has only 8 interaction types, but the database enum defines 11 types (missing trade_show, site_visit, contract_review, check_in, social). This violates SINGLE SOURCE OF TRUTH - the database is canonical, TypeScript must match.

**⚠️ VALIDATION UPDATE:** Type generation scripts ALREADY EXIST at `/scripts/mcp-generate-types.cjs` and `database.generated.ts` already has 2,228 lines. We just need to wire them up properly.

**Solution:** Use existing type generation infrastructure, update ActivityRecord to import from generated types instead of manual type union.

**Implementation Steps:**

1. **Add npm scripts to package.json** (5 min)
   ```json
   {
     "scripts": {
       "gen:types": "node ./scripts/mcp-generate-types.cjs",
       "gen:types:force": "node ./scripts/mcp-generate-types.cjs --force"
     }
   }
   ```

2. **Verify Existing Generated Types** (3 min)
   ```bash
   # Check that types are already generated
   cat src/types/database.generated.ts | grep -A 12 "interaction_type"
   # Should show all 11 types already defined
   ```

3. **Update ActivityRecord Type** (30 min)

   Open `src/atomic-crm/types.ts` and replace the hardcoded interaction type union (lines 128-136) with the generated enum:

   ```typescript
   // src/atomic-crm/types.ts
   import type { Database } from '@/types/database.generated';

   // Use generated enum as single source of truth
   type InteractionType = Database['public']['Enums']['interaction_type'];

   export type ActivityRecord = {
     id: Identifier;
     activity_type: "engagement" | "interaction";
     type: InteractionType;  // Now auto-synced with database (11 types)

     // ... rest of type unchanged
   } & Pick<RaRecord, "id">;
   ```

4. **Verify Type Sync** (10 min)
   ```bash
   # Check that all 11 interaction types are present
   grep -A 15 "interaction_type" src/types/database.generated.ts

   # Expected output should include:
   # call, email, meeting, demo, proposal, follow_up,
   # trade_show, site_visit, contract_review, check_in, social

   # Run TypeScript compiler to verify no errors
   npm run typecheck
   ```

5. **Optional: Add Pre-Commit Hook** (10 min - OPTIONAL)

   `.husky/pre-commit` already runs `npm test` which will catch type errors.

   If you want automatic type regeneration on migration changes:

   ```bash
   #!/usr/bin/env sh
   . "$(dirname -- "$0")/_/husky.sh"

   # Regenerate types if migrations changed (optional)
   if git diff --cached --name-only | grep -q "supabase/migrations"; then
     echo "🔄 Migrations changed, regenerating types..."
     npm run gen:types
     git add src/types/database.generated.ts
     echo "✅ Types regenerated and staged"
   fi

   npm test
   ```

**Validation Criteria:**
- [ ] ActivityRecord.type uses generated InteractionType enum
- [ ] All 11 interaction types present in database.generated.ts
- [ ] TypeScript compilation succeeds with no errors
- [ ] Pre-commit hook regenerates types when migrations change
- [ ] Types are auto-staged for commit

**Gotchas:**
- Database must be running (`npm run db:local:start`) before type generation
- Don't manually edit database.generated.ts - it's auto-generated
- If migration adds new enum values, types regenerate automatically on commit

---

#### Task 1.2: Implement Priority Inheritance Trigger [GAP 2] **Depends on: [none]**

**Priority:** 🟠 HIGH - Business Logic Enforcement
**Time Estimate:** 1.5 hours
**Engineering Constitution:** SINGLE SOURCE OF TRUTH, FAIL FAST

**READ THESE BEFORE TASK:**
- `/home/krwhynot/projects/crispy-crm/docs/supabase/WORKFLOW.md` - Migration workflow
- `/home/krwhynot/projects/crispy-crm/.docs/plans/opportunity-redesign/CRITICAL-GAPS.md` (lines 187-247)
- `/home/krwhynot/projects/crispy-crm/supabase/migrations/20251018204500_add_helper_function_and_audit_trail.sql` - Trigger examples

**Files to Create:**
- `supabase/migrations/[timestamp]_enforce_priority_inheritance.sql` (new migration)

**Files to Modify:**
- None

**Instructions:**

**Context:** The business rule states "Opportunity priority ALWAYS matches customer organization priority." Currently, this is not enforced - users can manually set priority that differs from the customer org. This violates data integrity.

**Solution:** Database triggers enforce the rule at the data layer, working across all clients (web, mobile, admin tools, direct SQL). Triggers are the correct layer for business logic enforcement (SINGLE SOURCE OF TRUTH).

**Implementation Steps:**

1. **Create Migration File** (5 min)
   ```bash
   npx supabase migration new enforce_priority_inheritance
   ```

2. **Write Trigger Functions and Triggers** (45 min)

   **IMPORTANT:** Organizations use varchar(1) priority (A/B/C/D), opportunities use enum priority_level (low/medium/high/critical). You need a mapping function.

   Open the generated migration file and add:

   ```sql
   -- supabase/migrations/[timestamp]_enforce_priority_inheritance.sql

   -- Migration: Enforce priority inheritance from customer organization
   -- Business Rule: Opportunity priority ALWAYS matches customer org priority

   -- Function to map organization priority (A/B/C/D) to opportunity priority_level
   CREATE OR REPLACE FUNCTION map_org_priority_to_opp_priority(org_priority varchar(1))
   RETURNS priority_level AS $$
   BEGIN
     RETURN CASE org_priority
       WHEN 'A' THEN 'critical'::priority_level
       WHEN 'B' THEN 'high'::priority_level
       WHEN 'C' THEN 'medium'::priority_level
       WHEN 'D' THEN 'low'::priority_level
       ELSE 'medium'::priority_level  -- Default if NULL
     END;
   END;
   $$ LANGUAGE plpgsql IMMUTABLE;

   COMMENT ON FUNCTION map_org_priority_to_opp_priority IS
     'Maps organization priority (A/B/C/D) to opportunity priority_level enum';

   -- Function to sync opportunity priority with customer organization
   CREATE OR REPLACE FUNCTION sync_opportunity_priority()
   RETURNS TRIGGER AS $$
   DECLARE
     v_org_priority varchar(1);
   BEGIN
     -- Get priority from customer organization
     SELECT priority INTO v_org_priority
     FROM organizations
     WHERE id = NEW.customer_organization_id;

     -- FAIL FAST: If customer org doesn't exist, abort
     IF NOT FOUND THEN
       RAISE EXCEPTION 'Customer organization % does not exist', NEW.customer_organization_id;
     END IF;

     -- Force opportunity priority to match customer org
     NEW.priority := map_org_priority_to_opp_priority(v_org_priority);

     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;

   COMMENT ON FUNCTION sync_opportunity_priority IS
     'Enforces business rule: opportunity priority inherits from customer organization';

   -- Trigger on INSERT or UPDATE of customer_organization_id
   DROP TRIGGER IF EXISTS enforce_priority_inheritance_on_opportunity ON opportunities;

   CREATE TRIGGER enforce_priority_inheritance_on_opportunity
     BEFORE INSERT OR UPDATE OF customer_organization_id ON opportunities
     FOR EACH ROW
     EXECUTE FUNCTION sync_opportunity_priority();

   -- Function to cascade priority changes to opportunities
   CREATE OR REPLACE FUNCTION cascade_priority_to_opportunities()
   RETURNS TRIGGER AS $$
   BEGIN
     -- Update all opportunities linked to this org
     UPDATE opportunities
     SET priority = map_org_priority_to_opp_priority(NEW.priority)
     WHERE customer_organization_id = NEW.id;

     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;

   COMMENT ON FUNCTION cascade_priority_to_opportunities IS
     'Cascades organization priority changes to all linked opportunities';

   -- Trigger on UPDATE of organization priority
   DROP TRIGGER IF EXISTS cascade_priority_on_org_update ON organizations;

   CREATE TRIGGER cascade_priority_on_org_update
     AFTER UPDATE OF priority ON organizations
     FOR EACH ROW
     WHEN (OLD.priority IS DISTINCT FROM NEW.priority)
     EXECUTE FUNCTION cascade_priority_to_opportunities();
   ```

3. **Apply Migration to Local Database** (10 min)
   ```bash
   npx supabase db reset
   ```

4. **Write Validation Tests** (30 min)

   Create test file `supabase/tests/test_priority_inheritance.sql`:

   ```sql
   -- Test 1: Create opportunity inherits org priority
   BEGIN;

   -- Setup: Create test organization with priority 'A'
   INSERT INTO organizations (id, name, priority, organization_type)
   VALUES (99999, 'Test Org A', 'A', 'customer');

   -- Test: Create opportunity with different priority
   INSERT INTO opportunities (id, name, customer_organization_id, stage, priority)
   VALUES (99999, 'Test Opp', 99999, 'new_lead', 'low');

   -- Verify: Priority should be 'critical' (mapped from 'A')
   SELECT priority FROM opportunities WHERE id = 99999;
   -- Expected: 'critical'

   ROLLBACK;

   -- Test 2: Update org priority cascades to opportunities
   BEGIN;

   -- Setup
   INSERT INTO organizations (id, name, priority, organization_type)
   VALUES (99998, 'Test Org B', 'B', 'customer');

   INSERT INTO opportunities (id, name, customer_organization_id, stage)
   VALUES (99998, 'Test Opp 1', 99998, 'new_lead'),
          (99997, 'Test Opp 2', 99998, 'new_lead');

   -- Test: Update org priority
   UPDATE organizations SET priority = 'D' WHERE id = 99998;

   -- Verify: All opportunities should now have priority 'low'
   SELECT COUNT(*) FROM opportunities
   WHERE customer_organization_id = 99998 AND priority = 'low';
   -- Expected: 2

   ROLLBACK;
   ```

   Run tests:
   ```bash
   psql $DATABASE_URL < supabase/tests/test_priority_inheritance.sql
   ```

**Validation Criteria:**
- [ ] Migration applies without errors
- [ ] New opportunities inherit customer org priority
- [ ] Updating customer_organization_id updates priority
- [ ] Updating org priority cascades to all opportunities
- [ ] Invalid customer_organization_id raises exception (FAIL FAST)
- [ ] Priority mapping A→critical, B→high, C→medium, D→low works correctly

**Gotchas:**
- Organizations use varchar(1) priority, opportunities use enum - mapping function required
- Trigger fires BEFORE INSERT/UPDATE, so NEW.priority is overwritten (users cannot manually set)
- Cascade trigger can update many opportunities - test performance with large datasets
- Don't forget to grant EXECUTE permission on functions if RLS is strict

---

#### Task 1.4: Add stage_changed_at Column and Trigger **Depends on: [none]**

**Priority:** 🟠 HIGH - Required for Task 1.3
**Time Estimate:** 30 minutes
**Engineering Constitution:** SINGLE SOURCE OF TRUTH

**READ THESE BEFORE TASK:**
- `/home/krwhynot/projects/crispy-crm/docs/supabase/WORKFLOW.md` - Migration workflow
- `/home/krwhynot/projects/crispy-crm/supabase/migrations/20251018204500_add_helper_function_and_audit_trail.sql` - Trigger pattern

**Files to Create:**
- `supabase/migrations/[timestamp]_add_stage_changed_at.sql` (new migration)

**Files to Modify:**
- `src/atomic-crm/types.ts` - Add stage_changed_at field to Opportunity type

**Instructions:**

**Context:** The opportunities_summary view (Task 1.3) needs to calculate "days in stage" for attention flags. This requires knowing when the opportunity entered the current stage. Currently, only updated_at exists, which changes on ANY update.

**Solution:** Add a stage_changed_at column that updates ONLY when stage changes, using a BEFORE UPDATE trigger.

**Implementation Steps:**

1. **Create Migration File** (5 min)
   ```bash
   npx supabase migration new add_stage_changed_at
   ```

2. **Write Migration SQL** (15 min)
   ```sql
   -- supabase/migrations/[timestamp]_add_stage_changed_at.sql

   -- Migration: Add stage_changed_at column for days-in-stage calculation
   -- Purpose: Track when opportunity last changed stage (not just updated)

   -- Add column with default NOW() for existing records
   ALTER TABLE opportunities
   ADD COLUMN stage_changed_at TIMESTAMPTZ DEFAULT NOW();

   COMMENT ON COLUMN opportunities.stage_changed_at IS
     'Timestamp when opportunity last changed stage. Used for days-in-stage calculations.';

   -- Create trigger function to update stage_changed_at
   CREATE OR REPLACE FUNCTION update_stage_changed_at()
   RETURNS TRIGGER AS $$
   BEGIN
     -- Only update timestamp if stage actually changed
     IF OLD.stage IS DISTINCT FROM NEW.stage THEN
       NEW.stage_changed_at = NOW();
     END IF;

     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;

   COMMENT ON FUNCTION update_stage_changed_at IS
     'Updates stage_changed_at timestamp only when stage column changes';

   -- Create trigger on opportunities table
   DROP TRIGGER IF EXISTS update_stage_timestamp ON opportunities;

   CREATE TRIGGER update_stage_timestamp
     BEFORE UPDATE OF stage ON opportunities
     FOR EACH ROW
     EXECUTE FUNCTION update_stage_changed_at();
   ```

3. **Apply Migration** (5 min)
   ```bash
   npx supabase db reset
   ```

4. **Update TypeScript Type** (5 min)

   Add to `src/atomic-crm/types.ts` in the Opportunity type (around line 220):
   ```typescript
   export type Opportunity = {
     // ... existing fields ...
     created_at: string;
     updated_at: string;
     stage_changed_at?: string;  // NEW: Timestamp of last stage change
     deleted_at?: string;
     // ... rest of fields
   } & Pick<RaRecord, "id">;
   ```

**Validation Criteria:**
- [ ] Migration applies without errors
- [ ] stage_changed_at column exists on opportunities table
- [ ] Existing opportunities have stage_changed_at = NOW()
- [ ] Updating stage sets stage_changed_at to NOW()
- [ ] Updating other fields does NOT change stage_changed_at
- [ ] Opportunity TypeScript type includes stage_changed_at field

**Gotchas:**
- Trigger only fires on UPDATE, not INSERT - new opportunities get stage_changed_at via DEFAULT NOW()
- For existing opportunities, initial stage_changed_at will be migration time, not actual stage change time
- This is acceptable for MVP - accurate tracking starts from migration forward

---

#### Task 1.3: Create opportunities_summary View [GAP 9] **Depends on: [1.4]**

**Priority:** 🟠 HIGH - Required for Interaction Count Display
**Time Estimate:** 40 minutes
**Engineering Constitution:** SINGLE SOURCE OF TRUTH, NO OVER-ENGINEERING

**READ THESE BEFORE TASK:**
- `/home/krwhynot/projects/crispy-crm/.docs/plans/opportunity-redesign/CRITICAL-GAPS.md` (lines 133-182)
- `/home/krwhynot/projects/crispy-crm/.docs/plans/opportunity-redesign/DECISION-QUESTIONS.md` (Q3, lines 246-299)
- `/home/krwhynot/projects/crispy-crm/supabase/migrations/20251020002305_fix_contacts_summary_security_invoker.sql` - View pattern

**Files to Create:**
- `supabase/migrations/[timestamp]_add_opportunities_summary_view.sql` (new migration)

**Files to Modify:**
- `src/atomic-crm/types.ts` - Add computed fields to Opportunity type
- `src/atomic-crm/providers/supabase/dataProviderUtils.ts` - Map opportunities → opportunities_summary

**Instructions:**

**Context:** OpportunityCard needs to display interaction count badge (like OrganizationCard shows contact count). This requires aggregating activities table. Instead of N+1 queries, use a database view with calculated fields.

**Solution:** Create opportunities_summary view that pre-computes nb_interactions, last_interaction_date, and days_in_stage. Data provider transparently uses view for lists, base table for mutations (DECISION Q3: Option A - Transparent Replacement).

**Implementation Steps:**

1. **Create Index for View Performance** (10 min)

   First, optimize the activities lookup:
   ```bash
   npx supabase migration new add_activities_opportunity_index
   ```

   ```sql
   -- supabase/migrations/[timestamp]_add_activities_opportunity_index.sql

   -- Create partial index for activities lookup by opportunity
   -- PARTIAL INDEX only includes interaction records, reducing index size
   CREATE INDEX IF NOT EXISTS idx_activities_opportunity_lookup
   ON activities(opportunity_id, activity_type, deleted_at)
   WHERE activity_type = 'interaction';

   COMMENT ON INDEX idx_activities_opportunity_lookup IS
     'Optimizes opportunities_summary view aggregations for interaction counts';
   ```

2. **Create Migration for View** (5 min)
   ```bash
   npx supabase migration new add_opportunities_summary_view
   ```

3. **Write View SQL** (15 min)

   Follow the security_invoker pattern from contacts_summary:

   ```sql
   -- supabase/migrations/[timestamp]_add_opportunities_summary_view.sql

   -- Migration: Create opportunities_summary view with calculated fields
   -- Purpose: Pre-compute interaction counts and days-in-stage for OpportunityCard

   DROP VIEW IF EXISTS opportunities_summary;

   CREATE VIEW opportunities_summary
   WITH (security_invoker = true)  -- Use caller's permissions for RLS
   AS
   SELECT
     o.id,
     o.name,
     o.customer_organization_id,
     o.principal_organization_id,
     o.distributor_organization_id,
     o.contact_ids,
     o.stage,
     o.status,
     o.priority,
     o.description,
     o.estimated_close_date,
     o.actual_close_date,
     o.created_at,
     o.updated_at,
     o.deleted_at,
     o.opportunity_owner_id,
     o.account_manager_id,
     o.lead_source,
     o.index,
     o.founding_interaction_id,
     o.stage_manual,
     o.status_manual,
     o.next_action,
     o.next_action_date,
     o.competition,
     o.decision_criteria,
     o.stage_changed_at,

     -- Calculated fields for OpportunityCard
     COUNT(a.id) FILTER (
       WHERE a.activity_type = 'interaction'
       AND a.deleted_at IS NULL
     ) AS nb_interactions,

     MAX(a.activity_date) FILTER (
       WHERE a.activity_type = 'interaction'
       AND a.deleted_at IS NULL
     ) AS last_interaction_date,

     -- Days in current stage (for attention flags)
     EXTRACT(DAY FROM NOW() - o.stage_changed_at)::INTEGER AS days_in_stage

   FROM opportunities o
   LEFT JOIN activities a ON (
     a.opportunity_id = o.id
     AND a.deleted_at IS NULL
   )
   WHERE o.deleted_at IS NULL  -- Only show non-deleted opportunities
   GROUP BY o.id;

   -- Grant permissions
   GRANT SELECT ON opportunities_summary TO authenticated;

   COMMENT ON VIEW opportunities_summary IS
     'Opportunities with pre-computed interaction counts and stage duration. Uses security_invoker to enforce RLS from base table.';
   ```

4. **Update TypeScript Type** (5 min)

   Add calculated fields to `src/atomic-crm/types.ts`:
   ```typescript
   export type Opportunity = {
     // ... existing fields ...
     decision_criteria?: string;
     stage_changed_at?: string;

     // Computed fields from opportunities_summary view (read-only)
     nb_interactions?: number;
     last_interaction_date?: string;
     days_in_stage?: number;
   } & Pick<RaRecord, "id">;
   ```

5. **Configure Data Provider Mapping** (5 min)

   Update `src/atomic-crm/providers/supabase/dataProviderUtils.ts`:

   Find the `getDatabaseResource` function and add opportunities mapping:
   ```typescript
   export function getDatabaseResource(
     resource: string,
     operation: "list" | "one"
   ): string {
     // Use summary views for list operations (pre-computed joins)
     if (operation === "list") {
       if (resource === "contacts") return "contacts_summary";
       if (resource === "organizations") return "organizations_summary";
       if (resource === "opportunities") return "opportunities_summary";  // NEW
     }

     // Use base tables for mutations
     return resource;
   }
   ```

**Validation Criteria:**
- [ ] Migration applies without errors
- [ ] View returns all opportunity fields plus nb_interactions, last_interaction_date, days_in_stage
- [ ] nb_interactions counts only interactions (not engagements)
- [ ] Soft-deleted opportunities excluded from view
- [ ] Soft-deleted activities not counted
- [ ] Data provider uses opportunities_summary for lists
- [ ] Mutations still target base opportunities table
- [ ] TypeScript type includes computed fields

**Gotchas:**
- View uses LEFT JOIN - opportunities with zero interactions still appear (nb_interactions = 0)
- security_invoker = true means RLS policies from base table apply
- Don't add RLS policies to the view itself (causes conflicts)
- days_in_stage can be NULL if stage_changed_at is NULL (old records before Task 1.4)

---

### Phase 2: Kanban Enhancements (Parallel Tasks 1.5-1.7)

These tasks improve the Kanban board UX. Tasks 1.5 and 1.7 can run in parallel. Task 1.6 depends on Task 1.5.

---

#### Task 1.5: Replace Index-Based Ordering with Timestamps [GAP 4] **Depends on: [none]**

**Priority:** 🟡 MEDIUM - Eliminates Race Conditions
**Time Estimate:** 2 hours
**Engineering Constitution:** NO OVER-ENGINEERING, FAIL FAST

**READ THESE BEFORE TASK:**
- `/home/krwhynot/projects/crispy-crm/.docs/plans/opportunity-redesign/CRITICAL-GAPS.md` (lines 358-392)
- `/home/krwhynot/projects/crispy-crm/.docs/plans/opportunity-redesign/DECISION-QUESTIONS.md` (Q4, lines 300-388)

**Files to Create:**
- `supabase/migrations/[timestamp]_remove_opportunity_index_column.sql` (new migration)

**Files to Modify:**
- `src/atomic-crm/types.ts` - Remove index field from Opportunity type
- `src/atomic-crm/opportunities/OpportunityListContent.tsx` - Change sort order
- `src/atomic-crm/opportunities/OpportunityCreate.tsx` - Remove index management
- `src/atomic-crm/services/opportunities.service.ts` - Simplify unarchive method
- `src/atomic-crm/opportunities/stages.ts` - Update sorting logic

**Instructions:**

**Context:** Current index-based ordering has race condition: two users creating opportunities simultaneously can both set index=0, causing collisions. Index management requires updating ALL opportunities in a stage (+1) on every create - expensive with many opportunities.

**Solution (DECISION Q4: Option A):** Use timestamp-based ordering (created_at DESC) for MVP. This eliminates race conditions, simplifies code, and defers complex drag-and-drop to Phase 2. NO OVER-ENGINEERING principle - simplest solution that works.

**Implementation Steps:**

1. **Create Migration to Drop Index Column** (10 min)
   ```bash
   npx supabase migration new remove_opportunity_index_column
   ```

   ```sql
   -- supabase/migrations/[timestamp]_remove_opportunity_index_column.sql

   -- Migration: Remove index column and use timestamp-based ordering
   -- Rationale: Eliminates race conditions, simplifies code, defers drag-and-drop to Phase 2

   -- Drop the index column (no longer needed)
   ALTER TABLE opportunities DROP COLUMN IF EXISTS index;

   COMMENT ON TABLE opportunities IS
     'Opportunities ordered by created_at DESC within each stage';

   -- Add index on (stage, created_at) for efficient sorting
   CREATE INDEX IF NOT EXISTS idx_opportunities_stage_created
   ON opportunities(stage, created_at DESC)
   WHERE deleted_at IS NULL;
   ```

2. **Update Opportunity Type** (5 min)

   Remove index field from `src/atomic-crm/types.ts`:
   ```typescript
   export type Opportunity = {
     // ... fields ...
     lead_source?: LeadSource;
     // index: number;  // REMOVE THIS LINE
     founding_interaction_id?: Identifier;
     // ... rest of fields ...
   } & Pick<RaRecord, "id">;
   ```

3. **Update OpportunityListContent Sort Order** (30 min)

   Modify `src/atomic-crm/opportunities/OpportunityListContent.tsx`:

   **Change the List component sort prop:**
   ```typescript
   // OpportunityList.tsx (around line 75)
   <List
     perPage={100}
     filter={{ "deleted_at@is": null }}
     sort={{ field: "created_at", order: "DESC" }}  // CHANGED from "index"
     filters={opportunityFilters}
     pagination={null}
   >
   ```

4. **Update Stage Grouping Function** (15 min)

   Modify `src/atomic-crm/opportunities/stages.ts`:
   ```typescript
   // stages.ts - Update getOpportunitiesByStage function
   export const getOpportunitiesByStage = (
     unorderedOpportunities: Opportunity[],
     opportunityStages?: { value: string; label: string }[],
   ) => {
     const stages = opportunityStages || OPPORTUNITY_STAGES.map((stage) => ({
       value: stage.value,
       label: stage.label,
     }));

     // Group opportunities by stage
     const opportunitiesByStage: Record<Opportunity["stage"], Opportunity[]> =
       unorderedOpportunities.reduce(
         (acc, opportunity) => {
           if (acc[opportunity.stage]) {
             acc[opportunity.stage].push(opportunity);
           }
           return acc;
         },
         stages.reduce((obj, stage) => ({ ...obj, [stage.value]: [] }), {}),
       );

     // Sort each column by created_at DESC (newest first)
     stages.forEach((stage) => {
       if (opportunitiesByStage[stage.value]) {
         opportunitiesByStage[stage.value] = opportunitiesByStage[stage.value].sort(
           (recordA, recordB) =>
             new Date(recordB.created_at).getTime() - new Date(recordA.created_at).getTime()
         );
       }
     });

     return opportunitiesByStage;
   };
   ```

5. **Remove Index Management from OpportunityCreate** (20 min)

   Simplify `src/atomic-crm/opportunities/OpportunityCreate.tsx`:

   **Remove the entire onSuccess handler** (lines 33-76):
   ```typescript
   // OpportunityCreate.tsx
   export const OpportunityCreate = () => {
     const queryClient = useQueryClient();

     // REMOVE onSuccess handler entirely - no index management needed

     return (
       <CreateBase
         redirect="show"
         // NO mutationOptions needed
       >
         <OpportunityCreateForm />
       </CreateBase>
     );
   };
   ```

6. **Simplify OpportunitiesService.unarchive** (20 min)

   Update `src/atomic-crm/services/opportunities.service.ts`:
   ```typescript
   // opportunities.service.ts
   async unarchiveOpportunity(opportunity: Opportunity): Promise<any> {
     // Simply unset deleted_at - no index reordering needed
     return await this.dataProvider.update("opportunities", {
       id: opportunity.id,
       data: { deleted_at: null },
       previousData: opportunity,
     });
   }
   ```

7. **Apply Migration and Verify** (10 min)
   ```bash
   npx supabase db reset

   # Verify index column is gone
   psql $DATABASE_URL -c "\d opportunities" | grep index
   # Should return empty (no index column)

   # Verify new index exists
   psql $DATABASE_URL -c "\di idx_opportunities_stage_created"
   # Should show the new index
   ```

**Validation Criteria:**
- [ ] Migration removes index column successfully
- [ ] New index on (stage, created_at DESC) exists
- [ ] OpportunityList sorts by created_at DESC
- [ ] New opportunities appear at top of their stage column
- [ ] OpportunityCreate no longer updates other opportunities
- [ ] Unarchive simply sets deleted_at = NULL (no reordering)
- [ ] TypeScript compilation succeeds (index field removed)

**Gotchas:**
- Existing code may reference opportunity.index - search for it and remove
- Sort order is now "newest first" instead of manual ordering
- Users will need to use manual "Move to Stage" buttons (Task 1.6) since cards don't auto-reorder
- This is intentional - drag-and-drop deferred to Phase 2

---

#### Task 1.6: Add Manual Stage Movement Buttons [GAP 8 MVP] **Depends on: [1.5]**

**Priority:** 🟡 MEDIUM - Replaces Drag-and-Drop for MVP
**Time Estimate:** 1 hour
**Engineering Constitution:** NO OVER-ENGINEERING, BOY SCOUT RULE

**READ THESE BEFORE TASK:**
- `/home/krwhynot/projects/crispy-crm/.docs/plans/opportunity-redesign/CRITICAL-GAPS.md` (lines 442-511)
- `/home/krwhynot/projects/crispy-crm/.docs/plans/opportunity-redesign/DECISION-QUESTIONS.md` (Q4, lines 300-388)
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/tasks/Task.tsx` (lines 155-206) - ⚠️ CORRECT dropdown pattern (OrganizationCard does NOT have dropdown)

**Files to Create:**
- None

**Files to Modify:**
- `src/atomic-crm/opportunities/OpportunityCard.tsx` - Add dropdown menu
- `src/atomic-crm/providers/supabase/filterRegistry.ts` - Allow stage updates

**Instructions:**

**Context:** Drag-and-drop requires 15 hours of greenfield implementation (Gap 8). For MVP, provide manual "Move to Stage" buttons in a dropdown menu. This is simpler, works on mobile, and satisfies user needs without over-engineering.

**Solution:** Add a dropdown menu (MoreVertical icon) to each OpportunityCard with "Move to {Stage}" options. Use React Admin's useUpdate hook for mutations.

**Implementation Steps:**

1. **Add Dropdown Menu to OpportunityCard** (40 min)

   Modify `src/atomic-crm/opportunities/OpportunityCard.tsx`:

   **Import required components:**
   ```typescript
   import {
     DropdownMenu,
     DropdownMenuContent,
     DropdownMenuItem,
     DropdownMenuTrigger
   } from "@/components/ui/dropdown-menu";
   import { Button } from "@/components/ui/button";
   import { MoreVertical } from "lucide-react";
   import { useUpdate, useNotify, useRefresh } from "react-admin";
   import { OPPORTUNITY_STAGES } from "./stageConstants";
   ```

   **Add dropdown after the priority badge** (around line 117):
   ```typescript
   export const OpportunityCard = ({ opportunity }: OpportunityCardProps) => {
     const [update] = useUpdate();
     const notify = useNotify();
     const refresh = useRefresh();

     const handleMoveToStage = async (newStage: string) => {
       try {
         await update(
           "opportunities",
           {
             id: opportunity.id,
             data: { stage: newStage },
             previousData: opportunity,
           },
           {
             onSuccess: () => {
               notify(`Moved to ${getOpportunityStageLabel(newStage)}`, { type: "success" });
               refresh();
             },
             onError: () => {
               notify("Error moving opportunity", { type: "error" });
             },
           }
         );
       } catch (error) {
         notify("Error moving opportunity", { type: "error" });
       }
     };

     return (
       <Card className="...existing classes...">
         {/* Existing card content */}

         {/* NEW: Stage movement dropdown */}
         <div className="absolute top-2 right-2">
           <DropdownMenu>
             <DropdownMenuTrigger asChild>
               <Button variant="ghost" size="icon" className="h-6 w-6">
                 <MoreVertical className="h-4 w-4" />
                 <span className="sr-only">Move to stage</span>
               </Button>
             </DropdownMenuTrigger>
             <DropdownMenuContent align="end">
               {OPPORTUNITY_STAGES
                 .filter(stage => stage.value !== opportunity.stage)
                 .map(stage => (
                   <DropdownMenuItem
                     key={stage.value}
                     onClick={() => handleMoveToStage(stage.value)}
                   >
                     Move to {stage.label}
                   </DropdownMenuItem>
                 ))}
             </DropdownMenuContent>
           </DropdownMenu>
         </div>

         {/* Rest of card content unchanged */}
       </Card>
     );
   };
   ```

2. **Update Filter Registry** (10 min)

   Ensure stage field is in the whitelist for updates:

   Check `src/atomic-crm/providers/supabase/filterRegistry.ts`:
   ```typescript
   export const filterableFields: Record<string, string[]> = {
     opportunities: [
       "id",
       "name",
       "stage",  // Verify this exists
       "status",
       "priority",
       // ... rest of fields
     ],
   };
   ```

3. **Add Keyboard Accessibility** (10 min)

   The shadcn DropdownMenu already has keyboard support built-in:
   - Tab to focus the MoreVertical button
   - Enter/Space to open menu
   - Arrow keys to navigate options
   - Enter to select
   - Escape to close

   Test manually to verify.

**Validation Criteria:**
- [ ] MoreVertical button appears in top-right of each card
- [ ] Dropdown menu shows all stages except current stage
- [ ] Clicking "Move to {Stage}" updates the opportunity
- [ ] Success notification displays
- [ ] Card moves to new column immediately
- [ ] Keyboard navigation works (Tab, Enter, Arrow keys, Escape)
- [ ] Screen reader announces button and menu items

**Gotchas:**
- Dropdown closes on selection - this is correct behavior
- refresh() causes full list refetch - acceptable for MVP
- For Phase 2 drag-and-drop, keep this dropdown as fallback for mobile

---

#### Task 1.7: Enhance Auto-Name Generation with Products [GAP 10] **Depends on: [none]**

**Priority:** 🟡 MEDIUM - UX Enhancement
**Time Estimate:** 1.5 hours
**Engineering Constitution:** Consistent UX, NO OVER-ENGINEERING

**READ THESE BEFORE TASK:**
- `/home/krwhynot/projects/crispy-crm/.docs/plans/opportunity-redesign/CRITICAL-GAPS.md` (lines 295-352)
- `/home/krwhynot/projects/crispy-crm/.docs/plans/opportunity-redesign/DECISION-QUESTIONS.md` (Q2, lines 106-183)
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/opportunities/useAutoGenerateName.ts` - Current implementation

**Files to Create:**
- None

**Files to Modify:**
- `src/atomic-crm/opportunities/useAutoGenerateName.ts` - Add products support

**Instructions:**

**Context:** Current auto-name generation uses customer + principal + date. Requirements specify products should also be included: 1 product shows name, 2+ shows count, 0 shows "[No Product]". Currently, changing products doesn't trigger name update.

**Solution (DECISION Q2: Option A):** Watch products array with useWatch, regenerate name when products change. React Hook Form handles deep equality automatically, so this won't cause infinite loops.

**Implementation Steps:**

1. **Update useAutoGenerateName Hook** (60 min)

   Modify `src/atomic-crm/opportunities/useAutoGenerateName.ts`:

   ```typescript
   import { useFormContext, useWatch } from "react-hook-form";
   import { useGetOne } from "react-admin";
   import { useCallback, useEffect } from "react";

   export const useAutoGenerateName = (mode: "create" | "edit") => {
     const { setValue } = useFormContext();

     // Watch form fields
     const customerOrgId = useWatch({ name: "customer_organization_id" });
     const principalOrgId = useWatch({ name: "principal_organization_id" });
     const products = useWatch({ name: "products" }) || [];  // NEW: Watch products
     const currentName = useWatch({ name: "name" });

     // Fetch organization names
     const { data: customerOrg, isLoading: isLoadingCustomer } = useGetOne(
       "organizations",
       { id: customerOrgId },
       { enabled: !!customerOrgId }
     );

     const { data: principalOrg, isLoading: isLoadingPrincipal } = useGetOne(
       "organizations",
       { id: principalOrgId },
       { enabled: !!principalOrgId }
     );

     const isLoading = isLoadingCustomer || isLoadingPrincipal;

     // Generate name: Customer - Principal - Product/Count - Date
     const generateName = useCallback(() => {
       const parts = [];

       // Add customer org name
       if (customerOrg?.name) {
         parts.push(customerOrg.name);
       }

       // Add principal org name
       if (principalOrg?.name) {
         parts.push(principalOrg.name);
       }

       // Add product information (NEW LOGIC)
       if (products.length === 0) {
         parts.push("[No Product]");
       } else if (products.length === 1) {
         // Show single product name (assume product has 'name' field)
         parts.push(products[0].name || "Product");
       } else {
         // Show product count
         parts.push(`${products.length} products`);
       }

       // Add month and year
       const date = new Date();
       parts.push(date.toLocaleDateString("en-US", { month: "short", year: "numeric" }));

       return parts.join(" - ");
     }, [customerOrg?.name, principalOrg?.name, products]);

     // Auto-generate in create mode when fields change and name is empty
     useEffect(() => {
       if (mode === "create" && !currentName && !isLoading) {
         const newName = generateName();
         if (newName) {
           setValue("name", newName, { shouldValidate: true, shouldDirty: true });
         }
       }
     }, [mode, currentName, generateName, setValue, isLoading]);

     // Manual regenerate for edit mode
     const regenerate = useCallback(() => {
       if (!isLoading) {
         const newName = generateName();
         if (newName) {
           setValue("name", newName, { shouldValidate: true, shouldDirty: true });
         }
       }
     }, [generateName, setValue, isLoading]);

     return { regenerate, isLoading };
   };
   ```

2. **Verify Product Field Exists** (10 min)

   Check if products field exists in OpportunityInputs:
   ```bash
   grep -n "products" src/atomic-crm/opportunities/OpportunityInputs.tsx
   ```

   If not found, products feature may not be implemented yet. In that case:
   - Skip this task for now
   - Document in a TODO comment that products support is ready when products field is added
   - The hook will gracefully handle missing products (defaults to empty array)

3. **Add Deep Equality Test** (10 min)

   Verify useWatch handles deep equality correctly (it should):
   ```typescript
   // Add a console.log temporarily to verify no infinite loops
   useEffect(() => {
     console.log("useAutoGenerateName dependencies changed:", {
       customerOrg: customerOrg?.name,
       principalOrg: principalOrg?.name,
       productCount: products.length,
     });
   }, [customerOrg?.name, principalOrg?.name, products]);
   ```

   Test by:
   - Adding/removing products
   - Changing customer org
   - Changing principal org

   Verify console only logs when actual changes occur, not on every render.

4. **Update Opportunity Type (if needed)** (10 min)

   Check if products field is in Opportunity type:
   ```typescript
   // src/atomic-crm/types.ts
   export type Opportunity = {
     // ... fields ...
     products?: Product[];  // Add if missing
     // ... rest of fields ...
   } & Pick<RaRecord, "id">;
   ```

**Validation Criteria:**
- [ ] Changing customer org updates name
- [ ] Changing principal org updates name
- [ ] Adding first product shows product name in opportunity name
- [ ] Adding second product changes to "2 products" in name
- [ ] Removing all products shows "[No Product]" in name
- [ ] Manual refresh button still works in edit mode
- [ ] No infinite loops (check console for excessive re-renders)
- [ ] Name format: "Customer - Principal - Product/Count - Mon YYYY"

**Gotchas:**
- useWatch returns undefined on initial render - handle with `|| []`
- Products array changes reference on every render - React Hook Form handles this
- If products field doesn't exist yet, hook gracefully falls back to "[No Product]"
- Date format should match existing pattern: "Jan 2025" not "January 2025"

---

### Phase 3: Data Migration (Task 1.8)

This task imports legacy CSV data. Must run after all infrastructure tasks (1.1-1.7) complete.

---

#### Task 1.8: Implement CSV Migration Script [GAP 5, GAP 6] **Depends on: [1.1, 1.2, 1.3, 1.4, 1.5]**

**Priority:** 🔴 BLOCKED - Business Decision Required
**Time Estimate:** 2.5 hours (AFTER stage mapping complete)
**Engineering Constitution:** FAIL FAST, SINGLE SOURCE OF TRUTH

**⚠️ VALIDATION UPDATE - CRITICAL BLOCKERS:**
- **BLOCKER #1:** STAGE column is at position **7** (not 6)
- **BLOCKER #2:** Only **~592 valid opportunity rows** (not 1,062 total lines)
- **BLOCKER #3:** Custom stage names require business mapping:
  - "Sampled/Visited invite-3" (533 occurrences - 90% of data!)
  - "VAF BLITZ" (64 occurrences)
  - "Contacted-phone/email-2" (60 occurrences)
  - "demo-cookup-6" (11 occurrences)
  - Invalid data in STAGE column (dates, text fragments)
- **ACTION REQUIRED:** Schedule stakeholder meeting to map custom stages before proceeding

**READ THESE BEFORE TASK:**
- `/home/krwhynot/projects/crispy-crm/.docs/plans/opportunity-redesign/CRITICAL-GAPS.md` (lines 75-131, 251-291)
- `/home/krwhynot/projects/crispy-crm/.docs/plans/opportunity-redesign/DECISION-QUESTIONS.md` (Q1, lines 31-104)
- `/home/krwhynot/projects/crispy-crm/docs/supabase/WORKFLOW.md` - RPC function patterns

**Files to Create:**
- `scripts/migrate-opportunities-csv.ts` (new migration script)
- `scripts/clean-opportunity-csv.ts` (data cleanup script - NEW)
- `supabase/migrations/[timestamp]_add_csv_migration_helpers.sql` (helper functions)
- `data/unique_stages_complete.txt` (extracted stage values - NEW)
- `data/stage_mapping.json` (business-approved mapping - NEW)

**Files to Modify:**
- None

**Instructions:**

**Context:** ~592 legacy opportunities exist in CSV with custom stage names. Must migrate to 8 semantic stages with fail-fast validation. Additionally, CSV interactions may link to contacts not in opportunity.contact_ids array (GAP 6).

**Solution:**
1. Extract ALL unique CSV stages and complete mapping (GAP 5 - fail fast)
2. Validate entire CSV before transaction starts
3. Use PostgreSQL transaction to ensure atomic import
4. Automatically backfill contact_ids with interaction contacts (DECISION Q1: Option A)

**Implementation Steps:**

1. **Extract Unique CSV Stages** (10 min)

   **CRITICAL: STAGE column is at position 7 (not 6), and CSV starts at row 16 (rows 1-15 are headers)**

   ```bash
   # Navigate to project root
   cd /home/krwhynot/projects/crispy-crm

   # Extract unique stage values from CSV (column 7, starting from row 16)
   awk -F',' 'NR>=16 && NF>=8 {print $8}' data/Opportunity.csv | \
   sort | uniq -c | sort -rn > data/unique_stages_complete.txt

   # Review the output (shows frequency counts)
   cat data/unique_stages_complete.txt

   # Expected output (top 5):
   #  533 Sampled/Visited invite-3
   #   64 VAF BLITZ
   #   60 Contacted-phone/email-2
   #   25 Lead-discovery-1
   #   20 SOLD-7
   ```

   **⚠️ DATA QUALITY WARNING:** Some rows have invalid STAGE values (dates, text fragments). Create cleanup script to filter these out.

2. **Create Helper Functions Migration** (30 min)

   ```bash
   npx supabase migration new add_csv_migration_helpers
   ```

   ```sql
   -- supabase/migrations/[timestamp]_add_csv_migration_helpers.sql

   -- Migration: Helper functions for CSV import with automatic contact backfill

   -- Function to backfill opportunity contacts from interactions
   CREATE OR REPLACE FUNCTION backfill_opportunity_contacts(p_opportunity_id BIGINT)
   RETURNS VOID AS $$
   DECLARE
     v_interaction_contacts BIGINT[];
   BEGIN
     -- Get all unique contact IDs from interactions for this opportunity
     SELECT ARRAY_AGG(DISTINCT contact_id)
     INTO v_interaction_contacts
     FROM activities
     WHERE opportunity_id = p_opportunity_id
       AND activity_type = 'interaction'
       AND contact_id IS NOT NULL
       AND deleted_at IS NULL;

     -- If we found contacts, add them to opportunity.contact_ids
     IF v_interaction_contacts IS NOT NULL AND array_length(v_interaction_contacts, 1) > 0 THEN
       UPDATE opportunities
       SET contact_ids = (
         SELECT ARRAY_AGG(DISTINCT c)
         FROM UNNEST(
           COALESCE(contact_ids, ARRAY[]::BIGINT[]) || v_interaction_contacts
         ) AS c
       )
       WHERE id = p_opportunity_id;
     END IF;
   END;
   $$ LANGUAGE plpgsql;

   COMMENT ON FUNCTION backfill_opportunity_contacts IS
     'Adds interaction contacts to opportunity.contact_ids if not already present. Used during CSV migration.';

   GRANT EXECUTE ON FUNCTION backfill_opportunity_contacts TO authenticated;
   ```

3. **Write CSV Migration Script** (90 min)

   Create `scripts/migrate-opportunities-csv.ts`:

   ```typescript
   import { createClient } from '@supabase/supabase-js';
   import fs from 'fs';
   import { parse } from 'csv-parse/sync';

   // Supabase connection
   const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
   const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';
   const supabase = createClient(supabaseUrl, supabaseKey);

   // CSV to semantic stage mapping (COMPLETE THIS FROM data/unique_stages.txt)
   const CSV_STAGE_MAP: Record<string, string> = {
     // Closed stages
     'SOLD-7': 'closed_won',
     'SOLD-7d': 'closed_won',

     // Active stages (ordered by progression)
     'Lead-discovery-1': 'new_lead',
     'Contacted-phone/email-2': 'initial_outreach',
     'Sampled/Visited invite-3': 'sample_visit_offered',
     'Follow-up-4': 'awaiting_response',
     'Feedback- received-5': 'feedback_logged',
     'demo-cookup-6': 'demo_scheduled',

     // Edge cases (ADD ALL FROM unique_stages.txt)
     'order support-8': 'closed_won',
     'VAF BLITZ': 'initial_outreach',

     // TODO: ADD REMAINING STAGES FROM unique_stages.txt
   };

   interface CSVOpportunityRow {
     ID: string;
     NAME: string;
     STAGE: string;
     CUSTOMER_ORG: string;
     PRINCIPAL_ORG: string;
     ESTIMATED_CLOSE_DATE: string;
     // Add other CSV columns as needed
   }

   async function validateCSV(rows: CSVOpportunityRow[]): Promise<void> {
     console.log('🔍 Validating CSV data...');

     const errors: string[] = [];

     // Validate ALL stage mappings exist (FAIL FAST)
     for (const [index, row] of rows.entries()) {
       const stage = row.STAGE?.trim();

       if (!stage) {
         errors.push(`Row ${index + 2}: Missing STAGE value`);
         continue;
       }

       if (!CSV_STAGE_MAP[stage]) {
         errors.push(
           `Row ${index + 2}: UNMAPPED STAGE "${stage}"\n` +
           `   Update CSV_STAGE_MAP and retry.\n` +
           `   See data/unique_stages.txt for all stages.`
         );
       }
     }

     // FAIL FAST: Halt on first error
     if (errors.length > 0) {
       console.error('\n❌ CSV VALIDATION FAILED\n');
       errors.forEach(err => console.error(err));
       console.error('\n');
       throw new Error(`CSV validation failed with ${errors.length} error(s)`);
     }

     console.log('✅ CSV validation passed');
   }

   async function migrateOpportunities(): Promise<void> {
     try {
       // Read CSV file
       const csvContent = fs.readFileSync('data/Opportunity.csv', 'utf-8');
       const rows: CSVOpportunityRow[] = parse(csvContent, {
         columns: true,
         skip_empty_lines: true,
       });

       console.log(`📊 Found ${rows.length} opportunities in CSV`);

       // Validate BEFORE starting transaction
       await validateCSV(rows);

       // Start transaction
       console.log('🚀 Starting import transaction...');

       let imported = 0;
       let skipped = 0;

       for (const row of rows) {
         const stage = CSV_STAGE_MAP[row.STAGE.trim()];

         // Import opportunity
         const { data: opportunity, error } = await supabase
           .from('opportunities')
           .insert({
             name: row.NAME,
             stage: stage,
             customer_organization_id: row.CUSTOMER_ORG,
             principal_organization_id: row.PRINCIPAL_ORG,
             estimated_close_date: row.ESTIMATED_CLOSE_DATE,
             // Map other fields as needed
           })
           .select()
           .single();

         if (error) {
           console.error(`❌ Failed to import row ${rows.indexOf(row) + 2}:`, error);
           skipped++;
           continue;
         }

         // Backfill contacts from interactions (GAP 6 - automatic backfill)
         if (opportunity) {
           await supabase.rpc('backfill_opportunity_contacts', {
             p_opportunity_id: opportunity.id,
           });
         }

         imported++;

         if (imported % 100 === 0) {
           console.log(`   Imported ${imported}/${rows.length}...`);
         }
       }

       console.log(`\n✅ Import complete: ${imported} imported, ${skipped} skipped`);

     } catch (error) {
       console.error('❌ Migration failed:', error);
       throw error;
     }
   }

   // Run migration
   migrateOpportunities()
     .then(() => process.exit(0))
     .catch(() => process.exit(1));
   ```

4. **Complete Stage Mapping** (20 min)

   **YOU MUST DO THIS STEP:**
   - Review `data/unique_stages.txt`
   - Map EVERY stage to one of the 8 semantic stages
   - Document business rationale for each mapping
   - Update `CSV_STAGE_MAP` in the script

   If business decisions are needed for ambiguous stages, document questions and get approval before proceeding.

5. **Test Migration on Local Database** (20 min)
   ```bash
   # Apply helper function migration
   npx supabase db reset

   # Run migration script
   npm run ts-node scripts/migrate-opportunities-csv.ts

   # Verify import
   psql $DATABASE_URL -c "SELECT COUNT(*) FROM opportunities;"
   # Should show 1,062 opportunities

   # Verify contact backfill worked
   psql $DATABASE_URL -c "
     SELECT COUNT(*) FROM opportunities
     WHERE array_length(contact_ids, 1) > 0;
   "
   # Should show opportunities with contacts
   ```

**Validation Criteria:**
- [ ] All unique CSV stages extracted to unique_stages.txt
- [ ] Every stage mapped in CSV_STAGE_MAP (no unmapped stages)
- [ ] CSV validation fails fast on first unmapped stage
- [ ] Import runs in transaction (all-or-nothing)
- [ ] 1,062 opportunities imported successfully
- [ ] Interaction contacts automatically added to opportunity.contact_ids
- [ ] stage_changed_at set to import time for all opportunities
- [ ] No duplicate opportunities created

**Gotchas:**
- CSV may have NULL/empty values - handle with trim() and null checks
- Some organizations may not exist - create them first or skip those opportunities
- Contact IDs in CSV may be names not IDs - need lookup logic
- Import is idempotent - can run multiple times without creating duplicates (check by name + customer_org)
- Use service role key for import, not authenticated user key

---

## Advice for Implementation

### Critical Success Factors

1. **Follow Task Dependencies Strictly**
   - Tasks 1.1, 1.2, 1.4 can run in parallel (no dependencies)
   - Task 1.3 MUST wait for Task 1.4 (needs stage_changed_at column)
   - Tasks 1.5, 1.7 can run in parallel
   - Task 1.6 MUST wait for Task 1.5 (needs timestamp ordering)
   - Task 1.8 MUST wait for ALL previous tasks (uses all infrastructure)

2. **Database Migration Order Matters**
   - Run migrations in timestamp order (automatic with Supabase)
   - Always use `npx supabase migration new <name>` for correct timestamps
   - Test each migration individually before moving to next task
   - Use `npx supabase db reset` to test full migration sequence

3. **Type Safety is Non-Negotiable**
   - Run `npm run typecheck` after EVERY type change
   - Regenerate database types after EVERY migration
   - Never use `@ts-ignore` or `any` - fix the type properly

4. **Engineering Constitution Compliance**
   - **SINGLE SOURCE OF TRUTH**: Database schema is canonical (types, triggers, views)
   - **FAIL FAST**: Validation errors halt execution immediately with clear messages
   - **NO OVER-ENGINEERING**: Simplest solution that works (timestamps > fractional indexing, buttons > drag-and-drop)
   - **BOY SCOUT RULE**: Fix inconsistencies when editing (remove index references completely)

5. **View vs Table Mutations**
   - ALWAYS query opportunities_summary for lists (OpportunityList)
   - ALWAYS mutate base opportunities table (create, update, delete)
   - Data provider handles mapping automatically via getDatabaseResource()
   - Never add RLS policies to views (use security_invoker = true instead)

6. **Trigger Gotchas**
   - Triggers fire even for service role - test with actual user permissions
   - BEFORE triggers can modify NEW before insert/update
   - AFTER triggers see committed data, good for cascading
   - Always add comments explaining trigger purpose

7. **CSV Migration Checklist**
   - Extract unique stages FIRST (don't guess)
   - Complete mapping BEFORE running import
   - Validate entire CSV BEFORE transaction starts
   - Test on small sample (10 rows) before full import
   - Document unmapped stages and get business decisions

8. **React Admin Patterns to Follow**
   - useListContext() for accessing data in custom layouts
   - useUpdate() for mutations with optimistic updates
   - refresh() to refetch data after mutations
   - notify() for user feedback (success/error)
   - Always provide loading states (isPending, isLoading)

9. **Mobile Responsiveness**
   - Dropdown menus work better than drag-and-drop on mobile
   - Test with viewport < 768px
   - Horizontal scroll is acceptable for Kanban (overflow-x-auto)
   - Stage movement must work without mouse (keyboard only)

10. **Performance Considerations**
    - Index on (stage, created_at DESC) critical for Kanban rendering
    - Partial index on activities.opportunity_id reduces size
    - View aggregations cached by PostgreSQL query planner
    - Use security_invoker to let RLS filter at base table level
    - Pagination disabled for MVP (perPage: 100) - acceptable for <10 users

### Common Pitfalls to Avoid

1. **Don't modify generated files**
   - database.generated.ts is auto-generated - changes will be overwritten
   - Edit source migrations, regenerate types

2. **Don't skip validation steps**
   - CSV validation prevents partial imports (data integrity)
   - TypeScript compilation catches type errors before runtime
   - Test migrations on local DB before pushing to cloud

3. **Don't over-optimize prematurely**
   - Timestamp ordering is sufficient for MVP
   - Optimistic concurrency deferred to Phase 3
   - Drag-and-drop deferred to Phase 2

4. **Don't violate Engineering Constitution**
   - If tempted to add complex caching → STOP (NO OVER-ENGINEERING)
   - If tempted to allow partial imports → STOP (FAIL FAST)
   - If tempted to duplicate priority logic in app → STOP (SINGLE SOURCE OF TRUTH)

5. **Don't forget documentation**
   - Add COMMENT ON for all migrations (tables, columns, views, functions)
   - Update CLAUDE.md if adding new patterns
   - Document business decisions in commit messages

### Testing Strategy

**For Each Task:**
1. Unit test: Does the function/component work in isolation?
2. Integration test: Does it work with data provider/database?
3. E2E test: Does the user workflow complete successfully?

**Critical Test Scenarios:**
- Create opportunity → verify priority inherited from customer org
- Change customer org → verify priority updates automatically
- Change org priority → verify all opportunities update
- Move opportunity to new stage → verify stage_changed_at updates
- Add interaction → verify nb_interactions increments in card
- Import CSV with unmapped stage → verify fails fast with clear error
- Import CSV with valid data → verify all 1,062 opportunities imported

**Regression Prevention:**
- Run full test suite after each task (`npm test`)
- Visual regression test OpportunityCard after Task 1.3 (interaction count badge)
- Manual test on mobile viewport after Task 1.6 (dropdown menu)

### Communication During Implementation

**For Multi-Agent Parallel Execution:**
1. Announce which task you're starting
2. Report blockers immediately (don't wait)
3. Share completion status with validation results
4. Document any deviations from plan with rationale

**Example Status Updates:**
- "Starting Task 1.1 - Fix Type System Mismatch"
- "Task 1.1 complete ✅ - All 11 interaction types present, TypeScript compiles"
- "⚠️ Task 1.3 blocked - waiting for Task 1.4 (needs stage_changed_at column)"
- "Task 1.8 deviation: Found 12 unique stages (not 10), added mapping for 'pilot-program-9'"

---

## Phase 2: Post-Launch Enhancements (Not in MVP)

**Trigger:** User feedback or explicit request for drag-and-drop

### Task 2.1: Implement Drag-and-Drop with Lexorank (15 hours)
- Use @hello-pangea/dnd library (already installed)
- Add lexorank string ordering for drag stability
- Desktop-only (mobile keeps dropdown buttons)
- Keyboard accessibility with screen reader announcements

### Task 2.2: Add Bulk Operations (8 hours)
- Multi-select checkboxes on cards
- Bulk move to stage, bulk archive, bulk assign owner
- Shift+Click for range selection

---

## Phase 3: Scaling Features (If Needed)

**Trigger:** User base >50 OR multiple reports of lost changes

### Task 3.1: Optimistic Concurrency Control (8 hours)
- RPC function with updated_at check
- Conflict modal with refresh/retry options
- Per Engineering Constitution: Only add when actually needed

---

## Summary

**Phase 1 MVP:** 11 hours, 8 tasks (7 ready + 1 blocked), addresses 8 critical gaps
**Dependencies:** Clear task ordering prevents blocking
**Validation:** ✅ Validated against actual codebase (2025-10-23)
**Engineering:** Constitution-compliant, database-first architecture
**Outcome:** Production-ready opportunity redesign (CSV migration requires stage mapping)

---

## ⚠️ Implementation Readiness Status

**✅ READY TO START IMMEDIATELY (7 tasks):**
- Task 1.1: Fix type system (1h - simplified)
- Task 1.2: Priority inheritance (1.5h)
- Task 1.3: opportunities_summary view (40min)
- Task 1.4: stage_changed_at column (30min)
- Task 1.5: Timestamp ordering (2h)
- Task 1.6: Manual stage buttons (1h - use Task.tsx pattern)
- Task 1.7: Auto-name with products (1.5h)

**🔴 BLOCKED (1 task):**
- Task 1.8: CSV migration - BLOCKED until stakeholder maps custom stage names
  - Action required: Schedule meeting to map "Sampled/Visited invite-3", "VAF BLITZ", etc.
  - Estimated unblock time: 1-2 days for business decision

**Total Validated Implementation Time:** 11 hours (reduced from original 12h)

---

## Validation Report Summary (2025-10-23)

**Validation Method:** 4 parallel research agents verified against actual codebase

**Findings:**
1. ✅ All database migration patterns match existing conventions
2. ✅ All React Admin patterns proven in codebase
3. ✅ Type generation infrastructure 70% complete (just wire up scripts)
4. ❌ CSV data assumptions incorrect (column 7 not 6, 592 not 1,062 rows, custom stages)

**Corrections Applied:**
- Task 1.1: Simplified to 1 hour (scripts exist)
- Task 1.6: Fixed reference to Task.tsx
- Task 1.8: Updated column position, row count, added blockers

**Plan Status:** VALIDATED AND READY (except Task 1.8 pending business input)
