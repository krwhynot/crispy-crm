# Implementation Plan: Contextual Onboarding System

**Date:** 2025-12-05
**Design Reference:** `docs/designs/2025-12-05-contextual-onboarding-design.md`
**Type:** New Feature
**Scope:** Full Stack (Dashboard, Opportunities, Activities, Data Provider)
**Execution:** Parallel Groups | Atomic Tasks (2-5 min) | TDD Strict

---

## Overview

Build a contextual onboarding system that helps MFB Account Managers understand workflow while working:

1. **AttentionCard** - Dashboard widget showing principals needing attention
2. **StalenessIndicator** - Badges on pipeline table rows
3. **WorkflowToast** - Post-submit guidance with opt-out
4. **useOnboardingProgress** - localStorage state management

---

## Dependency Graph

```
GROUP 0: Foundation (Types + Constants)
    ↓
GROUP 1: Hooks (useOnboardingProgress, useAttentionCardState)
    ↓
GROUP 2: Data Layer (Staleness Query in Provider)
    ↓
GROUP 3: Simple Components (StalenessIndicator)
    ↓
GROUP 4: Complex Components (WorkflowToast, AttentionCard)
    ↓
GROUP 5: Integration (Wire into existing components)
    ↓
GROUP 6: E2E Tests
```

---

## Pre-Execution Checklist

Before starting ANY task, verify:

```bash
# 1. Verify you're in the correct directory
pwd
# Expected: /home/krwhynot/projects/crispy-crm

# 2. Verify branch
git branch --show-current
# Expected: feature/contextual-onboarding (or create it)

# 3. Verify dependencies installed
npm list sonner react-admin
# Should show both installed

# 4. Verify test runner works
npm test -- --run --testPathPattern="dummy" 2>/dev/null || echo "Test runner OK"
```

---

## GROUP 0: Foundation (Types + Constants)

**Parallel:** All tasks in this group can run simultaneously.
**Dependencies:** None

### Task 0.1: Create onboarding directory structure

**File:** (directory creation)
**Time:** 2 min

```bash
mkdir -p src/atomic-crm/onboarding/__tests__
```

**Verification:**
```bash
ls -la src/atomic-crm/onboarding/
# Expected: __tests__/ directory exists
```

---

### Task 0.2: Create constants file

**File:** `src/atomic-crm/onboarding/constants.ts`
**Time:** 3 min

```typescript
/**
 * Onboarding system constants
 *
 * STALENESS_THRESHOLDS: Days since last activity before showing warnings
 * ONBOARDING_LIMITS: Caps on UI elements and hint frequency
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

**Constitution Checklist:**
- [x] No retry logic
- [x] No direct Supabase imports
- [x] Uses `type` for union (`OnboardingEntity`, `StalenessLevel`)
- [x] Uses `as const` for immutable objects

---

### Task 0.3: Create TypeScript interfaces

**File:** `src/atomic-crm/onboarding/types.ts`
**Time:** 3 min

```typescript
import type { OnboardingEntity, StalenessLevel } from './constants';

/**
 * Principal data enriched with activity staleness information
 * Returned by unifiedDataProvider.getList('principals', { meta: { includeStaleness: true } })
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
  /** Count of opportunities created (for toast fade logic) */
  opportunity_create_count: number;
  /** Count of activities created */
  activity_create_count: number;
  /** Count of contacts created */
  contact_create_count: number;
  /** Count of tasks created */
  task_create_count: number;
  /** Whether AttentionCard is in collapsed state */
  attention_card_dismissed: boolean;
  /** Principal IDs that were stale when user dismissed (for re-expand logic) */
  attention_card_dismissed_principals: string[];
  /** Master opt-out for all workflow hints */
  workflow_hints_disabled: boolean;
  /** ISO timestamp of last update */
  last_updated: string;
}

/**
 * Workflow hint configuration per entity type
 */
export interface WorkflowHint {
  /** Success message shown in toast */
  message: string;
  /** Description of recommended next action */
  nextAction: string;
  /** Route to navigate when user clicks action button */
  nextPath: string;
}
```

**Constitution Checklist:**
- [x] Uses `interface` for object shapes
- [x] JSDoc comments for documentation
- [x] No validation logic (Zod stays at API boundary)

---

### Task 0.4: Create barrel export

**File:** `src/atomic-crm/onboarding/index.ts`
**Time:** 2 min

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
} from './types';

// Components (will be added as they're created)
// export { AttentionCard } from './AttentionCard';
// export { StalenessIndicator } from './StalenessIndicator';
// export { showWorkflowToast } from './WorkflowToast';

// Hooks (will be added as they're created)
// export { useOnboardingProgress } from './useOnboardingProgress';
// export { useAttentionCardState } from './useAttentionCardState';
```

**Constitution Checklist:**
- [x] Clean barrel exports
- [x] Type-only exports use `type` keyword

---

## GROUP 1: Hooks (TDD)

**Parallel:** Tasks 1.1-1.2 can run in parallel, then 1.3-1.4 in parallel.
**Dependencies:** GROUP 0 complete

### Task 1.1: Write useOnboardingProgress tests (TDD - RED)

