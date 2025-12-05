# Implementation Plan: UX Enhancement Suite

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
2. **Minimal Forms** - Activity/Task forms reduced from 8-12 to 3-4 fields with context pre-fill
3. **Task Card Redesign** - Principal color ribbons, inline date picker

**Impact:**
- Activity logging: ~45s → ~20s (55% faster)
- Task rescheduling: 3+ clicks → 1 click
- Principal visibility: Color-coded at-a-glance identification
- Cognitive load: 67% field reduction on forms

---

## Consolidated Dependency Graph

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        WAVE 1: Shared Foundation                             │
│  ┌────────────────┐  ┌────────────────┐  ┌─────────────────────────────────┐│
│  │ 1.1 Types &    │  │ 1.2 Principal  │  │ 1.3 useNavigationContext       ││
│  │ Constants      │  │ Colors         │  │ (serves Forms + Onboarding)    ││
│  └────────────────┘  └────────────────┘  └─────────────────────────────────┘│
│  ┌────────────────┐  ┌────────────────┐                                     │
│  │ 1.4 Onboarding │  │ 1.5 Data Layer │                                     │
│  │ Progress Hook  │  │ (staleness +   │                                     │
│  │                │  │ principal)     │                                     │
│  └────────────────┘  └────────────────┘                                     │
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
│  │ 3.1 TaskKanbanCard   │  │ 3.2 ActivityCreate   │  │ 3.3 TaskCreate    │ │
│  │ (ribbon + date)      │  │ (minimal + context)  │  │ (minimal + context)│ │
│  └──────────────────────┘  └──────────────────────┘  └────────────────────┘ │
│  ┌──────────────────────┐  ┌──────────────────────┐                         │
│  │ 3.4 Dashboard        │  │ 3.5 Navigation       │                         │
│  │ (AttentionCard)      │  │ Buttons (context)    │                         │
│  └──────────────────────┘  └──────────────────────┘                         │
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

# 4. Verify test runner
npm test -- --run --testPathPattern="dummy" 2>/dev/null || echo "Test runner OK"
```

---

## WAVE 1: Shared Foundation (PARALLEL)

**All tasks in Wave 1 can run simultaneously.**

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
 * Shared by: AttentionCard, StalenessIndicator, WorkflowToast, TaskKanbanCard
 */

export const STALENESS_THRESHOLDS = {
  /** Days before showing yellow warning badge */
  WARNING: 5,
  /** Days before showing red critical badge */
  CRITICAL: 10,
} as const;

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

/** Staleness classification for visual indicators */
export type StalenessLevel = 'ok' | 'warning' | 'critical';
```

**File: `src/atomic-crm/onboarding/types.ts`**

```typescript
import type { OnboardingEntity, StalenessLevel } from './constants';

/**
 * Principal data enriched with activity staleness information
 * Used by: AttentionCard, Dashboard, TaskKanbanCard ribbon
 */
export interface PrincipalWithStaleness {
  id: string;
  name: string;
  /** Days since any activity was logged for this principal's opportunities */
  days_since_last_activity: number;
  /** Computed from days_since_last_activity using STALENESS_THRESHOLDS */
  staleness_level: StalenessLevel;
  /** Count of non-closed opportunities for this principal */
  active_opportunity_count: number;
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
  attention_card_dismissed_principals: string[];
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
 * Navigation context for form pre-filling
 * Used by: ActivityCreate, TaskCreate, WorkflowToast
 */
export interface NavigationContextRecord {
  opportunity_id?: string;
  contact_id?: string;
  organization_id?: string;
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
  STALENESS_THRESHOLDS,
  ONBOARDING_LIMITS,
  LOCALSTORAGE_KEY,
  type OnboardingEntity,
  type StalenessLevel,
} from './constants';

// Types
export type {
  PrincipalWithStaleness,
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
- [x] Uses `type` for unions
- [x] Uses `interface` for object shapes

---

### Task 1.2: Principal Colors Constant (CONSOLIDATED)

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

    it('returns default color for unknown principal ID', () => {
      const color = getPrincipalColor(999999);
      expect(color).toBe(PRINCIPAL_COLORS.default);
    });

    it('returns default color for null/undefined', () => {
      expect(getPrincipalColor(null)).toBe(PRINCIPAL_COLORS.default);
      expect(getPrincipalColor(undefined)).toBe(PRINCIPAL_COLORS.default);
    });
  });
});
```

**Implementation: `src/atomic-crm/onboarding/principalColors.ts`**

```typescript
/**
 * Principal color mappings for task card ribbons and staleness badges
 *
 * Uses Tailwind v4 semantic border colors.
 * Colors chosen for maximum visual distinction across 9 principals.
 *
 * NOTE: Principal IDs are database IDs from the principals table.
 * Update this mapping when onboarding new principals.
 */
export const PRINCIPAL_COLORS: Record<number | 'default', string> = {
  1: 'border-l-blue-500',
  2: 'border-l-emerald-500',
  3: 'border-l-amber-500',
  4: 'border-l-violet-500',
  5: 'border-l-rose-500',
  6: 'border-l-cyan-500',
  7: 'border-l-orange-500',
  8: 'border-l-indigo-500',
  9: 'border-l-pink-500',
  default: 'border-l-muted-foreground',
} as const;

/**
 * Get the ribbon color class for a principal
 *
 * @param principalId - The principal's database ID
 * @returns Tailwind border-l-* class for the ribbon
 */
export function getPrincipalColor(principalId: number | null | undefined): string {
  if (principalId == null) {
    return PRINCIPAL_COLORS.default;
  }
  return PRINCIPAL_COLORS[principalId] ?? PRINCIPAL_COLORS.default;
}
```

**Run:** `npm test -- --run src/atomic-crm/onboarding/__tests__/principalColors.test.ts`

---

### Task 1.3: useNavigationContext Hook (CONSOLIDATED)

**File:** `src/atomic-crm/onboarding/useNavigationContext.ts` (NEW)

**Time:** 5 min | **TDD:** Yes

**Serves:** ActivityCreate, TaskCreate, WorkflowToast

**Test First: `src/atomic-crm/onboarding/__tests__/useNavigationContext.test.tsx`**

