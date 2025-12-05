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
- `status_indicator`: 'good' | 'warning' | 'urgent' (thresholds: ≤3d, 3-7d, >7d)
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
│  │ 1.1 Types &    │  │ 1.2 Principal  │  │ 1.3 useNavigationContext       ││
│  │ Constants      │  │ Colors         │  │ (TaskCreate only)              ││
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
 * Thresholds: good ≤3d, warning 3-7d, urgent >7d (defined in SQL view)
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
  /** View-computed: 'good' (≤3d), 'warning' (3-7d), 'urgent' (>7d) */
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

// Types - view-aligned
export type {
  DashboardPrincipalSummary,
  OnboardingProgress,
  WorkflowHint,
  NavigationContextRecord,
  NavigationContext,
} from './types';

// Hooks (added in Wave 1)
// export { useOnboardingProgress } from './useOnboardingProgress';
// export { useNavigationContext } from './useNavigationContext';

// Components (added in Wave 2)
// export { AttentionCard } from './AttentionCard';
// export { StalenessIndicator } from './StalenessIndicator';
// export { showWorkflowToast } from './WorkflowToast';
```

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

### Task 1.3: useNavigationContext Hook (Tasks Only)

**File:** `src/atomic-crm/onboarding/useNavigationContext.ts` (NEW)

**Time:** 5 min | **TDD:** Yes

**NOTE:** This hook is used ONLY by TaskCreate. Activities use dialog props.

**Test First: `src/atomic-crm/onboarding/__tests__/useNavigationContext.test.ts`**

```typescript
import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useNavigationContext } from '../useNavigationContext';

// Mock react-router-dom
const mockLocation = { state: null as unknown };
vi.mock('react-router-dom', () => ({
  useLocation: () => mockLocation,
}));

describe('useNavigationContext', () => {
  beforeEach(() => {
    mockLocation.state = null;
  });

  it('returns empty record when no state', () => {
    const { result } = renderHook(() => useNavigationContext());
    expect(result.current.record).toEqual({});
    expect(result.current.source_resource).toBeUndefined();
  });

  it('extracts opportunity context from route state', () => {
    mockLocation.state = {
      record: { opportunity_id: 123 },
      source_resource: 'opportunities',
    };

    const { result } = renderHook(() => useNavigationContext());
    expect(result.current.record.opportunity_id).toBe(123);
    expect(result.current.source_resource).toBe('opportunities');
  });

  it('extracts contact context from route state', () => {
    mockLocation.state = {
      record: { contact_id: 456 },
      source_resource: 'contacts',
    };

    const { result } = renderHook(() => useNavigationContext());
    expect(result.current.record.contact_id).toBe(456);
    expect(result.current.source_resource).toBe('contacts');
  });
});
```

**Implementation:** `src/atomic-crm/onboarding/useNavigationContext.ts`

```typescript
import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import type { NavigationContext, NavigationContextRecord } from './types';

/**
 * Hook to extract navigation context from router state
 *
 * USAGE: TaskCreate only. Activities use QuickLogActivityDialog props.
 *
 * Example:
 * ```tsx
 * // In OpportunityShow.tsx - navigate to TaskCreate with context
 * navigate('/tasks/create', {
 *   state: {
 *     record: { opportunity_id: record.id },
 *     source_resource: 'opportunities'
 *   }
 * });
 *
 * // In TaskCreate.tsx
 * const { record } = useNavigationContext();
 * const defaultValues = { ...schema.partial().parse({}), ...record };
 * ```
 */
export function useNavigationContext(): NavigationContext {
  const location = useLocation();

  return useMemo(() => {
    const state = location.state as NavigationContext | null;

    if (!state?.record) {
      return { record: {} as NavigationContextRecord };
    }

    return {
      record: state.record,
      source_resource: state.source_resource,
    };
  }, [location.state]);
}
```

**Run:** `npm test -- --run src/atomic-crm/onboarding/__tests__/useNavigationContext.test.ts`

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
    resetProgress,
  };
}
```

**Run:** `npm test -- --run src/atomic-crm/onboarding/__tests__/useOnboardingProgress.test.ts`