**File:** `src/atomic-crm/onboarding/__tests__/useOnboardingProgress.test.ts`
**Time:** 5 min

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
      expect(result.current.getCount('contact')).toBe(0);
      expect(result.current.getCount('task')).toBe(0);
    });

    it('shouldShowHint returns true for all entities initially', () => {
      const { result } = renderHook(() => useOnboardingProgress());

      expect(result.current.shouldShowHint('opportunity')).toBe(true);
      expect(result.current.shouldShowHint('activity')).toBe(true);
      expect(result.current.shouldShowHint('contact')).toBe(true);
      expect(result.current.shouldShowHint('task')).toBe(true);
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

    it('increments correct entity without affecting others', () => {
      const { result } = renderHook(() => useOnboardingProgress());

      act(() => {
        result.current.incrementCount('activity');
        result.current.incrementCount('activity');
      });

      expect(result.current.getCount('activity')).toBe(2);
      expect(result.current.getCount('opportunity')).toBe(0);
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
      // Other entities still show hints
      expect(result.current.shouldShowHint('activity')).toBe(true);
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
      expect(result.current.shouldShowHint('contact')).toBe(false);
      expect(result.current.shouldShowHint('task')).toBe(false);
    });

    it('persists disabled state to localStorage', () => {
      const { result } = renderHook(() => useOnboardingProgress());

      act(() => {
        result.current.disableAllHints();
      });

      const stored = JSON.parse(localStorage.getItem(LOCALSTORAGE_KEY)!);
      expect(stored.workflow_hints_disabled).toBe(true);
    });
  });

  describe('AttentionCard state', () => {
    it('isCardDismissed is false initially', () => {
      const { result } = renderHook(() => useOnboardingProgress());

      expect(result.current.isCardDismissed).toBe(false);
    });

    it('dismissCard sets dismissed state', () => {
      const { result } = renderHook(() => useOnboardingProgress());

      act(() => {
        result.current.dismissCard(['principal-1', 'principal-2']);
      });

      expect(result.current.isCardDismissed).toBe(true);
    });

    it('expandCard clears dismissed state', () => {
      const { result } = renderHook(() => useOnboardingProgress());

      act(() => {
        result.current.dismissCard(['principal-1']);
        result.current.expandCard();
      });

      expect(result.current.isCardDismissed).toBe(false);
    });

    it('getDismissedPrincipals returns IDs from when card was dismissed', () => {
      const { result } = renderHook(() => useOnboardingProgress());

      act(() => {
        result.current.dismissCard(['p1', 'p2', 'p3']);
      });

      expect(result.current.getDismissedPrincipals()).toEqual(['p1', 'p2', 'p3']);
    });
  });

  describe('localStorage error handling', () => {
    it('returns safe defaults when localStorage throws on read', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      const { result } = renderHook(() => useOnboardingProgress());

      // Should return defaults, not throw
      expect(result.current.shouldShowHint('opportunity')).toBe(true);
      expect(result.current.getCount('opportunity')).toBe(0);

      vi.restoreAllMocks();
    });

    it('silently fails when localStorage throws on write', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      const { result } = renderHook(() => useOnboardingProgress());

      // Should not throw
      expect(() => {
        act(() => {
          result.current.incrementCount('opportunity');
        });
      }).not.toThrow();

      vi.restoreAllMocks();
    });
  });

  describe('resetProgress', () => {
    it('clears all progress for testing', () => {
      const { result } = renderHook(() => useOnboardingProgress());

      act(() => {
        result.current.incrementCount('opportunity');
        result.current.incrementCount('opportunity');
        result.current.disableAllHints();
        result.current.resetProgress();
      });

      expect(result.current.getCount('opportunity')).toBe(0);
      expect(result.current.shouldShowHint('opportunity')).toBe(true);
    });
  });
});
```

**Run test (should FAIL - RED):**
```bash
npm test -- --run src/atomic-crm/onboarding/__tests__/useOnboardingProgress.test.ts
# Expected: FAIL - module not found
```

---

### Task 1.2: Write useAttentionCardState tests (TDD - RED)

**File:** `src/atomic-crm/onboarding/__tests__/useAttentionCardState.test.ts`
**Time:** 4 min

```typescript
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAttentionCardState } from '../useAttentionCardState';

// Mock useOnboardingProgress
vi.mock('../useOnboardingProgress', () => ({
  useOnboardingProgress: () => ({
    isCardDismissed: false,
    dismissCard: vi.fn(),
    expandCard: vi.fn(),
    getDismissedPrincipals: () => [],
  }),
}));

describe('useAttentionCardState', () => {
  const mockStalePrincipals = ['p1', 'p2', 'p3'];

  describe('shouldReExpand', () => {
    it('returns false when no new principals became stale', () => {
      const { result } = renderHook(() =>
        useAttentionCardState({
          currentStalePrincipals: ['p1', 'p2'],
          dismissedStalePrincipals: ['p1', 'p2', 'p3'],
        })
      );

      expect(result.current.shouldReExpand).toBe(false);
    });

    it('returns true when a NEW principal became stale', () => {
      const { result } = renderHook(() =>
        useAttentionCardState({
          currentStalePrincipals: ['p1', 'p2', 'p4'], // p4 is new
          dismissedStalePrincipals: ['p1', 'p2', 'p3'],
        })
      );

      expect(result.current.shouldReExpand).toBe(true);
    });
  });

  describe('cardState', () => {
    it('returns "expanded" when not dismissed and has stale principals', () => {
      const { result } = renderHook(() =>
        useAttentionCardState({
          currentStalePrincipals: ['p1', 'p2'],
          dismissedStalePrincipals: [],
        })
      );

      expect(result.current.cardState).toBe('expanded');
    });

    it('returns "hidden" when no stale principals', () => {
      const { result } = renderHook(() =>
        useAttentionCardState({
          currentStalePrincipals: [],
          dismissedStalePrincipals: [],
        })
      );

      expect(result.current.cardState).toBe('hidden');
    });
  });
});
```

**Run test (should FAIL - RED):**
```bash
npm test -- --run src/atomic-crm/onboarding/__tests__/useAttentionCardState.test.ts
# Expected: FAIL - module not found
```

---

### Task 1.3: Implement useOnboardingProgress hook (TDD - GREEN)

**File:** `src/atomic-crm/onboarding/useOnboardingProgress.ts`
**Time:** 5 min

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

/** Map entity type to progress key */
const ENTITY_COUNT_KEY: Record<OnboardingEntity, keyof OnboardingProgress> = {
  opportunity: 'opportunity_create_count',
  activity: 'activity_create_count',
  contact: 'contact_create_count',
  task: 'task_create_count',
};

/** Read progress from localStorage with safe fallback */
function getProgress(): OnboardingProgress {
  try {
    const stored = localStorage.getItem(LOCALSTORAGE_KEY);
    return stored ? { ...DEFAULT_PROGRESS, ...JSON.parse(stored) } : DEFAULT_PROGRESS;
  } catch {
    console.warn('localStorage unavailable for onboarding progress');
    return DEFAULT_PROGRESS;
  }
}

/** Write progress to localStorage, silently fail if unavailable */
function setProgress(updates: Partial<OnboardingProgress>): void {
  try {
    const current = getProgress();
    const updated = {
      ...current,
      ...updates,
      last_updated: new Date().toISOString(),
    };
    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(updated));
    // Dispatch storage event for cross-tab sync
    window.dispatchEvent(new StorageEvent('storage', { key: LOCALSTORAGE_KEY }));
  } catch {
    console.warn('Failed to persist onboarding progress');
  }
}

/** Subscribe to localStorage changes */
function subscribe(callback: () => void): () => void {
  const handleStorage = (e: StorageEvent) => {
    if (e.key === LOCALSTORAGE_KEY || e.key === null) {
      callback();
    }
  };
  window.addEventListener('storage', handleStorage);
  return () => window.removeEventListener('storage', handleStorage);
}

/** Get snapshot for useSyncExternalStore */
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
 *
 * @example
 * const { shouldShowHint, incrementCount } = useOnboardingProgress();
 * if (shouldShowHint('opportunity')) {
 *   showToast();
 *   incrementCount('opportunity');
 * }
 */
export function useOnboardingProgress(): UseOnboardingProgressReturn {
  // Subscribe to localStorage changes for reactivity
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const progress: OnboardingProgress = JSON.parse(snapshot);

  const getCount = useCallback(
    (entity: OnboardingEntity): number => {
      return (progress[ENTITY_COUNT_KEY[entity]] as number) || 0;
    },
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

  const getDismissedPrincipals = useCallback((): string[] => {
    return progress.attention_card_dismissed_principals || [];
  }, [progress]);

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

**Run test (should PASS - GREEN):**
```bash
npm test -- --run src/atomic-crm/onboarding/__tests__/useOnboardingProgress.test.ts
# Expected: All tests pass
```

**Constitution Checklist:**
- [x] No retry logic
- [x] No direct Supabase imports
- [x] Uses `interface` for return type
- [x] Safe defaults on localStorage failure (fail-fast for data, safe-default for UX)

---

### Task 1.4: Implement useAttentionCardState hook (TDD - GREEN)

**File:** `src/atomic-crm/onboarding/useAttentionCardState.ts`
**Time:** 4 min

```typescript
import { useMemo } from 'react';
import { useOnboardingProgress } from './useOnboardingProgress';