```typescript
import { renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { useNavigationContext } from '../useNavigationContext';

const createWrapper = (state?: unknown) => {
  return ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter initialEntries={[{ pathname: '/activities/create', state }]}>
      {children}
    </MemoryRouter>
  );
};

describe('useNavigationContext', () => {
  it('returns empty record when no router state', () => {
    const { result } = renderHook(() => useNavigationContext(), {
      wrapper: createWrapper(),
    });
    expect(result.current.record).toEqual({});
    expect(result.current.source_resource).toBeUndefined();
  });

  it('extracts opportunity context from router state', () => {
    const state = {
      record: { opportunity_id: 'opp-123', organization_id: 'org-456' },
      source_resource: 'opportunities',
    };
    const { result } = renderHook(() => useNavigationContext(), {
      wrapper: createWrapper(state),
    });
    expect(result.current.record.opportunity_id).toBe('opp-123');
    expect(result.current.source_resource).toBe('opportunities');
  });

  it('handles partial context (contact only)', () => {
    const state = {
      record: { contact_id: 'contact-789' },
      source_resource: 'contacts',
    };
    const { result } = renderHook(() => useNavigationContext(), {
      wrapper: createWrapper(state),
    });
    expect(result.current.record.contact_id).toBe('contact-789');
    expect(result.current.record.opportunity_id).toBeUndefined();
  });

  it('handles malformed state gracefully', () => {
    const { result } = renderHook(() => useNavigationContext(), {
      wrapper: createWrapper({ unexpectedKey: 'value' }),
    });
    expect(result.current.record).toEqual({});
  });
});
```

**Implementation: `src/atomic-crm/onboarding/useNavigationContext.ts`**

```typescript
import { useLocation } from 'react-router-dom';
import type { NavigationContext, NavigationContextRecord } from './types';

interface LocationState {
  record?: NavigationContextRecord;
  source_resource?: NavigationContext['source_resource'];
}

/**
 * Extracts navigation context from router state.
 * Used to pre-fill forms when navigating from related records.
 *
 * @example
 * // On ActivityCreate, if user came from Opportunity page:
 * const { record, source_resource } = useNavigationContext();
 * // record = { opportunity_id: "opp-123" }
 * // source_resource = "opportunities"
 */
export const useNavigationContext = (): NavigationContext => {
  const location = useLocation();
  const state = location.state as LocationState | null;

  return {
    record: state?.record ?? {},
    source_resource: state?.source_resource,
  };
};
```

**Run:** `npm test -- --run src/atomic-crm/onboarding/__tests__/useNavigationContext.test.tsx`

---

### Task 1.4: useOnboardingProgress Hook

**File:** `src/atomic-crm/onboarding/useOnboardingProgress.ts` (NEW)

**Time:** 10 min | **TDD:** Yes

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

  describe('initial state', () => {
    it('returns zero counts when localStorage is empty', () => {
      const { result } = renderHook(() => useOnboardingProgress());
      expect(result.current.getCount('opportunity')).toBe(0);
      expect(result.current.getCount('activity')).toBe(0);
    });

    it('shouldShowHint returns true for all entities initially', () => {
      const { result } = renderHook(() => useOnboardingProgress());
      expect(result.current.shouldShowHint('opportunity')).toBe(true);
    });
  });

  describe('incrementCount', () => {
    it('increments count and persists to localStorage', () => {
      const { result } = renderHook(() => useOnboardingProgress());
      act(() => {
        result.current.incrementCount('opportunity');
      });
      expect(result.current.getCount('opportunity')).toBe(1);
      const stored = JSON.parse(localStorage.getItem(LOCALSTORAGE_KEY)!);
      expect(stored.opportunity_create_count).toBe(1);
    });
  });

  describe('shouldShowHint', () => {
    it('returns false after MAX_WORKFLOW_HINTS submissions', () => {
      const { result } = renderHook(() => useOnboardingProgress());
      act(() => {
        for (let i = 0; i < ONBOARDING_LIMITS.MAX_WORKFLOW_HINTS; i++) {
          result.current.incrementCount('opportunity');
        }
      });
      expect(result.current.shouldShowHint('opportunity')).toBe(false);
    });
  });

  describe('disableAllHints', () => {
    it('stops all hints immediately', () => {
      const { result } = renderHook(() => useOnboardingProgress());
      act(() => {
        result.current.disableAllHints();
      });
      expect(result.current.shouldShowHint('opportunity')).toBe(false);
      expect(result.current.shouldShowHint('activity')).toBe(false);
    });
  });

  describe('AttentionCard state', () => {
    it('isCardDismissed is false initially', () => {
      const { result } = renderHook(() => useOnboardingProgress());
      expect(result.current.isCardDismissed).toBe(false);
    });

    it('dismissCard sets dismissed state with principal IDs', () => {
      const { result } = renderHook(() => useOnboardingProgress());
      act(() => {
        result.current.dismissCard(['principal-1', 'principal-2']);
      });
      expect(result.current.isCardDismissed).toBe(true);
      expect(result.current.getDismissedPrincipals()).toEqual(['principal-1', 'principal-2']);
    });
  });

  describe('localStorage error handling', () => {
    it('returns safe defaults when localStorage throws', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      const { result } = renderHook(() => useOnboardingProgress());
      expect(result.current.shouldShowHint('opportunity')).toBe(true);
      vi.restoreAllMocks();
    });
  });
});
```

**Implementation: `src/atomic-crm/onboarding/useOnboardingProgress.ts`**

```typescript
import { useCallback, useSyncExternalStore } from 'react';
import type { OnboardingEntity } from './constants';
import { LOCALSTORAGE_KEY, ONBOARDING_LIMITS } from './constants';
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

const ENTITY_COUNT_KEY: Record<OnboardingEntity, keyof OnboardingProgress> = {
  opportunity: 'opportunity_create_count',
  activity: 'activity_create_count',
  contact: 'contact_create_count',
  task: 'task_create_count',
};

function getProgress(): OnboardingProgress {
  try {
    const stored = localStorage.getItem(LOCALSTORAGE_KEY);
    return stored ? { ...DEFAULT_PROGRESS, ...JSON.parse(stored) } : DEFAULT_PROGRESS;
  } catch {
    return DEFAULT_PROGRESS;
  }
}

function setProgress(updates: Partial<OnboardingProgress>): void {
  try {
    const current = getProgress();
    const updated = { ...current, ...updates, last_updated: new Date().toISOString() };
    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new StorageEvent('storage', { key: LOCALSTORAGE_KEY }));
  } catch {
    // Silent fail - non-critical
  }
}

function subscribe(callback: () => void): () => void {
  const handleStorage = (e: StorageEvent) => {
    if (e.key === LOCALSTORAGE_KEY || e.key === null) callback();
  };
  window.addEventListener('storage', handleStorage);
  return () => window.removeEventListener('storage', handleStorage);
}

function getSnapshot(): string {
  try {
    return localStorage.getItem(LOCALSTORAGE_KEY) || JSON.stringify(DEFAULT_PROGRESS);
  } catch {
    return JSON.stringify(DEFAULT_PROGRESS);
  }
}

