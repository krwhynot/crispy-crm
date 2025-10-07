# UI/UX Testing Automation - Shared Architecture Reference

This document provides high-level architectural information about files, tables, patterns, and documentation relevant to implementing comprehensive UI/UX testing automation for the Atomic CRM application.

## Architecture Overview

The Atomic CRM is built on a three-tier architecture: **(1) React Admin 5** orchestrates CRUD operations and routing through a **unified Supabase data provider** that validates all mutations with **Zod schemas at the API boundary**, **(2) shadcn/ui components** provide the base UI layer with semantic OKLCH color variables enforced by the Engineering Constitution (no hex codes), and **(3) a PostgreSQL database via Supabase** manages data with JSONB arrays for flexible contact information, junction tables for multi-organization relationships, and simple authenticated-only RLS policies. Testing this architecture requires E2E browser automation (Playwright), component integration tests (Vitest + React Testing Library), and visual regression testing (Storybook + Chromatic) to validate the complete stack from UI interactions through database persistence.

**🆕 CRITICAL TESTING GAPS ADDRESSED** (Expert Analysis): The testing plan now includes **(1) Authorization/RBAC testing** for admin vs. non-admin role differentiation, **(2) API error state testing** to verify UI behavior on 500 errors and RLS violations, **(3) Robust cleanup strategy** with `safeCleanup()` helper to prevent cascading test failures, **(4) Test selector strategy** mandating user-facing selectors over brittle CSS/text, **(5) Accessibility workflow** with formal a11y testing at component and E2E levels, and **(6) Flaky test policy** for quarantining unreliable tests.

## Relevant Files

### Core Application Architecture
- `/home/krwhynot/Projects/atomic/src/main.tsx`: Application entry point, renders App component
- `/home/krwhynot/Projects/atomic/src/App.tsx`: Root component, renders CRM component
- `/home/krwhynot/Projects/atomic/src/atomic-crm/root/CRM.tsx`: React Admin configuration with resource registration, auth provider, data provider, layout, and requireAuth protection
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/unifiedDataProvider.ts`: Single data provider (870 lines) implementing all CRUD operations with validation-first-transform-second pattern
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/authProvider.ts`: Authentication provider wrapping ra-supabase-core with custom identity fetching from sales table

### Form Components (High Test Priority)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityCreate.tsx`: Create form with transform function extracting products to products_to_sync for RPC processing
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityEdit.tsx`: Edit form with tabs, products RPC, and pessimistic mutation mode
- `/home/krwhynot/Projects/atomic/src/atomic-crm/contacts/ContactCreate.tsx`: Contact creation with JSONB email/phone arrays and multi-organization junction table handling
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityInputs.tsx`: Shared input components for create/edit with mode-based conditional rendering

### List Components (Medium Test Priority)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityList.tsx`: Complex list with kanban view, localStorage filter persistence, dynamic filter choices, and soft delete filtering
- `/home/krwhynot/Projects/atomic/src/atomic-crm/contacts/ContactList.tsx`: List using contacts_summary view with sidebar filters and custom exporter
- `/home/krwhynot/Projects/atomic/src/atomic-crm/contacts/ContactListFilter.tsx`: Sidebar filter with FilterLiveForm and ToggleFilterButton components

### Admin Layer Components
- `/home/krwhynot/Projects/atomic/src/components/admin/form.tsx`: Form wrapper with FormField, FormLabel, FormControl, FormError, SaveButton - all inputs must use these for validation display
- `/home/krwhynot/Projects/atomic/src/components/admin/text-input.tsx`: Wraps Input/Textarea from ui/ with useInput() hook for React Admin integration
- `/home/krwhynot/Projects/atomic/src/components/admin/select-input.tsx`: Wraps Select from ui/ with choices/reference support and Radix bug workaround (key-based remounting)
- `/home/krwhynot/Projects/atomic/src/components/admin/data-table.tsx`: Data grid using Table, Checkbox, Button, Tooltip, Alert from ui/ with sorting, selection, bulk actions