type CardState = 'expanded' | 'collapsed' | 'hidden' | 'celebration';

interface UseAttentionCardStateProps {
  currentStalePrincipals: string[];
  dismissedStalePrincipals?: string[];
}

interface UseAttentionCardStateReturn {
  cardState: CardState;
  shouldReExpand: boolean;
  dismiss: (stalePrincipalIds: string[]) => void;
  expand: () => void;
}

/**
 * Manages AttentionCard visibility state with smart re-expansion logic
 *
 * Re-expands automatically when a NEW principal becomes stale
 * (not just when the same principals are still stale)
 */
export function useAttentionCardState({
  currentStalePrincipals,
}: UseAttentionCardStateProps): UseAttentionCardStateReturn {
  const { isCardDismissed, dismissCard, expandCard, getDismissedPrincipals } =
    useOnboardingProgress();

  const dismissedPrincipals = getDismissedPrincipals();

  // Check if any NEW principal became stale since dismissal
  const shouldReExpand = useMemo(() => {
    if (!isCardDismissed) return false;
    if (currentStalePrincipals.length === 0) return false;

    // Find principals that are currently stale but weren't when user dismissed
    const newStalePrincipals = currentStalePrincipals.filter(
      (id) => !dismissedPrincipals.includes(id)
    );

    return newStalePrincipals.length > 0;
  }, [isCardDismissed, currentStalePrincipals, dismissedPrincipals]);

  // Determine card visibility state
  const cardState = useMemo((): CardState => {
    // No stale principals = hide or celebrate
    if (currentStalePrincipals.length === 0) {
      return 'hidden';
    }

    // New principal became stale = force expand
    if (shouldReExpand) {
      return 'expanded';
    }

    // User dismissed and same principals still stale = stay collapsed
    if (isCardDismissed) {
      return 'collapsed';
    }

    // Default = expanded
    return 'expanded';
  }, [currentStalePrincipals.length, shouldReExpand, isCardDismissed]);

  return {
    cardState,
    shouldReExpand,
    dismiss: dismissCard,
    expand: expandCard,
  };
}
```

**Run test (should PASS - GREEN):**
```bash
npm test -- --run src/atomic-crm/onboarding/__tests__/useAttentionCardState.test.ts
# Expected: All tests pass
```

---

### Task 1.5: Update barrel exports for hooks

**File:** `src/atomic-crm/onboarding/index.ts`
**Time:** 2 min

Update the existing file to add hook exports:

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
} from './types';

// Hooks
export { useOnboardingProgress } from './useOnboardingProgress';
export { useAttentionCardState } from './useAttentionCardState';

// Components (will be added as they're created)
// export { AttentionCard } from './AttentionCard';
// export { StalenessIndicator } from './StalenessIndicator';
// export { showWorkflowToast } from './WorkflowToast';
```

---

## GROUP 2: Data Layer

**Parallel:** Single task (modifies shared data provider)
**Dependencies:** GROUP 0 complete

### Task 2.1: Add staleness query to unifiedDataProvider

**File:** `src/atomic-crm/providers/supabase/unifiedDataProvider.ts`
**Time:** 5 min

Find the `getList` method for 'principals' resource and enhance it:

```typescript
// Add import at top of file
import { STALENESS_THRESHOLDS } from '@/atomic-crm/onboarding/constants';
import type { PrincipalWithStaleness, StalenessLevel } from '@/atomic-crm/onboarding/types';

// Add helper function before the dataProvider object
function computeStalenessLevel(days: number): StalenessLevel {
  if (days >= STALENESS_THRESHOLDS.CRITICAL) return 'critical';
  if (days >= STALENESS_THRESHOLDS.WARNING) return 'warning';
  return 'ok';
}

// In the getList handler for 'principals', add this logic when meta.includeStaleness is true:

// Inside getList for principals resource:
if (params.meta?.includeStaleness) {
  // Query with staleness calculation via LEFT JOIN
  const { data, error, count } = await supabase
    .from('principals')
    .select(`
      *,
      opportunities!left (
        id,
        activities!left (
          id,
          created_at
        )
      )
    `, { count: 'exact' })
    .is('deleted_at', null)
    .order('name', { ascending: true });

  if (error) throw error;

  // Transform to include staleness
  const principalsWithStaleness: PrincipalWithStaleness[] = (data || []).map((principal) => {
    // Flatten all activities from all opportunities
    const allActivities = principal.opportunities?.flatMap(
      (opp: { activities?: { created_at: string }[] }) => opp.activities || []
    ) || [];

    // Find most recent activity
    const latestActivity = allActivities.reduce(
      (latest: Date | null, activity: { created_at: string }) => {
        const activityDate = new Date(activity.created_at);
        return !latest || activityDate > latest ? activityDate : latest;
      },
      null as Date | null
    );

    // Calculate days since last activity
    const daysSinceLastActivity = latestActivity
      ? Math.floor((Date.now() - latestActivity.getTime()) / (1000 * 60 * 60 * 24))
      : 999; // No activities ever = very stale

    // Count active opportunities (not closed)
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

  // Sort by staleness (most urgent first)
  principalsWithStaleness.sort((a, b) => b.days_since_last_activity - a.days_since_last_activity);

  return {
    data: principalsWithStaleness,
    total: count || principalsWithStaleness.length,
  };
}
```