export interface UseOnboardingProgressReturn {
  getCount: (entity: OnboardingEntity) => number;
  incrementCount: (entity: OnboardingEntity) => void;
  shouldShowHint: (entity: OnboardingEntity) => boolean;
  disableAllHints: () => void;
  isCardDismissed: boolean;
  dismissCard: (stalePrincipalIds: string[]) => void;
  expandCard: () => void;
  getDismissedPrincipals: () => string[];
  resetProgress: () => void;
}

/**
 * Central hook for onboarding state management
 * All state persisted to localStorage for cross-session persistence
 */
export function useOnboardingProgress(): UseOnboardingProgressReturn {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const progress: OnboardingProgress = JSON.parse(snapshot);

  const getCount = useCallback(
    (entity: OnboardingEntity): number => (progress[ENTITY_COUNT_KEY[entity]] as number) || 0,
    [progress]
  );

  const incrementCount = useCallback((entity: OnboardingEntity): void => {
    const key = ENTITY_COUNT_KEY[entity];
    const current = getProgress();
    setProgress({ [key]: ((current[key] as number) || 0) + 1 });
  }, []);

  const shouldShowHint = useCallback(
    (entity: OnboardingEntity): boolean => {
      if (progress.workflow_hints_disabled) return false;
      const count = (progress[ENTITY_COUNT_KEY[entity]] as number) || 0;
      return count < ONBOARDING_LIMITS.MAX_WORKFLOW_HINTS;
    },
    [progress]
  );

  const disableAllHints = useCallback((): void => {
    setProgress({ workflow_hints_disabled: true });
  }, []);

  const dismissCard = useCallback((stalePrincipalIds: string[]): void => {
    setProgress({
      attention_card_dismissed: true,
      attention_card_dismissed_principals: stalePrincipalIds,
    });
  }, []);

  const expandCard = useCallback((): void => {
    setProgress({
      attention_card_dismissed: false,
      attention_card_dismissed_principals: [],
    });
  }, []);

  const getDismissedPrincipals = useCallback(
    (): string[] => progress.attention_card_dismissed_principals || [],
    [progress]
  );

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

### Task 1.5: Data Layer - Staleness + Principal Query (CONSOLIDATED)

**File:** `src/atomic-crm/providers/supabase/unifiedDataProvider.ts` (MODIFY)

**Time:** 8 min | **TDD:** Manual verification

**Purpose:** Single query enhancement serves both:
- AttentionCard (staleness data)
- TaskKanbanCard (principal info through opportunity)

**Changes to unifiedDataProvider.ts:**

```typescript
// Add imports at top of file
import { STALENESS_THRESHOLDS } from '@/atomic-crm/onboarding/constants';
import type { PrincipalWithStaleness, StalenessLevel } from '@/atomic-crm/onboarding/types';

// Add helper function before dataProvider object
function computeStalenessLevel(days: number): StalenessLevel {
  if (days >= STALENESS_THRESHOLDS.CRITICAL) return 'critical';
  if (days >= STALENESS_THRESHOLDS.WARNING) return 'warning';
  return 'ok';
}

// In getList handler for 'principals' resource, add:
if (params.meta?.includeStaleness) {
  const { data, error, count } = await supabase
    .from('principals')
    .select(`
      *,
      opportunities!left (
        id,
        stage,
        activities!left (
          id,
          created_at
        )
      )
    `, { count: 'exact' })
    .is('deleted_at', null)
    .order('name', { ascending: true });

  if (error) throw error;

  const principalsWithStaleness: PrincipalWithStaleness[] = (data || []).map((principal) => {
    const allActivities = principal.opportunities?.flatMap(
      (opp: { activities?: { created_at: string }[] }) => opp.activities || []
    ) || [];

    const latestActivity = allActivities.reduce(
      (latest: Date | null, activity: { created_at: string }) => {
        const activityDate = new Date(activity.created_at);
        return !latest || activityDate > latest ? activityDate : latest;
      },
      null as Date | null
    );

    const daysSinceLastActivity = latestActivity
      ? Math.floor((Date.now() - latestActivity.getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    const activeOpportunityCount = principal.opportunities?.filter(
      (opp: { stage?: string }) =>
        opp.stage !== 'closed_won' && opp.stage !== 'closed_lost'
    ).length || 0;

    return {
      id: principal.id,
      name: principal.name,
      days_since_last_activity: daysSinceLastActivity,
      staleness_level: computeStalenessLevel(daysSinceLastActivity),
      active_opportunity_count: activeOpportunityCount,
    };
  });

  principalsWithStaleness.sort((a, b) => b.days_since_last_activity - a.days_since_last_activity);

  return {
    data: principalsWithStaleness,
    total: count || principalsWithStaleness.length,
  };
}
```

**Also update tasks query to expand principal through opportunity:**

In the `getList` handler for 'tasks' resource, update meta.expand handling:

```typescript
// When meta.expand includes 'opportunity.principal', modify the select to include:
.select(`
  *,
  opportunity:opportunities!left (
    id,
    name,
    principal:principals!left (
      id,
      name
    )
  ),
  contact:contacts!left (id, first_name, last_name),
  organization:organizations!left (id, name)
`)
```

**Verification:**
```bash
npm run dev
# Check Network tab: principals query with includeStaleness should return staleness data
# Check Network tab: tasks query should include principal through opportunity
```

---

## WAVE 2: UI Components (PARALLEL)

**All tasks in Wave 2 can run simultaneously after Wave 1 complete.**

---

### Task 2.1: StalenessIndicator Component

**File:** `src/atomic-crm/onboarding/StalenessIndicator.tsx` (NEW)

**Time:** 5 min | **TDD:** Yes

**Test:** `src/atomic-crm/onboarding/__tests__/StalenessIndicator.test.tsx`

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StalenessIndicator } from '../StalenessIndicator';

