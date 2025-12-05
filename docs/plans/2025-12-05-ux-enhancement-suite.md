# Implementation Plan: UX Enhancement Suite (Rev 3 - Corrected)

**Date:** 2025-12-05
**Consolidated From:**
- `docs/plans/2025-12-05-contextual-onboarding.md`
- `docs/plans/2025-12-05-context-aware-minimal-forms.md`
- `docs/plans/2025-12-05-task-card-redesign.md`

**Type:** Multi-Feature Enhancement
**Scope:** Full Stack (Dashboard, Activities, Tasks, Data Provider)
**Execution:** Hybrid Waves (parallel within, sequential between)
**Testing:** TDD Strict

---

## Executive Summary

Three complementary UX improvements merged into one efficient implementation plan:

1. **Contextual Onboarding** - AttentionCard, staleness indicators, workflow toasts
2. **Minimal Forms** - Task forms reduced to 3 fields; Activities use existing dialogs
3. **Task Card Redesign** - Principal color ribbons, inline date picker

**Impact:**
- Task creation: ~30s → ~15s (50% faster)
- Task rescheduling: 3+ clicks → 1 click
- Principal visibility: Color-coded at-a-glance identification

---

## Critical Design Decisions (Locked)

### Decision 1: Staleness Data Source
**USE:** `dashboard_principal_summary` PostgreSQL view
**DO NOT:** Create custom staleness queries or client-side calculations

The view already computes:
- `status_indicator`: 'good' | 'warning' | 'urgent' (thresholds: ≤7d, 7-14d, >14d)
- `days_since_last_activity`: number
- `priority_score`: number (for sorting)

### Decision 2: Activity Creation Pattern
**USE:** Existing dialog components (`QuickLogActivityDialog`, `ActivityNoteForm`)
**DO NOT:** Add router-based navigation to `/activities/create`

Reality: ZERO router entries to `/activities/create` exist. All activity creation flows through dialogs that already receive entity context via props.

### Decision 3: Task Field Names
**USE:** `title` (what `useMyTasks` reads from API)
**DO NOT:** Use `subject` in Task-related code

