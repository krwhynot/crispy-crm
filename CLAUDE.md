# CLAUDE.md

Guidance for Claude Code working with Crispy CRM (Atomic CRM) - a React 19 + TypeScript + React Admin + Supabase CRM. Pre-launch product, desktop-first (1440px+) with iPad support.

## Key Objectives:
- **Centralize Sales Data:** create a single source of truth to replace multiple spreadsheets.    
- **Principal-First Visibility:** Allow Account Managers to answer the question, _"What is the ONE thing I have to do this week for each principal?"_ in under 2 seconds.    
- **Activity Tracking:** Facilitate the logging of 10+ activities (calls, emails, meetings) per week per principal.
- **Tablet Accessibility:** Optimize the experience for iPad use by field sales reps.    
- **Team Adoption:** Achieve 100% adoption and cessation of Excel usage within 30 days.

## Codebase Discovery (Read First!)

**Before exploring code manually, read these pre-computed discovery files:**

| File | Contents | Use When |
|------|----------|----------|
| `.claude/state/component-inventory/` | 484 React components (26 chunks) - includes childComponents, contextDependencies, componentRole | "Which components exist?", "What uses X hook?", "Component hierarchy?" |
| `.claude/state/hooks-inventory.json` | 77 custom hooks with dependencies | "What hooks are available?", "What does useX do?" |
| `.claude/state/schemas-inventory/` | 82 Zod schemas (~18 chunks) - includes transformDetails with function names | "What validation exists?", "Schema structure?", "Security transforms?" |
| `.claude/state/types-inventory/` | 101 TypeScript types (~10 chunks) | "What types exist?", "Type definitions?" |
| `.claude/state/forms-inventory.json` | 39 form components - includes componentChain, inputComponentsDeep | "What forms exist?", "Form hierarchy?", "Which inputs used?" |
| `.claude/state/validation-services-inventory/` | Validation wrapper functions & custom validators | "Error formatting?", "Custom validators?" |
| `.claude/state/call-graph-inventory/` | 919 nodes, 10K+ edges (30 chunks) - call/render/hook relationships, cycles | "What calls X?", "What renders Y?", "Circular deps?" |

**These files are auto-generated and CI-enforced fresh.** Use them to understand structure before reading individual source files.

**Enhanced metadata includes:**
- **Components:** `childComponents`, `contextDependencies`, `componentRole` (entry/wrapper/leaf)
- **Schemas:** `transformDetails.functionName`, `transformDetails.isSecurity` (for sanitization)
- **Forms:** `componentChain` (hierarchy), `inputComponentsDeep` (recursive inputs)
- **Validation Services:** Error formatting detection, custom validator patterns
- **Call Graph:** `nodeType` (component/hook/function/arrow), `edgeType` (call/render/hook/callback), `conditional`, `inLoop`, cycles via Tarjan's SCC

To regenerate: `just discover` | Single: `just discover-callgraph` | Check: `just discover-check`

### Incremental Discovery (Phase 2.5)

**For faster updates after modifying source files:**

```bash
# Full extraction (all chunks rewritten)
just discover

# Incremental extraction (only stale chunks updated)
npx tsx scripts/discover/index.ts --incremental
```

**How it works:**
1. Compares source file hashes against manifest to detect changes
2. Identifies which chunks contain modified/deleted files
3. Extracts only from stale chunks, preserves fresh chunk files
4. Merges results into updated manifest with correct totals

**When to use each:**
| Scenario | Command |
|----------|---------|
| First run / CI | `just discover` |
| After editing 1-2 files | `--incremental` |
| After major refactor | `just discover` |
| New chunk needed (new feature dir) | `just discover` |

**Output example:**
```
✓  Components: All 26 chunks fresh           # Skipped - no changes
📝 Zod Schemas: Updating 1 of 18 chunks      # Only contacts.json rewritten
     contacts: Modified: src/.../contacts.ts
✅ Incremental update: schemas-inventory/ (1 chunks updated, 18 total)
```

## Preferred CLI Tools

**Use these high-performance tools instead of defaults:**

| Task | Use This | Not This |
|------|----------|----------|
| **Task runner** | `just <command>` | `npm run <script>` |
| **Code search** | `rg "pattern" --type ts` | Built-in Grep |
| **File finding** | `fd -e tsx "name"` | Built-in Glob |
| **Read specific lines** | `bat --plain --line-range=N:M file` | Read entire file |
| **Git operations** | `gh` CLI with `--json` | Raw git commands |

**Why:** Saves tokens, faster execution, structured output. The `justfile` documents all project commands - run `just --list` to see available recipes.

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

## 🎨 Column Filter Pattern (Pilot: Organizations)
- Reusable components in `src/components/admin/column-filters/`
- Text filters: debounced (300ms), expand on click
- Checkbox filters: popover with multi-select
- Always use `useListContext` for filter state
- Touch targets ≥44px, semantic colors only

## Testing

**Unit (Vitest):** Use `renderWithAdminContext()` from `src/tests/utils/render-admin.tsx`. Supabase mocked in `src/tests/setup.ts`. Tests in `__tests__/` directories.

**Manual E2E (Claude Chrome):** See `docs/tests/e2e/` for manual testing checklists. Seed test data with `just seed-e2e`.

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