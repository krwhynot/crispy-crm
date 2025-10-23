# 🚀 Opportunity Redesign - Implementation Plan

**Plan Created:** 2025-10-23
**Based on:** CRITICAL-GAPS.md + SOLUTIONS-ANALYSIS.md + DECISION-QUESTIONS.md
**Approved Decisions:** All 4 business decisions signed off
**Total Estimated Time:** 10.5 hours

---

## Executive Summary

This implementation plan addresses 11 critical gaps identified in the opportunity redesign. The plan is organized into 3 phases:

**Phase 1 (MVP - 10.5 hours):** Fix critical blockers and implement approved features
**Phase 2 (Post-Launch):** Add polish features based on user feedback
**Phase 3 (If Needed):** Optimistic concurrency control for scaling

---

## Phase 1: MVP Implementation (10.5 hours)

### Task 1.1: Fix Type System Mismatch (GAP 1) - 2 hours

**Priority:** 🔴 CRITICAL BLOCKER - Must fix before ANY code

**Implementation Steps:**

1. **Add Supabase type generation script** (30 min)
   ```bash
   # Add to package.json
   "gen:types": "supabase gen types typescript --local > src/atomic-crm/types/database.types.ts"
   ```

2. **Generate types from local database** (15 min)
   ```bash
   npm run db:local:start
   npm run gen:types
   ```

3. **Update ActivityRecord type to use generated enum** (45 min)
   ```typescript
   // src/atomic-crm/types.ts
   import type { Database } from './types/database.types';

   type InteractionType = Database['public']['Enums']['interaction_type'];

   export type ActivityRecord = {
     type: InteractionType; // Now includes all 11 types from database
     // ... rest of type
   };
   ```

4. **Add git pre-commit hook for type regeneration** (30 min)
   ```bash
   # .husky/pre-commit
   if git diff --cached --name-only | grep -q "supabase/migrations"; then
     npm run gen:types
     git add src/atomic-crm/types/database.types.ts
   fi
   ```

**Validation:**
```bash
# Verify all 11 interaction types are present
grep -A 20 "type InteractionType" src/atomic-crm/types.ts
# Should see: call, email, meeting, demo, proposal, follow_up, trade_show, site_visit, contract_review, check_in, social
```

**Files Modified:**
- `package.json` (add gen:types script)
- `src/atomic-crm/types.ts` (update ActivityRecord type)
- `.husky/pre-commit` (add type regeneration)
- `src/atomic-crm/types/database.types.ts` (new generated file)

---

### Task 1.2: Implement Priority Inheritance Trigger (GAP 2) - 1.5 hours

**Priority:** 🟠 HIGH - Business logic enforcement

**Implementation Steps:**

1. **Create migration for trigger** (15 min)
   ```bash
   npx supabase migration new enforce_priority_inheritance
   ```

2. **Write trigger SQL** (45 min)
   ```sql
   -- supabase/migrations/[timestamp]_enforce_priority_inheritance.sql

   -- Function to sync opportunity priority with customer org
   CREATE OR REPLACE FUNCTION sync_opportunity_priority()
   RETURNS TRIGGER AS $$
   BEGIN
     -- Get priority from customer organization
     SELECT priority INTO NEW.priority
     FROM organizations
     WHERE id = NEW.customer_organization_id;

     IF NOT FOUND THEN
       RAISE EXCEPTION 'Customer organization % does not exist', NEW.customer_organization_id;
     END IF;

     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;

   -- Trigger on INSERT/UPDATE of opportunities
   CREATE TRIGGER enforce_priority_inheritance_on_opportunity
     BEFORE INSERT OR UPDATE OF customer_organization_id ON opportunities
     FOR EACH ROW
     EXECUTE FUNCTION sync_opportunity_priority();

   -- Function to cascade priority changes to opportunities
   CREATE OR REPLACE FUNCTION cascade_priority_to_opportunities()
   RETURNS TRIGGER AS $$
   BEGIN
     UPDATE opportunities
     SET priority = NEW.priority
     WHERE customer_organization_id = NEW.id;

     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;

   -- Trigger on UPDATE of organization priority
   CREATE TRIGGER cascade_priority_on_org_update
     AFTER UPDATE OF priority ON organizations
     FOR EACH ROW
     WHEN (OLD.priority IS DISTINCT FROM NEW.priority)
     EXECUTE FUNCTION cascade_priority_to_opportunities();
   ```

