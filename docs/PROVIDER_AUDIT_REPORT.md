# Provider System Deep Audit Report - 2026-01-08

## Executive Summary

### Complete Audit Statistics (11 Checks)

- **Total findings:** 38
- **Critical:** 10 | **High:** 13 | **Medium:** 8 | **Low:** 7
- **Audit Scope:** Application Layer, Database Layer, RPC Layer, Storage Layer, Type System

### Top 5 Issues Requiring Immediate Attention (P0)

| Priority | Issue | Type | Fix Effort |
|----------|-------|------|------------|
| 1 | **[CRITICAL-001]** ValidationService casing mismatch - silent validation bypass | Correctness | Small |
| 2 | **[SF-C01]** SECURITY DEFINER views bypass RLS (6 views affected) | Security | Small |
| 3 | **[SF-C08]** 20 CASCADE constraints conflict with soft-delete pattern | Data Loss | Medium |
| 4 | **[SF-C09]** getMany/getManyReference allow cross-tenant ID fetching (IDOR) | Security | Medium |
| 5 | **[SF-C10]** No storage cleanup - orphaned files accumulate forever | Data Leak | Medium |

### Audit Parts

- **Part 1:** Original Provider Audit (15 findings)
- **Part 2:** Silent Fallback Anti-Pattern Audit (8 checks, 23 findings)
- **Part 3:** System-Level Audit - RPC, Storage, TypeScript (3 checks)

### CRITICAL: Active Validation Bypass

**3 resources are currently bypassing Zod validation due to casing mismatch:**

| Resource (Router) | Registry Key | Validation Status |
|-------------------|--------------|-------------------|
| `contact_notes` | `contactNotes` | ❌ **BYPASSED** |
| `opportunity_notes` | `opportunityNotes` | ❌ **BYPASSED** |
| `organization_notes` | `organizationNotes` | ❌ **BYPASSED** |

**Flow:**
1. `composedDataProvider.create("contact_notes", ...)` - snake_case
2. `withValidation` calls `validationService.validate("contact_notes", ...)`
3. `ValidationService` line 218: `validationRegistry["contact_notes"]` → undefined
4. Line 220-222: `if (!validator) { return; }` → **Silent bypass, no error**

---

## Findings by Category

### 0. CRITICAL Issues (Active Bugs)

#### [CRITICAL-001] Active Validation Bypass - Notes Resources
- **File:** `src/atomic-crm/providers/supabase/services/ValidationService.ts`
- **Lines:** 98-204 (validationRegistry), 218-222 (validate method)
- **Issue:** ValidationService registry uses camelCase keys but composedDataProvider passes snake_case resource names, causing validation to be **silently skipped**.
- **Affected Resources:**
  - `contact_notes` → registry has `contactNotes` → **NO VALIDATION**
  - `opportunity_notes` → registry has `opportunityNotes` → **NO VALIDATION**
  - `organization_notes` → registry has `organizationNotes` → **NO VALIDATION**
- **Root Cause:** Line 220-222 returns silently when no validator found:
  ```typescript
  if (!validator) {
    return;  // Silent bypass - no error thrown!
  }
  ```
- **Impact:** Malformed note data (missing required fields, invalid types) can reach the database
- **Fix approach:** Add snake_case aliases to validationRegistry:
  ```typescript
  // Add these lines to validationRegistry:
  contact_notes: { /* same as contactNotes */ },
  opportunity_notes: { /* same as opportunityNotes */ },
  organization_notes: { /* same as organizationNotes */ },
  ```

---

### 1. CONSISTENCY Issues

#### [C-001] [MEDIUM] filterRegistry Also Has Casing Mismatch
- **File:** `src/atomic-crm/providers/supabase/filterRegistry.ts`
- **Issue:** Same casing problem as ValidationService - `contactNotes` vs `contact_notes`
- **Risk:** Filter validation throws UnregisteredResourceError for snake_case resources
- **Fix approach:** Add snake_case aliases to filterableFields

#### [C-002] [MEDIUM] DRY Violation: stripComputedFields Duplicated
- **Files:**
  - `src/atomic-crm/providers/supabase/callbacks/contactsCallbacks.ts:163-169`
  - `src/atomic-crm/providers/supabase/callbacks/organizationsCallbacks.ts:122-128`
  - `src/atomic-crm/providers/supabase/callbacks/opportunitiesCallbacks.ts:124-138`
- **Issue:** `stripComputedFields()` function duplicated in 3 callbacks files with identical logic
- **Expected:** Single utility function in `commonTransforms.ts`
- **Actual:** Each file has its own implementation
- **Fix approach:** Create `createStripFieldsTransform(fields: readonly string[])` factory in commonTransforms.ts

#### [C-003] [MEDIUM] DRY Violation: beforeGetList Search Pattern
- **Files:**
  - `src/atomic-crm/providers/supabase/callbacks/contactsCallbacks.ts:125-139`
  - `src/atomic-crm/providers/supabase/callbacks/organizationsCallbacks.ts:84-98`
  - `src/atomic-crm/providers/supabase/callbacks/salesCallbacks.ts:58-72`
- **Issue:** Same "transform search + apply soft delete" pattern duplicated in 3 files
- **Expected:** Composable factory for search+softDelete beforeGetList callbacks
- **Actual:** Each file re-implements the same pattern:
  ```typescript
  async function resourceBeforeGetList(params, dataProvider) {
    const searchTransformedParams = transformQToIlikeSearch(params);
    if (baseCallbacks.beforeGetList) {
      return baseCallbacks.beforeGetList(searchTransformedParams, dataProvider);
    }
    return searchTransformedParams;
  }
  ```
- **Fix approach:** Create `createSearchableResourceCallbacks()` factory that composes search + soft delete

#### [C-004] [LOW] Wrapper Composition Order Comment Misleading
- **File:** `src/atomic-crm/providers/supabase/handlers/notificationsHandler.ts`
- **Line:** 21-24
- **Issue:** Comment says "withLifecycleCallbacks MUST wrap withValidation so beforeSave can strip computed fields BEFORE Zod validation" but the actual order in code is correct (callbacks wraps validation from outside)
- **Expected:** Clearer documentation of wrapper execution order
- **Actual:** Comment could be misread as incorrect order
- **Fix approach:** Reword comment: "Composition order (innermost to outermost): validation -> callbacks -> errorLogging"

#### [C-005] [LOW] COMPUTED_FIELDS Export Naming Inconsistency
- **File:** `src/atomic-crm/providers/supabase/callbacks/index.ts`
- **Lines:** 42-88
- **Issue:** Some COMPUTED_FIELDS exports use resource prefix (`CONTACT_COMPUTED_FIELDS`), others use domain prefix (`OPP_COMPUTED_FIELDS`, `ACTIVITIES_COMPUTED_FIELDS`)
- **Expected:** Consistent naming: `CONTACT_COMPUTED_FIELDS`, `ORG_COMPUTED_FIELDS`, `OPPORTUNITY_COMPUTED_FIELDS`
- **Actual:** Mix of `CONTACT_`, `ORG_`, `OPP_`, `ACTIVITIES_`, `PRODUCTS_`, `TASKS_`, `SALES_`
- **Fix approach:** Standardize to `{RESOURCE}_COMPUTED_FIELDS` pattern