### Base UI Components (src/components/ui/)
- `/home/krwhynot/Projects/atomic/src/components/ui/button.tsx`: 6 variants × 4 sizes (24 combinations) using class-variance-authority
- `/home/krwhynot/Projects/atomic/src/components/ui/input.tsx`: Text input with focus/invalid states using semantic border and ring colors
- `/home/krwhynot/Projects/atomic/src/components/ui/select.tsx`: Select with trigger, content, items (2 sizes: sm, default)
- `/home/krwhynot/Projects/atomic/src/components/ui/card.tsx`: 7 sub-components for flexible card compositions
- `/home/krwhynot/Projects/atomic/src/components/ui/dialog.tsx`: Modal with overlay, header, footer using Radix Portal rendering
- **32 total base components** (~3,275 lines) - all require Storybook stories for visual regression

### Validation Layer (API Boundary Only)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/opportunities.ts`: Zod schemas (218 lines) with probability 0-100 range, positive amounts, contact_ids array minimum 1, legacy field rejection
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/contacts.ts`: JSONB email/phone array schemas (373 lines) with multi-org superRefine validation requiring exactly one primary organization
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/organizations.ts`: URL and LinkedIn validation patterns
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/tasks.ts`: Task type enum and title field validation
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/services/ValidationService.ts`: Centralized validation registry (160 lines) mapping resources to create/update validators

### Test Infrastructure (Existing)
- `/home/krwhynot/Projects/atomic/vitest.config.ts`: Minimal Vitest setup with jsdom environment - needs expansion for coverage, UI mode, browser mode
- `/home/krwhynot/Projects/atomic/src/setupTests.js`: Global test setup importing @testing-library/jest-dom
- `/home/krwhynot/Projects/atomic/src/tests/setup-mcp.ts`: Cloud database test utilities with retry logic, connection checking, test data namespacing
- `/home/krwhynot/Projects/atomic/tests/performance/opportunity-queries.spec.ts`: Performance benchmark pattern measuring execution time against thresholds
- **~20 existing test files** focused on data/API layer - ZERO UI component tests

### Environment & Configuration
- `/home/krwhynot/Projects/atomic/.env`: Supabase credentials (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY)
- `/home/krwhynot/Projects/atomic/src/index.css`: Tailwind CSS 4 with @theme inline block defining 40+ semantic color variables in OKLCH color space
- `/home/krwhynot/Projects/atomic/CLAUDE.md`: Engineering Constitution with mandatory rules (no hex codes, Zod at API boundary only, single data provider)
- `/home/krwhynot/Projects/atomic/package.json`: Dependencies and npm scripts - missing test:ci, test:coverage, test:e2e scripts

### CI/CD
- `/home/krwhynot/Projects/atomic/.github/workflows/check.yml`: GitHub Actions workflow with BROKEN test step (references non-existent Makefile)
- **CRITICAL FIX NEEDED**: Replace `make test-ci` with `npm run test:ci`

## Relevant Tables

### Core Tables
- **contacts**: Person entities with JSONB email/phone arrays `[{email: string, type: "Work"|"Home"|"Other"}]`, search_tsv for full-text search, soft delete via deleted_at
- **organizations**: Companies with parent_organization_id for hierarchies, JSONB context_links array of URLs, priority (A/B/C/D)
- **opportunities**: Sales pipeline with multi-org support (customer_organization_id, principal_organization_id, distributor_organization_id), contact_ids bigint array, index integer for kanban drag-drop ordering
- **products**: Catalog with JSONB dimensions/specifications/nutritional_info, arrays for certifications/allergens/image_urls

### Junction Tables (Many-to-Many)
- **contact_organizations**: Contact-organization relationships with is_primary boolean (exactly one per contact required), purchase_influence/decision_authority (0-100), role enum
- **opportunity_participants**: Organizations in opportunities with role ('customer'|'principal'|'distributor'|'partner'|'competitor'), is_primary boolean
- **opportunity_products**: Products in opportunities with quantity, unit_price, discount_percent, GENERATED ALWAYS AS columns for extended_price and final_price