3. **Apply migration to local database** (10 min)
   ```bash
   npx supabase db reset
   ```

4. **Write validation tests** (20 min)
   ```sql
   -- Test 1: Create opportunity inherits org priority
   INSERT INTO opportunities (customer_organization_id, name, stage)
   VALUES (1, 'Test Opportunity', 'new_lead');

   SELECT priority FROM opportunities WHERE name = 'Test Opportunity';
   -- Expected: Same as organizations.priority where id=1

   -- Test 2: Update org priority cascades to opportunities
   UPDATE organizations SET priority = 'critical' WHERE id = 1;

   SELECT count(*) FROM opportunities
   WHERE customer_organization_id = 1 AND priority = 'critical';
   -- Expected: All opportunities for org 1 have priority='critical'
   ```

**Files Modified:**
- `supabase/migrations/[timestamp]_enforce_priority_inheritance.sql` (new)

---

### Task 1.3: Create opportunities_summary View (GAP 9) - 30 min

**Priority:** 🟠 HIGH - Required for interaction count display

**Implementation Steps:**

1. **Create migration for view** (10 min)
   ```bash
   npx supabase migration new add_opportunities_summary_view
   ```

2. **Write view SQL** (15 min)
   ```sql
   -- supabase/migrations/[timestamp]_add_opportunities_summary_view.sql

   CREATE OR REPLACE VIEW opportunities_summary AS
   SELECT
     o.*,
     COUNT(a.id) FILTER (
       WHERE a.activity_type = 'interaction'
         AND a.deleted_at IS NULL
     ) as nb_interactions,
     MAX(a.activity_date) FILTER (
       WHERE a.activity_type = 'interaction'
         AND a.deleted_at IS NULL
     ) as last_interaction_date,
     -- Days in current stage
     EXTRACT(DAY FROM NOW() - o.stage_changed_at)::integer as days_in_stage
   FROM opportunities o
   LEFT JOIN activities a ON a.opportunity_id = o.id
   GROUP BY o.id;

   GRANT SELECT ON opportunities_summary TO authenticated;

   COMMENT ON VIEW opportunities_summary IS 'Opportunity list view with calculated interaction counts and stage duration';
   ```

3. **Update data provider to use view for lists** (5 min)
   ```typescript
   // src/atomic-crm/providers/supabase/dataProviderUtils.ts
   export function getDatabaseResource(resource: string, operation: "list" | "one") {
     if (operation === "list") {
       const viewMap = {
         'contacts': 'contacts_summary',
         'opportunities': 'opportunities_summary', // ADD THIS
       };
       return viewMap[resource] || resource;
     }
     return resource;
   }
   ```

**Files Modified:**
- `supabase/migrations/[timestamp]_add_opportunities_summary_view.sql` (new)
- `src/atomic-crm/providers/supabase/dataProviderUtils.ts`

---

### Task 1.4: Add stage_changed_at Column (Required for days_in_stage) - 30 min

**Priority:** 🟠 HIGH - Required for view

**Implementation Steps:**

1. **Create migration** (10 min)
   ```bash
   npx supabase migration new add_stage_changed_at_to_opportunities
   ```

2. **Write migration SQL** (15 min)
   ```sql
   -- Add column with default to NOW() for existing records
   ALTER TABLE opportunities
   ADD COLUMN stage_changed_at TIMESTAMPTZ DEFAULT NOW();

   -- Backfill with created_at for existing opportunities
   UPDATE opportunities
   SET stage_changed_at = created_at
   WHERE stage_changed_at IS NULL;

   -- Make NOT NULL after backfill
   ALTER TABLE opportunities
   ALTER COLUMN stage_changed_at SET NOT NULL;

   -- Function to update stage_changed_at on stage change
   CREATE OR REPLACE FUNCTION update_stage_changed_at()
   RETURNS TRIGGER AS $$
   BEGIN
     IF OLD.stage IS DISTINCT FROM NEW.stage THEN
       NEW.stage_changed_at = NOW();
     END IF;
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;

   -- Trigger on stage update
   CREATE TRIGGER update_stage_timestamp
     BEFORE UPDATE OF stage ON opportunities
     FOR EACH ROW
     EXECUTE FUNCTION update_stage_changed_at();
   ```

