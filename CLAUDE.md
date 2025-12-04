# CLAUDE.md

Guidance for Claude Code working with Crispy CRM (Atomic CRM) - a React 19 + TypeScript + React Admin + Supabase CRM. Pre-launch product, desktop-first (1440px+) with iPad support.

## Key Objectives:
- **Centralize Sales Data:** create a single source of truth to replace multiple spreadsheets.    
- **Principal-First Visibility:** Allow Account Managers to answer the question, _"What is the ONE thing I have to do this week for each principal?"_ in under 2 seconds.    
- **Activity Tracking:** Facilitate the logging of 10+ activities (calls, emails, meetings) per week per principal.
- **Tablet Accessibility:** Optimize the experience for iPad use by field sales reps.    
- **Team Adoption:** Achieve 100% adoption and cessation of Excel usage within 30 days.

## Architecture

### Data Provider (Critical)
**All DB access through ONE entry point:** `src/atomic-crm/providers/supabase/unifiedDataProvider.ts`
- Never import Supabase directly in components
- Zod validation at API boundary in this provider, NOT in forms

### Feature Structure
```
src/atomic-crm/feature/
├── index.tsx           # Entry + error boundaries
├── FeatureList.tsx     # List view
├── FeatureCreate.tsx   # Create form
├── FeatureEdit.tsx     # Edit form
└── FeatureSlideOver.tsx # Side panel (40vw, URL: ?view=123)
```

### Key Directories
- `src/atomic-crm/` - CRM features (contacts, organizations, opportunities)
- `src/components/admin/` - React Admin form wrappers
- `src/atomic-crm/validation/` - Zod schemas
- `supabase/migrations/` - DB migrations
- `supabase/functions/` - Edge Functions (Deno)

## Engineering Principles

### Fail Fast (Pre-Launch)
- NO retry logic, circuit breakers, or graceful fallbacks
- Let errors throw - velocity over resilience

### Single Source of Truth
- Data: `unifiedDataProvider` only
- Validation: Zod at API boundary only
- Form state: `zodSchema.partial().parse({})`

### TypeScript
- `interface` for object shapes
- `type` for unions/intersections

### Deprecated Patterns (NEVER USE)
- `Contact.company_id` → Use `contact_organizations` junction table
- `Opportunity.archived_at` → Use `deleted_at`
- Direct Supabase imports → Use data provider
- Form-level validation → Zod at API boundary only

### Zod Validation (Details)
- **Coercion:** `z.coerce` for all non-string form inputs (dates, numbers, booleans)
- **Length Limits:** All strings must have `.max()` constraint (DoS prevention)
- **Strict Objects:** `z.strictObject()` at API boundary (mass assignment prevention)
- **Allowlist:** `z.enum()` for constrained values (never denylist patterns)

### Form Performance
- **Mode:** `onSubmit` (default) or `onBlur` — never `onChange` (prevents re-render storms)
- **Watching:** `useWatch()` for subscriptions, not `watch()` (isolated re-renders)

### Accessibility (A11y)
- `aria-invalid={!!error}` on inputs with validation errors
- `aria-describedby={errorId}` linking input to error message
- `role="alert"` on error messages for screen reader announcements

## Design System

**Tailwind v4 semantic colors ONLY:**

| ✅ CORRECT                 | ❌ WRONG              |
|---------------------------|----------------------|
| text-muted-foreground     | text-gray-500        |
| bg-primary                | bg-green-600         |
| text-destructive          | text-red-500         |
| h-11 w-11 (touch targets) | h-8 w-8              |
| Semantic color tokens     | Raw hex/oklch values |

**Touch targets:** 44x44px minimum (`h-11 w-11`)

**Layouts:** List Shell (sidebar + PremiumDatagrid) | Slide-Over (40vw right panel) | Create Forms (full-page tabbed)

## Testing

**Unit (Vitest):** Use `renderWithAdminContext()` from `src/tests/utils/render-admin.tsx`. Supabase mocked in `src/tests/setup.ts`. Tests in `__tests__/` directories.

**E2E (Playwright):** POMs in `tests/e2e/support/poms/`. Semantic selectors only (`getByRole`, `getByLabel`, `getByText`) - never CSS. Auth: `tests/e2e/.auth/user.json`.

## Database

PostgreSQL 17 + RLS | Soft deletes via `deleted_at` | Multi-tenant per organization | Edge Functions: daily-digest, check-overdue-tasks

---

# Project Mission

**Goal:** Replace Excel-based sales pipeline for MFB, a food distribution broker.

## Domain Model

**MFB's Role:** Broker between Principals (manufacturers) → Distributors → Operators (restaurants)

**Scale:** 6 account managers | 9 principals | 50+ distributors

### Terminology
| Term | Definition |
|------|------------|
| **Principal** | Food manufacturer MFB represents |
| **Distributor** | Buys from principals, sells to operators |
| **Operator** | Restaurant/foodservice (end customer) |
| **Opportunity** | Deal in pipeline (one principal each) |
| **Authorization** | Distributor agrees to carry principal's products |

### Data Relationships
```
Principal → Opportunities, Products
Distributor → Contacts, Authorizations ↔ Principals, Territory
Opportunity → Principal, Activities, Samples
```

## Pipeline Stages (7)

1. `new_lead` - New Lead
2. `initial_outreach` - Initial Outreach
3. `sample_visit_offered` - Sample/Visit Offered
4. `feedback_logged` - Feedback Logged
5. `demo_scheduled` - Demo Scheduled
6. `closed_won` - Closed Won
7. `closed_lost` - Closed Lost

## User Roles

| Role | Access |
|------|--------|
| **Admin** | Full access, user management |
| **Manager** | All reps' data, reports |
| **Rep** | Own opportunities, activities |

## MVP Must-Haves

| Feature | Why |
|---------|-----|
| Principal-filtered views | See one principal's pipeline |
| Quick activity logging | <30 sec per entry |
| Excel export | Reports for principals |
| Sample tracking | Log samples + follow-ups |
| Mobile/tablet access | Field sales critical |
| Task management | Panel, snooze, daily digest |

**NOT MVP:** PDF export, volume/price tracking, external integrations, territory management

## Activity Types

- **Calls** - Phone conversations
- **Emails** - Correspondence
- **Samples** - Sent for evaluation (with follow-up)

## Win/Loss Reasons

**Win:** Relationship, Product quality
**Loss:** Price too high, No distributor authorization, Competitor relationship
---

**Status:** MVP in Progress (Pre-launch)
- use ref mcp tool for industry standards and/or ask multiple choice questions for additonal context if needed on plans or any tasks