### Support Tables
- **activities**: Engagements/interactions with activity_type enum, arrays for attachments/attendees/tags, follow_up tracking
- **tasks**: Action items with title (renamed from name), task_type enum (Call|Email|Meeting|Follow-up|Proposal|Discovery|Administrative|None), priority enum
- **contactNotes** / **opportunityNotes**: Entity-specific notes with text (required), attachments array, sales_id ownership
- **tags**: Flexible tagging with unique name, color (semantic variables only), usage_count
- **sales**: User/sales rep table with user_id → auth.users, is_admin boolean for role-based access

### Database Views (Denormalized for React Admin)
- **contacts_summary**: All contact columns + organization_ids array_agg + company_name (prioritizes is_primary, then earliest created)
- **opportunities_summary**: Opportunity data + customer_name/principal_name/distributor_name/sales_rep_name + item_count/total_amount computed from opportunity_products
- **organizations_summary**: Organization data + opportunities_count/contacts_count/last_opportunity_activity aggregates

## Relevant Patterns

### Data Provider Pattern (Validation-First-Transform-Second)
**Location**: `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/unifiedDataProvider.ts:166-183`

The critical `processForDatabase()` function MUST validate with original field names BEFORE transforming field names. This allows Zod schemas to validate the `products` field before it's renamed to `products_to_sync` for RPC processing. Testing must verify this order is maintained.

**Example**: Opportunity create transforms `{ products: [...] }` to `{ products_to_sync: [...] }` but validation runs first on the original `products` field.

### React Admin Form Pattern (Transform + Pessimistic Mode)
**Files**: OpportunityCreate.tsx, OpportunityEdit.tsx, ContactCreate.tsx

All create/edit forms use `CreateBase`/`EditBase` → `Form` → Input Components → `FormToolbar` structure with:
1. Transform function to rename/reshape fields before data provider
2. Pessimistic mutation mode to prevent optimistic UI updates
3. Default values to prefill forms
4. onSuccess handlers for cache invalidation

**Testing requirement**: Mock data provider and verify transform functions are called with correct payloads.

### JSONB Array Handling (Email/Phone in Contacts)
**Migration**: `20250928220851_normalize_contact_email_phone_to_arrays.sql`

Contacts store emails/phones as JSONB arrays: `[{email: "x@y.com", type: "Work"}]` and `[{number: "+1-555-123", type: "Work"}]`. Data provider normalizes null JSONB to empty arrays for React Admin compatibility.

**Testing requirement**: Create test factories with `createEmailArray()` and `createPhoneArray()` helpers using faker.js to generate realistic JSONB structures.

### Multi-Organization Contact Validation
**File**: `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/contacts.ts:171-234`

Contacts require at least one organization link via contact_organizations junction table with EXACTLY one is_primary: true. Enforced via Zod `superRefine()` cross-field validation.

**Testing requirement**: Test both valid (one primary) and invalid (zero primary, multiple primary) scenarios in component and E2E tests.

### Filter Persistence with localStorage
**File**: `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityList.tsx:31-68`

Lists persist filter preferences to localStorage with key format `CRM.opportunities.listParams`. Stale filters can break UI if schema changes (e.g., removed `status` field still in cache).

**Testing requirement**: Test filter application, localStorage persistence, and stale filter cleanup logic.

### Semantic Color Variables (No Hex Codes)
**File**: `/home/krwhynot/Projects/atomic/src/index.css`

All components MUST use CSS variables (--primary, --destructive, --border, --input, etc.) defined in OKLCH color space. Hex codes violate Engineering Constitution. Dark mode redefines all variables in `.dark` selector.

**Testing requirement**: Visual regression tests must capture both light and dark mode for all component variants. Run `npm run validate:colors` to enforce no hex codes.

### Component Variant Management (class-variance-authority)
**Pattern**: Button, Badge, Alert, Select all use cva for type-safe variants