### Decision 4: Principal Expansion
**USE:** `opportunity.principal_organization` (actual FK relationship)
**DO NOT:** Use `opportunity.principal` (doesn't exist)

---

## Consolidated Dependency Graph

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        WAVE 1: Shared Foundation                             │
│  ┌────────────────┐  ┌────────────────┐  ┌─────────────────────────────────┐│
│  │ 1.1 Types &    │  │ 1.2 Principal  │  │ 1.3 useQueryParams             ││
│  │ Constants      │  │ Colors         │  │ (hash URL parsing)             ││
│  └────────────────┘  └────────────────┘  └─────────────────────────────────┘│
│  ┌────────────────┐  ┌─────────────────────────────────────────────────────┐│
│  │ 1.4 Onboarding │  │ 1.5 Task Principal Expansion (useMyTasks update)   ││
│  │ Progress Hook  │  │                                                     ││
│  └────────────────┘  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        WAVE 2: UI Components                                 │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐                 │
│  │ 2.1 Staleness  │  │ 2.2 ShowMore   │  │ 2.3 LinkedRec  │                 │
│  │ Indicator      │  │ Section        │  │ ordChip        │                 │
│  └────────────────┘  └────────────────┘  └────────────────┘                 │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐                 │
│  │ 2.4 InlineDate │  │ 2.5 Workflow   │  │ 2.6 Attention  │                 │
│  │ Picker         │  │ Toast          │  │ Card           │                 │
│  └────────────────┘  └────────────────┘  └────────────────┘                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        WAVE 3: Feature Integration                           │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌────────────────────┐ │
│  │ 3.1 TaskKanbanCard   │  │ 3.2 TaskCreate       │  │ 3.3 Dashboard      │ │
│  │ (ribbon + date)      │  │ (minimal + context)  │  │ (AttentionCard)    │ │
│  └──────────────────────┘  └──────────────────────┘  └────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        WAVE 4: Testing & Polish                              │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌────────────────────┐ │
│  │ 4.1 Unit Tests       │  │ 4.2 E2E Tests        │  │ 4.3 Visual QA     │ │
│  │ (all components)     │  │ (all features)       │  │ (iPad viewport)   │ │
│  └──────────────────────┘  └──────────────────────┘  └────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

**REMOVED from original plan:**
- Task 3.2 ActivityCreate (router integration) → Activities use dialogs
- Task 3.5 Navigation Buttons → Not needed for dialog-based flow

---

## Pre-Execution Checklist

```bash
# 1. Verify directory
pwd
# Expected: /home/krwhynot/projects/crispy-crm

# 2. Create feature branch
git checkout -b feature/ux-enhancement-suite

# 3. Verify dependencies
npm list sonner react-admin react-day-picker
# Should show: sonner, react-admin, react-day-picker@9.11.1

# 4. Verify test runner (Vitest uses --testNamePattern)
npm test -- --testNamePattern="dummy" 2>/dev/null || echo "Test runner OK"

# 5. Verify dashboard_principal_summary view exists
npm run db:local:reset -- --dry-run 2>&1 | grep -q "dashboard_principal_summary" && echo "View exists"
```

---

## WAVE 0: Database Prerequisites (BLOCKING)

**Must complete before Wave 1. Creates denormalized view for task principal data.**

---

### Task 0.1: Create `tasks_with_principal` SQL View

**File:** `supabase/migrations/YYYYMMDDHHMMSS_create_tasks_with_principal_view.sql` (NEW)

**Time:** 5 min | **TDD:** No (SQL)

**CRITICAL:** The existing `useMyTasks` hook uses `meta.expand` which the Supabase provider doesn't support.
To get principal data for task ribbons, we need a denormalized view that joins tasks → opportunities → principal_organization.

**Why a view (not provider changes):**
- Lower risk - no provider code changes
- Better performance - single query vs N+1
- Maintains existing API contract

**Migration:**

```sql
-- Migration: Create tasks_with_principal view for Kanban ribbons
-- This view denormalizes principal data so task cards can show color ribbons
-- without requiring unsupported meta.expand in the data provider

CREATE OR REPLACE VIEW tasks_with_principal
WITH (security_invoker = on)
AS
SELECT
  t.id,
  t.title,           -- NOTE: DB field is 'title', UI maps to 'subject'
  t.description,     -- NOTE: DB field is 'description', UI maps to 'notes'
  t.due_date,
  t.priority,
  t.type,
  t.completed,
  t.completed_at,
  t.sales_id,
  t.opportunity_id,
  t.contact_id,
  t.organization_id,
  t.created_at,
  t.updated_at,
  t.deleted_at,
  -- Denormalized opportunity data
  o.name AS opportunity_name,
  -- Denormalized principal data (for ribbon colors)
  po.id AS principal_id,
  po.name AS principal_name,
  -- Denormalized contact data
  c.first_name || ' ' || c.last_name AS contact_name,
  -- Denormalized organization data
  org.name AS organization_name
FROM tasks t
LEFT JOIN opportunities o ON t.opportunity_id = o.id AND o.deleted_at IS NULL
LEFT JOIN organizations po ON o.principal_organization_id = po.id
LEFT JOIN contacts c ON t.contact_id = c.id AND c.deleted_at IS NULL
LEFT JOIN organizations org ON t.organization_id = org.id
WHERE t.deleted_at IS NULL;

-- Grant permissions
GRANT SELECT ON tasks_with_principal TO authenticated, anon;

-- Add comment
COMMENT ON VIEW tasks_with_principal IS
  'Denormalized task view with principal data for Kanban ribbon colors. '
  'Eliminates need for unsupported meta.expand in data provider.';
```

**Apply migration:**

```bash
npx supabase migration new create_tasks_with_principal_view
# Paste SQL into the generated file
npx supabase db reset  # Or deploy to staging
```

**Update Task 1.5 to use this view:**

The `useMyTasks` hook should query `tasks_with_principal` resource instead of `tasks` with `meta.expand`.

---

## WAVE 1: Shared Foundation (PARALLEL)

---

### Task 1.1: Create Onboarding Types & Constants

**Files:**
- `src/atomic-crm/onboarding/constants.ts` (NEW)
- `src/atomic-crm/onboarding/types.ts` (NEW)
- `src/atomic-crm/onboarding/index.ts` (NEW)

**Time:** 5 min | **TDD:** No (pure types)

```bash
mkdir -p src/atomic-crm/onboarding/__tests__
```

**File: `src/atomic-crm/onboarding/constants.ts`**

```typescript
/**
 * Onboarding system constants
 *
 * IMPORTANT: Staleness thresholds are NOT defined here.
 * The dashboard_principal_summary view computes status_indicator directly.
 * Thresholds: good ≤7d, warning 7-14d, urgent >14d (defined in SQL view)
 */

export const ONBOARDING_LIMITS = {
  /** Stop showing workflow hints after this many submissions per entity type */
  MAX_WORKFLOW_HINTS: 5,
  /** Maximum principals to show in AttentionCard */
  MAX_ATTENTION_CARDS: 3,
  /** Auto-dismiss toast after this many milliseconds */
  TOAST_DURATION_MS: 8000,
} as const;

export const LOCALSTORAGE_KEY = 'crispy_onboarding_progress' as const;

/** Entity types that trigger workflow toasts */
export type OnboardingEntity = 'opportunity' | 'activity' | 'contact' | 'task';

/**
 * Staleness classification matching dashboard_principal_summary view
 * Maps directly to view's status_indicator column
 */
export type StalenessLevel = 'good' | 'warning' | 'urgent';

/**
 * Map view's status_indicator to UI severity for styling
 */
export function getStalenessUISeverity(status: StalenessLevel): 'ok' | 'warning' | 'critical' {
  if (status === 'urgent') return 'critical';
  if (status === 'warning') return 'warning';
  return 'ok';
}
```

**File: `src/atomic-crm/onboarding/types.ts`**

```typescript
import type { OnboardingEntity, StalenessLevel } from './constants';

/**
 * Principal data from dashboard_principal_summary view
 *
 * IMPORTANT: Field names MUST match view columns exactly:
 * - principal_name (NOT 'name')
 * - opportunity_count (NOT 'active_opportunity_count')
 * - status_indicator (view-computed, NOT client-computed)
 */
export interface DashboardPrincipalSummary {
  id: number | null;
  principal_name: string | null;
  opportunity_count: number | null;
  weekly_activity_count: number | null;
  assigned_reps: string[] | null;
  last_activity_date: string | null;
  last_activity_type: string | null;
  days_since_last_activity: number | null;
  /** View-computed: 'good' (≤7d), 'warning' (7-14d), 'urgent' (>14d) */
  status_indicator: StalenessLevel;
  max_days_in_stage: number | null;
  is_stuck: boolean | null;
  next_action: string | null;
  priority_score: number | null;
}

/**
 * Persisted onboarding progress state
 * Stored in localStorage under LOCALSTORAGE_KEY
 */
export interface OnboardingProgress {
  opportunity_create_count: number;
  activity_create_count: number;
  contact_create_count: number;
  task_create_count: number;
  attention_card_dismissed: boolean;
  attention_card_dismissed_principals: number[];
  workflow_hints_disabled: boolean;
  last_updated: string;
}

/**
 * Workflow hint configuration per entity type
 */
export interface WorkflowHint {
  message: string;
  nextAction: string;
  nextPath: string;
}

/**
 * Navigation context for form pre-filling (Tasks only)
 *
 * NOTE: Activities use dialog props, not router state.
 * This context is only used by TaskCreate.
 */
export interface NavigationContextRecord {
  opportunity_id?: number;
  contact_id?: number;
  organization_id?: number;
}

export interface NavigationContext {
  record: NavigationContextRecord;
  source_resource?: 'opportunities' | 'contacts' | 'organizations';
}
```

**File: `src/atomic-crm/onboarding/index.ts`**

```typescript
// Constants
export {
  ONBOARDING_LIMITS,
  LOCALSTORAGE_KEY,
  getStalenessUISeverity,
  type OnboardingEntity,
  type StalenessLevel,
} from './constants';

// Principal colors (for ribbons and visual identification)
export { PRINCIPAL_COLORS, getPrincipalColor } from './principalColors';

// Types - view-aligned
export type {
  DashboardPrincipalSummary,
  OnboardingProgress,
  WorkflowHint,
  NavigationContextRecord,
  NavigationContext,
} from './types';

// Hooks
export { useOnboardingProgress } from './useOnboardingProgress';
export { useQueryParams, getNumericParam } from './useQueryParams';

// Components
export { AttentionCard } from './AttentionCard';
export { StalenessIndicator } from './StalenessIndicator';
export { showWorkflowToast } from './WorkflowToast';
```

**NOTE:** Barrel exports are NOT commented out. Each module is exported as soon as it's created in its respective Wave task.

**Constitution Checklist:**
- [x] No retry logic
- [x] No direct Supabase imports
- [x] Uses `type` for unions (`StalenessLevel`, `OnboardingEntity`)
- [x] Uses `interface` for object shapes
- [x] NO custom staleness thresholds (uses view)

---

### Task 1.2: Principal Colors Constant

**File:** `src/atomic-crm/onboarding/principalColors.ts` (NEW)

**Time:** 5 min | **TDD:** Yes

**Serves:** AttentionCard, StalenessIndicator, TaskKanbanCard ribbon

**Test First: `src/atomic-crm/onboarding/__tests__/principalColors.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { PRINCIPAL_COLORS, getPrincipalColor } from '../principalColors';

describe('principalColors', () => {
  describe('PRINCIPAL_COLORS', () => {
    it('contains at least 9 unique colors for principals', () => {
      const uniqueColors = new Set(Object.values(PRINCIPAL_COLORS));
      expect(uniqueColors.size).toBeGreaterThanOrEqual(9);
    });

    it('has a default color', () => {
      expect(PRINCIPAL_COLORS.default).toBeDefined();
    });

    it('uses Tailwind border-l classes', () => {
      Object.values(PRINCIPAL_COLORS).forEach(color => {
        expect(color).toMatch(/^border-l-/);
      });
    });
  });

  describe('getPrincipalColor', () => {
    it('returns specific color for known principal ID', () => {
      const color = getPrincipalColor(1);
      expect(color).toContain('border-l-');
      expect(color).not.toBe(PRINCIPAL_COLORS.default);
    });

    it('returns modulo-based color for unknown principal ID (deterministic)', () => {
      // ID 10 should get color at index 10 % 9 = 1 (emerald)
      const color10 = getPrincipalColor(10);
      expect(color10).toBe('border-l-emerald-500');

      // ID 18 should get color at index 18 % 9 = 0 (blue)
      const color18 = getPrincipalColor(18);
      expect(color18).toBe('border-l-blue-500');

      // Same ID should always return same color (deterministic)
      expect(getPrincipalColor(10)).toBe(getPrincipalColor(10));
    });

    it('returns default for undefined/null', () => {
      expect(getPrincipalColor(undefined)).toBe(PRINCIPAL_COLORS.default);
      expect(getPrincipalColor(null as unknown as number)).toBe(PRINCIPAL_COLORS.default);
    });
  });
});
```

**Implementation:** `src/atomic-crm/onboarding/principalColors.ts`

```typescript
/**
 * Principal color mapping for visual identification
 *
 * Colors are assigned deterministically by principal ID using modulo.
 * This ensures consistent colors across sessions without server storage.
 */

/** Ordered color palette for principals (9 colors for MFB's 9 principals) */
const COLOR_PALETTE = [
  'border-l-blue-500',
  'border-l-emerald-500',
  'border-l-amber-500',
  'border-l-rose-500',
  'border-l-violet-500',
  'border-l-cyan-500',
  'border-l-orange-500',
  'border-l-lime-500',
  'border-l-fuchsia-500',
] as const;

export const PRINCIPAL_COLORS = {
  ...Object.fromEntries(COLOR_PALETTE.map((color, i) => [i, color])),
  default: 'border-l-muted-foreground',
} as const;

/**
 * Get border color class for a principal ID
 *
 * @param principalId - The principal's database ID (number)
 * @returns Tailwind border-l-* class string
 */
export function getPrincipalColor(principalId: number | undefined | null): string {
  if (principalId == null) {
    return PRINCIPAL_COLORS.default;
  }

  // Use modulo for deterministic assignment
  const index = principalId % COLOR_PALETTE.length;
  return COLOR_PALETTE[index];
}
```

**Run:** `npm test -- --run src/atomic-crm/onboarding/__tests__/principalColors.test.ts`

---

### Task 1.3: useQueryParams Hook (Hash-Based URL Parsing)

**File:** `src/atomic-crm/onboarding/useQueryParams.ts` (NEW)

**Time:** 5 min | **TDD:** Yes

**IMPORTANT:** This app uses hash-based routing with `window.location.href` (NOT React Router state).
All navigation uses patterns like `/#/tasks/create?opportunity_id=123`.
This hook parses query params from the hash URL.

**Test First: `src/atomic-crm/onboarding/__tests__/useQueryParams.test.ts`**

```typescript
import { renderHook } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useQueryParams } from '../useQueryParams';

describe('useQueryParams', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    // Reset hash before each test
    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, hash: '' },
      writable: true,
    });
  });

  it('returns empty object when no query params', () => {
    window.location.hash = '#/tasks/create';
    const { result } = renderHook(() => useQueryParams());
    expect(result.current).toEqual({});
  });

  it('parses opportunity_id from hash URL', () => {
    window.location.hash = '#/tasks/create?opportunity_id=123';
    const { result } = renderHook(() => useQueryParams());
    expect(result.current.opportunity_id).toBe('123');
  });

  it('parses multiple params from hash URL', () => {
    window.location.hash = '#/tasks/create?opportunity_id=123&contact_id=456';
    const { result } = renderHook(() => useQueryParams());
    expect(result.current.opportunity_id).toBe('123');
    expect(result.current.contact_id).toBe('456');
  });

  it('handles empty hash', () => {
    window.location.hash = '';
    const { result } = renderHook(() => useQueryParams());
    expect(result.current).toEqual({});
  });
});
```

**Implementation:** `src/atomic-crm/onboarding/useQueryParams.ts`

```typescript
import { useMemo, useSyncExternalStore } from 'react';

/**
 * Parse URL query params from hash-based routing
 *
 * This app uses React Admin's hash router (window.location.href + hash).
 * URLs look like: /#/tasks/create?opportunity_id=123
 *
 * DO NOT use React Router hooks - they won't work with hash routing.
 *
 * @example
 * ```tsx
 * // In TaskKanbanCard.tsx - navigate with query params
 * const params = new URLSearchParams();
 * params.set('opportunity_id', String(task.relatedTo.id));
 * window.location.href = `/#/tasks/create?${params.toString()}`;
 *
 * // In TaskCreate.tsx - read query params
 * const queryParams = useQueryParams();
 * const defaultValues = {
 *   ...getTaskDefaultValues(),
 *   opportunity_id: queryParams.opportunity_id ? Number(queryParams.opportunity_id) : undefined,
 * };
 * ```
 */
export function useQueryParams(): Record<string, string> {
  // Subscribe to hash changes for reactivity
  const hash = useSyncExternalStore(
    (callback) => {
      window.addEventListener('hashchange', callback);
      return () => window.removeEventListener('hashchange', callback);
    },
    () => window.location.hash
  );

  return useMemo(() => {
    const queryIndex = hash.indexOf('?');
    if (queryIndex === -1) return {};

    const queryString = hash.slice(queryIndex + 1);
    const params = new URLSearchParams(queryString);
    return Object.fromEntries(params.entries());
  }, [hash]);
}

/**
 * Type-safe helper to get numeric ID from query params
 */
export function getNumericParam(
  params: Record<string, string>,
  key: string
): number | undefined {
  const value = params[key];
  if (!value) return undefined;
  const num = Number(value);
  return Number.isNaN(num) ? undefined : num;
}
```

**Run:** `npm test -- --run src/atomic-crm/onboarding/__tests__/useQueryParams.test.ts`

---

### Task 1.4: useOnboardingProgress Hook

**File:** `src/atomic-crm/onboarding/useOnboardingProgress.ts` (NEW)

**Time:** 8 min | **TDD:** Yes

**Test First: `src/atomic-crm/onboarding/__tests__/useOnboardingProgress.test.ts`**

```typescript
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useOnboardingProgress } from '../useOnboardingProgress';
import { LOCALSTORAGE_KEY, ONBOARDING_LIMITS } from '../constants';

describe('useOnboardingProgress', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('initialization', () => {
    it('starts with zero counts when no localStorage', () => {
      const { result } = renderHook(() => useOnboardingProgress());
      expect(result.current.getCount('opportunity')).toBe(0);
      expect(result.current.getCount('activity')).toBe(0);
    });

    it('loads existing progress from localStorage', () => {
      localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify({
        opportunity_create_count: 3,
        activity_create_count: 5,
        contact_create_count: 0,
        task_create_count: 0,
        attention_card_dismissed: false,
        attention_card_dismissed_principals: [],
        workflow_hints_disabled: false,
        last_updated: new Date().toISOString(),
      }));

      const { result } = renderHook(() => useOnboardingProgress());
      expect(result.current.getCount('opportunity')).toBe(3);
      expect(result.current.getCount('activity')).toBe(5);
    });

    it('handles corrupted localStorage gracefully', () => {
      localStorage.setItem(LOCALSTORAGE_KEY, 'not-json');
      const { result } = renderHook(() => useOnboardingProgress());
      expect(result.current.getCount('opportunity')).toBe(0);
    });
  });

  describe('incrementCount', () => {
    it('increments and persists count', () => {
      const { result } = renderHook(() => useOnboardingProgress());

      act(() => {
        result.current.incrementCount('opportunity');
      });

      expect(result.current.getCount('opportunity')).toBe(1);

      const stored = JSON.parse(localStorage.getItem(LOCALSTORAGE_KEY) || '{}');
      expect(stored.opportunity_create_count).toBe(1);
    });
  });

  describe('shouldShowHint', () => {
    it('returns true when count below threshold', () => {
      const { result } = renderHook(() => useOnboardingProgress());
      expect(result.current.shouldShowHint('opportunity')).toBe(true);
    });

    it('returns false when count reaches threshold', () => {
      localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify({
        opportunity_create_count: ONBOARDING_LIMITS.MAX_WORKFLOW_HINTS,
        activity_create_count: 0,
        contact_create_count: 0,
        task_create_count: 0,
        attention_card_dismissed: false,
        attention_card_dismissed_principals: [],
        workflow_hints_disabled: false,
        last_updated: new Date().toISOString(),
      }));

      const { result } = renderHook(() => useOnboardingProgress());
      expect(result.current.shouldShowHint('opportunity')).toBe(false);
    });

    it('returns false when hints globally disabled', () => {
      localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify({
        opportunity_create_count: 0,
        activity_create_count: 0,
        contact_create_count: 0,
        task_create_count: 0,
        attention_card_dismissed: false,
        attention_card_dismissed_principals: [],
        workflow_hints_disabled: true,
        last_updated: new Date().toISOString(),
      }));

      const { result } = renderHook(() => useOnboardingProgress());
      expect(result.current.shouldShowHint('opportunity')).toBe(false);
    });
  });

  describe('dismissCard', () => {
    it('sets dismissed flag', () => {
      const { result } = renderHook(() => useOnboardingProgress());

      act(() => {
        result.current.dismissCard();
      });

      expect(result.current.isCardDismissed).toBe(true);
    });
  });

  describe('dismissPrincipal', () => {
    it('adds principal ID to dismissed list', () => {
      const { result } = renderHook(() => useOnboardingProgress());

      act(() => {
        result.current.dismissPrincipal(123);
      });

      expect(result.current.getDismissedPrincipals()).toContain(123);
      expect(result.current.isPrincipalDismissed(123)).toBe(true);
    });

    it('persists dismissed principals to localStorage', () => {
      const { result } = renderHook(() => useOnboardingProgress());

      act(() => {
        result.current.dismissPrincipal(456);
      });

      const stored = JSON.parse(localStorage.getItem(LOCALSTORAGE_KEY) || '{}');
      expect(stored.attention_card_dismissed_principals).toContain(456);
    });

    it('does not duplicate principal IDs', () => {
      const { result } = renderHook(() => useOnboardingProgress());

      act(() => {
        result.current.dismissPrincipal(123);
        result.current.dismissPrincipal(123);
      });

      const dismissed = result.current.getDismissedPrincipals();
      expect(dismissed.filter((id: number) => id === 123)).toHaveLength(1);
    });
  });
});
```

**Implementation:** `src/atomic-crm/onboarding/useOnboardingProgress.ts`

```typescript
import { useState, useCallback, useMemo, useEffect } from 'react';
import { LOCALSTORAGE_KEY, ONBOARDING_LIMITS, type OnboardingEntity } from './constants';
import type { OnboardingProgress } from './types';

const DEFAULT_PROGRESS: OnboardingProgress = {
  opportunity_create_count: 0,
  activity_create_count: 0,
  contact_create_count: 0,
  task_create_count: 0,
  attention_card_dismissed: false,
  attention_card_dismissed_principals: [],
  workflow_hints_disabled: false,
  last_updated: new Date().toISOString(),
};

/**
 * Check if localStorage is available (handles SSR, private browsing)
 */
function isLocalStorageAvailable(): boolean {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Load progress from localStorage with error handling
 */
function loadProgress(): OnboardingProgress {
  if (!isLocalStorageAvailable()) {
    return DEFAULT_PROGRESS;
  }

  try {
    const stored = localStorage.getItem(LOCALSTORAGE_KEY);
    if (!stored) return DEFAULT_PROGRESS;

    const parsed = JSON.parse(stored);
    // Validate shape
    if (typeof parsed.opportunity_create_count !== 'number') {
      return DEFAULT_PROGRESS;
    }
    return { ...DEFAULT_PROGRESS, ...parsed };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

/**
 * Save progress to localStorage
 */
function saveProgress(progress: OnboardingProgress): void {
  if (!isLocalStorageAvailable()) return;

  try {
    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify({
      ...progress,
      last_updated: new Date().toISOString(),
    }));
  } catch {
    // Silently fail if storage is full
  }
}

/**
 * Hook for managing onboarding progress state
 *
 * Tracks:
 * - Entity creation counts (for workflow hint suppression)
 * - AttentionCard dismissed state
 * - Per-principal dismissed state
 */
export function useOnboardingProgress() {
  const [progress, setProgress] = useState<OnboardingProgress>(loadProgress);

  // Persist changes
  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const getCount = useCallback((entity: OnboardingEntity): number => {
    const key = `${entity}_create_count` as keyof OnboardingProgress;
    return (progress[key] as number) || 0;
  }, [progress]);

  const incrementCount = useCallback((entity: OnboardingEntity): void => {
    setProgress((prev) => {
      const key = `${entity}_create_count` as keyof OnboardingProgress;
      return {
        ...prev,
        [key]: ((prev[key] as number) || 0) + 1,
      };
    });
  }, []);

  const shouldShowHint = useCallback((entity: OnboardingEntity): boolean => {
    if (progress.workflow_hints_disabled) return false;
    return getCount(entity) < ONBOARDING_LIMITS.MAX_WORKFLOW_HINTS;
  }, [progress.workflow_hints_disabled, getCount]);

  const disableAllHints = useCallback((): void => {
    setProgress((prev) => ({ ...prev, workflow_hints_disabled: true }));
  }, []);

  const dismissCard = useCallback((): void => {
    setProgress((prev) => ({ ...prev, attention_card_dismissed: true }));
  }, []);

  const expandCard = useCallback((): void => {
    setProgress((prev) => ({ ...prev, attention_card_dismissed: false }));
  }, []);

  const getDismissedPrincipals = useCallback((): number[] => {
    return progress.attention_card_dismissed_principals;
  }, [progress.attention_card_dismissed_principals]);

  /**
   * Dismiss a specific principal from AttentionCard
   * Persisted so user doesn't see same principal again after refresh
   */
  const dismissPrincipal = useCallback((principalId: number): void => {
    setProgress((prev) => ({
      ...prev,
      attention_card_dismissed_principals: [
        ...prev.attention_card_dismissed_principals.filter((id) => id !== principalId),
        principalId,
      ],
    }));
  }, []);

  /**
   * Check if a specific principal has been dismissed
   */
  const isPrincipalDismissed = useCallback((principalId: number): boolean => {
    return progress.attention_card_dismissed_principals.includes(principalId);
  }, [progress.attention_card_dismissed_principals]);

  const resetProgress = useCallback((): void => {
    setProgress(DEFAULT_PROGRESS);
  }, []);

  return {
    getCount,
    incrementCount,
    shouldShowHint,
    disableAllHints,
    isCardDismissed: progress.attention_card_dismissed,
    dismissCard,
    expandCard,
    getDismissedPrincipals,
    dismissPrincipal,
    isPrincipalDismissed,
    resetProgress,
  };
}
```

**Run:** `npm test -- --run src/atomic-crm/onboarding/__tests__/useOnboardingProgress.test.ts`

---

### Task 1.5: Task Principal Data via Denormalized View

**File:** `src/atomic-crm/dashboard/v3/hooks/useMyTasks.ts` (MODIFY)
**File:** `src/atomic-crm/dashboard/v3/types.ts` (MODIFY)

**Time:** 10 min | **TDD:** Manual verification

**DEPENDS ON:** Task 0.1 (`tasks_with_principal` view must exist)

**Purpose:** Enable TaskKanbanCard to show principal color ribbons by:
1. Querying `tasks_with_principal` view (NOT `tasks` table with `meta.expand`)
2. Using flat denormalized columns (`principal_id`, `principal_name`, etc.)
3. Mapping the flat data to `RelatedEntity.principal`

**IMPORTANT:** Remove `meta.expand` - the Supabase provider doesn't support it.
Use the `tasks_with_principal` view which denormalizes all related data.

**Step 1: Update types.ts - Match view columns**

```typescript
// src/atomic-crm/dashboard/v3/types.ts

export interface RelatedEntity {
  type: "opportunity" | "contact" | "organization" | "personal";
  name: string;
  id: number;
  /** Principal info from denormalized view (for ribbon color) */
  principal?: {
    id: number;
    name: string;
  };
}

/**
 * Response shape from tasks_with_principal view
 * Uses flat denormalized columns instead of nested objects
 */
export interface TaskApiResponse {
  id: number;
  title: string;        // DB field - mapped to 'subject' in UI
  due_date: string;
  priority: string;
  type: string;
  completed: boolean;
  description?: string; // DB field - mapped to 'notes' in UI
  sales_id: number;
  opportunity_id?: number;
  contact_id?: number;
  organization_id?: number;
  // Denormalized columns from tasks_with_principal view (NOT nested objects)
  opportunity_name?: string;
  principal_id?: number;
  principal_name?: string;
  contact_name?: string;
  organization_name?: string;
}
```

**Step 2: Update useMyTasks.ts - Query view, remove meta.expand**

```typescript
// Change resource from "tasks" to "tasks_with_principal"
// REMOVE meta.expand - not supported by Supabase provider
const {
  data: rawTasks = [],
  isLoading: loading,
  error: fetchError,
  refetch: _refetch,
} = useGetList<TaskApiResponse>(
  "tasks_with_principal",  // CHANGED: Use denormalized view
  {
    filter: {
      sales_id: salesId,
      completed: false,
      // Note: deleted_at IS NULL is already in view WHERE clause
    },
    sort: { field: "due_date", order: "ASC" },
    pagination: { page: 1, perPage: 100 },
    // REMOVED: meta.expand - not supported, view provides all data
  },
  {
    enabled: !salesLoading && !!salesId,
    staleTime: 5 * 60 * 1000,
  }
);

// In the transform (serverTasks mapping), use flat columns:
relatedTo: {
  type: task.opportunity_id
    ? "opportunity"
    : task.contact_id
      ? "contact"
      : task.organization_id
        ? "organization"
        : "personal",
  name:
    task.opportunity_name ||  // Flat column from view
    task.contact_name ||      // Flat column from view
    task.organization_name || // Flat column from view
    "Personal Task",
  id: task.opportunity_id || task.contact_id || task.organization_id || 0,
  // Principal from flat denormalized columns
  principal: task.principal_id
    ? {
        id: task.principal_id,
        name: task.principal_name || 'Unknown Principal',
      }
    : undefined,
},
```

**Verification:**
```bash
npm run dev
# Open DevTools Network tab
# Navigate to Tasks panel
# Verify API calls "tasks_with_principal" (not "tasks")
# Verify response includes principal_id, principal_name as flat columns
# Verify task cards show principal color ribbons
```

---

## WAVE 2: UI Components (PARALLEL)

**All tasks in Wave 2 can run simultaneously after Wave 1 complete.**

---

### Task 2.1: StalenessIndicator Component

**File:** `src/atomic-crm/onboarding/StalenessIndicator.tsx` (NEW)

**Time:** 5 min | **TDD:** Yes

**IMPORTANT:** Uses view's `status_indicator` field directly. Thresholds are:
- `good`: ≤7 days (renders nothing)
- `warning`: 7-14 days (yellow badge)
- `urgent`: >14 days (red badge)

**Test:** `src/atomic-crm/onboarding/__tests__/StalenessIndicator.test.tsx`

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StalenessIndicator } from '../StalenessIndicator';