---

### Task 1.5: Task Principal Expansion (useMyTasks Update)

**File:** `src/atomic-crm/dashboard/v3/hooks/useMyTasks.ts` (MODIFY)
**File:** `src/atomic-crm/dashboard/v3/types.ts` (MODIFY)

**Time:** 10 min | **TDD:** Manual verification

**Purpose:** Enable TaskKanbanCard to show principal color ribbons by:
1. Expanding `opportunity.principal_organization` in the query
2. Adding `principal` field to `RelatedEntity` type
3. Mapping the expanded data in the transform

**Step 1: Update types.ts - Add principal to RelatedEntity**

```typescript
// src/atomic-crm/dashboard/v3/types.ts

export interface RelatedEntity {
  type: "opportunity" | "contact" | "organization" | "personal";
  name: string;
  id: number;
  /** Principal info from opportunity's principal_organization (for ribbon color) */
  principal?: {
    id: number;
    name: string;
  };
}

// Also update TaskApiResponse to include nested principal_organization
export interface TaskApiResponse {
  id: number;
  title: string;  // NOTE: Field is 'title', not 'subject'
  due_date: string;
  priority: string;
  type: string;
  completed: boolean;
  description?: string;  // NOTE: Field is 'description', not 'notes'
  sales_id: number;
  opportunity_id?: number;
  contact_id?: number;
  organization_id?: number;
  // Expanded relations (when meta.expand is used)
  opportunity?: {
    id: number;
    name: string;
    // Nested expansion from principal_organization
    principal_organization?: {
      id: number;
      name: string;
    };
  };
  contact?: { id: number; name: string };
  organization?: { id: number; name: string };
}
```

**Step 2: Update useMyTasks.ts - Expand principal_organization**

```typescript
// In useGetList call, update meta.expand:
meta: {
  expand: [
    "opportunity.principal_organization",  // ADDED - nested expand for ribbons
    "contact",
    "organization"
  ],
},

// In the transform (serverTasks mapping), update relatedTo:
relatedTo: {
  type: task.opportunity_id
    ? "opportunity"
    : task.contact_id
      ? "contact"
      : task.organization_id
        ? "organization"
        : "personal",
  name:
    task.opportunity?.name ||
    task.contact?.name ||
    task.organization?.name ||
    "Personal Task",
  id: task.opportunity_id || task.contact_id || task.organization_id || 0,
  // ADDED: Extract principal from opportunity's principal_organization
  principal: task.opportunity?.principal_organization
    ? {
        id: task.opportunity.principal_organization.id,
        name: task.opportunity.principal_organization.name,
      }
    : undefined,
},
```