3. **Update Opportunity type** (5 min)
   ```typescript
   // src/atomic-crm/types.ts
   export type Opportunity = {
     // ... existing fields
     stage_changed_at: string; // ISO timestamp
   };
   ```

**Files Modified:**
- `supabase/migrations/[timestamp]_add_stage_changed_at_to_opportunities.sql` (new)
- `src/atomic-crm/types.ts`

---

### Task 1.5: Remove Integer Index Field (GAP 4) - 2 hours

**Priority:** 🟢 MEDIUM - Simplification (removes race conditions)

**Implementation Steps:**

1. **Create migration to drop index column** (10 min)
   ```bash
   npx supabase migration new remove_opportunity_index_field
   ```

2. **Write migration SQL** (10 min)
   ```sql
   -- Drop index column (no longer needed with timestamp sorting)
   ALTER TABLE opportunities DROP COLUMN IF EXISTS index;
   ```

3. **Update Opportunity type** (5 min)
   ```typescript
   // src/atomic-crm/types.ts
   export type Opportunity = {
     // ... existing fields
     // REMOVE: index: number;
   };
   ```

4. **Update OpportunityListContent.tsx to sort by created_at** (30 min)
   ```typescript
   // src/atomic-crm/opportunities/OpportunityListContent.tsx
   import { groupOpportunitiesByStage } from "./stages";

   export function OpportunityListContent() {
     const { data, isPending } = useListContext<Opportunity>();

     // Sort by created_at DESC (newest first)
     const sortedData = useMemo(() => {
       return [...(data || [])].sort((a, b) =>
         new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
       );
     }, [data]);

     const opportunitiesByStage = groupOpportunitiesByStage(sortedData);

     // ... render columns
   }
   ```

5. **Remove index management from OpportunityCreate** (20 min)
   ```typescript
   // src/atomic-crm/opportunities/OpportunityCreate.tsx
   // REMOVE all index calculation logic

   const onSubmit = async (data: OpportunityFormData) => {
     await dataProvider.create("opportunities", {
       data: {
         ...data,
         // REMOVE: index: 0,
       },
     });
   };
   ```

6. **Remove OpportunitiesService.unarchive reordering** (20 min)
   ```typescript
   // src/atomic-crm/services/opportunities.service.ts
   export class OpportunitiesService {
     async unarchive(id: number) {
       // Simply update status to active
       await this.dataProvider.update("opportunities", {
         id,
         data: { status: "active" },
       });

       // REMOVE: Full index reordering logic (no longer needed)
     }
   }
   ```

7. **Update stages.ts to remove index sorting** (15 min)
   ```typescript
   // src/atomic-crm/opportunities/stages.ts
   export function groupOpportunitiesByStage(opportunities: Opportunity[]) {
     // Opportunities already sorted by created_at in parent component
     // No need to sort by index

     return OPPORTUNITY_STAGES.reduce((acc, stage) => {
       acc[stage.value] = opportunities.filter(opp => opp.stage === stage.value);
       return acc;
     }, {} as Record<string, Opportunity[]>);
   }
   ```

**Files Modified:**
- `supabase/migrations/[timestamp]_remove_opportunity_index_field.sql` (new)
- `src/atomic-crm/types.ts`
- `src/atomic-crm/opportunities/OpportunityListContent.tsx`
- `src/atomic-crm/opportunities/OpportunityCreate.tsx`
- `src/atomic-crm/opportunities/stages.ts`
- `src/atomic-crm/services/opportunities.service.ts`

---