describe('StalenessIndicator', () => {
  describe('Good staleness (≤7 days)', () => {
    it('returns null for status_indicator="good"', () => {
      const { container } = render(
        <StalenessIndicator statusIndicator="good" daysSinceActivity={2} />
      );
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('Warning staleness (7-14 days)', () => {
    it('shows warning badge for status_indicator="warning"', () => {
      render(<StalenessIndicator statusIndicator="warning" daysSinceActivity={5} />);
      const badge = screen.getByText('5d');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-amber-100');
    });
  });

  describe('Urgent staleness (>14 days)', () => {
    it('shows urgent badge for status_indicator="urgent"', () => {
      render(<StalenessIndicator statusIndicator="urgent" daysSinceActivity={12} />);
      const badge = screen.getByText('12d');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-destructive');
    });
  });

  describe('accessibility', () => {
    it('has accessible label with severity', () => {
      render(<StalenessIndicator statusIndicator="urgent" daysSinceActivity={12} />);
      const badge = screen.getByRole('status');
      expect(badge).toHaveAccessibleName(/12 days since last activity - urgent attention needed/i);
    });
  });
});
```

**Implementation:** `src/atomic-crm/onboarding/StalenessIndicator.tsx`

```typescript
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { StalenessLevel } from './constants';

interface StalenessIndicatorProps {
  /** View-computed status: 'good' | 'warning' | 'urgent' */
  statusIndicator: StalenessLevel;
  /** Days since last activity (for display) */
  daysSinceActivity: number | null;
  className?: string;
}

/**
 * Visual indicator for principal activity staleness
 *
 * Uses dashboard_principal_summary view's pre-computed status_indicator.
 * Renders nothing for 'good' status (≤7 days).
 */
export function StalenessIndicator({
  statusIndicator,
  daysSinceActivity,
  className,
}: StalenessIndicatorProps) {
  // Don't show badge for healthy principals
  if (statusIndicator === 'good') {
    return null;
  }

  const isUrgent = statusIndicator === 'urgent';
  const hasData = daysSinceActivity !== null && daysSinceActivity !== undefined;

  // Display "—" for unknown data, actual days otherwise
  const displayText = hasData ? `${daysSinceActivity}d` : '—';
  const accessibleLabel = hasData
    ? isUrgent
      ? `${daysSinceActivity} days since last activity - urgent attention needed`
      : `${daysSinceActivity} days since last activity - needs attention`
    : isUrgent
      ? 'Unknown days since last activity - urgent attention needed'
      : 'Unknown days since last activity - needs attention';

  return (
    <Badge
      role="status"
      aria-label={accessibleLabel}
      className={cn(
        'text-xs font-medium',
        isUrgent
          ? 'bg-destructive text-destructive-foreground'
          : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100',
        className
      )}
    >
      {displayText}
    </Badge>
  );
}
```

**Run:** `npm test -- --run src/atomic-crm/onboarding/__tests__/StalenessIndicator.test.tsx`

---

### Task 2.2: ShowMoreSection Component

**File:** `src/atomic-crm/components/ShowMoreSection.tsx` (NEW)

**Time:** 5 min | **TDD:** Yes

**Test:** `src/atomic-crm/components/__tests__/ShowMoreSection.test.tsx`

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { ShowMoreSection } from '../ShowMoreSection';

describe('ShowMoreSection', () => {
  it('hides children by default', () => {
    render(
      <ShowMoreSection label="More options">
        <div data-testid="hidden-content">Secret content</div>
      </ShowMoreSection>
    );

    expect(screen.queryByTestId('hidden-content')).not.toBeInTheDocument();
  });

  it('shows children when expanded', async () => {
    const user = userEvent.setup();

    render(
      <ShowMoreSection label="More options">
        <div data-testid="hidden-content">Secret content</div>
      </ShowMoreSection>
    );

    await user.click(screen.getByRole('button', { name: /more options/i }));

    expect(screen.getByTestId('hidden-content')).toBeInTheDocument();
  });

  it('supports defaultExpanded prop', () => {
    render(
      <ShowMoreSection label="More options" defaultExpanded>
        <div data-testid="visible-content">Visible content</div>
      </ShowMoreSection>
    );

    expect(screen.getByTestId('visible-content')).toBeInTheDocument();
  });

  it('has accessible aria-expanded state', async () => {
    const user = userEvent.setup();

    render(
      <ShowMoreSection label="More options">
        <div>Content</div>
      </ShowMoreSection>
    );

    const button = screen.getByRole('button', { name: /more options/i });
    expect(button).toHaveAttribute('aria-expanded', 'false');

    await user.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });
});
```

**Implementation:** `src/atomic-crm/components/ShowMoreSection.tsx`

```typescript
import { useState, type ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ShowMoreSectionProps {
  label: string;
  children: ReactNode;
  defaultExpanded?: boolean;
  className?: string;
}

/**
 * Collapsible section for progressive disclosure
 *
 * Use to hide optional form fields behind "More options" toggle.
 * Reduces cognitive load for common use cases.
 */
export function ShowMoreSection({
  label,
  children,
  defaultExpanded = false,
  className,
}: ShowMoreSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className={cn('space-y-3', className)}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
      >
        {expanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
        {label}
      </Button>

      {expanded && (
        <div className="pl-5 space-y-4 animate-in fade-in-50 slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  );
}
```

**Run:** `npm test -- --run src/atomic-crm/components/__tests__/ShowMoreSection.test.tsx`

---

### Task 2.3: LinkedRecordChip Component

**File:** `src/atomic-crm/components/LinkedRecordChip.tsx` (NEW)

**Time:** 8 min | **TDD:** Yes

**Purpose:** Display linked entity context in forms, showing resource type + name in a compact chip. Clicking opens entity in slide-over panel.

**Test:** `src/atomic-crm/components/__tests__/LinkedRecordChip.test.tsx`

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { LinkedRecordChip } from '../LinkedRecordChip';

describe('LinkedRecordChip', () => {
  it('renders resource type icon and name', () => {
    render(
      <LinkedRecordChip
        resourceType="opportunity"
        resourceId={123}
        resourceName="Acme Corp Deal"
      />
    );

    expect(screen.getByText('Acme Corp Deal')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('shows opportunity icon for opportunity type', () => {
    render(
      <LinkedRecordChip
        resourceType="opportunity"
        resourceId={123}
        resourceName="Deal"
      />
    );

    // Briefcase icon for opportunities
    expect(screen.getByTestId('chip-icon')).toHaveClass('lucide-briefcase');
  });

  it('shows contact icon for contact type', () => {
    render(
      <LinkedRecordChip
        resourceType="contact"
        resourceId={456}
        resourceName="John Doe"
      />
    );

    expect(screen.getByTestId('chip-icon')).toHaveClass('lucide-user');
  });

  it('calls onNavigate with correct URL on click', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();

    render(
      <LinkedRecordChip
        resourceType="opportunity"
        resourceId={123}
        resourceName="Deal"
        onNavigate={onNavigate}
      />
    );

    await user.click(screen.getByRole('button'));

    expect(onNavigate).toHaveBeenCalledWith('/opportunities?view=123');
  });

  it('is accessible with proper button role', () => {
    render(
      <LinkedRecordChip
        resourceType="contact"
        resourceId={456}
        resourceName="John Doe"
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAccessibleName(/john doe/i);
  });

  it('supports clearable mode', async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();

    render(
      <LinkedRecordChip
        resourceType="opportunity"
        resourceId={123}
        resourceName="Deal"
        clearable
        onClear={onClear}
      />
    );

    await user.click(screen.getByRole('button', { name: /clear/i }));

    expect(onClear).toHaveBeenCalled();
  });
});
```

**Implementation:** `src/atomic-crm/components/LinkedRecordChip.tsx`

```typescript
import { Briefcase, User, Building2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ResourceType = 'opportunity' | 'contact' | 'organization';

interface LinkedRecordChipProps {
  resourceType: ResourceType;
  resourceId: number;
  resourceName: string;
  /** Called when chip clicked - navigates to slide-over view */
  onNavigate?: (path: string) => void;
  /** Show clear button */
  clearable?: boolean;
  /** Called when clear button clicked */
  onClear?: () => void;
  className?: string;
}

const RESOURCE_CONFIG: Record<ResourceType, { icon: typeof Briefcase; label: string; basePath: string }> = {
  opportunity: { icon: Briefcase, label: 'Opportunity', basePath: '/opportunities' },
  contact: { icon: User, label: 'Contact', basePath: '/contacts' },
  organization: { icon: Building2, label: 'Organization', basePath: '/organizations' },
};

/**
 * Compact chip displaying linked entity context
 *
 * Used in minimal forms to show pre-filled context.
 * Clicking navigates to entity slide-over panel.
 */
export function LinkedRecordChip({
  resourceType,
  resourceId,
  resourceName,
  onNavigate,
  clearable = false,
  onClear,
  className,
}: LinkedRecordChipProps) {
  const config = RESOURCE_CONFIG[resourceType];
  const Icon = config.icon;

  const handleClick = () => {
    if (onNavigate) {
      onNavigate(`${config.basePath}?view=${resourceId}`);
    }
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full',
        'bg-muted text-sm',
        className
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleClick}
        className="h-auto p-0 hover:bg-transparent hover:underline"
        aria-label={`View ${resourceName}`}
      >
        <Icon
          data-testid="chip-icon"
          className={cn('h-3.5 w-3.5 mr-1', `lucide-${resourceType === 'opportunity' ? 'briefcase' : resourceType === 'contact' ? 'user' : 'building-2'}`)}
        />
        <span className="max-w-[150px] truncate">{resourceName}</span>
      </Button>

      {clearable && onClear && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-4 w-4 p-0 ml-1 hover:bg-destructive/10"
          aria-label="Clear linked record"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
```

**Run:** `npm test -- --run src/atomic-crm/components/__tests__/LinkedRecordChip.test.tsx`

---

### Task 2.4: InlineDatePicker Component

**File:** `src/atomic-crm/components/InlineDatePicker.tsx` (NEW)

**Time:** 10 min | **TDD:** Yes

**Test:** `src/atomic-crm/components/__tests__/InlineDatePicker.test.tsx`

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { InlineDatePicker } from '../InlineDatePicker';

describe('InlineDatePicker', () => {
  it('displays formatted date', () => {
    const date = new Date('2025-01-15');
    render(<InlineDatePicker value={date} onChange={vi.fn()} />);

    expect(screen.getByRole('button')).toHaveTextContent(/jan 15/i);
  });

  it('opens calendar on click', async () => {
    const user = userEvent.setup();
    const date = new Date('2025-01-15');

    render(<InlineDatePicker value={date} onChange={vi.fn()} />);

    await user.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /choose due date/i })).toBeInTheDocument();
    });
  });

  it('calls onChange when date selected', async () => {
    const user = userEvent.setup();
    const date = new Date('2025-01-15');
    const onChange = vi.fn();

    render(<InlineDatePicker value={date} onChange={onChange} />);

    await user.click(screen.getByRole('button'));
    await user.click(screen.getByRole('button', { name: 'Tomorrow' }));

    expect(onChange).toHaveBeenCalled();
  });

  it('shows quick action shortcuts', async () => {
    const user = userEvent.setup();
    const date = new Date('2025-01-15');

    render(<InlineDatePicker value={date} onChange={vi.fn()} />);

    await user.click(screen.getByRole('button'));

    expect(screen.getByRole('button', { name: 'Today' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tomorrow' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next Week' })).toBeInTheDocument();
  });

  it('has accessible dialog with title', async () => {
    const user = userEvent.setup();
    const date = new Date('2025-01-15');

    render(<InlineDatePicker value={date} onChange={vi.fn()} />);

    await user.click(screen.getByRole('button'));

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAccessibleName(/choose due date/i);
  });

  it('closes on Escape key', async () => {
    const user = userEvent.setup();
    const date = new Date('2025-01-15');

    render(<InlineDatePicker value={date} onChange={vi.fn()} />);

    await user.click(screen.getByRole('button'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
```

**Implementation:** `src/atomic-crm/components/InlineDatePicker.tsx`

```typescript
import { useState, useRef, useCallback } from 'react';
import { format, addDays, startOfWeek, addWeeks } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface InlineDatePickerProps {
  value: Date;
  onChange: (date: Date) => Promise<void> | void;
  disabled?: boolean;
  className?: string;
}

/**
 * Inline date picker for task cards
 *
 * Features:
 * - Compact trigger showing abbreviated date
 * - Quick action shortcuts (Today, Tomorrow, Next Week)
 * - Full calendar for custom selection
 * - WCAG 2.1 AA accessible (role="dialog", keyboard nav)
 */
export function InlineDatePicker({
  value,
  onChange,
  disabled = false,
  className,
}: InlineDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const handleDateChange = useCallback(async (date: Date) => {
    setIsUpdating(true);
    try {
      await onChange(date);
      setOpen(false);
    } finally {
      setIsUpdating(false);
    }
  }, [onChange]);

  const handleQuickAction = (days: number) => {
    const newDate = days === 0
      ? new Date()
      : days === 7
        ? addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), 1)
        : addDays(new Date(), days);
    handleDateChange(newDate);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant="ghost"
          size="sm"
          disabled={disabled || isUpdating}
          className={cn(
            'h-7 px-2 text-xs font-normal',
            isUpdating && 'opacity-50',
            className
          )}
        >
          <Calendar className="mr-1 h-3 w-3" />
          {format(value, 'MMM d')}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-auto p-0"
        align="start"
        role="dialog"
        aria-label="Choose due date"
      >
        <div className="p-3 space-y-3">
          {/* Quick actions */}
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleQuickAction(0)}
              disabled={isUpdating}
            >
              Today
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleQuickAction(1)}
              disabled={isUpdating}
            >
              Tomorrow
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleQuickAction(7)}
              disabled={isUpdating}
            >
              Next Week
            </Button>
          </div>

          {/* Calendar */}
          <DayPicker
            mode="single"
            selected={value}
            onSelect={(date) => date && handleDateChange(date)}
            disabled={isUpdating}
            className="rounded-md border"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
```

**Run:** `npm test -- --run src/atomic-crm/components/__tests__/InlineDatePicker.test.tsx`

---

### Task 2.5: WorkflowToast Function

**File:** `src/atomic-crm/onboarding/WorkflowToast.tsx` (NEW)

**Time:** 5 min | **TDD:** Yes

```typescript
import { toast } from 'sonner';
import type { OnboardingEntity } from './constants';

/**
 * Workflow hint configuration
 *
 * IMPORTANT: Activities use 'dialog' action type (opens QuickLogActivityDialog),
 * other entities use 'navigate' action type (router navigation).
 * This aligns with Decision 2: Activity Creation Pattern.
 */
interface WorkflowHintConfig {
  message: string;
  nextAction: string;
  /** 'dialog' = trigger callback, 'navigate' = router push */
  actionType: 'dialog' | 'navigate';
  /** Path for navigate action, or dialog identifier for dialog action */
  target: string;
}

interface WorkflowToastOptions {
  action: 'create' | 'update';
  entity: OnboardingEntity;
  entityName: string;
  /** Called for 'navigate' action type */
  onNavigate?: (path: string) => void;
  /** Called for 'dialog' action type - receives dialogId AND context for prefilling */
  onOpenDialog?: (dialogId: string, context: Record<string, unknown>) => void;
  /** Context to pass to dialog (e.g., { opportunityId: 123 } for activity dialog) */
  dialogContext?: Record<string, unknown>;
}

const WORKFLOW_HINTS: Record<OnboardingEntity, WorkflowHintConfig> = {
  opportunity: {
    message: 'Great! Now log your first activity for this opportunity.',
    actionType: 'dialog',  // Opens QuickLogActivityDialog (NOT router navigation)
    target: 'activity',
    nextAction: 'Log Activity',
  },
  activity: {
    message: 'Activity logged! Consider creating a follow-up task.',
    actionType: 'navigate',
    target: '/tasks/create',
    nextAction: 'Create Task',
  },
  contact: {
    message: 'Contact added! Link them to an opportunity.',
    actionType: 'navigate',
    target: '/opportunities/create',
    nextAction: 'Create Opportunity',
  },
  task: {
    message: 'Task created! You can view all tasks in My Tasks.',
    actionType: 'navigate',
    target: '/#tasks',
    nextAction: 'View Tasks',
  },
};

/**
 * Show workflow guidance toast after entity creation
 *
 * Uses sonner for accessible, dismissible toasts.
 * CTA triggers either dialog (for activities) or navigation (for other entities).
 *
 * IMPORTANT: Activity logging uses dialog callback, NOT router navigation.
 * See Decision 2: Activity Creation Pattern.
 */
export function showWorkflowToast({
  action,
  entity,
  entityName,
  onNavigate,
  onOpenDialog,
  dialogContext,
}: WorkflowToastOptions) {
  const hint = WORKFLOW_HINTS[entity];
  if (!hint) return;

  const title = action === 'create'
    ? `${entityName} created!`
    : `${entityName} updated!`;

  const handleAction = () => {
    if (hint.actionType === 'dialog' && onOpenDialog) {
      onOpenDialog(hint.target);
    } else if (hint.actionType === 'navigate' && onNavigate) {
      onNavigate(hint.target);
    }
  };

  toast.success(title, {
    description: hint.message,
    duration: 8000,
    action: {
      label: hint.nextAction,
      onClick: handleAction,
    },
    // Accessibility: role="status" is default for sonner
  });
}
```

---

### Task 2.6: AttentionCard Component

**File:** `src/atomic-crm/onboarding/AttentionCard.tsx` (NEW)

**Time:** 10 min | **TDD:** Yes

```typescript
import { useMemo } from 'react';
import { AlertTriangle, ChevronRight, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StalenessIndicator } from './StalenessIndicator';
import { getPrincipalColor } from './principalColors';
import { ONBOARDING_LIMITS } from './constants';
import type { DashboardPrincipalSummary } from './types';

interface AttentionCardProps {
  /** Principals from dashboard_principal_summary view */
  principals: DashboardPrincipalSummary[];
  /** Called when "Log Activity" clicked for a principal */
  onLogActivity: (principalId: number) => void;
  /** Called when card dismissed */
  onDismiss?: () => void;
  /** Whether card is in collapsed state */
  isDismissed?: boolean;
  /** Called when expanding from collapsed state */
  onExpand?: () => void;
}

/**
 * Dashboard card highlighting principals needing attention
 *
 * Shows top 3 principals with warning/urgent staleness.
 * Uses dashboard_principal_summary view's pre-computed status_indicator.
 */
export function AttentionCard({
  principals,
  onLogActivity,
  onDismiss,
  isDismissed = false,
  onExpand,
}: AttentionCardProps) {
  // Filter to warning/urgent, sort by priority_score descending
  const stalePrincipals = useMemo(() => {
    return principals
      .filter((p) => p.status_indicator === 'warning' || p.status_indicator === 'urgent')
      .sort((a, b) => (b.priority_score ?? 0) - (a.priority_score ?? 0))
      .slice(0, ONBOARDING_LIMITS.MAX_ATTENTION_CARDS);
  }, [principals]);

  if (stalePrincipals.length === 0) {
    return null;
  }

  // Collapsed summary view
  if (isDismissed) {
    return (
      <button
        onClick={onExpand}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <span>{stalePrincipals.length} principals need attention</span>
        <ChevronRight className="h-4 w-4" />
      </button>
    );
  }

  return (
    <Card data-testid="attention-card" className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Principals Need Attention
        </CardTitle>
        {onDismiss && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onDismiss}
            aria-label="Dismiss attention card"
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {stalePrincipals.map((principal) => (
          <div
            key={principal.id}
            className={`flex items-center justify-between p-2 rounded-lg border-l-4 bg-background ${getPrincipalColor(principal.id ?? undefined)}`}
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{principal.principal_name}</p>
              <p className="text-xs text-muted-foreground">
                {principal.days_since_last_activity ?? '∞'} days · {principal.opportunity_count ?? 0} opps
              </p>
            </div>

            <div className="flex items-center gap-2">
              <StalenessIndicator
                statusIndicator={principal.status_indicator}
                daysSinceActivity={principal.days_since_last_activity}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => principal.id && onLogActivity(principal.id)}
                disabled={!principal.id}
              >
                Log Activity
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
```

---

## WAVE 3: Feature Integration (SEQUENTIAL)

**Depends on Wave 1 + Wave 2 completion.**

---

### Task 3.1: TaskKanbanCard Integration

**File:** `src/atomic-crm/dashboard/v3/TaskKanbanCard.tsx` (MODIFY)

**Time:** 10 min

**Changes:**
1. Import `getPrincipalColor` from `@/atomic-crm/onboarding`
2. Import `InlineDatePicker` from `@/atomic-crm/components`
3. Add principal color ribbon to card left edge
4. Replace date display with InlineDatePicker
5. Wire onDateChange through column to panel
6. **FIX `arePropsEqual` memo guard** - add missing comparisons

**CRITICAL FIX: Update `arePropsEqual` function**

The existing memo guard only checks `relatedTo.name`, ignoring `id`, `type`, and new `principal` field.
This causes stale UI when related entities change or principal ribbons need updating.

```typescript
// TaskKanbanCard.tsx - Update arePropsEqual to include all relevant fields
function arePropsEqual(prevProps: TaskKanbanCardProps, nextProps: TaskKanbanCardProps): boolean {
  const prevTask = prevProps.task;
  const nextTask = nextProps.task;

  return (
    prevTask.id === nextTask.id &&
    prevTask.subject === nextTask.subject &&
    prevTask.dueDate.getTime() === nextTask.dueDate.getTime() &&
    prevTask.priority === nextTask.priority &&
    prevTask.status === nextTask.status &&
    // FIX: Include all relatedTo fields (was only checking name)
    prevTask.relatedTo.id === nextTask.relatedTo.id &&
    prevTask.relatedTo.type === nextTask.relatedTo.type &&
    prevTask.relatedTo.name === nextTask.relatedTo.name &&
    // FIX: Include principal for ribbon updates
    prevTask.relatedTo.principal?.id === nextTask.relatedTo.principal?.id &&
    // FIX: Include callback reference for date picker
    prevProps.onDateChange === nextProps.onDateChange
  );
}

// Apply memo with fixed comparator
export const TaskKanbanCard = memo(TaskKanbanCardComponent, arePropsEqual);
```

```typescript
// Add imports
import { getPrincipalColor } from '@/atomic-crm/onboarding';
import { InlineDatePicker } from '@/atomic-crm/components/InlineDatePicker';

// Add prop
interface TaskKanbanCardProps {
  task: TaskItem;
  index: number;
  onComplete: (taskId: number) => Promise<void>;
  onSnooze: (taskId: number) => Promise<void>;
  onDelete: (taskId: number) => Promise<void>;
  onView: (taskId: number) => void;
  onDateChange: (taskId: number, newDate: Date) => Promise<void>;  // ADDED
}

// In component - handle date change
const handleDateChange = async (newDate: Date) => {
  await onDateChange(task.id, newDate);
};

// In render - principal ribbon
<div
  data-testid="principal-ribbon"
  className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg border-l-4 ${getPrincipalColor(task.relatedTo.principal?.id)}`}
/>

// In metadata row - InlineDatePicker
<InlineDatePicker value={task.dueDate} onChange={handleDateChange} />
```

**Wiring Chain (update all files):**

```typescript
// TaskKanbanColumn.tsx - Add prop and pass through
interface TaskKanbanColumnProps {
  // ... existing props
  onDateChange: (taskId: number, newDate: Date) => Promise<void>;
}

// In map:
<TaskKanbanCard
  key={task.id}
  task={task}
  index={index}
  onComplete={onComplete}
  onSnooze={onSnooze}
  onDelete={onDelete}
  onView={onView}
  onDateChange={onDateChange}  // PASS THROUGH
/>

// TasksKanbanPanel.tsx - Use existing updateTaskDueDate
const { updateTaskDueDate } = useMyTasks();  // Already destructured

<TaskKanbanColumn
  columnId="today"
  title="Today"
  tasks={tasksByColumn.today}
  onComplete={completeTask}
  onSnooze={snoozeTask}
  onDelete={deleteTask}
  onView={viewTask}
  onDateChange={updateTaskDueDate}  // WIRE EXISTING FUNCTION
/>
```

---

### Task 3.2: TaskCreate Minimal Form Enhancement

**File:** `src/atomic-crm/tasks/TaskCreate.tsx` (MODIFY)

**Time:** 10 min

**IMPORTANT:** Keep existing `CreateBase`/`Form` pattern - do NOT replace with `SimpleForm`.
The existing form uses `getTaskDefaultValues()`, identity for `sales_id`, and custom inputs.
We're adding context pre-fill from URL query params and progressive disclosure.

**Changes:**
1. Import `useQueryParams`, `getNumericParam`, `showWorkflowToast` from `@/atomic-crm/onboarding`
2. Import `ShowMoreSection` for optional fields
3. Merge query params into form defaults (existing `getTaskDefaultValues()` pattern)
4. Hide optional fields (notes, priority) in ShowMoreSection
5. Add workflow toast in onSuccess

**Minimal Fields (3):**
- Subject (required) - **NOTE: Field is `subject`, NOT `title`**
- Due Date (required, defaults to tomorrow)
- Related Entity (pre-filled from URL query params)

**Hidden Fields:**
- Notes - **NOTE: Field is `notes`, NOT `description`**
- Priority (defaults to 'Medium') - **NOTE: Title Case**
- Type (defaults to 'Follow-up') - **NOTE: Title Case**

```typescript
import { useQueryParams, getNumericParam, showWorkflowToast } from '@/atomic-crm/onboarding';
import { ShowMoreSection } from '@/atomic-crm/components/ShowMoreSection';

// In component - parse hash URL query params
const queryParams = useQueryParams();
const opportunityIdFromUrl = getNumericParam(queryParams, 'opportunity_id');
const contactIdFromUrl = getNumericParam(queryParams, 'contact_id');

// Merge URL params into existing defaults pattern
const defaultValues = useMemo(() => ({
  ...getTaskDefaultValues(),  // Keep existing defaults
  due_date: addDays(new Date(), 1),  // Default to tomorrow
  priority: 'Medium',      // Title Case per schema
  type: 'Follow-up',       // Title Case per schema
  // Pre-fill from URL query params (hash-based routing)
  opportunity_id: opportunityIdFromUrl,
  contact_id: contactIdFromUrl,
}), [opportunityIdFromUrl, contactIdFromUrl]);

// In form - keep CreateBase/Form pattern, add ShowMoreSection
// NOTE: Existing TaskCreate already uses CreateBase + Form, not SimpleForm
{/* Minimal fields - always visible */}
<TextInput source="subject" label="Task Subject" fullWidth />
<DateInput source="due_date" label="Due Date" />

{/* Context indicator - show linked entity from URL params */}
{opportunityIdFromUrl && (
  <LinkedRecordChip
    opportunityId={opportunityIdFromUrl}
    opportunityName={queryParams.opportunity_name}  // Optional name from URL
  />
)}

{/* Optional fields - progressive disclosure */}
<ShowMoreSection label="More options">
  <TextInput source="notes" multiline rows={3} label="Notes" />
  <SelectInput source="priority" choices={PRIORITY_CHOICES} />
  <SelectInput source="type" choices={TASK_TYPE_CHOICES} />
</ShowMoreSection>

// In onSuccess handler
showWorkflowToast({
  action: 'create',
  entity: 'task',
  entityName: data.subject,
  onNavigate: (path) => { window.location.href = `/#${path}`; },
});
```

---

### Task 3.3: Dashboard AttentionCard Integration

**File:** `src/atomic-crm/dashboard/v3/PrincipalDashboardV3.tsx` (MODIFY)

**Time:** 8 min

**Changes:**
1. Import `AttentionCard` and `DashboardPrincipalSummary`
2. Fetch principals from `dashboard_principal_summary` view
3. Add AttentionCard above tabbed interface
4. Wire "Log Activity" to open QuickLogActivityDialog (not router!)

```typescript
import { useGetList } from 'react-admin';
import { AttentionCard } from '@/atomic-crm/onboarding';
import type { DashboardPrincipalSummary } from '@/atomic-crm/onboarding';
import { QuickLogActivityDialog } from '@/atomic-crm/activities/QuickLogActivityDialog';

// In component
const [activityDialogPrincipalId, setActivityDialogPrincipalId] = useState<number | null>(null);

// Fetch from view (NO custom query, NO includeStaleness meta)
const { data: principalSummaries } = useGetList<DashboardPrincipalSummary>(
  'dashboard_principal_summary',  // Actual view resource
  {
    pagination: { page: 1, perPage: 100 },
    sort: { field: 'priority_score', order: 'DESC' },
  }
);

// Handler opens dialog, not router navigation
const handleLogActivity = (principalId: number) => {
  setActivityDialogPrincipalId(principalId);
};

// In render, before tabbed interface
{principalSummaries && principalSummaries.length > 0 && (
  <div className="shrink-0 px-4 pb-4">
    <AttentionCard
      principals={principalSummaries}
      onLogActivity={handleLogActivity}  // Opens dialog
    />
  </div>
)}

{/* Activity dialog - receives principal context via props */}
{/* NOTE: QuickLogActivityDialog uses onOpenChange (NOT onClose) per actual component API */}
<QuickLogActivityDialog
  open={activityDialogPrincipalId !== null}
  onOpenChange={(open) => {
    if (!open) setActivityDialogPrincipalId(null);
  }}
  entityContext={{
    // principal.id from dashboard_principal_summary IS the organization FK
    // (view defines: pa.principal_organization_id AS id)
    organizationId: activityDialogPrincipalId ?? undefined,
  }}
/>
```

---

## WAVE 4: Testing & Polish (PARALLEL)

---

### Task 4.1: Run All Unit Tests

```bash
# Run all onboarding tests
npm test -- --run src/atomic-crm/onboarding/

# Run component tests
npm test -- --run src/atomic-crm/components/

# Run dashboard hook tests
npm test -- --run src/atomic-crm/dashboard/v3/
```

---

### Task 4.2: E2E Tests

**File:** `tests/e2e/ux-enhancement-suite.spec.ts` (NEW)

**CORRECTED SELECTORS:** Task cards use `role="button"`, not `role="article"`.

```typescript
import { test, expect } from '@playwright/test';

test.describe('UX Enhancement Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('AttentionCard', () => {
    test('shows principals with stale activity', async ({ page }) => {
      const attentionCard = page.locator('[data-testid="attention-card"]');
      await expect(attentionCard).toBeVisible();
    });

    test('dismiss collapses to summary view', async ({ page }) => {
      const attentionCard = page.locator('[data-testid="attention-card"]');
      await attentionCard.getByRole('button', { name: /dismiss/i }).click();
      await expect(page.getByText(/principals need attention/i)).toBeVisible();
    });

    test('Log Activity opens dialog', async ({ page }) => {
      const attentionCard = page.locator('[data-testid="attention-card"]');
      await attentionCard.getByRole('button', { name: /log activity/i }).first().click();

      // Should open dialog, not navigate
      await expect(page.getByRole('dialog')).toBeVisible();
    });
  });

  test.describe('Task Inline Date Picker', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByRole('tab', { name: /my tasks/i }).click();
    });

    test('opens date picker on date click', async ({ page }) => {
      // CORRECTED: Cards use role="button", access via class
      const taskCard = page.locator('.interactive-card').first();
      const dateButton = taskCard.getByRole('button', { name: /\w{3} \d{1,2}/i });
      await dateButton.click();
      await expect(page.getByRole('dialog', { name: /choose due date/i })).toBeVisible();
    });

    test('shows quick action shortcuts', async ({ page }) => {
      const taskCard = page.locator('.interactive-card').first();
      const dateButton = taskCard.getByRole('button', { name: /\w{3} \d{1,2}/i });
      await dateButton.click();

      await expect(page.getByRole('button', { name: 'Today' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Tomorrow' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Next Week' })).toBeVisible();
    });

    test('principal ribbon shows on task cards', async ({ page }) => {
      const taskCard = page.locator('.interactive-card').first();
      const ribbon = taskCard.locator('[data-testid="principal-ribbon"]');
      await expect(ribbon).toBeVisible();
    });
  });

  test.describe('Task Minimal Form', () => {
    test('shows minimal form by default', async ({ page }) => {
      await page.goto('/tasks/create');

      // Minimal fields visible
      await expect(page.getByRole('textbox', { name: /title/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /due date/i })).toBeVisible();

      // Optional fields hidden
      await expect(page.getByRole('textbox', { name: /description/i })).not.toBeVisible();
    });

    test('More options reveals hidden fields', async ({ page }) => {
      await page.goto('/tasks/create');

      await page.getByRole('button', { name: /more options/i }).click();

      await expect(page.getByRole('textbox', { name: /description/i })).toBeVisible();
    });
  });
});
```

---

### Task 4.3: Visual QA (iPad Viewport)

Manual checklist on iPad viewport (1024x768):

- [ ] AttentionCard readable with 44px touch targets
- [ ] InlineDatePicker popover doesn't clip edge
- [ ] Task cards show principal ribbons clearly
- [ ] ShowMoreSection toggle has 44px tap area
- [ ] Date picker quick actions are finger-friendly

---

## Summary of Changes from Original Plan

| Original Task | Status | Reason |
|--------------|--------|--------|
| Task 1.1 STALENESS_THRESHOLDS | **REMOVED** | View computes thresholds |
| Task 1.5 Custom staleness query | **REMOVED** | View provides all data |
| Task 1.5 Data layer | **RENAMED** | Now "Task Principal Expansion" |
| Task 2.1 Test thresholds | **CORRECTED** | 3/7 days (not 5/10) |
| Task 3.2 ActivityCreate router | **REMOVED** | Activities use dialogs |
| Task 3.4 Dashboard query | **CORRECTED** | Uses `dashboard_principal_summary` resource |
| Task 3.5 Navigation buttons | **REMOVED** | Not needed for dialogs |
| Task 4.2 E2E selectors | **CORRECTED** | `role="button"`, not `role="article"` |

---

## Ready for Execution

This plan is internally consistent and ready for `/execute-plan`.

**Pre-flight:**
```bash
git checkout -b feature/ux-enhancement-suite
npm test -- --run
npm run build
```
