# Context-Aware Minimal Forms Design

**Date:** 2025-12-05
**Status:** Validated

## Problem Statement

High-frequency forms (Activities, Tasks) show too many fields upfront, increasing cognitive load and slowing down the "10+ activities/week per principal" workflow. The MVP goal of "quick activity logging <30 sec" requires reducing visible fields while maintaining full functionality when needed.

**Current State:**
- Activity Create: 12 fields visible across sections
- Task Create: 8 fields all visible
- No context awareness from navigation source

## Decision

**Approach A: Context-Aware Minimal Forms**

Reduce visible fields to 3-4 essential inputs. Pre-fill remaining fields based on navigation context (which page the user came from). "Show more" reveals full form.

### Why This Approach

1. **Matches existing patterns** - `QuickLogActivity` already infers activity type from task context
2. **Dramatic cognitive load reduction** - 12 fields → 3-4 visible
3. **Context pre-fill eliminates redundant selection** - navigating from Opportunity auto-links it
4. **Full functionality preserved** - "Show more" expands to complete form

## Alternatives Considered

| Approach | Why Rejected |
|----------|--------------|
| **B: FAB Quick-Add** | Two entry points to maintain, violates single source of truth |
| **C: Adaptive Progressive** | High complexity, conditional logic maintenance burden |
| **D: Template Quick-Entry** | Template maintenance overhead, may not match all use cases |
| **E: Inline List Quick-Add** | Different UX pattern, limited space for fields |

## Design Details

### Architecture

```
Navigation Sources (Opportunity/Contact/Organization pages)
                    │
                    ▼
        useNavigationContext() hook
                    │
                    ▼
    ActivityCreate / TaskCreate
    (merges context into form defaults)
                    │
                    ▼
    Minimal form with "Show more" section
```

### New Components

#### 1. `useNavigationContext` Hook

**Location:** `src/atomic-crm/hooks/useNavigationContext.ts`

```typescript
interface NavigationContext {
  record: {
    opportunity_id?: string;
    contact_id?: string;
    organization_id?: string;
  };
  source_resource?: 'opportunities' | 'contacts' | 'organizations';
}
```

Reads from router state, returns empty object if navigated directly.

#### 2. `ShowMoreSection` Component

**Location:** `src/atomic-crm/components/ShowMoreSection.tsx`

```typescript
interface ShowMoreSectionProps {
  label?: string;           // Default: "Show more options"
  defaultOpen?: boolean;    // Default: false
  children: React.ReactNode;
}
```

Uses existing `Collapsible` from shadcn/ui for consistency.

#### 3. `LinkedRecordChip` Component

**Location:** `src/atomic-crm/components/LinkedRecordChip.tsx`

Displays pre-filled context as a dismissible chip (e.g., "Opportunity: Acme Deal").

### Form Field Distribution

#### Activity Create

| Essential (always visible) | Show More Section |
|---------------------------|-------------------|
| Type (required) | Duration |
| Subject (required) | Notes/Description |
| Date (required) | Contact (if not pre-filled) |
| Opportunity (if pre-filled, as chip) | Organization (if not pre-filled) |
| | Sentiment |
| | Follow-up Date |
| | Follow-up Notes |
| | Location |
| | Outcome |

#### Task Create

| Essential (always visible) | Show More Section |
|---------------------------|-------------------|
| Title (required) | Description |
| Due Date (required) | Opportunity (if not pre-filled) |
| Type | Contact (if not pre-filled) |
| Priority | |

### Data Flow

**Default Priority Order (merge sequence):**

```typescript
const formDefaults = {
  // 1. Schema defaults (lowest priority)
  ...schema.partial().parse({}),

  // 2. Smart defaults (user context)
  ...smartDefaults,  // { activity_date, sales_id }

  // 3. Navigation context (highest priority)
  ...navContext.record,
};
```

### Navigation Button Pattern

Source pages pass context via router state:

```tsx
<CreateButton
  resource="activities"
  label="Log Activity"
  state={{
    record: {
      opportunity_id: record.id,
      organization_id: record.customer_organization_id
    },
    source_resource: 'opportunities'
  }}
/>
```

### Files to Modify

| File | Change |
|------|--------|
| `src/atomic-crm/hooks/useNavigationContext.ts` | **NEW** - Extract context from router state |
| `src/atomic-crm/components/ShowMoreSection.tsx` | **NEW** - Progressive disclosure wrapper |
| `src/atomic-crm/components/LinkedRecordChip.tsx` | **NEW** - Pre-filled context display |
| `src/atomic-crm/activities/ActivityCreate.tsx` | Integrate useNavigationContext |
| `src/atomic-crm/activities/ActivitySinglePage.tsx` | Restructure with ShowMoreSection |
| `src/atomic-crm/tasks/TaskCreate.tsx` | Integrate useNavigationContext, add ShowMoreSection |
| `src/atomic-crm/opportunities/OpportunityShow.tsx` | Add context to "Log Activity" button |
| `src/atomic-crm/contacts/ContactShow.tsx` | Add context to activity/task buttons |

## Engineering Principles Applied

- [x] **Fail-fast** - No retry logic, no fallback if context missing (just shows manual fields)
- [x] **Single source of truth** - Context flows through router state, not duplicated
- [x] **Zod at API boundary only** - No form-level validation changes
- [x] **Form defaults from schema** - `zodSchema.partial().parse({})` pattern preserved
- [x] **interface for objects** - NavigationContext uses interface

## Testing Strategy

### Unit Tests (Vitest)

- `useNavigationContext`: 3 tests (empty state, full context, partial context)
- `ShowMoreSection`: 3 tests (default hidden, expand, defaultOpen prop)

### E2E Tests (Playwright)

- Activity create with opportunity context: 4 tests
- Task create with context: 3 tests
- Direct navigation (no context): 2 tests

### Page Object Model

New POMs:
- `ActivityCreatePage.ts`
- `TaskCreatePage.ts` (if not existing)

## Open Questions

None - design validated through brainstorming session.

## Impact Assessment

| Metric | Before | After |
|--------|--------|-------|
| Activity form fields visible | 12 | 4 |
| Task form fields visible | 8 | 4 |
| Estimated time to log activity | ~45 sec | ~20 sec |
| Clicks to create from Opportunity | 5+ | 3 |