### Task 1.6: Add Manual "Move to Stage" Dropdown (GAP 8) - 1 hour

**Priority:** 🟢 MEDIUM - UX improvement for stage changes

**Implementation Steps:**

1. **Add DropdownMenu to OpportunityCard** (40 min)
   ```tsx
   // src/atomic-crm/opportunities/OpportunityCard.tsx
   import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
   import { MoreVertical } from "lucide-react";
   import { OPPORTUNITY_STAGES } from "./stageConstants";
   import { useDataProvider } from "react-admin";

   export function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
     const dataProvider = useDataProvider();
     const queryClient = useQueryClient();

     const handleMoveToStage = async (newStage: string) => {
       try {
         await dataProvider.update("opportunities", {
           id: opportunity.id,
           data: { stage: newStage },
           previousData: opportunity,
         });

         queryClient.invalidateQueries({ queryKey: ["opportunities"] });

         notify("Opportunity moved successfully", { type: "success" });
       } catch (error) {
         notify("Failed to move opportunity", { type: "error" });
       }
     };

     return (
       <Card>
         {/* Existing card content */}

         <div className="flex items-center justify-between mt-2">
           <Button variant="outline" size="sm" asChild>
             <Link to={`/opportunities/${opportunity.id}`}>View</Link>
           </Button>

           <DropdownMenu>
             <DropdownMenuTrigger asChild>
               <Button variant="ghost" size="icon">
                 <MoreVertical className="h-4 w-4" />
               </Button>
             </DropdownMenuTrigger>
             <DropdownMenuContent align="end">
               {OPPORTUNITY_STAGES.filter(stage => stage.value !== opportunity.stage).map(stage => (
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
       </Card>
     );
   }
   ```

2. **Update filter registry for stage field** (10 min)
   ```typescript
   // src/atomic-crm/providers/supabase/filterRegistry.ts
   export const FILTER_REGISTRY = {
     opportunities: [
       "stage", // Ensure stage is whitelisted
       "priority",
       "customer_organization_id",
       "status",
       "opportunity_owner_id",
     ],
   };
   ```

3. **Add keyboard accessibility test** (10 min)
   ```typescript
   // src/atomic-crm/opportunities/OpportunityCard.test.tsx
   test("dropdown menu is keyboard accessible", () => {
     render(<OpportunityCard opportunity={mockOpportunity} />);

     const trigger = screen.getByRole("button", { name: /more options/i });
     trigger.focus();

     fireEvent.keyDown(trigger, { key: "Enter" });

     expect(screen.getByText("Move to Qualified")).toBeInTheDocument();
   });
   ```

**Files Modified:**
- `src/atomic-crm/opportunities/OpportunityCard.tsx`
- `src/atomic-crm/providers/supabase/filterRegistry.ts`
- `src/atomic-crm/opportunities/OpportunityCard.test.tsx` (new test)

---

### Task 1.7: Implement Watch Products Array Auto-Name (GAP 10) - 1.5 hours

**Priority:** 🟢 MEDIUM - UX polish (approved "magical" behavior)

**Implementation Steps:**

1. **Update useAutoGenerateName hook** (60 min)
   ```typescript
   // src/atomic-crm/opportunities/useAutoGenerateName.ts
   import { useWatch, useFormContext } from "react-hook-form";
   import { useEffect, useState } from "react";
   import { useGetOne } from "react-admin";

   export function useAutoGenerateName(mode: "create" | "edit") {
     const customerOrgId = useWatch({ name: "customer_organization_id" });
     const principalOrgId = useWatch({ name: "principal_organization_id" });
     const products = useWatch({ name: "products" }); // NEW: Watch products array
     const { setValue, getValues } = useFormContext();
     const [isManuallyEdited, setIsManuallyEdited] = useState(false);

     // Fetch organization names
     const { data: customerOrg } = useGetOne("organizations", { id: customerOrgId });
     const { data: principalOrg } = useGetOne("organizations", { id: principalOrgId });

     useEffect(() => {
       // Skip if user manually edited the name
       if (isManuallyEdited) return;

       // Auto-generate name when customer, principal, or products change
       if (customerOrg && principalOrg) {
         const productNames = (products || [])
           .map((p: any) => p.name)
           .join(" & ");

         const generatedName = [
           customerOrg.name,
           principalOrg.name,
           productNames,
         ]
           .filter(Boolean)
           .join(" - ");

         setValue("name", generatedName, { shouldDirty: false });
       }
     }, [customerOrgId, principalOrgId, products, customerOrg, principalOrg, isManuallyEdited]);

     // Expose manual refresh function
     const refreshName = () => {
       setIsManuallyEdited(false);
       // Trigger will re-run via useEffect
     };

     // Track if user manually edits name
     const handleNameChange = () => {
       setIsManuallyEdited(true);
     };

     return { refreshName, handleNameChange };
   }
   ```