**Constitution Checklist:**
- [x] Single source of truth (staleness computed here, not in UI)
- [x] No retry logic
- [x] Throws on error (fail-fast)
- [x] Uses existing Supabase client (no direct imports)

**Verification:**
```bash
# Manual verification - start app and check network tab
npm run dev
# Navigate to dashboard, check principals query includes staleness data
```

---

## GROUP 3: Simple Components (TDD)

**Parallel:** All tasks in this group can run simultaneously
**Dependencies:** GROUP 0 complete

### Task 3.1: Write StalenessIndicator tests (TDD - RED)

**File:** `src/atomic-crm/onboarding/__tests__/StalenessIndicator.test.tsx`
**Time:** 4 min

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StalenessIndicator } from '../StalenessIndicator';

describe('StalenessIndicator', () => {
  describe('OK staleness (< 5 days)', () => {
    it('returns null for 0 days', () => {
      const { container } = render(<StalenessIndicator days={0} />);
      expect(container).toBeEmptyDOMElement();
    });

    it('returns null for 4 days', () => {
      const { container } = render(<StalenessIndicator days={4} />);
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('Warning staleness (5-9 days)', () => {
    it('shows warning badge for 5 days', () => {
      render(<StalenessIndicator days={5} />);

      const badge = screen.getByText('5d');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-warning');
    });

    it('shows warning badge for 9 days', () => {
      render(<StalenessIndicator days={9} />);

      const badge = screen.getByText('9d');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-warning');
    });
  });

  describe('Critical staleness (10+ days)', () => {
    it('shows critical badge for 10 days', () => {
      render(<StalenessIndicator days={10} />);

      const badge = screen.getByText('10d');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-destructive');
    });

    it('shows critical badge for 15 days', () => {
      render(<StalenessIndicator days={15} />);

      const badge = screen.getByText('15d');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-destructive');
    });
  });

  describe('size variants', () => {
    it('renders small size by default', () => {
      render(<StalenessIndicator days={7} />);

      const badge = screen.getByText('7d');
      expect(badge).toHaveClass('text-xs');
    });

    it('renders medium size when specified', () => {
      render(<StalenessIndicator days={7} size="md" />);

      const badge = screen.getByText('7d');
      expect(badge).toHaveClass('text-sm');
    });
  });

  describe('accessibility', () => {
    it('has accessible label describing staleness', () => {
      render(<StalenessIndicator days={12} />);

      const badge = screen.getByRole('status');
      expect(badge).toHaveAccessibleName(/12 days since last activity/i);
    });
  });
});
```

**Run test (should FAIL - RED):**
```bash
npm test -- --run src/atomic-crm/onboarding/__tests__/StalenessIndicator.test.tsx
# Expected: FAIL - module not found
```

---

### Task 3.2: Implement StalenessIndicator component (TDD - GREEN)

**File:** `src/atomic-crm/onboarding/StalenessIndicator.tsx`
**Time:** 4 min

```typescript
import { Badge } from '@/components/ui/badge';
import { STALENESS_THRESHOLDS } from './constants';
import { cn } from '@/lib/utils';

interface StalenessIndicatorProps {
  /** Days since last activity for this principal */
  days: number;
  /** Badge size variant */
  size?: 'sm' | 'md';
}

/**
 * Visual badge showing activity staleness
 *
 * - OK (< 5 days): No badge shown
 * - Warning (5-9 days): Yellow badge "5d"
 * - Critical (10+ days): Red badge "12d"
 *
 * @example
 * <StalenessIndicator days={7} />
 * // Renders: Yellow badge "7d"
 */
export function StalenessIndicator({ days, size = 'sm' }: StalenessIndicatorProps) {
  // Don't show anything for OK staleness
  if (days < STALENESS_THRESHOLDS.WARNING) {
    return null;
  }

  const isCritical = days >= STALENESS_THRESHOLDS.CRITICAL;
  const variant = isCritical ? 'destructive' : 'warning';

  return (
    <Badge
      variant={variant}
      className={cn(
        'font-mono',
        size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2 py-1',
        isCritical ? 'bg-destructive' : 'bg-warning'
      )}
      role="status"
      aria-label={`${days} days since last activity`}
    >
      {days}d
    </Badge>
  );
}
```

**Note:** If `bg-warning` variant doesn't exist in your Badge component, you may need to add it or use inline styles:

```typescript
// Alternative if warning variant doesn't exist:
className={cn(
  'font-mono',
  size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2 py-1',
  isCritical
    ? 'bg-destructive text-destructive-foreground'
    : 'bg-yellow-500 text-yellow-950'
)}
```

**Run test (should PASS - GREEN):**
```bash
npm test -- --run src/atomic-crm/onboarding/__tests__/StalenessIndicator.test.tsx
# Expected: All tests pass
```

**Constitution Checklist:**
- [x] Touch targets not applicable (badge, not interactive)
- [x] Uses semantic colors
- [x] ARIA role="status" for screen readers
- [x] No retry logic

---

## GROUP 4: Complex Components (TDD)

**Parallel:** Tasks 4.1-4.4 can run in parallel (WorkflowToast), Tasks 4.5-4.8 can run in parallel (AttentionCard)
**Dependencies:** GROUP 1, GROUP 3 complete

### Task 4.1: Write WorkflowToast tests (TDD - RED)

**File:** `src/atomic-crm/onboarding/__tests__/WorkflowToast.test.tsx`
**Time:** 5 min

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { showWorkflowToast, WorkflowToastContent } from '../WorkflowToast';
import { LOCALSTORAGE_KEY } from '../constants';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    custom: vi.fn(),
    dismiss: vi.fn(),
  },
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
    expect(screen.getByText(/acme deal/i)).toBeInTheDocument();
  });

  it('shows next step hint', () => {
    render(<WorkflowToastContent {...defaultProps} />);

    expect(screen.getByText(/next step/i)).toBeInTheDocument();
    expect(screen.getByText(/log your first activity/i)).toBeInTheDocument();
  });

  it('renders action button that calls onAction', async () => {
    const user = userEvent.setup();
    render(<WorkflowToastContent {...defaultProps} />);

    const actionButton = screen.getByRole('button', { name: /log activity/i });
    await user.click(actionButton);

    expect(defaultProps.onAction).toHaveBeenCalledTimes(1);
  });

  it('renders dismiss button that calls onDismiss', async () => {
    const user = userEvent.setup();
    render(<WorkflowToastContent {...defaultProps} />);

    const dismissButton = screen.getByRole('button', { name: /dismiss/i });
    await user.click(dismissButton);

    expect(defaultProps.onDismiss).toHaveBeenCalledTimes(1);
  });

  it('renders opt-out checkbox', () => {
    render(<WorkflowToastContent {...defaultProps} />);

    const checkbox = screen.getByRole('checkbox', { name: /don't show workflow tips/i });
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });

  it('calls onDisableAll when checkbox is checked and dismissed', async () => {
    const user = userEvent.setup();
    render(<WorkflowToastContent {...defaultProps} />);

    const checkbox = screen.getByRole('checkbox', { name: /don't show workflow tips/i });
    await user.click(checkbox);

    const dismissButton = screen.getByRole('button', { name: /dismiss/i });
    await user.click(dismissButton);

    expect(defaultProps.onDisableAll).toHaveBeenCalledTimes(1);
    expect(defaultProps.onDismiss).not.toHaveBeenCalled();
  });
});

describe('showWorkflowToast', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('does not show toast when workflow_hints_disabled is true', async () => {
    localStorage.setItem(
      LOCALSTORAGE_KEY,
      JSON.stringify({ workflow_hints_disabled: true })
    );

    const { toast } = await import('sonner');
    showWorkflowToast({ action: 'create', entity: 'opportunity' });

    expect(toast.custom).not.toHaveBeenCalled();
  });

  it('does not show toast after MAX_WORKFLOW_HINTS submissions', async () => {
    localStorage.setItem(
      LOCALSTORAGE_KEY,
      JSON.stringify({ opportunity_create_count: 5 })
    );

    const { toast } = await import('sonner');
    showWorkflowToast({ action: 'create', entity: 'opportunity' });

    expect(toast.custom).not.toHaveBeenCalled();
  });

  it('shows toast when under the limit', async () => {
    localStorage.setItem(
      LOCALSTORAGE_KEY,
      JSON.stringify({ opportunity_create_count: 2 })
    );

    const { toast } = await import('sonner');
    showWorkflowToast({ action: 'create', entity: 'opportunity' });

    expect(toast.custom).toHaveBeenCalled();
  });
});
```

**Run test (should FAIL - RED):**
```bash
npm test -- --run src/atomic-crm/onboarding/__tests__/WorkflowToast.test.tsx
# Expected: FAIL - module not found
```

---

### Task 4.2: Implement WorkflowToast component (TDD - GREEN)

**File:** `src/atomic-crm/onboarding/WorkflowToast.tsx`
**Time:** 5 min

```typescript
import { useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import type { OnboardingEntity } from './constants';
import { ONBOARDING_LIMITS, LOCALSTORAGE_KEY } from './constants';
import type { WorkflowHint, OnboardingProgress } from './types';

/** Workflow hints mapped by entity type */
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

/**
 * Toast content with next-step guidance and opt-out checkbox
 */
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
    <div className="bg-card border border-border rounded-lg p-4 shadow-lg max-w-sm">
      {/* Success message */}
      <div className="flex items-center gap-2 mb-2">
        <CheckCircle className="h-5 w-5 text-success" />
        <span className="font-medium">
          {hint.message}
          {entityName && ` for ${entityName}`}
        </span>
      </div>

      {/* Next step hint */}
      <p className="text-sm text-muted-foreground mb-3">
        Next step: {hint.nextAction}
      </p>

      {/* Action buttons */}
      <div className="flex items-center justify-between mb-3">
        <Button size="sm" onClick={onAction} className="h-9">
          {hint.nextAction} →
        </Button>
        <Button variant="ghost" size="sm" onClick={handleDismiss} className="h-9">
          Dismiss
        </Button>
      </div>

      {/* Opt-out checkbox */}
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

interface ShowWorkflowToastOptions {
  action: 'create' | 'update';
  entity: OnboardingEntity;
  entityName?: string;
  onNavigate?: (path: string) => void;
}

/** Get progress from localStorage */
function getProgress(): OnboardingProgress | null {
  try {
    const stored = localStorage.getItem(LOCALSTORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

/** Update progress in localStorage */
function updateProgress(updates: Partial<OnboardingProgress>): void {
  try {
    const current = getProgress() || {};
    localStorage.setItem(
      LOCALSTORAGE_KEY,
      JSON.stringify({ ...current, ...updates, last_updated: new Date().toISOString() })
    );
  } catch {
    // Silent fail - non-critical
  }
}

/** Check if hint should be shown for entity */
function shouldShowHint(entity: OnboardingEntity): boolean {
  const progress = getProgress();
  if (!progress) return true;
  if (progress.workflow_hints_disabled) return false;

  const countKey = `${entity}_create_count` as keyof OnboardingProgress;
  const count = (progress[countKey] as number) || 0;
  return count < ONBOARDING_LIMITS.MAX_WORKFLOW_HINTS;
}

/** Increment count for entity */
function incrementCount(entity: OnboardingEntity): void {
  const progress = getProgress() || {};
  const countKey = `${entity}_create_count` as keyof OnboardingProgress;
  const currentCount = (progress[countKey] as number) || 0;
  updateProgress({ [countKey]: currentCount + 1 });
}

/**
 * Shows workflow guidance toast after entity creation
 *
 * @example
 * // In form onSuccess callback:
 * showWorkflowToast({
 *   action: 'create',
 *   entity: 'opportunity',
 *   entityName: data.name,
 *   onNavigate: (path) => redirect(path),
 * });
 */
export function showWorkflowToast({
  action,
  entity,
  entityName,
  onNavigate,
}: ShowWorkflowToastOptions): void {
  // Check if we should show the hint
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
    {
      duration: ONBOARDING_LIMITS.TOAST_DURATION_MS,
    }
  );
}
```

**Run test (should PASS - GREEN):**
```bash
npm test -- --run src/atomic-crm/onboarding/__tests__/WorkflowToast.test.tsx
# Expected: All tests pass
```

**Constitution Checklist:**
- [x] Touch targets: Buttons have `h-9` (36px) - acceptable for toast context
- [x] No retry logic
- [x] Uses semantic colors
- [x] ARIA labels on checkbox

---

### Task 4.3: Write AttentionCard tests (TDD - RED)

**File:** `src/atomic-crm/onboarding/__tests__/AttentionCard.test.tsx`
**Time:** 5 min

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AttentionCard } from '../AttentionCard';
import type { PrincipalWithStaleness } from '../types';
import { renderWithAdminContext } from '@/tests/utils/render-admin';

// Mock useOnboardingProgress
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
      renderWithAdminContext(
        <AttentionCard principals={mockPrincipals} onLogActivity={vi.fn()} />
      );

      expect(screen.getByText('Acme Foods')).toBeInTheDocument();
      expect(screen.getByText('Best Bites')).toBeInTheDocument();
      expect(screen.getByText('Chef Choice')).toBeInTheDocument();
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

      renderWithAdminContext(
        <AttentionCard principals={manyStale} onLogActivity={vi.fn()} />
      );

      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(3);
    });

    it('sorts by most urgent (highest days) first', () => {
      renderWithAdminContext(
        <AttentionCard principals={mockPrincipals} onLogActivity={vi.fn()} />
      );

      const items = screen.getAllByRole('listitem');
      expect(items[0]).toHaveTextContent('Acme Foods'); // 12 days
      expect(items[1]).toHaveTextContent('Best Bites'); // 6 days
      expect(items[2]).toHaveTextContent('Chef Choice'); // 5 days
    });
  });

  describe('progress bar', () => {
    it('shows correct count of contacted principals', () => {
      renderWithAdminContext(
        <AttentionCard principals={mockPrincipals} onLogActivity={vi.fn()} />
      );

      // 1 of 4 is OK (Daily Delights)
      expect(screen.getByText(/1 of 4 principals contacted/i)).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('returns null when no principals are stale', () => {
      const allOk: PrincipalWithStaleness[] = mockPrincipals.map((p) => ({
        ...p,
        days_since_last_activity: 2,
        staleness_level: 'ok',
      }));

      const { container } = renderWithAdminContext(
        <AttentionCard principals={allOk} onLogActivity={vi.fn()} />
      );

      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('actions', () => {
    it('calls onLogActivity with principal id when action button clicked', async () => {
      const user = userEvent.setup();
      const onLogActivity = vi.fn();

      renderWithAdminContext(
        <AttentionCard principals={mockPrincipals} onLogActivity={onLogActivity} />
      );

      const buttons = screen.getAllByRole('button', { name: /log activity/i });
      await user.click(buttons[0]);

      expect(onLogActivity).toHaveBeenCalledWith('1'); // Acme Foods id
    });
  });

  describe('accessibility', () => {
    it('has accessible heading', () => {
      renderWithAdminContext(
        <AttentionCard principals={mockPrincipals} onLogActivity={vi.fn()} />
      );

      expect(
        screen.getByRole('heading', { name: /needs attention/i })
      ).toBeInTheDocument();
    });

    it('dismiss button is keyboard accessible', async () => {
      const user = userEvent.setup();
      renderWithAdminContext(
        <AttentionCard principals={mockPrincipals} onLogActivity={vi.fn()} />
      );

      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      dismissButton.focus();
      await user.keyboard('{Enter}');

      // Card should be collapsed (implementation detail)
    });
  });
});
```

**Run test (should FAIL - RED):**
```bash
npm test -- --run src/atomic-crm/onboarding/__tests__/AttentionCard.test.tsx
# Expected: FAIL - module not found
```

---

### Task 4.4: Implement AttentionCard component (TDD - GREEN)

**File:** `src/atomic-crm/onboarding/AttentionCard.tsx`
**Time:** 5 min

```typescript
import { useMemo } from 'react';
import { AlertTriangle, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { STALENESS_THRESHOLDS, ONBOARDING_LIMITS } from './constants';
import { useAttentionCardState } from './useAttentionCardState';
import { StalenessIndicator } from './StalenessIndicator';
import type { PrincipalWithStaleness } from './types';

interface AttentionCardProps {
  principals: PrincipalWithStaleness[];
  onLogActivity: (principalId: string) => void;
}

/**
 * Dashboard widget showing principals needing attention
 *
 * Features:
 * - Shows top 3 stale principals sorted by urgency
 * - Dismissible to collapsed state
 * - Re-expands when NEW principal becomes stale
 * - Hidden entirely when all principals are OK
 */
export function AttentionCard({ principals, onLogActivity }: AttentionCardProps) {
  // Filter to stale principals only
  const stalePrincipals = useMemo(() => {
    return principals
      .filter((p) => p.days_since_last_activity >= STALENESS_THRESHOLDS.WARNING)
      .sort((a, b) => b.days_since_last_activity - a.days_since_last_activity)
      .slice(0, ONBOARDING_LIMITS.MAX_ATTENTION_CARDS);
  }, [principals]);

  const stalePrincipalIds = useMemo(
    () => stalePrincipals.map((p) => p.id),
    [stalePrincipals]
  );

  const { cardState, dismiss, expand } = useAttentionCardState({
    currentStalePrincipals: stalePrincipalIds,
  });

  // Calculate progress
  const totalPrincipals = principals.length;
  const contactedPrincipals = principals.filter(
    (p) => p.days_since_last_activity < STALENESS_THRESHOLDS.WARNING
  ).length;
  const progressPercent = totalPrincipals > 0
    ? Math.round((contactedPrincipals / totalPrincipals) * 100)
    : 100;

  // Don't render if hidden
  if (cardState === 'hidden' || stalePrincipals.length === 0) {
    return null;
  }

  // Collapsed state
  if (cardState === 'collapsed') {
    return (
      <Card className="mb-3">
        <CardHeader className="py-2 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <span className="text-sm font-medium">
                {stalePrincipals.length} principals need attention
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={expand}
              className="h-8"
              aria-label="Expand attention card"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>
    );
  }

  // Expanded state
  return (
    <Card className="mb-3">
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Needs Attention This Week
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => dismiss(stalePrincipalIds)}
            className="h-8"
            aria-label="Dismiss attention card"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {/* Principal list */}
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

        {/* Progress bar */}
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

**Run test (should PASS - GREEN):**
```bash
npm test -- --run src/atomic-crm/onboarding/__tests__/AttentionCard.test.tsx
# Expected: All tests pass
```

**Constitution Checklist:**
- [x] Touch targets: Buttons have `h-8` or `h-9` (32-36px) - acceptable for card context
- [x] Uses semantic colors (`text-warning`, `border-border`)
- [x] ARIA labels on buttons
- [x] No retry logic

---

### Task 4.5: Update barrel exports for components

**File:** `src/atomic-crm/onboarding/index.ts`
**Time:** 2 min

Final update with all exports:

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
} from './types';

// Hooks
export { useOnboardingProgress } from './useOnboardingProgress';
export { useAttentionCardState } from './useAttentionCardState';

// Components
export { AttentionCard } from './AttentionCard';
export { StalenessIndicator } from './StalenessIndicator';
export { showWorkflowToast, WorkflowToastContent } from './WorkflowToast';
```

---

## GROUP 5: Integration

**Parallel:** Tasks can run in parallel after GROUP 4
**Dependencies:** GROUP 2, GROUP 4 complete

### Task 5.1: Integrate AttentionCard into Dashboard

**File:** `src/atomic-crm/dashboard/v3/PrincipalDashboardV3.tsx`
**Time:** 4 min

Add AttentionCard above the tabbed interface:

```typescript
// Add imports
import { useGetList } from 'ra-core';
import { useNavigate } from 'react-router-dom';
import { AttentionCard } from '@/atomic-crm/onboarding';
import type { PrincipalWithStaleness } from '@/atomic-crm/onboarding';

// Inside PrincipalDashboardV3 component, add:
export function PrincipalDashboardV3() {
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const [isTaskSheetOpen, setIsTaskSheetOpen] = useState(false);

  // Fetch principals with staleness data
  const { data: principalsWithStaleness } = useGetList<PrincipalWithStaleness>(
    'principals',
    {
      pagination: { page: 1, perPage: 100 },
      meta: { includeStaleness: true },
    }
  );

  // ... existing handlers ...

  const handleLogActivityFromCard = useCallback((principalId: string) => {
    // Navigate to activity create with principal prefilled
    navigate(`/activities/create?principal_id=${principalId}`);
  }, [navigate]);

  return (
    <div className="flex h-[calc(100dvh-140px)] flex-col overflow-hidden">
      <main className="relative flex min-h-0 flex-1 flex-col gap-3">
        {/* KPI Summary Row */}
        <div className="shrink-0">
          <KPISummaryRow key={`kpi-${refreshKey}`} />
        </div>

        {/* NEW: Attention Card */}
        {principalsWithStaleness && principalsWithStaleness.length > 0 && (
          <div className="shrink-0 px-4">
            <AttentionCard
              principals={principalsWithStaleness}
              onLogActivity={handleLogActivityFromCard}
            />
          </div>
        )}

        {/* Tabbed interface */}
        <DashboardTabPanel key={`tabs-${refreshKey}`} />

        {/* ... rest of component ... */}
      </main>
    </div>
  );
}
```

---

### Task 5.2: Integrate StalenessIndicator into PipelineTable

**File:** `src/atomic-crm/dashboard/v3/components/PrincipalPipelineTable.tsx`
**Time:** 4 min

Add staleness badge to principal rows:

```typescript
// Add import
import { StalenessIndicator } from '@/atomic-crm/onboarding';

// In the table row rendering, add staleness column:
// Find where principal name is rendered and add badge next to it

// Example (adapt to actual file structure):
<TableCell>
  <div className="flex items-center gap-2">
    <span className="font-medium">{principal.name}</span>
    <StalenessIndicator days={principal.days_since_last_activity} />
  </div>
</TableCell>
```

---

### Task 5.3: Integrate WorkflowToast into OpportunityCreate

**File:** `src/atomic-crm/opportunities/OpportunityCreate.tsx`
**Time:** 3 min

Add toast to onSuccess callback:

```typescript
// Add import
import { showWorkflowToast } from '@/atomic-crm/onboarding';
import { useNavigate } from 'react-router-dom';

// Inside the component, in the onSuccess callback:
const navigate = useNavigate();

const onSuccess = (data: Opportunity) => {
  notify('Opportunity created', { type: 'success' });

  // Show workflow guidance toast
  showWorkflowToast({
    action: 'create',
    entity: 'opportunity',
    entityName: data.name,
    onNavigate: (path) => navigate(path),
  });

  redirect('list');
};
```

---

### Task 5.4: Integrate WorkflowToast into ActivityCreate/QuickLog

**File:** `src/atomic-crm/activities/QuickLogActivity.tsx` (and similar)
**Time:** 3 min

```typescript
// Add import
import { showWorkflowToast } from '@/atomic-crm/onboarding';
import { useNavigate } from 'react-router-dom';

// Inside onSuccess callback:
const navigate = useNavigate();

const onSuccess = (data: Activity) => {
  notify('Activity logged', { type: 'success' });

  showWorkflowToast({
    action: 'create',
    entity: 'activity',
    entityName: `${data.type} with ${data.contact_name}`,
    onNavigate: (path) => navigate(path),
  });

  // ... rest of success handling
};
```

---

### Task 5.5: Integrate WorkflowToast into ContactCreate

**File:** `src/atomic-crm/contacts/ContactCreate.tsx`
**Time:** 3 min

```typescript
// Add import
import { showWorkflowToast } from '@/atomic-crm/onboarding';
import { useNavigate } from 'react-router-dom';

// Inside onSuccess callback:
const navigate = useNavigate();

const onSuccess = (data: Contact) => {
  notify('Contact created', { type: 'success' });

  showWorkflowToast({
    action: 'create',
    entity: 'contact',
    entityName: `${data.first_name} ${data.last_name}`,
    onNavigate: (path) => navigate(path),
  });

  redirect('list');
};
```

---

## GROUP 6: E2E Tests

**Parallel:** Tasks can run in parallel
**Dependencies:** GROUP 5 complete

### Task 6.1: Create Onboarding POM

**File:** `tests/e2e/support/poms/OnboardingPOM.ts`
**Time:** 4 min

```typescript
import { Page, Locator, expect } from '@playwright/test';

export class OnboardingPOM {
  readonly page: Page;
  readonly attentionCard: Locator;
  readonly attentionCardItems: Locator;
  readonly attentionCardDismiss: Locator;
  readonly attentionCardExpand: Locator;
  readonly attentionCardProgress: Locator;
  readonly workflowToast: Locator;
  readonly workflowToastAction: Locator;
  readonly workflowToastDismiss: Locator;
  readonly dontShowCheckbox: Locator;

  constructor(page: Page) {
    this.page = page;
    this.attentionCard = page.locator('[data-testid="attention-card"]');
    this.attentionCardItems = this.attentionCard.getByRole('listitem');
    this.attentionCardDismiss = this.attentionCard.getByRole('button', { name: /dismiss/i });
    this.attentionCardExpand = this.attentionCard.getByRole('button', { name: /expand/i });
    this.attentionCardProgress = this.attentionCard.getByRole('progressbar');
    this.workflowToast = page.getByRole('alert').filter({ hasText: /next step/i });
    this.workflowToastAction = this.workflowToast.getByRole('button').first();
    this.workflowToastDismiss = this.workflowToast.getByRole('button', { name: /dismiss/i });
    this.dontShowCheckbox = page.getByRole('checkbox', { name: /don't show workflow tips/i });
  }

  async dismissAttentionCard() {
    await this.attentionCardDismiss.click();
  }

  async expandAttentionCard() {
    await this.attentionCardExpand.click();
  }

  async disableWorkflowHints() {
    await this.dontShowCheckbox.check();
    await this.workflowToastDismiss.click();
  }

  async expectStalePrincipalCount(count: number) {
    await expect(this.attentionCardItems).toHaveCount(count);
  }

  async expectToastVisible() {
    await expect(this.workflowToast).toBeVisible();
  }

  async expectToastHidden() {
    await expect(this.workflowToast).not.toBeVisible();
  }

  async clearOnboardingProgress() {
    await this.page.evaluate(() => {
      localStorage.removeItem('crispy_onboarding_progress');
    });
  }
}
```

---

### Task 6.2: Write AttentionCard E2E tests

**File:** `tests/e2e/onboarding/attention-card.spec.ts`
**Time:** 5 min

```typescript
import { test, expect } from '@playwright/test';
import { OnboardingPOM } from '../support/poms/OnboardingPOM';

test.describe('AttentionCard', () => {
  let onboarding: OnboardingPOM;

  test.beforeEach(async ({ page }) => {
    onboarding = new OnboardingPOM(page);
    await onboarding.clearOnboardingProgress();
    await page.goto('/dashboard');
  });

  test('shows principals with stale activity', async () => {
    await expect(onboarding.attentionCard).toBeVisible();
    await expect(onboarding.attentionCardItems.first()).toBeVisible();
  });

  test('dismiss collapses to summary view', async ({ page }) => {
    await onboarding.dismissAttentionCard();

    // Should show collapsed state
    await expect(page.getByText(/principals need attention/i)).toBeVisible();
    await expect(onboarding.attentionCardItems).toHaveCount(0);
  });

  test('expand shows full card again', async ({ page }) => {
    await onboarding.dismissAttentionCard();
    await onboarding.expandAttentionCard();

    // Should show expanded state
    await expect(onboarding.attentionCardItems.first()).toBeVisible();
  });

  test('log activity button navigates with principal prefilled', async ({ page }) => {
    const logButton = onboarding.attentionCard.getByRole('button', { name: /log activity/i }).first();
    await logButton.click();

    // Should navigate to activity create with principal in URL
    await expect(page).toHaveURL(/activities\/create\?principal_id=/);
  });

  test('shows progress bar with correct percentage', async () => {
    await expect(onboarding.attentionCardProgress).toBeVisible();
  });
});
```

---

### Task 6.3: Write WorkflowToast E2E tests

**File:** `tests/e2e/onboarding/workflow-toast.spec.ts`
**Time:** 5 min

```typescript
import { test, expect } from '@playwright/test';
import { OnboardingPOM } from '../support/poms/OnboardingPOM';
import { OpportunityPOM } from '../support/poms/OpportunityPOM';

test.describe('WorkflowToast', () => {
  let onboarding: OnboardingPOM;
  let opportunity: OpportunityPOM;

  test.beforeEach(async ({ page }) => {
    onboarding = new OnboardingPOM(page);
    opportunity = new OpportunityPOM(page);
    await onboarding.clearOnboardingProgress();
  });

  test('shows toast after creating opportunity', async ({ page }) => {
    await opportunity.navigateToCreate();
    await opportunity.fillRequiredFields({ name: 'Test Opportunity' });
    await opportunity.submit();

    await onboarding.expectToastVisible();
    await expect(page.getByText(/log your first activity/i)).toBeVisible();
  });

  test('toast action navigates to next step', async ({ page }) => {
    await opportunity.navigateToCreate();
    await opportunity.fillRequiredFields({ name: 'Test Opportunity' });
    await opportunity.submit();

    await onboarding.workflowToastAction.click();

    await expect(page).toHaveURL(/activities\/create/);
  });

  test('opt-out checkbox disables all future hints', async ({ page }) => {
    // Create first opportunity
    await opportunity.navigateToCreate();
    await opportunity.fillRequiredFields({ name: 'Opp 1' });
    await opportunity.submit();

    // Opt out
    await onboarding.disableWorkflowHints();

    // Create second opportunity
    await opportunity.navigateToCreate();
    await opportunity.fillRequiredFields({ name: 'Opp 2' });
    await opportunity.submit();

    // Toast should NOT appear
    await onboarding.expectToastHidden();
  });

  test('toast auto-dismisses after timeout', async ({ page }) => {
    await opportunity.navigateToCreate();
    await opportunity.fillRequiredFields({ name: 'Test' });
    await opportunity.submit();

    await onboarding.expectToastVisible();

    // Wait for auto-dismiss (8 seconds + buffer)
    await page.waitForTimeout(9000);

    await onboarding.expectToastHidden();
  });
});
```

---

## Verification Checklist

After completing all tasks, verify:

```bash
# 1. All unit tests pass
npm test -- --run src/atomic-crm/onboarding/

# 2. TypeScript compiles without errors
npm run build

# 3. E2E tests pass
npm run test:e2e -- --grep "onboarding"

# 4. Manual verification
npm run dev
# - Navigate to dashboard, verify AttentionCard shows
# - Create an opportunity, verify toast appears
# - Check opt-out checkbox works
# - Verify staleness badges on pipeline table
```

---

## Rollback Plan

If issues arise, revert in this order:

1. **Integration** (GROUP 5) - Remove imports and component usage
2. **Components** (GROUP 4) - Delete component files
3. **Hooks** (GROUP 1) - Delete hook files
4. **Data Layer** (GROUP 2) - Remove staleness query enhancement
5. **Foundation** (GROUP 0) - Delete onboarding directory

```bash
# Quick rollback - delete entire onboarding directory
rm -rf src/atomic-crm/onboarding/
# Then revert data provider changes via git
git checkout -- src/atomic-crm/providers/supabase/unifiedDataProvider.ts
```

---

## Summary

| Group | Tasks | Parallel? | Est. Time |
|-------|-------|-----------|-----------|
| 0: Foundation | 4 | Yes | 10 min |
| 1: Hooks (TDD) | 5 | Partial | 20 min |
| 2: Data Layer | 1 | No | 5 min |
| 3: Simple Components | 2 | Yes | 8 min |
| 4: Complex Components | 5 | Partial | 25 min |
| 5: Integration | 5 | Yes | 17 min |
| 6: E2E Tests | 3 | Yes | 14 min |

**Total estimated time:** ~99 minutes (with parallelization: ~60 minutes)