describe('StalenessIndicator', () => {
  describe('OK staleness (< 5 days)', () => {
    it('returns null for 0-4 days', () => {
      const { container } = render(<StalenessIndicator days={4} />);
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('Warning staleness (5-9 days)', () => {
    it('shows warning badge for 5 days', () => {
      render(<StalenessIndicator days={5} />);
      const badge = screen.getByText('5d');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Critical staleness (10+ days)', () => {
    it('shows critical badge for 10+ days', () => {
      render(<StalenessIndicator days={12} />);
      const badge = screen.getByText('12d');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has accessible label with severity', () => {
      render(<StalenessIndicator days={12} />);
      const badge = screen.getByRole('status');
      expect(badge).toHaveAccessibleName(/12 days since last activity - urgent attention needed/i);
    });
  });
});
```

**Implementation:** `src/atomic-crm/onboarding/StalenessIndicator.tsx`

```typescript
import { Badge } from '@/components/ui/badge';
import { STALENESS_THRESHOLDS } from './constants';
import { cn } from '@/lib/utils';

interface StalenessIndicatorProps {
  days: number;
  size?: 'sm' | 'md';
}

export function StalenessIndicator({ days, size = 'sm' }: StalenessIndicatorProps) {
  if (days < STALENESS_THRESHOLDS.WARNING) return null;

  const isCritical = days >= STALENESS_THRESHOLDS.CRITICAL;
  const severityText = isCritical ? 'urgent attention needed' : 'needs attention soon';

  return (
    <Badge
      variant={isCritical ? 'destructive' : 'secondary'}
      className={cn(
        'font-mono',
        size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2 py-1',
        isCritical ? 'bg-destructive' : 'bg-yellow-500 text-yellow-950'
      )}
      role="status"
      aria-label={`${days} days since last activity - ${severityText}`}
    >
      {days}d
    </Badge>
  );
}
```

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
      <ShowMoreSection>
        <input data-testid="hidden-field" />
      </ShowMoreSection>
    );
    expect(screen.queryByTestId('hidden-field')).not.toBeInTheDocument();
  });

  it('shows children when trigger clicked', async () => {
    const user = userEvent.setup();
    render(
      <ShowMoreSection>
        <input data-testid="hidden-field" />
      </ShowMoreSection>
    );
    await user.click(screen.getByRole('button', { name: /show more/i }));
    expect(screen.getByTestId('hidden-field')).toBeInTheDocument();
  });

  it('respects defaultOpen prop', () => {
    render(
      <ShowMoreSection defaultOpen>
        <input data-testid="visible-field" />
      </ShowMoreSection>
    );
    expect(screen.getByTestId('visible-field')).toBeInTheDocument();
  });

  it('can be toggled with keyboard', async () => {
    const user = userEvent.setup();
    render(
      <ShowMoreSection>
        <input data-testid="hidden-field" />
      </ShowMoreSection>
    );
    const trigger = screen.getByRole('button', { name: /show more/i });
    trigger.focus();
    await user.keyboard('{Enter}');
    expect(screen.getByTestId('hidden-field')).toBeInTheDocument();
  });
});
```

**Implementation:** `src/atomic-crm/components/ShowMoreSection.tsx`

```typescript
import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface ShowMoreSectionProps {
  label?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export const ShowMoreSection = ({
  label = 'Show more options',
  defaultOpen = false,
  children,
}: ShowMoreSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 w-full border-b border-border pb-2 mt-6"
          aria-expanded={isOpen}
        >
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-6 space-y-6">{children}</CollapsibleContent>
    </Collapsible>
  );
};
```

---

### Task 2.3: LinkedRecordChip Component

**File:** `src/atomic-crm/components/LinkedRecordChip.tsx` (NEW)

**Time:** 5 min | **TDD:** Yes

**Test:** `src/atomic-crm/components/__tests__/LinkedRecordChip.test.tsx`

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { LinkedRecordChip } from '../LinkedRecordChip';
import { AdminContext } from 'react-admin';

const mockDataProvider = {
  getOne: vi.fn().mockResolvedValue({ data: { id: 'opp-123', name: 'Acme Deal' } }),
  getList: vi.fn(),
  getMany: vi.fn(),
  getManyReference: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  updateMany: vi.fn(),
  delete: vi.fn(),
  deleteMany: vi.fn(),
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AdminContext dataProvider={mockDataProvider}>{children}</AdminContext>
);

describe('LinkedRecordChip', () => {
  it('displays record name after loading', async () => {
    render(
      <LinkedRecordChip resource="opportunities" id="opp-123" labelField="name" />,
      { wrapper }
    );
    await waitFor(() => {
      expect(screen.getByText('Acme Deal')).toBeInTheDocument();
    });
  });

  it('calls onClear when dismiss button clicked', async () => {
    const onClear = vi.fn();
    const user = userEvent.setup();
    render(
      <LinkedRecordChip resource="opportunities" id="opp-123" labelField="name" onClear={onClear} />,
      { wrapper }
    );
    await waitFor(() => {
      expect(screen.getByText('Acme Deal')).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /clear/i }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('hides dismiss button when onClear not provided', async () => {
    render(
      <LinkedRecordChip resource="opportunities" id="opp-123" labelField="name" />,
      { wrapper }
    );
    await waitFor(() => {
      expect(screen.getByText('Acme Deal')).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument();
  });
});
```

**Implementation:** `src/atomic-crm/components/LinkedRecordChip.tsx`

```typescript
import { useGetOne } from 'react-admin';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface LinkedRecordChipProps {
  resource: string;
  id: string;
  labelField: string;
  prefix?: string;
  onClear?: () => void;
}

export const LinkedRecordChip = ({
  resource,
  id,
  labelField,
  prefix,
  onClear,
}: LinkedRecordChipProps) => {
  const { data, isLoading, error } = useGetOne(resource, { id });

  if (isLoading) {
    return (
      <Badge variant="secondary" className="animate-pulse">
        Loading...
      </Badge>
    );
  }

  const label = error ? 'Unknown' : (data?.[labelField] ?? 'Unknown');
  const displayText = prefix ? `${prefix}: ${label}` : label;

  return (
    <Badge
      variant="secondary"
      className="gap-1 pr-1 text-sm"
      data-testid={`linked-${resource}-chip`}
    >
      <span>{displayText}</span>
      {onClear && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 hover:bg-muted"
          onClick={onClear}
          aria-label={`Clear ${prefix ?? resource}`}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </Badge>
  );
};
```

---

### Task 2.4: InlineDatePicker Component

**File:** `src/atomic-crm/components/InlineDatePicker.tsx` (NEW)

**Time:** 8 min | **TDD:** Yes

**Test:** `src/atomic-crm/components/__tests__/InlineDatePicker.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { format } from 'date-fns';
import { InlineDatePicker } from '../InlineDatePicker';

describe('InlineDatePicker', () => {
  const mockOnChange = vi.fn();
  const testDate = new Date('2025-12-05');

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(testDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('displays formatted date as button text', () => {
    render(<InlineDatePicker value={testDate} onChange={mockOnChange} />);
    expect(screen.getByRole('button', { name: /dec 5/i })).toBeInTheDocument();
  });

  it('opens dropdown on click', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<InlineDatePicker value={testDate} onChange={mockOnChange} />);
    await user.click(screen.getByRole('button', { name: /dec 5/i }));
    expect(screen.getByRole('dialog', { name: /choose due date/i })).toBeInTheDocument();
  });

  it('shows quick action shortcuts', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<InlineDatePicker value={testDate} onChange={mockOnChange} />);
    await user.click(screen.getByRole('button', { name: /dec 5/i }));
    expect(screen.getByRole('button', { name: 'Today' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tomorrow' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next Wk' })).toBeInTheDocument();
  });

  it('calls onChange with tomorrow when "Tomorrow" clicked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<InlineDatePicker value={testDate} onChange={mockOnChange} />);
    await user.click(screen.getByRole('button', { name: /dec 5/i }));
    await user.click(screen.getByRole('button', { name: 'Tomorrow' }));
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    const calledDate = mockOnChange.mock.calls[0][0];
    expect(format(calledDate, 'yyyy-MM-dd')).toBe('2025-12-06');
  });

  it('closes dropdown on Escape key', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<InlineDatePicker value={testDate} onChange={mockOnChange} />);
    await user.click(screen.getByRole('button', { name: /dec 5/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
```

**Implementation:** `src/atomic-crm/components/InlineDatePicker.tsx`

```typescript
import { useState, useCallback } from 'react';
import { format, addDays, nextMonday, endOfDay } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import 'react-day-picker/dist/style.css';

interface InlineDatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  className?: string;
  disabled?: boolean;
}

interface QuickOption {
  label: string;
  getValue: () => Date;
}

export function InlineDatePicker({
  value,
  onChange,
  className = '',
  disabled = false,
}: InlineDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const quickOptions: QuickOption[] = [
    { label: 'Today', getValue: () => endOfDay(new Date()) },
    { label: 'Tomorrow', getValue: () => endOfDay(addDays(new Date(), 1)) },
    { label: 'Next Wk', getValue: () => endOfDay(nextMonday(new Date())) },
  ];

  const handleQuickSelect = useCallback((option: QuickOption) => {
    onChange(option.getValue());
    setIsOpen(false);
  }, [onChange]);

  const handleDaySelect = useCallback((day: Date | undefined) => {
    if (day) {
      onChange(endOfDay(day));
      setIsOpen(false);
    }
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setIsOpen(false);
  }, []);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`
            inline-flex items-center gap-1
            text-sm text-primary hover:text-primary/80
            min-h-[44px] px-2
            rounded-md hover:bg-muted/50
            transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed
            ${className}
          `}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-label={`Due date: ${format(value, 'MMM d')}. Click to change.`}
          disabled={disabled}
          onClick={(e) => e.stopPropagation()}
        >
          {format(value, 'MMM d')}
          <ChevronDown className="h-3 w-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0"
        align="end"
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-label="Choose due date"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex gap-1 p-2 border-b border-border">
          {quickOptions.map((option) => (
            <Button
              key={option.label}
              variant="outline"
              size="sm"
              className="flex-1 h-9"
              onClick={() => handleQuickSelect(option)}
            >
              {option.label}
            </Button>
          ))}
        </div>
        <DayPicker
          mode="single"
          selected={value}
          onSelect={handleDaySelect}
          autoFocus
          className="p-2"
          classNames={{
            day_selected: 'bg-primary text-primary-foreground',
            day_today: 'bg-accent text-accent-foreground',
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
```

---

### Task 2.5: WorkflowToast Component

**File:** `src/atomic-crm/onboarding/WorkflowToast.tsx` (NEW)

**Time:** 8 min | **TDD:** Yes

**Test:** `src/atomic-crm/onboarding/__tests__/WorkflowToast.test.tsx`

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WorkflowToastContent } from '../WorkflowToast';

vi.mock('sonner', () => ({
  toast: { custom: vi.fn(), dismiss: vi.fn() },
}));

describe('WorkflowToastContent', () => {
  const defaultProps = {
    toastId: 'test-toast',
    entity: 'opportunity' as const,
    entityName: 'Acme Deal',
    onAction: vi.fn(),
    onDismiss: vi.fn(),
    onDisableAll: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders success message with entity name', () => {
    render(<WorkflowToastContent {...defaultProps} />);
    expect(screen.getByText(/opportunity created/i)).toBeInTheDocument();
  });

  it('shows next step hint', () => {
    render(<WorkflowToastContent {...defaultProps} />);
    expect(screen.getByText(/next step/i)).toBeInTheDocument();
  });

  it('renders action button that calls onAction', async () => {
    const user = userEvent.setup();
    render(<WorkflowToastContent {...defaultProps} />);
    const actionButton = screen.getByRole('button', { name: /log activity/i });
    await user.click(actionButton);
    expect(defaultProps.onAction).toHaveBeenCalledTimes(1);
  });

  it('calls onDisableAll when checkbox is checked and dismissed', async () => {
    const user = userEvent.setup();
    render(<WorkflowToastContent {...defaultProps} />);
    const checkbox = screen.getByRole('checkbox', { name: /don't show workflow tips/i });
    await user.click(checkbox);
    const dismissButton = screen.getByRole('button', { name: /dismiss/i });
    await user.click(dismissButton);
    expect(defaultProps.onDisableAll).toHaveBeenCalledTimes(1);
  });
});
```

**Implementation:** `src/atomic-crm/onboarding/WorkflowToast.tsx`

```typescript
import { useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import type { OnboardingEntity } from './constants';
import { ONBOARDING_LIMITS, LOCALSTORAGE_KEY } from './constants';
import type { WorkflowHint, OnboardingProgress } from './types';

const WORKFLOW_HINTS: Record<OnboardingEntity, WorkflowHint> = {
  opportunity: {
    message: 'Opportunity created',
    nextAction: 'Log your first activity',
    nextPath: '/activities/create',
  },
  activity: {
    message: 'Activity logged',
    nextAction: 'Set a follow-up task',
    nextPath: '/tasks/create',
  },
  contact: {
    message: 'Contact added',
    nextAction: 'Create an opportunity',
    nextPath: '/opportunities/create',
  },
  task: {
    message: 'Task created',
    nextAction: 'View your task board',
    nextPath: '/dashboard',
  },
};

interface WorkflowToastContentProps {
  toastId: string;
  entity: OnboardingEntity;
  entityName?: string;
  onAction: () => void;
  onDismiss: () => void;
  onDisableAll: () => void;
}

export function WorkflowToastContent({
  toastId,
  entity,
  entityName,
  onAction,
  onDismiss,
  onDisableAll,
}: WorkflowToastContentProps) {
  const [dontShowChecked, setDontShowChecked] = useState(false);
  const hint = WORKFLOW_HINTS[entity];

  const handleDismiss = () => {
    if (dontShowChecked) {
      onDisableAll();
    } else {
      onDismiss();
    }
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      className="bg-card border border-border rounded-lg p-4 shadow-lg max-w-sm"
    >
      <div className="flex items-center gap-2 mb-2">
        <CheckCircle className="h-5 w-5 text-emerald-500" />
        <span className="font-medium">
          {hint.message}
          {entityName && ` for ${entityName}`}
        </span>
      </div>
      <p className="text-sm text-muted-foreground mb-3">
        Next step: {hint.nextAction}
      </p>
      <div className="flex items-center justify-between mb-3">
        <Button size="sm" onClick={onAction} className="h-9">
          {hint.nextAction} →
        </Button>
        <Button variant="ghost" size="sm" onClick={handleDismiss} className="h-9">
          Dismiss
        </Button>
      </div>
      <div className="flex items-center gap-2 pt-2 border-t border-border">
        <Checkbox
          id={`dont-show-${toastId}`}
          checked={dontShowChecked}
          onCheckedChange={(checked) => setDontShowChecked(checked === true)}
          className="h-4 w-4"
        />
        <label
          htmlFor={`dont-show-${toastId}`}
          className="text-xs text-muted-foreground cursor-pointer"
        >
          Don't show workflow tips
        </label>
      </div>
    </div>
  );
}

function getProgress(): OnboardingProgress | null {
  try {
    const stored = localStorage.getItem(LOCALSTORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function updateProgress(updates: Partial<OnboardingProgress>): void {
  try {
    const current = getProgress() || {};
    localStorage.setItem(
      LOCALSTORAGE_KEY,
      JSON.stringify({ ...current, ...updates, last_updated: new Date().toISOString() })
    );
  } catch {
    // Silent fail
  }
}

function shouldShowHint(entity: OnboardingEntity): boolean {
  const progress = getProgress();
  if (!progress) return true;
  if (progress.workflow_hints_disabled) return false;
  const countKey = `${entity}_create_count` as keyof OnboardingProgress;
  const count = (progress[countKey] as number) || 0;
  return count < ONBOARDING_LIMITS.MAX_WORKFLOW_HINTS;
}

function incrementCount(entity: OnboardingEntity): void {
  const progress = getProgress() || {};
  const countKey = `${entity}_create_count` as keyof OnboardingProgress;
  const currentCount = (progress[countKey] as number) || 0;
  updateProgress({ [countKey]: currentCount + 1 });
}

interface ShowWorkflowToastOptions {
  action: 'create' | 'update';
  entity: OnboardingEntity;
  entityName?: string;
  onNavigate?: (path: string) => void;
}

export function showWorkflowToast({
  action,
  entity,
  entityName,
  onNavigate,
}: ShowWorkflowToastOptions): void {
  if (!shouldShowHint(entity)) return;

  const hint = WORKFLOW_HINTS[entity];

  toast.custom(
    (t) => (
      <WorkflowToastContent
        toastId={String(t)}
        entity={entity}
        entityName={entityName}
        onAction={() => {
          incrementCount(entity);
          onNavigate?.(hint.nextPath);
          toast.dismiss(t);
        }}
        onDismiss={() => {
          incrementCount(entity);
          toast.dismiss(t);
        }}
        onDisableAll={() => {
          updateProgress({ workflow_hints_disabled: true });
          toast.dismiss(t);
        }}
      />
    ),
    { duration: ONBOARDING_LIMITS.TOAST_DURATION_MS }
  );
}
```

---

### Task 2.6: AttentionCard Component

**File:** `src/atomic-crm/onboarding/AttentionCard.tsx` (NEW)

**Time:** 10 min | **TDD:** Yes

**Test:** `src/atomic-crm/onboarding/__tests__/AttentionCard.test.tsx`

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AttentionCard } from '../AttentionCard';
import type { PrincipalWithStaleness } from '../types';

vi.mock('../useOnboardingProgress', () => ({
  useOnboardingProgress: () => ({
    isCardDismissed: false,
    dismissCard: vi.fn(),
    expandCard: vi.fn(),
    getDismissedPrincipals: () => [],
  }),
}));

const mockPrincipals: PrincipalWithStaleness[] = [
  { id: '1', name: 'Acme Foods', days_since_last_activity: 12, staleness_level: 'critical', active_opportunity_count: 3 },
  { id: '2', name: 'Best Bites', days_since_last_activity: 6, staleness_level: 'warning', active_opportunity_count: 2 },
  { id: '3', name: 'Chef Choice', days_since_last_activity: 5, staleness_level: 'warning', active_opportunity_count: 1 },
  { id: '4', name: 'Daily Delights', days_since_last_activity: 2, staleness_level: 'ok', active_opportunity_count: 4 },
];

describe('AttentionCard', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('filtering', () => {
    it('shows only stale principals (warning + critical)', () => {
      render(<AttentionCard principals={mockPrincipals} onLogActivity={vi.fn()} />);
      expect(screen.getByText('Acme Foods')).toBeInTheDocument();
      expect(screen.getByText('Best Bites')).toBeInTheDocument();
      expect(screen.queryByText('Daily Delights')).not.toBeInTheDocument();
    });

    it('limits display to MAX_ATTENTION_CARDS (3)', () => {
      const manyStale: PrincipalWithStaleness[] = Array.from({ length: 6 }, (_, i) => ({
        id: String(i),
        name: `Principal ${i}`,
        days_since_last_activity: 10 + i,
        staleness_level: 'critical',
        active_opportunity_count: 1,
      }));
      render(<AttentionCard principals={manyStale} onLogActivity={vi.fn()} />);
      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(3);
    });
  });

  describe('empty state', () => {
    it('returns null when no principals are stale', () => {
      const allOk: PrincipalWithStaleness[] = mockPrincipals.map((p) => ({
        ...p,
        days_since_last_activity: 2,
        staleness_level: 'ok',
      }));
      const { container } = render(<AttentionCard principals={allOk} onLogActivity={vi.fn()} />);
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('actions', () => {
    it('calls onLogActivity with principal id when action button clicked', async () => {
      const user = userEvent.setup();
      const onLogActivity = vi.fn();
      render(<AttentionCard principals={mockPrincipals} onLogActivity={onLogActivity} />);
      const buttons = screen.getAllByRole('button', { name: /log activity/i });
      await user.click(buttons[0]);
      expect(onLogActivity).toHaveBeenCalledWith('1');
    });
  });
});
```

**Implementation:** `src/atomic-crm/onboarding/AttentionCard.tsx`

```typescript
import { useMemo } from 'react';
import { AlertTriangle, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { STALENESS_THRESHOLDS, ONBOARDING_LIMITS } from './constants';
import { useOnboardingProgress } from './useOnboardingProgress';
import { StalenessIndicator } from './StalenessIndicator';
import type { PrincipalWithStaleness } from './types';

interface AttentionCardProps {
  principals: PrincipalWithStaleness[];
  onLogActivity: (principalId: string) => void;
}

export function AttentionCard({ principals, onLogActivity }: AttentionCardProps) {
  const { isCardDismissed, dismissCard, expandCard, getDismissedPrincipals } = useOnboardingProgress();

  const stalePrincipals = useMemo(() => {
    return principals
      .filter((p) => p.days_since_last_activity >= STALENESS_THRESHOLDS.WARNING)
      .sort((a, b) => b.days_since_last_activity - a.days_since_last_activity)
      .slice(0, ONBOARDING_LIMITS.MAX_ATTENTION_CARDS);
  }, [principals]);

  const stalePrincipalIds = useMemo(() => stalePrincipals.map((p) => p.id), [stalePrincipals]);

  const totalPrincipals = principals.length;
  const contactedPrincipals = principals.filter(
    (p) => p.days_since_last_activity < STALENESS_THRESHOLDS.WARNING
  ).length;
  const progressPercent = totalPrincipals > 0
    ? Math.round((contactedPrincipals / totalPrincipals) * 100)
    : 100;

  // Check for new stale principals since dismissal
  const dismissedPrincipals = getDismissedPrincipals();
  const hasNewStalePrincipals = stalePrincipalIds.some((id) => !dismissedPrincipals.includes(id));
  const shouldExpand = hasNewStalePrincipals && isCardDismissed;

  if (stalePrincipals.length === 0) return null;

  if (isCardDismissed && !shouldExpand) {
    return (
      <Card className="mb-3">
        <CardHeader className="py-2 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">{stalePrincipals.length} principals need attention</span>
            </div>
            <Button variant="ghost" size="sm" onClick={expandCard} className="h-8" aria-label="Expand attention card">
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="mb-3" data-testid="attention-card">
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Needs Attention This Week
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => dismissCard(stalePrincipalIds)}
            className="h-8"
            aria-label="Dismiss attention card"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <ul className="space-y-2 mb-4" role="list">
          {stalePrincipals.map((principal) => (
            <li
              key={principal.id}
              className="flex items-center justify-between py-2 border-b border-border last:border-0"
              role="listitem"
            >
              <div className="flex items-center gap-3">
                <StalenessIndicator days={principal.days_since_last_activity} size="md" />
                <div>
                  <p className="font-medium">{principal.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {principal.days_since_last_activity} days · {principal.active_opportunity_count} active opps
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onLogActivity(principal.id)}
                className="h-9"
              >
                Log Activity →
              </Button>
            </li>
          ))}
        </ul>
        <div className="pt-3 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              {contactedPrincipals} of {totalPrincipals} principals contacted this week
            </span>
            <span className="text-sm font-medium">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## WAVE 3: Feature Integration (PARALLEL)

**All tasks in Wave 3 can run simultaneously after Wave 2 complete.**

---

### Task 3.1: TaskKanbanCard Integration

**File:** `src/atomic-crm/dashboard/v3/components/TaskKanbanCard.tsx` (MODIFY)

**Time:** 15 min

**Changes:**
1. Import `InlineDatePicker` from `@/atomic-crm/components/InlineDatePicker`
2. Import `getPrincipalColor` from `@/atomic-crm/onboarding/principalColors`
3. Add principal ribbon (4px left border)
4. Replace static date with `InlineDatePicker`
5. Add principal name to metadata row
6. Add `onDateChange` prop

See original Task Card Redesign plan (Task 2.1) for full implementation.

**Key additions:**
```typescript
// Add to imports
import { InlineDatePicker } from '@/atomic-crm/components/InlineDatePicker';
import { getPrincipalColor } from '@/atomic-crm/onboarding/principalColors';

// Add prop
onDateChange: (taskId: number, newDate: Date) => Promise<void>;

// In render - Principal ribbon
<div
  data-testid="principal-ribbon"
  className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg border-l-4 ${getPrincipalColor(task.relatedTo.principal?.id)}`}
/>

// In metadata row - InlineDatePicker
<InlineDatePicker value={task.dueDate} onChange={handleDateChange} />
```

---

### Task 3.2: ActivityCreate Integration

**File:** `src/atomic-crm/activities/ActivityCreate.tsx` (MODIFY)

**Time:** 10 min

**Changes:**
1. Import `useNavigationContext` from `@/atomic-crm/onboarding`
2. Import `showWorkflowToast` from `@/atomic-crm/onboarding`
3. Merge navContext into form defaults
4. Pass navContext to form layout
5. Add workflow toast in onSuccess

```typescript
// Add imports
import { useNavigationContext, showWorkflowToast } from '@/atomic-crm/onboarding';

// In component
const navContext = useNavigationContext();

const defaultValues = useMemo(() => ({
  ...activitiesSchema.partial().parse({}),
  created_by: identity?.id,
  ...navContext.record, // Context pre-fill
}), [identity?.id, navContext.record]);

// In onSuccess
const onSuccess = (data: Activity) => {
  notify('Activity created', { type: 'success' });
  showWorkflowToast({
    action: 'create',
    entity: 'activity',
    entityName: data.subject,
    onNavigate: (path) => navigate(path),
  });
  redirect('list');
};
```

---

### Task 3.3: TaskCreate Integration

**File:** `src/atomic-crm/tasks/TaskCreate.tsx` (MODIFY)

**Time:** 10 min

**Changes:** Same pattern as ActivityCreate - navContext + workflow toast + ShowMoreSection

---

### Task 3.4: Dashboard AttentionCard Integration

**File:** `src/atomic-crm/dashboard/v3/PrincipalDashboardV3.tsx` (MODIFY)

**Time:** 8 min

**Changes:**
1. Import `AttentionCard` and `PrincipalWithStaleness`
2. Fetch principals with `includeStaleness: true`
3. Add AttentionCard above tabbed interface

```typescript
import { AttentionCard } from '@/atomic-crm/onboarding';
import type { PrincipalWithStaleness } from '@/atomic-crm/onboarding';

// In component
const { data: principalsWithStaleness } = useGetList<PrincipalWithStaleness>(
  'principals',
  {
    pagination: { page: 1, perPage: 100 },
    meta: { includeStaleness: true },
  }
);

// In render, before tabbed interface
{principalsWithStaleness && principalsWithStaleness.length > 0 && (
  <div className="shrink-0 px-4">
    <AttentionCard
      principals={principalsWithStaleness}
      onLogActivity={(principalId) => navigate(`/activities/create?principal_id=${principalId}`)}
    />
  </div>
)}
```

---

### Task 3.5: Navigation Buttons Context Integration

**Files:** Multiple Show pages (MODIFY)

**Time:** 10 min

Add state to CreateButton components:

```typescript
// OpportunityShow.tsx
<CreateButton
  resource="activities"
  label="Log Activity"
  state={{
    record: { opportunity_id: record?.id, organization_id: record?.customer_organization_id },
    source_resource: 'opportunities',
  }}
/>

// ContactShow.tsx
<CreateButton
  resource="activities"
  label="Log Activity"
  state={{
    record: { contact_id: record?.id },
    source_resource: 'contacts',
  }}
/>
```

---

## WAVE 4: Testing & Polish (PARALLEL)

---

### Task 4.1: Run All Unit Tests

```bash
npm test -- --run src/atomic-crm/onboarding/
npm test -- --run src/atomic-crm/components/
npm test -- --run src/atomic-crm/dashboard/v3/
```

---

### Task 4.2: E2E Tests

**File:** `tests/e2e/ux-enhancement-suite.spec.ts` (NEW)

Consolidated E2E tests for all three features.

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
  });

  test.describe('Task Inline Date Picker', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByRole('tab', { name: /my tasks/i }).click();
    });

    test('opens date picker on date click', async ({ page }) => {
      const taskCard = page.getByRole('article').first();
      const dateButton = taskCard.getByRole('button', { name: /\w{3} \d{1,2}/i });
      await dateButton.click();
      await expect(page.getByRole('dialog', { name: /choose due date/i })).toBeVisible();
    });

    test('shows quick action shortcuts', async ({ page }) => {
      const taskCard = page.getByRole('article').first();
      const dateButton = taskCard.getByRole('button', { name: /\w{3} \d{1,2}/i });
      await dateButton.click();
      await expect(page.getByRole('button', { name: 'Today' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Tomorrow' })).toBeVisible();
    });
  });

  test.describe('Activity Minimal Form', () => {
    test('shows minimal form by default', async ({ page }) => {
      await page.goto('/activities/create');
      await expect(page.getByRole('combobox', { name: /interaction type/i })).toBeVisible();
      await expect(page.getByRole('textbox', { name: /subject/i })).toBeVisible();
      // Optional fields hidden
      await expect(page.getByRole('textbox', { name: /notes/i })).not.toBeVisible();
    });

    test('expands to show all fields', async ({ page }) => {
      await page.goto('/activities/create');
      await page.getByRole('button', { name: /show more/i }).click();
      await expect(page.getByRole('textbox', { name: /notes/i })).toBeVisible();
    });

    test('pre-fills from opportunity navigation', async ({ page }) => {
      await page.goto('/opportunities');
      await page.getByRole('row').first().click();
      await page.getByRole('button', { name: /log activity/i }).click();
      await expect(page.getByTestId('linked-opportunities-chip')).toBeVisible();
    });
  });

  test.describe('Workflow Toast', () => {
    test('shows toast after creating opportunity', async ({ page }) => {
      await page.goto('/opportunities/create');
      await page.getByRole('textbox', { name: /name/i }).fill('Test Opportunity');
      // Fill other required fields...
      await page.getByRole('button', { name: /save/i }).click();
      await expect(page.getByRole('alert')).toContainText(/next step/i);
    });
  });
});
```

---

### Task 4.3: Visual QA Checklist

```markdown
## Visual QA Checklist (iPad viewport 1024x768)

### AttentionCard
- [ ] Shows on dashboard above tabs
- [ ] Dismisses to collapsed state
- [ ] Re-expands when NEW principal becomes stale
- [ ] Progress bar accurate

### Task Card Ribbon
- [ ] 4px colored left border visible
- [ ] Colors distinct across principals
- [ ] Default gray for no principal

### InlineDatePicker
- [ ] 44px touch target
- [ ] Opens on tap
- [ ] Quick shortcuts work
- [ ] Calendar navigation works
- [ ] Closes on selection

### Minimal Forms
- [ ] 3-4 fields visible by default
- [ ] ShowMore expands cleanly
- [ ] LinkedRecordChip shows context
- [ ] Clear button removes context

### Workflow Toast
- [ ] Appears after create
- [ ] Auto-dismisses after 8s
- [ ] Opt-out checkbox works
- [ ] Stops showing after 5 submissions
```

---

## Final Barrel Exports

**File:** `src/atomic-crm/onboarding/index.ts` (UPDATE)

```typescript
// Constants
export {
  STALENESS_THRESHOLDS,
  ONBOARDING_LIMITS,
  LOCALSTORAGE_KEY,
  type OnboardingEntity,
  type StalenessLevel,
} from './constants';

export { PRINCIPAL_COLORS, getPrincipalColor } from './principalColors';

// Types
export type {
  PrincipalWithStaleness,
  OnboardingProgress,
  WorkflowHint,
  NavigationContextRecord,
  NavigationContext,
} from './types';

// Hooks
export { useOnboardingProgress } from './useOnboardingProgress';
export { useNavigationContext } from './useNavigationContext';

// Components
export { AttentionCard } from './AttentionCard';
export { StalenessIndicator } from './StalenessIndicator';
export { showWorkflowToast, WorkflowToastContent } from './WorkflowToast';
```

---

## Verification Checklist

After all waves complete:

```bash
# 1. TypeScript compiles
npm run build

# 2. All unit tests pass
npm test

# 3. E2E tests pass
npx playwright test tests/e2e/ux-enhancement-suite.spec.ts

# 4. Manual verification
npm run dev
# - Dashboard shows AttentionCard
# - Task cards have ribbons + inline date
# - Activity/Task create forms are minimal
# - Navigation pre-fills context
# - Workflow toasts appear
```

---

## Rollback Plan

If issues arise, revert in wave order:

1. **Wave 3** - Remove integrations from existing components
2. **Wave 2** - Delete new component files
3. **Wave 1** - Delete onboarding directory, revert data provider

```bash
# Quick rollback
git checkout HEAD -- src/atomic-crm/activities/
git checkout HEAD -- src/atomic-crm/tasks/
git checkout HEAD -- src/atomic-crm/dashboard/v3/
rm -rf src/atomic-crm/onboarding/
rm -rf src/atomic-crm/components/ShowMoreSection.tsx
rm -rf src/atomic-crm/components/LinkedRecordChip.tsx
rm -rf src/atomic-crm/components/InlineDatePicker.tsx
```

---

## Summary

| Wave | Tasks | Parallel? | Est. Time |
|------|-------|-----------|-----------|
| 1: Foundation | 5 | Yes | 35 min |
| 2: Components | 6 | Yes | 45 min |
| 3: Integration | 5 | Yes | 55 min |
| 4: Testing | 3 | Yes | 30 min |

**Total (sequential):** ~165 min
**Total (with parallelization):** ~90 min

**Consolidation savings:** ~30% fewer tasks than original 3 plans combined

---

## Files Summary

| Category | New Files | Modified Files |
|----------|-----------|----------------|
| Onboarding | 8 | 0 |
| Components | 3 | 0 |
| Integration | 0 | 6 |
| Tests | 10 | 0 |
| E2E | 1 | 0 |
| **Total** | **22** | **6** |