2. **Update OpportunityInputs to use hook** (20 min)
   ```tsx
   // src/atomic-crm/opportunities/OpportunityInputs.tsx
   export function OpportunityInputs({ mode }: { mode: "create" | "edit" }) {
     const { refreshName, handleNameChange } = useAutoGenerateName(mode);

     return (
       <>
         <TextInput
           source="name"
           label="Opportunity Name"
           onChange={handleNameChange} // Track manual edits
           helperText={
             <Button
               variant="ghost"
               size="sm"
               onClick={refreshName}
               type="button"
             >
               🔄 Regenerate from customer & products
             </Button>
           }
         />

         {/* Customer, Principal, Products inputs */}
       </>
     );
   }
   ```

3. **Add deep equality tests** (10 min)
   ```typescript
   // src/atomic-crm/opportunities/useAutoGenerateName.test.ts
   test("regenerates name when products array changes", () => {
     const { result } = renderHook(() => useAutoGenerateName("edit"));

     // Change products array
     act(() => {
       setValue("products", [{ id: 1, name: "Widget" }]);
     });

     expect(getValues("name")).toContain("Widget");

     // Add another product
     act(() => {
       setValue("products", [
         { id: 1, name: "Widget" },
         { id: 2, name: "Gadget" },
       ]);
     });

     expect(getValues("name")).toContain("Widget & Gadget");
   });
   ```

**Files Modified:**
- `src/atomic-crm/opportunities/useAutoGenerateName.ts`
- `src/atomic-crm/opportunities/OpportunityInputs.tsx`
- `src/atomic-crm/opportunities/useAutoGenerateName.test.ts` (new tests)

---

### Task 1.8: CSV Migration with Automatic Contact Backfill (GAP 5 + GAP 6) - 2 hours

**Priority:** 🔴 CRITICAL - Required before production data import

**Implementation Steps:**

1. **Extract unique CSV stages** (10 min)
   ```bash
   awk -F',' 'NR>1 {print $6}' data/Opportunity.csv | sort -u > data/unique_stages.txt
   cat data/unique_stages.txt
   ```

2. **Complete stage mapping** (20 min)
   ```typescript
   // scripts/migrate-opportunities-csv.ts
   const CSV_STAGE_MAP: Record<string, OpportunityStage> = {
     // Complete mapping based on unique_stages.txt
     "New Lead": "new_lead",
     "Contacted": "contacted",
     "Qualified": "qualified",
     "Proposal Sent": "proposal",
     "Negotiation": "negotiation",
     "Closed Won": "closed_won",
     "Closed Lost": "closed_lost",
     // ... add all mappings from CSV
   };
   ```