---

### 2. CORRECTNESS Issues

#### [C-006] [HIGH] Missing Validation for notifications Resource
- **File:** `src/atomic-crm/providers/supabase/services/ValidationService.ts`
- **Line:** 98-204 (validationRegistry)
- **Issue:** `notifications` resource has a handler and callbacks but NO entry in ValidationService.validationRegistry
- **Expected:** All resources with handlers should have validation
- **Actual:** `notifications` not in validation registry
- **Risk:** Malformed notification data could reach database
- **Fix approach:** Add notifications validation entry (or document why it's intentionally omitted)

#### [C-007] [MEDIUM] Junction Table Validation Gap
- **File:** `src/atomic-crm/providers/supabase/services/ValidationService.ts`
- **Issue:** Junction tables (`opportunity_participants`, `opportunity_contacts`, etc.) not in validationRegistry
- **Expected:** Validation for junction table operations
- **Actual:** No validation configured for any of the 6 junction tables
- **Risk:** Invalid FK references or malformed junction records
- **Fix approach:** Add basic FK validation schemas for junction tables

#### [C-008] [MEDIUM] Direct Supabase Call in opportunitiesCallbacks
- **File:** `src/atomic-crm/providers/supabase/callbacks/opportunitiesCallbacks.ts`
- **Line:** 182-188
- **Issue:** Imports and calls `supabase.rpc()` directly, bypassing DataProvider abstraction
- **Expected:** Use DataProvider's RPC method if available
- **Actual:** Direct `supabase.rpc("archive_opportunity_with_relations", {...})`
- **Risk:** Inconsistent error handling, logging bypass, potential mock issues in tests
- **Note:** Comment claims this is "React Admin recommended pattern" - verify this is intentional
- **Fix approach:** If intentional, document the trade-off. Otherwise, use ExtendedDataProvider.rpc()

#### [C-009] [MEDIUM] filterRegistry Missing contact_notes (snake_case)
- **File:** `src/atomic-crm/providers/supabase/filterRegistry.ts`
- **Issue:** Registry has `contactNotes` (camelCase) but handler uses `contact_notes` (snake_case)
- **Expected:** Both casing variants OR consistent single casing
- **Actual:** Only camelCase in filterRegistry, snake_case in HANDLED_RESOURCES
- **Risk:** Filter validation throws UnregisteredResourceError for snake_case resource names
- **Fix approach:** Add snake_case aliases: `contact_notes`, `opportunity_notes`, `organization_notes`

---

### 3. PERFORMANCE Issues

#### [P-001] [MEDIUM] Searchable Fields Cache Not Pre-warmed
- **File:** `src/atomic-crm/providers/supabase/dataProviderUtils.ts`
- **Line:** 86-97
- **Issue:** `searchableFieldsCache` Map populated on-demand, first request per resource pays lookup cost
- **Expected:** Cache pre-warmed on module load for known resources
- **Actual:** Lazy initialization
- **Impact:** Minor first-request latency (~1ms)
- **Fix approach:** Pre-populate cache in module initialization for SEARCHABLE_RESOURCES keys

#### [P-002] [LOW] JSONB Array Normalization on Every Read
- **File:** `src/atomic-crm/providers/supabase/callbacks/contactsCallbacks.ts`
- **Line:** 113 (afterReadTransform)
- **Issue:** `normalizeJsonbArrays` called on every contact read, even when arrays are already valid
- **Expected:** Only normalize when needed
- **Actual:** Always runs full normalization loop
- **Impact:** Minor CPU overhead on contact reads
- **Fix approach:** Add early return if all fields are already arrays (optimization, not critical)

#### [P-003] [LOW] Redundant Filter Transformation
- **File:** `src/atomic-crm/providers/supabase/dataProviderUtils.ts`
- **Line:** 377-386
- **Issue:** `applySearchParams` calls `transformStaleFilter`, `transformOrFilter`, `transformArrayFilters` sequentially, creating intermediate objects
- **Expected:** Single-pass transformation
- **Actual:** 3 transformation passes with object spreading
- **Impact:** Minor memory/CPU overhead on getList calls
- **Fix approach:** Combine transformations into single-pass function (optimization, not critical)

---

### 4. DOCUMENTATION Issues

#### [D-001] [LOW] Deprecated JSONB_ARRAY_FIELDS Export Still Used
- **File:** `src/atomic-crm/providers/supabase/callbacks/contactsCallbacks.ts`
- **Line:** 43-44
- **Issue:** `JSONB_ARRAY_FIELDS` marked `@deprecated` but still exported and potentially used
- **Expected:** Remove deprecated exports or complete migration
- **Actual:** Deprecated annotation with no removal timeline
- **Fix approach:** Remove export in next major version, update any imports to use commonTransforms

#### [D-002] [LOW] Missing JSDoc on Some Handler Factories
- **Files:**
  - `src/atomic-crm/providers/supabase/handlers/segmentsHandler.ts`
  - `src/atomic-crm/providers/supabase/handlers/productDistributorsHandler.ts`
- **Issue:** Handler factory functions lack comprehensive JSDoc documentation
- **Expected:** Consistent JSDoc across all handlers explaining composition and behaviors
- **Actual:** Some handlers have detailed docs, others minimal
- **Fix approach:** Add JSDoc templates to all handler factories

---

## Handler Status Matrix

| Handler | Wrapper Order | Callbacks | FilterRegistry | Validation | Status |
|---------|--------------|-----------|----------------|------------|--------|
| contacts | ✅ Correct | ✅ contactsCallbacks | ✅ contacts | ✅ contacts | **PASS** |
| organizations | ✅ Correct | ✅ organizationsCallbacks | ✅ organizations | ✅ organizations | **PASS** |
| opportunities | ✅ Correct | ✅ Custom (RPC delete) | ✅ opportunities | ✅ opportunities | **PASS** |
| activities | ✅ Correct | ✅ activitiesCallbacks | ✅ activities | ✅ activities | **PASS** |
| products | ✅ Correct | ✅ productsCallbacks | ✅ products | ✅ products | **PASS** |
| tasks | ✅ Correct | ✅ tasksCallbacks | ✅ tasks | ✅ tasks | **PASS** |
| contact_notes | ✅ Correct | ✅ contactNotesCallbacks | ⚠️ contactNotes | ⚠️ contactNotes | **REVIEW** |
| opportunity_notes | ✅ Correct | ✅ opportunityNotesCallbacks | ⚠️ opportunityNotes | ⚠️ opportunityNotes | **REVIEW** |
| organization_notes | ✅ Correct | ✅ organizationNotesCallbacks | ❌ Missing | ⚠️ organizationNotes | **REVIEW** |
| tags | ✅ Correct | ✅ tagsCallbacks (hard delete) | ✅ tags | ✅ tags | **PASS** |
| sales | ✅ Correct | ✅ salesCallbacks | ✅ sales | ⚠️ No update validation | **PASS** |
| segments | ✅ Correct | ✅ Factory | ✅ segments | ✅ segments | **PASS** |
| product_distributors | ✅ Correct | ✅ Factory | ❌ Missing | ✅ product_distributors | **REVIEW** |
| opportunity_participants | ✅ Correct | ✅ Factory | ⚠️ opportunity_contacts only | ❌ Missing | **REVIEW** |
| notifications | ✅ Correct | ✅ notificationsCallbacks | ✅ notifications | ❌ Missing | **FAIL** |
| user_favorites | ✅ Correct | ✅ Factory | ✅ user_favorites | ✅ user_favorites | **PASS** |

### Legend
- ✅ Present and correctly configured
- ⚠️ Present but casing mismatch or partial
- ❌ Missing

---

## Technical Debt Inventory

| ID | Description | Effort | Priority | Dependencies |
|----|-------------|--------|----------|--------------|
| **TD-001** | **FIX CRITICAL: Add snake_case aliases to ValidationService** | S | **P0** | None - IMMEDIATE |
| TD-002 | Add snake_case aliases to filterRegistry | S | P1 | None |
| TD-003 | Add notifications validation schema | S | P1 | Create notificationsSchema |
| TD-004 | Extract stripComputedFields to commonTransforms | M | P2 | None |
| TD-005 | Create composable beforeGetList factory | M | P2 | TD-004 |
| TD-006 | Add junction table validation schemas | M | P2 | Define schemas |
| TD-007 | Standardize COMPUTED_FIELDS export naming | S | P3 | None |
| TD-008 | Pre-warm searchable fields cache | S | P3 | None |
| TD-009 | Remove deprecated JSONB_ARRAY_FIELDS export | S | P3 | Verify no imports |
| TD-010 | Add JSDoc to all handler factories | S | P3 | None |
| TD-011 | Review/document direct supabase.rpc() in opportunities | S | P3 | Architecture decision |

---

## Appendix: Files Examined

### Handlers (12 files)
- `/src/atomic-crm/providers/supabase/handlers/index.ts`
- `/src/atomic-crm/providers/supabase/handlers/contactsHandler.ts`
- `/src/atomic-crm/providers/supabase/handlers/organizationsHandler.ts`
- `/src/atomic-crm/providers/supabase/handlers/opportunitiesHandler.ts`
- `/src/atomic-crm/providers/supabase/handlers/activitiesHandler.ts`
- `/src/atomic-crm/providers/supabase/handlers/productsHandler.ts`
- `/src/atomic-crm/providers/supabase/handlers/tasksHandler.ts`
- `/src/atomic-crm/providers/supabase/handlers/notesHandler.ts`
- `/src/atomic-crm/providers/supabase/handlers/tagsHandler.ts`
- `/src/atomic-crm/providers/supabase/handlers/salesHandler.ts`
- `/src/atomic-crm/providers/supabase/handlers/segmentsHandler.ts`
- `/src/atomic-crm/providers/supabase/handlers/productDistributorsHandler.ts`
- `/src/atomic-crm/providers/supabase/handlers/junctionHandlers.ts`
- `/src/atomic-crm/providers/supabase/handlers/notificationsHandler.ts`

### Callbacks (11 files)
- `/src/atomic-crm/providers/supabase/callbacks/index.ts`
- `/src/atomic-crm/providers/supabase/callbacks/commonTransforms.ts`
- `/src/atomic-crm/providers/supabase/callbacks/createResourceCallbacks.ts`
- `/src/atomic-crm/providers/supabase/callbacks/contactsCallbacks.ts`
- `/src/atomic-crm/providers/supabase/callbacks/organizationsCallbacks.ts`
- `/src/atomic-crm/providers/supabase/callbacks/opportunitiesCallbacks.ts`
- `/src/atomic-crm/providers/supabase/callbacks/activitiesCallbacks.ts`
- `/src/atomic-crm/providers/supabase/callbacks/productsCallbacks.ts`
- `/src/atomic-crm/providers/supabase/callbacks/tasksCallbacks.ts`
- `/src/atomic-crm/providers/supabase/callbacks/notesCallbacks.ts`
- `/src/atomic-crm/providers/supabase/callbacks/tagsCallbacks.ts`
- `/src/atomic-crm/providers/supabase/callbacks/salesCallbacks.ts`
- `/src/atomic-crm/providers/supabase/callbacks/notificationsCallbacks.ts`

### Wrappers (3 files)
- `/src/atomic-crm/providers/supabase/wrappers/index.ts`
- `/src/atomic-crm/providers/supabase/wrappers/withErrorLogging.ts`
- `/src/atomic-crm/providers/supabase/wrappers/withValidation.ts`

### Services (4 files)
- `/src/atomic-crm/providers/supabase/services/index.ts`
- `/src/atomic-crm/providers/supabase/services/ValidationService.ts`
- `/src/atomic-crm/providers/supabase/services/TransformService.ts`
- `/src/atomic-crm/providers/supabase/services/StorageService.ts` (referenced, not read)

### Infrastructure (5 files)
- `/src/atomic-crm/providers/supabase/index.ts`
- `/src/atomic-crm/providers/supabase/composedDataProvider.ts`
- `/src/atomic-crm/providers/supabase/filterRegistry.ts`
- `/src/atomic-crm/providers/supabase/dataProviderUtils.ts`
- `/src/atomic-crm/providers/supabase/resources.ts`
- `/src/atomic-crm/providers/supabase/typeGuards.ts`

---

## Recommendations Summary

### CRITICAL - Fix Now (P0)
**TD-001: Add snake_case aliases to ValidationService**
```typescript
// In ValidationService.ts validationRegistry, add after each camelCase entry:
contact_notes: this.validationRegistry.contactNotes,
opportunity_notes: this.validationRegistry.opportunityNotes,
organization_notes: this.validationRegistry.organizationNotes,
```
Or normalize resource names in the `validate()` method before lookup.

### Immediate Actions (P1)
1. Add snake_case aliases to filterRegistry for consistency
2. Add notifications validation to prevent malformed data

### Short-term (P2)
1. Consolidate DRY violations in callbacks (stripComputedFields, beforeGetList pattern)
2. Add junction table validation schemas

### Long-term (P3)
1. Documentation cleanup and standardization
2. Performance micro-optimizations (cache warming, single-pass transforms)
3. Architectural decision on direct Supabase calls vs DataProvider abstraction

---

## Part 2: Silent Fallback Anti-Pattern Audit

*Added 2026-01-08 - Comprehensive check for "graceful degradation" patterns that hide bugs*

This section documents 6 additional discovery checks for silent fallback patterns that prioritize "don't crash" over correctness.

---

### Summary Matrix

| Check | Area | Critical | High | Medium | Low |
|-------|------|----------|------|--------|-----|
| **1** | Auth Default Allow | 1 | 0 | 1 | 0 |
| **2** | API Error Swallowing | 0 | 0 | 1 | 2 |
| **3** | Zod safeParse Misuse | 2 | 0 | 0 | 0 |
| **4** | Switch Fall-Through | 1 | 5 | 3 | 1 |
| **5** | Env Var Fallbacks | 1 | 1 | 0 | 0 |
| **6** | Filter Over-Fetch | 2 | 1 | 1 | 0 |
| **TOTAL** | | **7** | **7** | **6** | **3** |

---

### Check 1: Default Allow Security Trap

#### [SF-C01] CRITICAL: SECURITY DEFINER Views Bypass RLS
- **Files:** 6 database views (`authorization_status`, `dashboard_principal_summary`, `organizations_with_account_manager`, `principal_pipeline_summary`, `priority_tasks`, `principal_opportunities`)
- **Issue:** Views use `SECURITY DEFINER` which enforces RLS of the view creator (admin), not the querying user
- **Impact:** Silent permission escalation - users see data as if they're the schema owner
- **Fix:** Change to `SECURITY INVOKER`
- **Remediation URL:** https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view

#### [SF-M01] MEDIUM: Permissive RLS Policies (Intentional)
- **Files:** 31 RLS policies in `consolidate_rls_policies.sql`
- **Issue:** Many policies use `WITH CHECK (true)` for INSERT/UPDATE
- **Status:** Intentional architecture decision for team-wide collaboration, but contradicts code comments claiming RLS enforces ownership
- **Action:** Document this decision explicitly or add ownership checks

#### ✅ SECURE: Frontend Permission Defaults
- `canAccess.ts:75` returns `false` for unknown roles
- `authProvider.ts:103` returns `false` when user is null
- Component guards properly redirect unauthorized users

---

### Check 2: API Error Swallowing (Empty List Lie)

#### [SF-M02] MEDIUM: useRecentSearches Silent Failure
- **File:** `src/atomic-crm/hooks/useRecentSearches.ts:67-69`
- **Code:** `catch (e) { console.error(...); return []; }`
- **Issue:** Storage read failures return empty array, user sees "No recent searches" instead of error
- **Impact:** Non-critical UX issue, corrupted localStorage invisible to user

#### ✅ SAFE Patterns Found:
- `safeJsonParse.ts` - Intentional security pattern, caller handles null
- `SampleStatusBadge.tsx` - Correct React Admin error callback pattern
- Service layer properly throws errors instead of returning empty collections

---

### Check 3: Safe Parse Data Loss

#### [SF-C02] CRITICAL: DigestService Unsafe Cast on Validation Failure
- **File:** `src/atomic-crm/services/digest.service.ts:282-289`
- **Code:**
  ```typescript
  const parsed = UserDigestSummarySchema.safeParse(data);
  if (!parsed.success) {
    console.warn("[DigestService] Digest summary validation warning", {...});
    return data as UserDigestSummarySchema;  // UNSAFE CAST!
  }
  ```
- **Issue:** Returns unvalidated data via unsafe type cast when schema fails
- **Impact:** Corrupted digest data reaches UI (wrong deal counts, task lists)

#### [SF-C03] CRITICAL: DigestService generateDailyDigests Same Pattern
- **File:** `src/atomic-crm/services/digest.service.ts:313-319`
- **Issue:** Same unsafe cast pattern in digest generation
- **Impact:** Background jobs marked "successful" with corrupted data, no retry triggered

#### ✅ CORRECT Patterns Found:
- `customMethodsExtension.ts:486-492` - Throws on safeParse failure
- `organizationImport.logic.ts:216-239` - Separates valid/invalid records
- `secureStorage.ts:84-93` - Returns null with proper error handling

---

### Check 4: Fall-Through Switch (Silent Defaults)

*Note: No traditional switch statements found; analysis covers equivalent `.find()` fallback patterns*

#### [SF-C04] CRITICAL: Stage Grouping Silently Reclassifies Invalid Stages
- **File:** `src/atomic-crm/opportunities/constants/stages.ts:80-89`
- **Code:**
  ```typescript
  if (acc[opportunity.stage]) {
    acc[opportunity.stage].push(opportunity);
  } else {
    console.warn("[Stage Grouping] Invalid stage detected:", {...});
    acc["new_lead"].push({ ...opportunity, stage: "new_lead" });  // Silent reclassification!
  }
  ```
- **Issue:** Invalid stages silently moved to "new_lead" with only console warning
- **Impact:** Data integrity loss - opportunities appear in wrong pipeline column

#### [SF-H01-H05] HIGH: Stage Helper Functions Silent Fallbacks
- **File:** `src/atomic-crm/opportunities/constants/stageConstants.ts:137-164`
- **Functions affected:**
  - `getOpportunityStageLabel()` → returns raw enum value
  - `getOpportunityStageColor()` → returns `"var(--muted)"`
  - `getOpportunityStageDescription()` → returns empty string
  - `getOpportunityStageElevation()` → returns `2` (medium)
  - `getOpportunityMfbPhase()` → returns `null`
- **Risk:** New stages added to database but not to constants would silently use fallbacks

#### [SF-M03-M05] MEDIUM: Tag Color Silent Defaults
- **Files:** `tag-colors.ts:25-49`, `validation/tags.ts:38-49`
- **Issue:** Unknown tag colors silently default to "gray"
- **Impact:** Visual-only, less critical than stage handling

---

### Check 5: Configuration Fallback Illusion

#### [SF-C05] CRITICAL: Sentry Release Version Fallback
- **File:** `src/main.tsx:20`
- **Code:** `release: import.meta.env.VITE_APP_VERSION || import.meta.env.VITE_COMMIT_SHA || "dev"`
- **Issue:** Production builds without version vars tagged as `"dev"` in Sentry
- **Impact:** Error monitoring unusable - production errors mixed with development

#### [SF-H06] HIGH: Test File Production URL Fallback
- **File:** `src/atomic-crm/tests/unifiedDataProvider.test.ts:10-11`
- **Code:** `const url = process.env.VITE_SUPABASE_URL || "https://aaqnanddcqvfiwhshndl.supabase.co"`
- **Issue:** Tests fall back to production Supabase URL if env missing
- **Impact:** Could accidentally corrupt production data

#### ✅ CORRECT Pattern Found:
- `supabase.ts:19-26` - Throws if required env vars missing (use as template)

---

### Check 6: Missing Filter Over-Fetch

#### [SF-C06] CRITICAL: getMany/getManyReference Bypass Filter Validation
- **File:** `src/atomic-crm/providers/supabase/composedDataProvider.ts:179-192`
- **Issue:** `getMany()` and `getManyReference()` do NOT call `applySearchParams()` like `getList()` does
- **Impact:** Filter validation completely bypassed for these methods
- **Compare:** `getList()` (line 158-166) properly calls `applySearchParams()`

#### [SF-C07] CRITICAL: withValidation Wrapper Incomplete Coverage
- **File:** `src/atomic-crm/providers/supabase/wrappers/withValidation.ts:100-161`
- **Issue:** Only wraps `create`, `update`, `getList` - NOT `getMany`, `getManyReference`, `delete`
- **Impact:** These methods pass through without validation

#### [SF-H07] HIGH: ValidationService Graceful Degradation
- **File:** `src/atomic-crm/providers/supabase/services/ValidationService.ts:277-290`
- **Code:** `if (!allowedFields) { return filters; }`
- **Issue:** Unknown resources silently allow ALL filters instead of throwing
- **Impact:** New resources without filterRegistry entries accept any filter

---

### Updated Technical Debt Priority

#### P0 - Fix Before Production Data
| ID | Issue | Effort |
|----|-------|--------|
| SF-C01 | SECURITY DEFINER views → SECURITY INVOKER | S |
| SF-C02/C03 | DigestService unsafe casts → throw on failure | S |
| SF-C04 | Stage reclassification → throw instead of silent move | S |
| CRITICAL-001 | ValidationService casing mismatch (from Part 1) | S |

#### P1 - Fix This Sprint
| ID | Issue | Effort |
|----|-------|--------|
| SF-C05 | Sentry release fallback → throw if not set in prod | S |
| SF-H06 | Test file production URL → require explicit env | S |
| SF-C06/C07 | getMany/getManyReference filter bypass → add applySearchParams | M |
| SF-H07 | ValidationService graceful degrade → throw for unknown resources | S |

#### P2 - Technical Debt
| ID | Issue | Effort |
|----|-------|--------|
| SF-H01-H05 | Stage helper fallbacks → add exhaustive guards | M |
| SF-M03-M05 | Tag color fallbacks → consider throwing | S |
| SF-M01 | Document RLS "team-wide" decision or add ownership checks | M |

---

### Secure Patterns Reference (Copy These)

```typescript
// ✅ Environment validation (supabase.ts:19-26)
const requiredEnvVars = ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"];
const missing = requiredEnvVars.filter((key) => !import.meta.env[key]);
if (missing.length > 0) {
  throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
}

// ✅ SafeParse with proper error (customMethodsExtension.ts:486-492)
const validationResult = schema.safeParse(params);
if (!validationResult.success) {
  throw new Error(`Invalid params: ${validationResult.error.message}`);
}

// ✅ Auth default deny (canAccess.ts:75)
return false;  // Unknown roles denied by default
```

---

### Check 7: Zombie Child (CASCADE vs Soft Delete Conflict)

**SQL Query Used:**
```sql
SELECT conname, conrelid::regclass, confrelid::regclass
FROM pg_constraint WHERE confdeltype = 'c';
```

#### [SF-C08] CRITICAL: 20 CASCADE Constraints on Soft-Delete Tables

The application uses **soft deletes** (`deleted_at` column), but the database has **ON DELETE CASCADE** foreign keys. If a hard DELETE occurs (admin action, bug, or migration), child records are **silently destroyed**.

**Dangerous CASCADE Constraints Found:**

| Child Table | Parent Table | Constraint | Risk |
|-------------|--------------|------------|------|
| `activities` | `contacts` | `activities_contact_id_fkey` | **CRITICAL** - Contact hard-delete wipes all activities |
| `contact_notes` | `contacts` | `contact_notes_contact_id_fkey` | **CRITICAL** - Contact hard-delete wipes all notes |
| `tasks` | `contacts` | `tasks_contact_id_fkey` | **CRITICAL** - Contact hard-delete wipes all tasks |
| `opportunity_notes` | `opportunities` | `opportunity_notes_opportunity_id_fkey` | **CRITICAL** - Opportunity hard-delete wipes notes |
| `opportunity_participants` | `opportunities` | `opportunity_participants_opportunity_id_fkey` | **CRITICAL** |
| `opportunity_contacts` | `opportunities` | `opportunity_contacts_opportunity_id_fkey` | **CRITICAL** |
| `opportunity_contacts` | `contacts` | `opportunity_contacts_contact_id_fkey` | **CRITICAL** |
| `opportunity_products` | `opportunities` | `opportunity_products_opportunity_id_fkey` | **CRITICAL** |
| `opportunity_products` | `products` | `opportunity_products_product_id_reference_fkey` | **HIGH** |
| `organization_notes` | `organizations` | `organization_notes_organization_id_fkey` | **CRITICAL** |
| `distributor_principal_authorizations` | `organizations` | `*_principal_id_fkey` | **HIGH** |
| `distributor_principal_authorizations` | `organizations` | `*_distributor_id_fkey` | **HIGH** |
| `organization_distributors` | `organizations` | `*_organization_id_fkey` | **HIGH** |
| `organization_distributors` | `organizations` | `*_distributor_id_fkey` | **HIGH** |
| `product_distributors` | `products` | `fk_product_distributors_product` | **HIGH** |
| `product_distributors` | `organizations` | `fk_product_distributors_distributor` | **HIGH** |
| `interaction_participants` | `activities` | `interaction_participants_activity_id_fkey` | **MEDIUM** |
| `sales` | `auth.users` | `sales_user_id_fkey` | **MEDIUM** - Auth user delete wipes sales record |
| `notifications` | `auth.users` | `notifications_user_id_fkey` | **LOW** |
| `dashboard_snapshots` | `sales` | `dashboard_snapshots_sales_id_fkey` | **LOW** |

**Scenario:**
1. Admin runs: `DELETE FROM contacts WHERE id = 123;` (or migration bug)
2. PostgreSQL CASCADE silently executes:
   - `DELETE FROM activities WHERE contact_id = 123;`
   - `DELETE FROM contact_notes WHERE contact_id = 123;`
   - `DELETE FROM tasks WHERE contact_id = 123;`
   - `DELETE FROM opportunity_contacts WHERE contact_id = 123;`
3. All related data **permanently destroyed** with no soft-delete trace

**Fix Options:**
1. **Change to `ON DELETE RESTRICT`** - Prevents hard delete if children exist (safest)
2. **Change to `ON DELETE SET NULL`** - Orphans children but preserves data
3. **Add database trigger** - Block hard DELETE on soft-delete tables

**Migration Example:**
```sql
-- Replace CASCADE with RESTRICT
ALTER TABLE activities
  DROP CONSTRAINT activities_contact_id_fkey,
  ADD CONSTRAINT activities_contact_id_fkey
    FOREIGN KEY (contact_id) REFERENCES contacts(id)
    ON DELETE RESTRICT;
```

---

### Check 8: IDOR Hole in getMany/getManyReference

#### [SF-C09] CRITICAL: getMany Allows Cross-Tenant ID Fetching

**File:** `src/atomic-crm/providers/supabase/composedDataProvider.ts:179-184`

**Code:**
```typescript
getMany: async <RecordType extends RaRecord = RaRecord>(
  resource: string,
  params: Parameters<DataProvider["getMany"]>[1]
) => {
  const provider = getProviderForResource(resource);
  return provider.getMany<RecordType>(resource, params);  // ← No tenancy filter!
},
```

**Issue:**
- `getMany()` generates: `SELECT * FROM table WHERE id IN (1, 2, 3, ...)`
- **No tenancy/ownership filter is applied**
- RLS policies only check `deleted_at IS NULL`, not ownership

**Attack Scenario:**
1. Attacker knows their contact ID is `100`
2. Attacker guesses competitor's contact ID is `999`
3. Attacker calls: `dataProvider.getMany("contacts", { ids: [100, 999] })`
4. API returns **both records** (200 OK) because RLS allows all authenticated users to SELECT
5. **Silent data leak** - no error, no audit trail

**Proof - RLS Policy from Check 1:**
```sql
-- Current RLS (from consolidate_rls_policies.sql)
CREATE POLICY "select_contacts" ON contacts
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);  -- ← No ownership check!
```

**Affected Methods:**
- `getMany()` - Fetch multiple by ID array
- `getManyReference()` - Fetch related records by FK
- `getOne()` - Fetch single by ID (same issue)

**Why This is "Silent":**
- TypeScript happy ✓
- API returns 200 OK ✓
- User sees data ✓
- **But it's someone else's data**

**Fix Options:**

1. **Add ownership to RLS** (recommended):
```sql
CREATE POLICY "select_contacts" ON contacts
  FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      -- User can see contacts they created
      created_by = auth.uid()
      -- OR contacts in their organization
      OR organization_id IN (
        SELECT organization_id FROM sales WHERE user_id = auth.uid()
      )
    )
  );
```

2. **Add filter in composedDataProvider**:
```typescript
getMany: async (resource, params) => {
  // Inject ownership filter
  const tenantParams = await injectTenancyFilter(resource, params);
  return provider.getMany(resource, tenantParams);
},
```

---

### Updated Summary Matrix (All 8 Checks)

| Check | Area | Critical | High | Medium | Low |
|-------|------|----------|------|--------|-----|
| **1** | Auth Default Allow | 1 | 0 | 1 | 0 |
| **2** | API Error Swallowing | 0 | 0 | 1 | 2 |
| **3** | Zod safeParse Misuse | 2 | 0 | 0 | 0 |
| **4** | Switch Fall-Through | 1 | 5 | 3 | 1 |
| **5** | Env Var Fallbacks | 1 | 1 | 0 | 0 |
| **6** | Filter Over-Fetch | 2 | 1 | 1 | 0 |
| **7** | Zombie Child CASCADE | 1 | 6 | 1 | 2 |
| **8** | IDOR in getMany | 1 | 0 | 0 | 0 |
| **TOTAL** | | **9** | **13** | **7** | **5** |

---

### Final Priority Matrix

#### P0 - SECURITY/DATA LOSS (Fix Before Any User Data)
| ID | Issue | Effort | Type |
|----|-------|--------|------|
| SF-C01 | SECURITY DEFINER views → SECURITY INVOKER | S | Security |
| SF-C08 | CASCADE → RESTRICT on soft-delete tables | M | Data Loss |
| SF-C09 | Add ownership RLS or tenancy filter to getMany | M | Security |
| CRITICAL-001 | ValidationService casing mismatch | S | Correctness |

#### P0.5 - Data Integrity
| ID | Issue | Effort |
|----|-------|--------|
| SF-C02/C03 | DigestService unsafe casts → throw on failure | S |
| SF-C04 | Stage reclassification → throw instead of silent move | S |

#### P1 - Fix This Sprint
| ID | Issue | Effort |
|----|-------|--------|
| SF-C05 | Sentry release fallback → throw if not set in prod | S |
| SF-H06 | Test file production URL → require explicit env | S |
| SF-C06/C07 | getMany/getManyReference filter bypass → add applySearchParams | M |

---

## Part 3: System-Level Audit (RPC, Storage, TypeScript)

*Added 2026-01-08 - Final 3 checks covering Logic Layer, Storage Layer, and Type System*

---

### Check 9: Swallowed Exception in RPC Functions

**SQL Query Used:**
```sql
SELECT routine_name, prosrc FROM pg_proc p
JOIN information_schema.routines r ON r.routine_name = p.proname
WHERE p.prosrc ILIKE '%EXCEPTION%' AND r.routine_schema = 'public';
```

**Result: 24 functions with EXCEPTION blocks examined**

#### ✅ SAFE: Functions That Properly Re-raise Errors

| Function | Pattern | Status |
|----------|---------|--------|
| `complete_task_with_followup` | `EXCEPTION WHEN OTHERS THEN RAISE EXCEPTION '...', SQLERRM;` | **SAFE** |
| `create_booth_visitor_opportunity` | `EXCEPTION WHEN OTHERS THEN RAISE EXCEPTION '...', SQLERRM;` | **SAFE** |
| `sync_opportunity_with_products` (3 versions) | `EXCEPTION ... RAISE EXCEPTION 'CONFLICT...'` | **SAFE** |
| `admin_update_sale` | Uses `RAISE EXCEPTION ... USING ERRCODE` | **SAFE** |
| `archive_opportunity_with_relations` | Uses `RAISE EXCEPTION` for validation | **SAFE** |
| `check_organization_cycle` | Uses `RAISE EXCEPTION` for cycle detection | **SAFE** |
| `enforce_sales_column_restrictions` | Uses `RAISE EXCEPTION ... USING ERRCODE = 'P0003'` | **SAFE** |
| `get_sale_by_id` / `get_sale_by_user_id` | Uses `RAISE EXCEPTION` for auth | **SAFE** |
| `log_engagement` / `log_interaction` | Uses `RAISE EXCEPTION` for validation | **SAFE** |
| `prevent_organization_cycle` | Uses `RAISE EXCEPTION` for cycle | **SAFE** |
| `set_opportunity_owner_defaults` | Uses `RAISE EXCEPTION` for validation | **SAFE** |
| All `validate_*` trigger functions | Use `RAISE EXCEPTION` for validation | **SAFE** |

#### [SF-M06] MEDIUM: process_digest_opt_out Returns Error Object

- **Function:** `process_digest_opt_out`
- **Code:**
  ```sql
  EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'Invalid token format');
  ```
- **Issue:** Catches ALL exceptions and returns error JSON instead of raising
- **Impact:** Non-critical - this is a user-facing unsubscribe function where friendly errors are intentional
- **Risk:** If database has internal error, user sees "Invalid token format" instead of actual issue
- **Status:** Acceptable for user-facing endpoint, but overly broad catch

#### Summary: RPC Functions are Well-Designed

The Crispy CRM RPC functions follow a **proper exception handling pattern**:
- Use `RAISE EXCEPTION` with descriptive messages
- Include `USING ERRCODE` for HTTP status mapping
- Include `SQLERRM` for debugging context

**No critical swallowed exceptions found in RPC layer.**

---

### Check 10: Orphaned File Leak (Storage)

**Search Pattern Used:**
```
afterDelete.*avatar|afterDelete.*logo|cleanup.*storage
```

#### [SF-C10] CRITICAL: No Storage Cleanup on Record Deletion

**Finding:** Zero files matched the storage cleanup pattern in callbacks.

**Analysis:**
- `StorageService.remove()` exists at `services/StorageService.ts:112`
- `storage.remove()` exists in `customMethodsExtension.ts:584`
- **BUT:** Neither is called from any `afterDelete` lifecycle callback

**Files That Upload Without Delete Cleanup:**

| Resource | Upload Location | Storage Bucket | Cleanup? |
|----------|-----------------|----------------|----------|
| Contacts | Avatar upload | `avatars` | ❌ **NONE** |
| Organizations | Logo upload | `logos` | ❌ **NONE** |
| Contact Notes | Attachments | `attachments` | ❌ **NONE** |
| Opportunity Notes | Attachments | `attachments` | ❌ **NONE** |
| Organization Notes | Attachments | `attachments` | ❌ **NONE** |

**Leak Scenario:**
1. User uploads contact avatar → file stored in `avatars/user-123.jpg`
2. Contact is soft-deleted → `contacts.deleted_at = NOW()`
3. Avatar file remains in storage **forever**
4. Over time: storage costs accumulate, GDPR violation risk

**Impact:**
- **Cost:** Orphaned files accumulate, increasing storage bills
- **GDPR/Privacy:** "Deleted" user data still exists in storage
- **No Audit Trail:** No way to know which files are orphaned

**Fix Options:**

1. **Add afterDelete callbacks to clean storage:**
```typescript
// In contactsCallbacks.ts
afterDelete: async (resource, params, result) => {
  if (result.data?.avatar_url) {
    const path = extractPathFromUrl(result.data.avatar_url);
    await dataProvider.storage.remove("avatars", [path]);
  }
  return result;
}
```

2. **Add storage cleanup cron job:**
```sql
-- Find orphaned files
SELECT path FROM storage.objects o
LEFT JOIN contacts c ON o.path LIKE '%' || c.id || '%'
WHERE c.id IS NULL AND o.bucket_id = 'avatars';
```

3. **Use database trigger on soft delete:**
```sql
CREATE FUNCTION cleanup_contact_avatar() RETURNS trigger AS $$
BEGIN
  PERFORM storage.delete('avatars', OLD.avatar_url);
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;
```

---

### Check 11: "Any" Type Virus (TypeScript)

**Search Pattern Used:**
```
:\s*any[;,\s\)\]\}]|:\s*any$|as\s+any|Record<string,\s*any>
```

**Result:** 182 occurrences across 46 files (count excludes test file content)

#### Analysis by Category:

| Category | Count | Risk Level |
|----------|-------|------------|
| Test files (`*.test.ts`, `*.test.tsx`) | ~150 | ✅ Acceptable |
| React Admin generic constraints | ~20 | ✅ Acceptable |
| Library integration types | ~8 | ⚠️ Low |
| Actual unsafe `any` | ~4 | 🔴 Review needed |

#### ✅ SAFE: Generic Type Constraints (React Admin Pattern)

These are acceptable React Admin patterns for generic record types:

```typescript
// src/components/admin/date-field.tsx:31
const DateFieldImpl = <RecordType extends Record<string, any> = Record<string, any>>(...)

// src/components/admin/text-field.tsx:5
export const TextField = <RecordType extends Record<string, any> = Record<string, any>>(...)
```

**Why Safe:** These define type bounds, not function parameters. TypeScript still type-checks the usage.

**Files using this pattern (8 files):**
- `date-field.tsx`, `url-field.tsx`, `record-field.tsx`
- `text-field.tsx`, `number-field.tsx`, `email-field.tsx`
- `select-field.tsx`, `file-field.tsx`

#### ⚠️ LOW RISK: Dynamic Object Types

```typescript
// src/atomic-crm/hooks/useFilterCleanup.ts:93
const cleanedFilter: Record<string, any> = {};

// src/atomic-crm/hooks/useSmartDefaults.ts:7
reset?: (values: Record<string, any>, options?: ...) => void;
```

**Why Low Risk:** Used for dynamic filter/form objects where structure varies by resource.

**Improvement:** Could use generic type parameter instead:
```typescript
const cleanedFilter: Record<string, FilterValue> = {};
```

#### ✅ NO CRITICAL `any` USAGE IN PRODUCTION CODE

The audit confirms:
1. DigestService unsafe casts (already flagged in Check 3) remain the only critical `any` issue
2. Most `any` usage is in test files (expected for mock typing)
3. Production `any` is limited to React Admin generic constraints

---

## Part 4: Concurrency & Async Safety Audit (Checks 12-13)

### Check 12: "Last Write Wins" (Race Conditions)

**Purpose:** Detect missing optimistic locking that causes silent data overwrites when two users edit the same record simultaneously.

**Search Pattern Used:**
```
version|expected_version|optimistic.*lock|concurrent
```

#### [SF-C12] CRITICAL: Optimistic Locking EXISTS But NOT ENFORCED

**Finding:** The `opportunities` table has version-based concurrency protection, but it is **never activated** due to a missing parameter in the handler chain.

**The Complete Version Checking Infrastructure:**

| Component | Status | Location |
|-----------|--------|----------|
| `version` column on opportunities | ✅ Exists | Migration 20251222034729 |
| Auto-increment trigger | ✅ Exists | `increment_opportunity_version` trigger |
| RPC `expected_version` parameter | ✅ Exists | `sync_opportunity_with_products` RPC |
| CONFLICT exception on mismatch | ✅ Exists | RAISE EXCEPTION in RPC line 179 |
| UI conflict error handler | ✅ Exists | `OpportunityEdit.tsx:34-39` |
| **Handler passes version to service** | ❌ **MISSING** | `opportunitiesHandler.ts:173` |

**Root Cause - Handler Never Passes Version:**

```typescript
// opportunitiesHandler.ts:173-176
const result = await service.updateWithProducts(
  params.id,
  validatedData,
  previousProducts
  // ❌ MISSING: previousVersion = params.previousData?.version
);
```

**Service Signature Shows Optional 4th Param:**

```typescript
// opportunities.service.ts:140-144
async updateWithProducts(
  id: Identifier,
  data: Partial<OpportunityUpdateInput>,
  previousProducts: Product[] = [],
  previousVersion?: number  // ← This is NEVER passed!
)
```

**Why Version Check Never Triggers:**

```typescript
// opportunities.service.ts:153
if (productsToSync.length === 0 && previousVersion === undefined) {
  // ← ALWAYS TRUE when previousVersion is undefined!
  // Uses standard update WITHOUT version check
}
```

**Race Condition Scenario:**
1. User A opens Opportunity #123 (version=5)
2. User B opens Opportunity #123 (version=5)
3. User A saves changes → version becomes 6
4. User B saves changes → **SHOULD raise CONFLICT** but doesn't
5. User B's changes silently overwrite User A's → **DATA LOSS**

**Impact:** Critical - silent data loss in multi-user scenarios

**Fix Required:**

```typescript
// opportunitiesHandler.ts - Add version pass-through
const result = await service.updateWithProducts(
  params.id,
  validatedData,
  previousProducts,
  (params.previousData as { version?: number })?.version  // Pass version!
);
```

---

#### [SF-C13] CRITICAL: Other Resources Have ZERO Concurrency Protection

**Finding:** Only `opportunities` has version infrastructure. All other resources allow unrestricted "last write wins":

| Resource | Has `version` Column | Impact |
|----------|---------------------|--------|
| opportunities | ✅ (but not enforced) | Critical |
| **contacts** | ❌ NONE | Critical - customer data overwritten |
| **organizations** | ❌ NONE | Critical - company data overwritten |
| **tasks** | ❌ NONE | High - work items lost |
| **activities** | ❌ NONE | High - activity log corrupted |
| **products** | ❌ NONE | Medium - catalog inconsistency |
| **sales** | ❌ NONE | Medium - user profiles overwritten |

**Impact:** Any resource edited simultaneously by two users will silently lose one user's changes.

---

### Check 13: "Floating Promise" (Fire-and-Forget)

**Purpose:** Detect async operations that aren't awaited, causing errors to be silently swallowed while the caller assumes success.

**Search Patterns Used:**
```
.then(|.catch(
void\s+\w+\(
mutate(
dataProvider.update|create|delete
```

#### [SF-L13] LOW: Floating Promise Audit Results

**Finding:** The codebase has GOOD async hygiene overall.

**Evidence of Proper Patterns:**

1. **DataProvider calls properly awaited:**
   ```typescript
   // All 35+ dataProvider.create/update calls use await + try/catch
   const result = await dataProvider.create("organizations", { data });
   ```

2. **Optimistic updates have rollback:**
   ```typescript
   // useMyTasks.ts:154-178 - Exemplary pattern
   try {
     await dataProvider.update("tasks", {...});
     setOptimisticUpdates(prev => ...); // Clear on success
   } catch (err) {
     setOptimisticUpdates(prev => ...); // Rollback on failure
     throw err;  // Re-throw for caller awareness
   }
   ```

3. **setTimeout usage is UI-only:**
   - Focus management delays
   - Accessibility announcements
   - Debouncing - no data operations

4. **refresh() returns void:**
   - React Admin's `refresh()` is designed as fire-and-forget
   - Triggers background refetch, UI eventually syncs

**Minor Concerns:**

| Pattern | Location | Risk |
|---------|----------|------|
| `.then().catch()` in hooks | `useReportData.ts:110-116` | ⚠️ Low - properly chained |
| `fetch().then()` for blobs | `StorageService.ts:45` | ⚠️ Low - inside await |

**Conclusion:** No critical floating promise issues found. The codebase demonstrates defensive async patterns with proper error propagation.

---

### Updated Summary Matrix (All 13 Checks)

| Check | Area | Critical | High | Medium | Low |
|-------|------|----------|------|--------|-----|
| **1** | Auth Default Allow | 1 | 0 | 1 | 0 |
| **2** | API Error Swallowing | 0 | 0 | 1 | 2 |
| **3** | Zod safeParse Misuse | 2 | 0 | 0 | 0 |
| **4** | Switch Fall-Through | 1 | 5 | 3 | 1 |
| **5** | Env Var Fallbacks | 1 | 1 | 0 | 0 |
| **6** | Filter Over-Fetch | 2 | 1 | 1 | 0 |
| **7** | Zombie Child CASCADE | 1 | 6 | 1 | 2 |
| **8** | IDOR in getMany | 1 | 0 | 0 | 0 |
| **9** | Swallowed RPC Exceptions | 0 | 0 | 1 | 0 |
| **10** | Orphaned File Leak | 1 | 0 | 0 | 0 |
| **11** | Any Type Virus | 0 | 0 | 0 | 2 |
| **12** | Last Write Wins (Race) | 2 | 0 | 0 | 0 |
| **13** | Floating Promise | 0 | 0 | 0 | 1 |
| **TOTAL** | | **12** | **13** | **8** | **8** |

---

### Final Priority Matrix (Complete)

#### P0 - SECURITY/DATA LOSS (Fix Before Production)
| ID | Issue | Effort | Type |
|----|-------|--------|------|
| SF-C01 | SECURITY DEFINER views → SECURITY INVOKER | S | Security |
| SF-C08 | CASCADE → RESTRICT on soft-delete tables | M | Data Loss |
| SF-C09 | Add ownership RLS or tenancy filter to getMany | M | Security |
| SF-C10 | Add storage cleanup on record deletion | M | Data Leak |
| SF-C12 | **Pass version to service for optimistic locking** | S | Data Loss |
| SF-C13 | **Add version columns to contacts/organizations** | M | Data Loss |
| CRITICAL-001 | ValidationService casing mismatch | S | Correctness |

#### P0.5 - Data Integrity
| ID | Issue | Effort |
|----|-------|--------|
| SF-C02/C03 | DigestService unsafe casts → throw on failure | S |
| SF-C04 | Stage reclassification → throw instead of silent move | S |

#### P1 - Fix This Sprint
| ID | Issue | Effort |
|----|-------|--------|
| SF-C05 | Sentry release fallback → throw if not set in prod | S |
| SF-H06 | Test file production URL → require explicit env | S |
| SF-C06/C07 | getMany/getManyReference filter bypass | M |

#### P2 - Technical Debt
| ID | Issue | Effort |
|----|-------|--------|
| SF-H01-H05 | Stage helper fallbacks → add exhaustive guards | M |
| SF-M06 | process_digest_opt_out → narrow exception catch | S |
| Low risk `any` | Replace `Record<string, any>` with specific types | S |
| SF-L13 | Audit remaining .then()/.catch() patterns | S |

---

*Complete Provider Audit (13 checks) completed by Claude Code - 2026-01-08*