```typescript
const buttonVariants = cva(
  "base-classes...",
  {
    variants: {
      variant: { default, destructive, outline, secondary, ghost, link },
      size: { default, sm, lg, icon }
    },
    defaultVariants: { variant: "default", size: "default" }
  }
);
```

**Testing requirement**: Storybook stories must cover all variant combinations (Button: 6 variants × 4 sizes = 24 stories minimum).

### RLS Pattern (Simple Authenticated-Only)
**Migration**: `20250927000000_standardize_all_rls_policies.sql`

All tables use identical RLS policies: `auth.role() = 'authenticated'` for INSERT, `auth.uid() IS NOT NULL` for SELECT/UPDATE/DELETE. No user-specific data isolation - all authenticated users can access all data.

**Testing requirement**: E2E tests need authenticated session but no special permission checks. Use both anonymous client (test RLS) and service client (test data setup).

### Admin Layer Integration (React Admin Hooks)
**Files**: All `src/components/admin/*-input.tsx` components

Pattern: `useInput()` → `FormField` → `FormControl` → `BaseComponent` → `FormError`

The `useInput()` hook from ra-core provides field state, validation errors, and connects to React Hook Form. Must use `sanitizeInputRestProps()` before spreading props to DOM elements.

**Testing requirement**: Mock React Admin context (AdminContext, RecordContextProvider, ResourceContextProvider) in component tests.

### 🆕 Authorization (RBAC) Pattern
**File**: `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/commons/canAccess.ts`

The `sales` table has an `is_admin` boolean flag that determines access to admin-only resources. Admin users (`is_admin: true`) have full access to all resources including `/sales`. Non-admin users are restricted from accessing the sales resource entirely. The `canAccess()` function in the auth provider enforces this role-based access control.

**Testing requirement**: E2E tests MUST include Flow 6 (Authorization) verifying non-admin users cannot access `/sales` resource and admin users can. Component tests should mock different user roles to verify conditional rendering.

### 🆕 API Error State Handling
**Pattern**: All forms must handle data provider rejections gracefully

When the data provider rejects (500 server error, RLS violation, network failure), the UI must:
1. Display error notification/toast to the user
2. Keep form editable (not disabled) for user to retry
3. Show field-specific errors when available
4. Log errors for debugging

**Testing requirement**: Component tests MUST include scenarios where mocked data provider methods (`create`, `update`, `getList`) reject with errors. Assert error UI displays and form remains functional. See `requirements.md` Flow examples for OpportunityCreate error testing.

### 🆕 Robust Test Cleanup Pattern
**File**: `tests/utils/db-helpers.ts` (to be created)

Use `safeCleanup()` helper with `Promise.allSettled` to prevent cleanup failures from poisoning other tests:

```typescript
export async function safeCleanup(cleanupFunctions: TestDataCleanup[]): Promise<void> {
  const results = await Promise.allSettled(cleanupFunctions.map(fn => fn()));
  const failures = results.filter(r => r.status === 'rejected');
  if (failures.length > 0) {
    console.error(`${failures.length} cleanup operations failed:`, failures);
    // Log but don't throw - allow other tests to continue
  }
}
```

**Testing requirement**: All E2E tests must use `safeCleanup()` in `afterEach` hooks to ensure cleanup failures don't cascade. Track cleanup functions in array and pass to `safeCleanup()`.

### 🆕 Test Selector Strategy
**Mandatory Hierarchy** (see `requirements.md` for full details):

1. **Preferred**: User-facing selectors (`getByRole`, `getByLabel`, `getByPlaceholderText`)
2. **Acceptable**: `data-testid` attributes on critical elements only
3. **AVOID**: Text content selectors (brittle with i18n), CSS class selectors (brittle with refactoring)

**Testing requirement**: All Playwright E2E tests MUST use user-facing selectors or data-testid. Human review required for AI-generated tests to verify selector quality.

### 🆕 Accessibility Testing Workflow
**4-Level Process**:

1. **Component Level**: Storybook @storybook/addon-a11y scans every story automatically
2. **E2E Baseline**: Playwright + @axe-core/playwright scans 5 key pages for WCAG violations
3. **CI/CD Integration**: Dedicated `a11y-tests` job fails build on critical/serious violations
4. **Manual Checklist**: Keyboard navigation, screen reader testing, color contrast verification

**Testing requirement**: Create `tests/e2e/accessibility.spec.ts` with Axe scans for dashboard, opportunities, contacts, create forms, edit forms. Fail on critical/serious violations only.

## Relevant Docs

### Engineering Constitution
**File**: `/home/krwhynot/Projects/atomic/CLAUDE.md`

You _must_ read this when working on **all implementation tasks**. Contains non-negotiable rules:
1. NO OVER-ENGINEERING: Fail fast, no circuit breakers
2. SINGLE SOURCE OF TRUTH: One data provider (Supabase), validation at API boundary only
3. VALIDATION: Zod schemas in `src/atomic-crm/validation/` only
4. COLORS: Semantic CSS variables only, never hex codes
5. MIGRATIONS: Timestamp format YYYYMMDDHHMMSS

### Research Documents
**Directory**: `/home/krwhynot/Projects/atomic/.docs/plans/ui-ux-testing-automation/`

You _must_ read these when working on **test implementation**:
- `requirements.md`: 🆕 **UPDATED WITH CRITICAL GAPS** - Complete feature requirements with 3-layer testing strategy (E2E, component, visual), **Flow 6 Authorization testing**, **API error state testing**, **robust cleanup strategy**, **test selector strategy**, **accessibility workflow**, **Foundation First implementation phases**, test data management patterns, critical user flows, CI/CD integration
- `react-admin-patterns.research.md`: Resource registration, data provider architecture, form/list patterns, validation integration, edge cases (transform order, idempotent deletes, localStorage cleanup). 🆕 **READ FOR**: API error testing patterns, data provider mocking strategies
- `database-architecture.research.md`: Schema structure, JSONB field formats, junction table patterns, migration conventions, test data factory requirements. 🆕 **READ FOR**: Understanding `sales` table with `is_admin` for RBAC testing
- `ui-components.research.md`: 32 base components + 73 admin components inventory, variant combinations (~215 stories needed), semantic color usage, dark mode patterns, testing gotchas. 🆕 **READ FOR**: Accessibility testing requirements, data-testid placement strategy
- `existing-test-setup.research.md`: Current Vitest configuration, missing dependencies, broken CI (Makefile reference), test file patterns, what needs to be added. 🆕 **READ FOR**: Understanding gaps that new tests must fill
- `env-and-auth.research.md`: Environment variables (VITE_* for client, SUPABASE_SERVICE_ROLE_KEY for server), Supabase client initialization, authentication flow, creating test sessions. 🆕 **READ FOR**: Creating test users with different `is_admin` values for RBAC testing

### External Documentation
**React Admin**: https://marmelab.com/react-admin/ - Read when working on **list/form component tests** to understand useListContext, useInput, DataProvider interface, validation patterns

**Playwright**: https://playwright.dev/docs/intro - Read when working on **E2E test implementation** for browser automation, authentication, selectors, assertions

**Storybook**: https://storybook.js.org/docs/writing-tests/visual-testing - Read when working on **visual regression setup** for story writing patterns, Chromatic integration, accessibility testing

**Vitest**: https://vitest.dev/guide/ - Read when working on **test configuration** for coverage setup, browser mode, UI dashboard, mocking patterns

**Zod**: https://zod.dev/ - Read when working on **validation testing** to understand schema patterns, error format, superRefine for cross-field validation

**Supabase**: https://supabase.com/docs/guides/auth - Read when working on **auth flow testing** for session management, RLS patterns, service role usage

**shadcn/ui**: https://ui.shadcn.com - Read when working on **component story creation** to understand base component APIs, Radix UI primitive patterns, composition patterns

**Tailwind CSS 4**: https://tailwindcss.com/docs - Read when working on **visual regression** to understand @theme syntax, OKLCH color space, semantic color patterns