3. **Write migration script with fail-fast validation** (60 min)
   ```typescript
   // scripts/migrate-opportunities-csv.ts
   import { createClient } from "@supabase/supabase-js";
   import * as fs from "fs";
   import * as csv from "csv-parser";

   async function migrateOpportunities() {
     const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

     const csvRows: any[] = [];

     // Read CSV
     await new Promise((resolve, reject) => {
       fs.createReadStream("data/Opportunity.csv")
         .pipe(csv())
         .on("data", (row) => csvRows.push(row))
         .on("end", resolve)
         .on("error", reject);
     });

     console.log(`📋 Found ${csvRows.length} opportunities to migrate`);

     // Validate ALL stage mappings BEFORE starting transaction
     for (const row of csvRows) {
       const stage = CSV_STAGE_MAP[row.STAGE?.trim()];

       if (!stage) {
         throw new Error(
           `❌ UNMAPPED STAGE: "${row.STAGE}" (row ${csvRows.indexOf(row) + 2})\n` +
           `Update CSV_STAGE_MAP and retry.`
         );
       }
     }

     console.log("✅ All stages validated");

     // Start transaction
     const { data: opportunities, error } = await supabase.rpc("migrate_opportunities", {
       csv_data: csvRows.map(row => ({
         ...row,
         stage: CSV_STAGE_MAP[row.STAGE.trim()],
         legacy_stage_source: row.STAGE, // Audit trail
       })),
     });

     if (error) {
       console.error("❌ Migration failed:", error);
       throw error;
     }

     console.log(`✅ Migrated ${opportunities.length} opportunities`);

     // Automatic contact backfill
     await backfillContactsFromInteractions(supabase);
   }

   async function backfillContactsFromInteractions(supabase: any) {
     console.log("🔄 Starting automatic contact backfill...");

     const { data: mismatches } = await supabase.rpc("backfill_opportunity_contacts");

     console.log(`✅ Added ${mismatches.length} contacts to opportunities from interactions`);
   }

   migrateOpportunities().catch(console.error);
   ```

4. **Create database RPC function for backfill** (30 min)
   ```sql
   -- Create migration
   -- supabase/migrations/[timestamp]_add_backfill_contacts_rpc.sql

   CREATE OR REPLACE FUNCTION backfill_opportunity_contacts()
   RETURNS TABLE (opportunity_id bigint, contacts_added bigint[]) AS $$
   DECLARE
     opp RECORD;
     missing_contacts bigint[];
   BEGIN
     FOR opp IN SELECT id, contact_ids FROM opportunities LOOP
       -- Find interaction contacts not in opportunity.contact_ids
       SELECT array_agg(DISTINCT contact_id)
       INTO missing_contacts
       FROM activities
       WHERE opportunity_id = opp.id
         AND activity_type = 'interaction'
         AND contact_id IS NOT NULL
         AND contact_id != ALL(opp.contact_ids);

       IF missing_contacts IS NOT NULL AND array_length(missing_contacts, 1) > 0 THEN
         -- Add missing contacts
         UPDATE opportunities
         SET contact_ids = array_cat(contact_ids, missing_contacts)
         WHERE id = opp.id;

         RETURN QUERY SELECT opp.id, missing_contacts;
       END IF;
     END LOOP;
   END;
   $$ LANGUAGE plpgsql;
   ```

**Files Modified:**
- `scripts/migrate-opportunities-csv.ts` (new)
- `supabase/migrations/[timestamp]_add_backfill_contacts_rpc.sql` (new)
- `data/unique_stages.txt` (new - for reference)

---

## Phase 1 Validation Checklist

Before marking Phase 1 complete, verify:

- [ ] **GAP 1:** Run `npm run gen:types` and verify all 11 interaction types present in generated types
- [ ] **GAP 2:** Create opportunity and verify priority auto-inherited from customer org
- [ ] **GAP 2:** Update org priority and verify all opportunities cascade
- [ ] **GAP 4:** Create multiple opportunities and verify sorted by created_at (newest first)
- [ ] **GAP 5:** Run CSV migration script and verify fail-fast on unmapped stages
- [ ] **GAP 6:** Verify interaction contacts automatically added to opportunity.contact_ids
- [ ] **GAP 8:** Test "Move to Stage" dropdown with keyboard navigation
- [ ] **GAP 9:** Verify OpportunityList uses opportunities_summary view (check network tab)
- [ ] **GAP 10:** Change products and verify name auto-regenerates
- [ ] **No drag-and-drop code:** Verify @hello-pangea/dnd not imported anywhere in src/