**Verification:**
```bash
npm run dev
# Open DevTools Network tab
# Navigate to Tasks panel
# Verify tasks API response includes principal_organization nested in opportunity
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
- `good`: ≤3 days (renders nothing)
- `warning`: 3-7 days (yellow badge)
- `urgent`: >7 days (red badge)

**Test:** `src/atomic-crm/onboarding/__tests__/StalenessIndicator.test.tsx`

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StalenessIndicator } from '../StalenessIndicator';

describe('StalenessIndicator', () => {
  describe('Good staleness (≤3 days)', () => {
    it('returns null for status_indicator="good"', () => {
      const { container } = render(
        <StalenessIndicator statusIndicator="good" daysSinceActivity={2} />
      );
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('Warning staleness (3-7 days)', () => {
    it('shows warning badge for status_indicator="warning"', () => {
      render(<StalenessIndicator statusIndicator="warning" daysSinceActivity={5} />);
      const badge = screen.getByText('5d');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-amber-100');
    });
  });

  describe('Urgent staleness (>7 days)', () => {
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
 * Renders nothing for 'good' status (≤3 days).
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

  const days = daysSinceActivity ?? 0;
  const isUrgent = statusIndicator === 'urgent';

  const accessibleLabel = isUrgent
    ? `${days} days since last activity - urgent attention needed`
    : `${days} days since last activity - needs attention`;

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
      {days}d
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

**Time:** 5 min | **TDD:** Yes

```typescript
// Implementation similar to previous plan - displays entity context
// Shows resource type + name in a compact chip format
// Clicking opens entity in slide-over panel
```

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
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { OnboardingEntity } from './constants';

interface WorkflowToastOptions {
  action: 'create' | 'update';
  entity: OnboardingEntity;
  entityName: string;
  onNavigate: (path: string) => void;
}

const WORKFLOW_HINTS: Record<OnboardingEntity, { message: string; nextPath: string; nextAction: string }> = {
  opportunity: {
    message: 'Great! Now log your first activity for this opportunity.',
    nextPath: '/activities/create',  // NOTE: This actually opens dialog, not route
    nextAction: 'Log Activity',
  },
  activity: {
    message: 'Activity logged! Consider creating a follow-up task.',
    nextPath: '/tasks/create',
    nextAction: 'Create Task',
  },
  contact: {
    message: 'Contact added! Link them to an opportunity.',
    nextPath: '/opportunities/create',
    nextAction: 'Create Opportunity',
  },
  task: {
    message: 'Task created! You can view all tasks in My Tasks.',
    nextPath: '/#tasks',
    nextAction: 'View Tasks',
  },
};

/**
 * Show workflow guidance toast after entity creation
 *
 * Uses sonner for accessible, dismissible toasts.
 * Includes CTA button to suggested next action.
 */
export function showWorkflowToast({
  action,
  entity,
  entityName,
  onNavigate,
}: WorkflowToastOptions) {
  const hint = WORKFLOW_HINTS[entity];
  if (!hint) return;

  const title = action === 'create'
    ? `${entityName} created!`
    : `${entityName} updated!`;

  toast.success(title, {
    description: hint.message,
    duration: 8000,
    action: {
      label: hint.nextAction,
      onClick: () => onNavigate(hint.nextPath),
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
    <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
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

### Task 3.2: TaskCreate Minimal Form

**File:** `src/atomic-crm/tasks/TaskCreate.tsx` (MODIFY)

**Time:** 10 min

**Changes:**
1. Import `useNavigationContext` and `showWorkflowToast`
2. Import `ShowMoreSection` for optional fields
3. Merge navContext into form defaults
4. Hide optional fields (description, priority) in ShowMoreSection
5. Add workflow toast in onSuccess

**Minimal Fields (3):**
- Title (required)
- Due Date (required, defaults to tomorrow)
- Related Entity (pre-filled from context if available)

**Hidden Fields:**
- Description
- Priority (defaults to 'medium')
- Type (defaults to 'follow-up')

```typescript
import { useNavigationContext, showWorkflowToast } from '@/atomic-crm/onboarding';
import { ShowMoreSection } from '@/atomic-crm/components/ShowMoreSection';

// In component
const navContext = useNavigationContext();

const defaultValues = useMemo(() => ({
  ...tasksSchema.partial().parse({}),
  due_date: addDays(new Date(), 1),  // Default to tomorrow
  priority: 'medium',
  type: 'follow_up',
  ...navContext.record,  // Pre-fill from context
}), [navContext.record]);

// Form structure
<SimpleForm defaultValues={defaultValues}>
  {/* Minimal fields - always visible */}
  <TextInput source="title" label="Task Title" fullWidth />
  <DateInput source="due_date" label="Due Date" />

  {/* Context indicator */}
  {navContext.record.opportunity_id && (
    <LinkedRecordChip
      resource="opportunities"
      id={navContext.record.opportunity_id}
    />
  )}

  {/* Optional fields */}
  <ShowMoreSection label="More options">
    <TextInput source="description" multiline rows={3} />
    <SelectInput source="priority" choices={PRIORITY_CHOICES} />
    <SelectInput source="type" choices={TASK_TYPE_CHOICES} />
  </ShowMoreSection>
</SimpleForm>
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
<QuickLogActivityDialog
  open={activityDialogPrincipalId !== null}
  onClose={() => setActivityDialogPrincipalId(null)}
  entityContext={{
    // Find organization_id for principal
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