**Success Criteria:**
- All 11 critical gaps resolved or deferred
- Zero type errors (`npm run typecheck`)
- All tests passing (`npm test`)
- CSV migration completes successfully
- Manual testing confirms expected behavior

---

## Phase 2: Post-Launch Enhancements (Deferred)

**Trigger:** User feedback indicates manual buttons insufficient

### Task 2.1: Implement Drag-and-Drop Kanban (GAP 8) - 15 hours

**Implementation:**
- Add @hello-pangea/dnd DragDropContext
- Implement Droppable columns
- Implement Draggable cards
- Add lexorank ordering library
- Desktop-only (mobile keeps manual buttons)
- Keyboard accessibility testing

### Task 2.2: Add Lexorank Ordering (GAP 4) - 4 hours

**Implementation:**
- Install `lexorank` npm package
- Add `rank` field to opportunities table
- Generate ranks on create/move
- Handle rank compaction

---

## Phase 3: Scaling Features (If Needed)

**Trigger:** Multiple users report losing changes OR user base >50

### Task 3.1: Optimistic Concurrency Control (GAP 7) - 8 hours

**Implementation:**
- Create RPC function for atomic updates with timestamp check
- Add conflict detection modal
- Update mutation handlers to include `updated_at`
- Add retry logic

---

## Implementation Order

**Week 1 (10.5 hours):**
1. Day 1 (4 hours): Tasks 1.1, 1.2, 1.3, 1.4 (Database foundations)
2. Day 2 (3.5 hours): Tasks 1.5, 1.6 (Simplify index, add manual buttons)
3. Day 3 (3 hours): Tasks 1.7, 1.8 (Auto-name, CSV migration)

**Total MVP Delivery:** 3 days (10.5 hours)

---

## Risk Mitigation

**Risk 1: CSV stage mapping incomplete**
- **Mitigation:** Extract unique stages FIRST, validate mapping BEFORE transaction

**Risk 2: Contact backfill adds wrong contacts**
- **Mitigation:** Dry-run mode logs changes without applying, manual review option

**Risk 3: Type generation breaks on schema changes**
- **Mitigation:** Pre-commit hook ensures types always synced with migrations

**Risk 4: View performance degradation**
- **Mitigation:** Monitor query times, add indexes if needed (opportunities.opportunity_id on activities)

---

## Success Metrics

**Phase 1 MVP Success:**
- ✅ Zero type mismatches between database and TypeScript
- ✅ 100% priority inheritance compliance (enforced by trigger)
- ✅ 1,062 opportunities migrated successfully with full contact relationships
- ✅ Interaction counts visible on Kanban cards
- ✅ Zero race conditions on ordering
- ✅ Mobile-friendly manual stage changes

**Phase 2 Success (if implemented):**
- ✅ <200ms drag-and-drop response time
- ✅ Zero rank compaction needed in first 90 days
- ✅ 95%+ user preference for drag-and-drop over manual buttons

---

## Deployment Plan

**Local Testing:**
```bash
npm run db:local:reset
npm run gen:types
npm test
npm run dev
# Manual testing of all 8 tasks
```

**Cloud Deployment:**
```bash
npm run db:cloud:push  # Deploy all migrations
npm run gen:types      # Regenerate types from cloud schema
npm run migrate:csv    # Run CSV migration script
npm run build          # Production build
npm run deploy         # Deploy to production
```

**Rollback Plan:**
If critical issues found post-deployment:
1. Revert migrations: `supabase db reset --linked` (⚠️ DESTRUCTIVE - only if safe)
2. Restore from backup: `supabase db dump` (run before deployment)
3. Alternative: Fix forward with new migration

---

## Documentation Updates

After Phase 1 completion, update:

- [ ] `shared.md` - Update relevant patterns section
- [ ] `CRITICAL-GAPS.md` - Mark all Phase 1 gaps as RESOLVED
- [ ] `SOLUTIONS-ANALYSIS.md` - Add implementation results
- [ ] `README.md` - Update features list (add interaction counts, priority inheritance)

---

**Implementation Status:** Ready to begin
**Next Action:** Start Task 1.1 (Type System Fix)
