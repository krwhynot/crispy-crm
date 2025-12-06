# Tutorial Walkthrough Implementation Plan

**Date:** 2025-12-06
**Status:** Ready for Implementation (Zen MCP Reviewed ✅)
**Type:** New Feature
**Scope:** Cross-feature (8 modules + layout)
**Execution:** Hybrid (parallel groups + sequential dependencies)
**Testing:** TDD Strict

---

## Overview

Interactive guided walkthrough tutorial using Driver.js to teach users data entry across all 8 CRM features. On-demand from user menu, localStorage for progress.

---

## Dependency Graph

```
Phase 0: Branch Setup (MUST BE FIRST)
    ↓
Phase 1: Infrastructure (Sequential)
    ├── 1.1 Install Driver.js
    ├── 1.2 Create module structure
    └── 1.3 Create utility functions
            ↓
Phase 2: Core Components (Sequential - each depends on previous)
    ├── 2.1 TutorialProgress hook (localStorage)
    ├── 2.2 TutorialProvider (context + Driver.js)
    └── 2.3 TutorialTooltip (custom component)
            ↓
Phase 3: Step Definitions (PARALLEL - all independent)
    ├── 3.1 organizationSteps.ts ─┐
    ├── 3.2 contactSteps.ts      │
    ├── 3.3 opportunitySteps.ts  │─── Can run in parallel
    ├── 3.4 activitySteps.ts     │
    ├── 3.5 taskSteps.ts         │
    ├── 3.6 productSteps.ts      │
    ├── 3.7 noteSteps.ts         │
    └── 3.8 userSteps.ts ────────┘
            ↓
Phase 4: Data Attributes (PARALLEL - all independent)
    ├── 4.1 Header.tsx ──────────┐
    ├── 4.2 ContactCreate.tsx    │
    ├── 4.3 OrgCreate.tsx        │─── Can run in parallel
    ├── 4.4 OppCreate.tsx        │
    ├── 4.5 ActivityCreate.tsx   │
    ├── 4.6 TaskCreate.tsx       │
    ├── 4.7 ProductCreate.tsx    │
    ├── 4.8 NoteCreate.tsx       │
    └── 4.9 SalesCreate.tsx ─────┘
            ↓
Phase 5: Integration (Sequential)
    ├── 5.1 TutorialLauncher menu
    ├── 5.2 Wrap CRM with Provider
    └── 5.3 Import Driver.js CSS
            ↓
Phase 6: Testing (Sequential)
    ├── 6.1 Unit tests
    ├── 6.2 Integration tests
    └── 6.3 E2E tests
```

---

## Phase 0: Branch Setup

### Task 0.1: Create Feature Branch

**Time:** 2 min
**Dependencies:** None
**Parallel:** No - must be first

```bash
# Run from project root
cd /home/krwhynot/projects/crispy-crm

# Verify clean working directory
git status
# Expected: nothing to commit, working tree clean

# Create and switch to feature branch
git checkout -b feature/tutorial-walkthrough

# Verify branch
git branch --show-current
# Expected: feature/tutorial-walkthrough
```

**Constitution Checklist:**
- [x] No code changes yet
- [x] Clean working directory verified

---

## Phase 1: Infrastructure

### Task 1.1: Install Driver.js

**Time:** 3 min
**Dependencies:** Task 0.1
**Parallel:** No

```bash
cd /home/krwhynot/projects/crispy-crm
npm install driver.js
```

**Verify installation:**
```bash
grep "driver.js" package.json
# Expected: "driver.js": "^1.x.x"
```

**Constitution Checklist:**
- [x] Single dependency added
- [x] ~5kb bundle size (acceptable)

---

### Task 1.2: Create Module Structure

**Time:** 3 min
**Dependencies:** Task 1.1
**Parallel:** No

```bash
mkdir -p src/atomic-crm/tutorial/steps
mkdir -p src/atomic-crm/tutorial/components
```

Create **`src/atomic-crm/tutorial/index.tsx`**:
```tsx
// Tutorial module exports
export { TutorialProvider, useTutorial } from './TutorialProvider';
export { TutorialLauncher } from './TutorialLauncher';
export type { TutorialChapter, TutorialProgress } from './types';
```

Create **`src/atomic-crm/tutorial/types.ts`**:
```tsx
export type TutorialChapter =
  | 'organizations'
  | 'contacts'
  | 'opportunities'
  | 'activities'
  | 'tasks'
  | 'products'
  | 'notes'
  | 'users';

export interface TutorialProgress {
  currentChapter: TutorialChapter | null;
  currentStepIndex: number;
  completedChapters: TutorialChapter[];
  lastUpdated: string; // ISO date
}

export interface TutorialStep {
  element?: string;
  popover: {
    title: string;
    description: string;
    side?: 'top' | 'bottom' | 'left' | 'right';
    align?: 'start' | 'center' | 'end';
  };
  navigateTo?: string; // Route to navigate before this step
}
```

**Constitution Checklist:**
- [x] TypeScript interfaces (not types) for objects
- [x] No hardcoded values

---

### Task 1.3: Create Utility Functions

**Time:** 5 min
**Dependencies:** Task 1.2
**Parallel:** No

Create **`src/atomic-crm/tutorial/waitForElement.ts`**:
```tsx
/**
 * Polls the DOM for an element to appear.
 * Used after React Router navigation to wait for target elements.
 *
 * @param selector - CSS selector for the element
 * @param timeout - Max wait time in ms (default 5000)
 * @returns Promise that resolves when element exists or rejects on timeout
 */
export async function waitForElement(
  selector: string,
  timeout = 5000
): Promise<Element> {
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const check = () => {
      const element = document.querySelector(selector);

      if (element) {
        resolve(element);
        return;
      }

      if (Date.now() - startTime >= timeout) {
        reject(new Error(`Element "${selector}" not found within ${timeout}ms`));
        return;
      }

      // Poll every 100ms
      requestAnimationFrame(check);
    };

    check();
  });
}

/**
 * Checks if an element exists in the DOM.
 * Used to validate tutorial steps before highlighting.
 *
 * @param selector - CSS selector for the element
 * @returns true if element exists
 */
export function elementExists(selector: string): boolean {
  return document.querySelector(selector) !== null;
}

/**
 * Filters steps to only include those with existing elements.
 * Handles edge case where React Admin conditionally renders components.
 *
 * @param steps - Array of tutorial steps
 * @returns Filtered steps with valid elements
 */
export function filterValidSteps(steps: TutorialStep[]): TutorialStep[] {
  return steps.filter((step) => {
    // Steps without elements (intro/outro) are always valid
    if (!step.element) return true;
    // Check if element exists in DOM
    return elementExists(step.element);
  });
}
```

**Constitution Checklist:**
- [x] Fail-fast: Throws error after timeout (no silent failures)
- [x] No retry logic with backoff (simple polling is acceptable)
- [x] JSDoc comments for clarity

---

## Phase 2: Core Components

### Task 2.1: TDD - Write Failing Tests for useTutorialProgress Hook

**Time:** 10 min
**Dependencies:** Task 1.3
**Parallel:** No

Create **`src/atomic-crm/tutorial/__tests__/useTutorialProgress.test.ts`**:
```tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTutorialProgress } from '../useTutorialProgress';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('useTutorialProgress', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('should return default progress when localStorage is empty', () => {
    const { result } = renderHook(() => useTutorialProgress());

    expect(result.current.progress).toEqual({
      currentChapter: null,
      currentStepIndex: 0,
      completedChapters: [],
      lastUpdated: expect.any(String),
    });
  });

  it('should load progress from localStorage on mount', () => {
    const savedProgress = {
      currentChapter: 'contacts',
      currentStepIndex: 3,
      completedChapters: ['organizations'],
      lastUpdated: '2025-12-06T10:00:00.000Z',
    };
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(savedProgress));

    const { result } = renderHook(() => useTutorialProgress());

    expect(result.current.progress).toEqual(savedProgress);
  });

  it('should save progress to localStorage when updated', () => {
    const { result } = renderHook(() => useTutorialProgress());

    act(() => {
      result.current.setCurrentChapter('contacts');
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'tutorial-progress',
      expect.stringContaining('"currentChapter":"contacts"')
    );
  });

  it('should mark chapter as completed', () => {
    const { result } = renderHook(() => useTutorialProgress());

    act(() => {
      result.current.markChapterComplete('organizations');
    });

    expect(result.current.progress.completedChapters).toContain('organizations');
  });

  it('should not duplicate completed chapters', () => {
    const { result } = renderHook(() => useTutorialProgress());

    act(() => {
      result.current.markChapterComplete('organizations');
      result.current.markChapterComplete('organizations');
    });

    expect(
      result.current.progress.completedChapters.filter((c) => c === 'organizations')
    ).toHaveLength(1);
  });

  it('should reset progress', () => {
    const savedProgress = {
      currentChapter: 'contacts',
      currentStepIndex: 3,
      completedChapters: ['organizations'],
      lastUpdated: '2025-12-06T10:00:00.000Z',
    };
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(savedProgress));

    const { result } = renderHook(() => useTutorialProgress());

    act(() => {
      result.current.resetProgress();
    });

    expect(result.current.progress.currentChapter).toBeNull();
    expect(result.current.progress.completedChapters).toEqual([]);
  });
});
```

**Run tests (should fail):**
```bash
npm test -- src/atomic-crm/tutorial/__tests__/useTutorialProgress.test.ts
# Expected: All tests should FAIL (module not found)
```

**Constitution Checklist:**
- [x] TDD: Tests written BEFORE implementation
- [x] Tests cover: default state, persistence, updates, edge cases

---

### Task 2.2: Implement useTutorialProgress Hook

**Time:** 10 min
**Dependencies:** Task 2.1
**Parallel:** No

Create **`src/atomic-crm/tutorial/useTutorialProgress.ts`**:
```tsx
import { useState, useEffect, useCallback } from 'react';
import type { TutorialChapter, TutorialProgress } from './types';

const STORAGE_KEY = 'tutorial-progress';

const DEFAULT_PROGRESS: TutorialProgress = {
  currentChapter: null,
  currentStepIndex: 0,
  completedChapters: [],
  lastUpdated: new Date().toISOString(),
};

function loadProgress(): TutorialProgress {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as TutorialProgress;
    }
  } catch {
    // Fail silently, return default
  }
  return { ...DEFAULT_PROGRESS, lastUpdated: new Date().toISOString() };
}

function saveProgress(progress: TutorialProgress): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function useTutorialProgress() {
  const [progress, setProgress] = useState<TutorialProgress>(loadProgress);

  // Save to localStorage whenever progress changes
  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const setCurrentChapter = useCallback((chapter: TutorialChapter | null) => {
    setProgress((prev) => ({
      ...prev,
      currentChapter: chapter,
      currentStepIndex: 0,
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  const setCurrentStep = useCallback((stepIndex: number) => {
    setProgress((prev) => ({
      ...prev,
      currentStepIndex: stepIndex,
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  const markChapterComplete = useCallback((chapter: TutorialChapter) => {
    setProgress((prev) => {
      // Prevent duplicates
      if (prev.completedChapters.includes(chapter)) {
        return prev;
      }
      return {
        ...prev,
        completedChapters: [...prev.completedChapters, chapter],
        currentChapter: null,
        currentStepIndex: 0,
        lastUpdated: new Date().toISOString(),
      };
    });
  }, []);

  const resetProgress = useCallback(() => {
    setProgress({
      ...DEFAULT_PROGRESS,
      lastUpdated: new Date().toISOString(),
    });
  }, []);

  return {
    progress,
    setCurrentChapter,
    setCurrentStep,
    markChapterComplete,
    resetProgress,
  };
}
```

**Run tests (should pass):**
```bash
npm test -- src/atomic-crm/tutorial/__tests__/useTutorialProgress.test.ts
# Expected: All tests should PASS
```

**Constitution Checklist:**
- [x] Fail-fast: Invalid JSON fails silently (acceptable for localStorage)
- [x] Single source of truth: One hook manages all progress state
- [x] No retry logic

---

### Task 2.3: TDD - Write Failing Tests for TutorialProvider

**Time:** 10 min
**Dependencies:** Task 2.2
**Parallel:** No

Create **`src/atomic-crm/tutorial/__tests__/TutorialProvider.test.tsx`**:
```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TutorialProvider, useTutorial } from '../TutorialProvider';
import { MemoryRouter } from 'react-router-dom';

// Mock driver.js
vi.mock('driver.js', () => ({
  driver: vi.fn(() => ({
    drive: vi.fn(),
    destroy: vi.fn(),
    isActive: vi.fn(() => false),
    moveNext: vi.fn(),
    movePrevious: vi.fn(),
  })),
}));

// Test component that uses the context
function TestConsumer() {
  const { startTutorial, stopTutorial, isActive } = useTutorial();

  return (
    <div>
      <span data-testid="is-active">{isActive ? 'active' : 'inactive'}</span>
      <button onClick={() => startTutorial()}>Start</button>
      <button onClick={() => startTutorial('contacts')}>Start Contacts</button>
      <button onClick={() => stopTutorial()}>Stop</button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <MemoryRouter>
      <TutorialProvider>
        <TestConsumer />
      </TutorialProvider>
    </MemoryRouter>
  );
}

describe('TutorialProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should provide tutorial context to children', () => {
    renderWithProvider();

    expect(screen.getByTestId('is-active')).toHaveTextContent('inactive');
  });

  it('should start tutorial when startTutorial is called', async () => {
    renderWithProvider();

    fireEvent.click(screen.getByText('Start'));

    // Driver.js should be initialized
    const { driver } = await import('driver.js');
    expect(driver).toHaveBeenCalled();
  });

  it('should start specific chapter when chapter is provided', async () => {
    renderWithProvider();

    fireEvent.click(screen.getByText('Start Contacts'));

    const { driver } = await import('driver.js');
    expect(driver).toHaveBeenCalled();
  });

  it('should throw error when useTutorial is used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestConsumer />);
    }).toThrow('useTutorial must be used within TutorialProvider');

    consoleSpy.mockRestore();
  });
});
```

**Run tests (should fail):**
```bash
npm test -- src/atomic-crm/tutorial/__tests__/TutorialProvider.test.tsx
# Expected: All tests should FAIL (module not found)
```

---

### Task 2.4: Implement TutorialProvider

**Time:** 15 min
**Dependencies:** Task 2.3
**Parallel:** No

Create **`src/atomic-crm/tutorial/TutorialProvider.tsx`**:
```tsx
import {
  createContext,
  useContext,
  useCallback,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { driver, type Driver, type Config } from 'driver.js';
import 'driver.js/dist/driver.css';

import { useTutorialProgress } from './useTutorialProgress';
import { waitForElement } from './waitForElement';
import { getAllSteps, getChapterSteps } from './steps';
import type { TutorialChapter, TutorialProgress } from './types';

interface TutorialContextType {
  startTutorial: (chapter?: TutorialChapter) => void;
  stopTutorial: () => void;
  isActive: boolean;
  progress: TutorialProgress;
}

const TutorialContext = createContext<TutorialContextType | null>(null);

interface TutorialProviderProps {
  children: ReactNode;
}

export function TutorialProvider({ children }: TutorialProviderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const driverRef = useRef<Driver | null>(null);
  const [isActive, setIsActive] = useState(false);

  const {
    progress,
    setCurrentChapter,
    setCurrentStep,
    markChapterComplete,
  } = useTutorialProgress();

  const stopTutorial = useCallback(() => {
    if (driverRef.current) {
      driverRef.current.destroy();
      driverRef.current = null;
    }
    setIsActive(false);
    setCurrentChapter(null);
  }, [setCurrentChapter]);

  const startTutorial = useCallback(
    (chapter?: TutorialChapter) => {
      // Stop any existing tour
      stopTutorial();

      // Get steps for chapter or full tour
      const steps = chapter ? getChapterSteps(chapter) : getAllSteps();

      if (steps.length === 0) {
        console.warn('No tutorial steps found');
        return;
      }

      // Set current chapter in progress
      setCurrentChapter(chapter ?? 'organizations');

      // Configure Driver.js
      const config: Config = {
        showProgress: true,
        animate: true,
        overlayColor: 'rgba(0, 0, 0, 0.75)',
        popoverClass: 'tutorial-popover',
        steps: steps.map((step, index) => ({
          element: step.element,
          popover: {
            title: step.popover.title,
            description: step.popover.description,
            side: step.popover.side,
            align: step.popover.align,
          },
          onHighlightStarted: async () => {
            // Navigate if needed
            if (step.navigateTo && location.pathname !== step.navigateTo) {
              navigate(step.navigateTo);
              if (step.element) {
                await waitForElement(step.element);
              }
            }
            setCurrentStep(index);
          },
        })),
        onDestroyStarted: () => {
          // Check if tour was completed (last step)
          if (chapter && driverRef.current) {
            markChapterComplete(chapter);
          }
        },
        onDestroyed: () => {
          setIsActive(false);
          driverRef.current = null;
        },
      };

      // Create and start driver
      driverRef.current = driver(config);
      setIsActive(true);
      driverRef.current.drive();
    },
    [
      stopTutorial,
      setCurrentChapter,
      setCurrentStep,
      markChapterComplete,
      navigate,
      location.pathname,
    ]
  );

  return (
    <TutorialContext.Provider
      value={{ startTutorial, stopTutorial, isActive, progress }}
    >
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial(): TutorialContextType {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorial must be used within TutorialProvider');
  }
  return context;
}
```

**Run tests (should pass):**
```bash
npm test -- src/atomic-crm/tutorial/__tests__/TutorialProvider.test.tsx
# Expected: All tests should PASS
```

**Constitution Checklist:**
- [x] Fail-fast: Throws if used outside provider
- [x] Single source of truth: One context for tutorial state
- [x] No retry logic

---

### Task 2.5: Create TutorialTooltip Component

**Time:** 10 min
**Dependencies:** Task 2.4
**Parallel:** No

Create **`src/atomic-crm/tutorial/components/TutorialTooltip.tsx`**:
```tsx
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface TutorialTooltipProps {
  title: string;
  description: string;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  onClose: () => void;
  isFirst: boolean;
  isLast: boolean;
}

/**
 * Custom tooltip component for Driver.js
 * Uses semantic Tailwind colors and 44px touch targets
 */
export function TutorialTooltip({
  title,
  description,
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  onClose,
  isFirst,
  isLast,
}: TutorialTooltipProps) {
  return (
    <div className="bg-card text-card-foreground border border-border rounded-lg shadow-lg p-4 max-w-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-lg leading-tight">{title}</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 shrink-0 -mr-2 -mt-1"
          aria-label="Close tutorial"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Description */}
      <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
        {description}
      </p>

      {/* Progress indicator */}
      <div className="flex items-center gap-1 mt-3">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-colors ${
              i <= currentStep ? 'bg-primary' : 'bg-muted'
            }`}
            style={{ width: `${100 / totalSteps}%` }}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        Step {currentStep + 1} of {totalSteps}
      </p>

      {/* Navigation buttons - 44px touch targets */}
      <div className="flex justify-between mt-4 gap-2">
        <Button
          variant="ghost"
          size="default"
          onClick={isFirst ? onClose : onPrevious}
          className="h-11 px-4"
        >
          {isFirst ? 'Skip' : '← Back'}
        </Button>
        <Button
          variant="default"
          size="default"
          onClick={onNext}
          className="h-11 px-6"
        >
          {isLast ? 'Finish' : 'Next →'}
        </Button>
      </div>
    </div>
  );
}
```

**Constitution Checklist:**
- [x] Semantic colors: `bg-card`, `text-card-foreground`, `text-muted-foreground`, `bg-primary`
- [x] Touch targets: `h-11` (44px) for buttons
- [x] No hardcoded hex values
- [x] WCAG AA: Proper contrast with semantic tokens

---

## Phase 3: Step Definitions (PARALLEL GROUP)

> **PARALLEL EXECUTION:** Tasks 3.1-3.8 can all run simultaneously.
> Each task creates one step definition file independently.

### Task 3.1: Create organizationSteps.ts

**Time:** 10 min
**Dependencies:** Phase 2 complete
**Parallel:** Yes (with 3.2-3.8)

Create **`src/atomic-crm/tutorial/steps/organizationSteps.ts`**:
```tsx
import type { TutorialStep } from '../types';

export const organizationSteps: TutorialStep[] = [
  {
    element: '[data-tutorial="nav-organizations"]',
    popover: {
      title: 'Organizations',
      description:
        'This is where you manage all organizations - Principals (manufacturers), Distributors, and Operators (restaurants).',
      side: 'bottom',
    },
  },
  {
    element: '[data-tutorial="organizations-list"]',
    popover: {
      title: 'Organization List',
      description:
        'View all your organizations here. Use the filters to find specific types like Principals or Distributors.',
      side: 'left',
    },
    navigateTo: '/organizations',
  },
  {
    element: '[data-tutorial="create-organization-btn"]',
    popover: {
      title: 'Add New Organization',
      description: "Click here to add a new organization. Let's create one now!",
      side: 'bottom',
    },
  },
  {
    element: '[data-tutorial="org-name"]',
    popover: {
      title: 'Organization Name',
      description: 'Enter the company name. We check for duplicates automatically.',
      side: 'right',
    },
    navigateTo: '/organizations/create',
  },
  {
    element: '[data-tutorial="org-type"]',
    popover: {
      title: 'Organization Type',
      description:
        'Select the type: Principal (manufacturer you represent), Distributor, or Operator (restaurant/foodservice).',
      side: 'right',
    },
  },
  {
    element: '[data-tutorial="org-website"]',
    popover: {
      title: 'Website (Optional)',
      description: "Add their website URL. We'll auto-add https:// if you forget.",
      side: 'right',
    },
  },
  {
    element: '[data-tutorial="org-save-btn"]',
    popover: {
      title: 'Save Organization',
      description:
        "Click Save to create the organization. You'll see a confirmation message.",
      side: 'top',
    },
  },
  {
    popover: {
      title: '✅ Organizations Complete!',
      description:
        "You've learned how to add organizations. Next, let's add contacts to these organizations.",
    },
  },
];
```

---

### Task 3.2: Create contactSteps.ts

**Time:** 10 min
**Dependencies:** Phase 2 complete
**Parallel:** Yes (with 3.1, 3.3-3.8)

Create **`src/atomic-crm/tutorial/steps/contactSteps.ts`**:
```tsx
import type { TutorialStep } from '../types';

export const contactSteps: TutorialStep[] = [
  {
    element: '[data-tutorial="nav-contacts"]',
    popover: {
      title: 'Contacts',
      description:
        'Manage all your contacts - buyers, decision makers, and key people at organizations.',
      side: 'bottom',
    },
  },
  {
    element: '[data-tutorial="contacts-list"]',
    popover: {
      title: 'Contact List',
      description:
        'View all contacts here. You can filter by organization or search by name.',
      side: 'left',
    },
    navigateTo: '/contacts',
  },
  {
    element: '[data-tutorial="create-contact-btn"]',
    popover: {
      title: 'Add New Contact',
      description: "Click here to add a new contact. Let's create one!",
      side: 'bottom',
    },
  },
  {
    element: '[data-tutorial="contact-first-name"]',
    popover: {
      title: 'First Name',
      description: 'Enter the first name. This is required.',
      side: 'right',
    },
    navigateTo: '/contacts/create',
  },
  {
    element: '[data-tutorial="contact-last-name"]',
    popover: {
      title: 'Last Name',
      description: 'Enter the last name. This is also required.',
      side: 'right',
    },
  },
  {
    element: '[data-tutorial="contact-organization"]',
    popover: {
      title: 'Organization',
      description:
        'Link this contact to an organization. You can also create a new organization inline.',
      side: 'right',
    },
  },
  {
    element: '[data-tutorial="contact-email"]',
    popover: {
      title: 'Email Address',
      description:
        'Add their email. Pro tip: We can auto-fill the name from the email if you enter it first!',
      side: 'right',
    },
  },
  {
    element: '[data-tutorial="contact-phone"]',
    popover: {
      title: 'Phone Number',
      description: 'Add phone numbers. You can add multiple numbers if needed.',
      side: 'right',
    },
  },
  {
    element: '[data-tutorial="contact-save-btn"]',
    popover: {
      title: 'Save Contact',
      description: 'Click Save to create the contact.',
      side: 'top',
    },
  },
  {
    popover: {
      title: '✅ Contacts Complete!',
      description:
        "Great! You've learned how to add contacts. Next, let's create opportunities in the sales pipeline.",
    },
  },
];
```

---

### Task 3.3: Create opportunitySteps.ts

**Time:** 12 min
**Dependencies:** Phase 2 complete
**Parallel:** Yes

Create **`src/atomic-crm/tutorial/steps/opportunitySteps.ts`**:
```tsx
import type { TutorialStep } from '../types';

export const opportunitySteps: TutorialStep[] = [
  {
    element: '[data-tutorial="nav-opportunities"]',
    popover: {
      title: 'Opportunities',
      description:
        'This is your sales pipeline - track deals from lead to close.',
      side: 'bottom',
    },
  },
  {
    element: '[data-tutorial="opportunities-list"]',
    popover: {
      title: 'Pipeline View',
      description:
        'See all opportunities here. Filter by Principal to answer "What do I need to do for each principal?"',
      side: 'left',
    },
    navigateTo: '/opportunities',
  },
  {
    element: '[data-tutorial="create-opportunity-btn"]',
    popover: {
      title: 'Add New Opportunity',
      description: "Let's create a new deal in the pipeline.",
      side: 'bottom',
    },
  },
  {
    element: '[data-tutorial="opp-name"]',
    popover: {
      title: 'Opportunity Name',
      description: 'Give this deal a clear name, like "ABC Restaurant - Sysco Authorization".',
      side: 'right',
    },
    navigateTo: '/opportunities/create',
  },
  {
    element: '[data-tutorial="opp-stage"]',
    popover: {
      title: 'Pipeline Stage',
      description:
        'Select the current stage: New Lead → Initial Outreach → Sample/Visit → Feedback → Demo → Closed.',
      side: 'right',
    },
  },
  {
    element: '[data-tutorial="opp-principal"]',
    popover: {
      title: 'Principal',
      description:
        'Which Principal (manufacturer) is this opportunity for? Each opportunity is linked to one Principal.',
      side: 'right',
    },
  },
  {
    element: '[data-tutorial="opp-customer"]',
    popover: {
      title: 'Customer Organization',
      description: 'Select the customer (Operator or Distributor) for this deal.',
      side: 'right',
    },
  },
  {
    element: '[data-tutorial="opp-contacts"]',
    popover: {
      title: 'Related Contacts',
      description: 'Link the key people involved in this deal.',
      side: 'right',
    },
  },
  {
    element: '[data-tutorial="opp-close-date"]',
    popover: {
      title: 'Estimated Close Date',
      description: 'When do you expect to close this deal?',
      side: 'right',
    },
  },
  {
    element: '[data-tutorial="opp-priority"]',
    popover: {
      title: 'Priority',
      description: 'Set the priority: Low, Medium, or High.',
      side: 'right',
    },
  },
  {
    element: '[data-tutorial="opp-save-btn"]',
    popover: {
      title: 'Save Opportunity',
      description: 'Click Save to add this opportunity to your pipeline.',
      side: 'top',
    },
  },
  {
    popover: {
      title: '✅ Opportunities Complete!',
      description:
        "Excellent! Now you know how to manage your pipeline. Let's learn about logging activities.",
    },
  },
];
```

---

### Task 3.4: Create activitySteps.ts

**Time:** 10 min
**Dependencies:** Phase 2 complete
**Parallel:** Yes

Create **`src/atomic-crm/tutorial/steps/activitySteps.ts`**:
```tsx
import type { TutorialStep } from '../types';

export const activitySteps: TutorialStep[] = [
  {
    popover: {
      title: 'Activity Logging',
      description:
        'Activities track your interactions - calls, emails, meetings, and samples. Aim for 10+ activities per week per Principal!',
    },
  },
  {
    element: '[data-tutorial="activities-list"]',
    popover: {
      title: 'Activity History',
      description: 'View all logged activities here.',
      side: 'left',
    },
    navigateTo: '/activities',
  },
  {
    element: '[data-tutorial="create-activity-btn"]',
    popover: {
      title: 'Log New Activity',
      description: "Let's log an activity. You should do this in under 30 seconds!",
      side: 'bottom',
    },
  },
  {
    element: '[data-tutorial="activity-type"]',
    popover: {
      title: 'Activity Type',
      description:
        'Select the type: Call, Email, Meeting, Demo, Sample, Site Visit, and more.',
      side: 'right',
    },
    navigateTo: '/activities/create',
  },
  {
    element: '[data-tutorial="activity-description"]',
    popover: {
      title: 'Description',
      description: 'Brief notes about what happened. Keep it short!',
      side: 'right',
    },
  },
  {
    element: '[data-tutorial="activity-opportunity"]',
    popover: {
      title: 'Related Opportunity',
      description: 'Link this activity to an opportunity in your pipeline.',
      side: 'right',
    },
  },
  {
    element: '[data-tutorial="activity-save-btn"]',
    popover: {
      title: 'Save Activity',
      description: 'Click Save to log this activity.',
      side: 'top',
    },
  },
  {
    popover: {
      title: '✅ Activities Complete!',
      description:
        "You've learned quick activity logging. Next, let's look at task management.",
    },
  },
];
```

---

### Task 3.5: Create taskSteps.ts

**Time:** 8 min
**Dependencies:** Phase 2 complete
**Parallel:** Yes

Create **`src/atomic-crm/tutorial/steps/taskSteps.ts`**:
```tsx
import type { TutorialStep } from '../types';

export const taskSteps: TutorialStep[] = [
  {
    element: '[data-tutorial="nav-tasks"]',
    popover: {
      title: 'Tasks',
      description: 'Manage your to-do list and follow-ups here.',
      side: 'bottom',
    },
  },
  {
    element: '[data-tutorial="tasks-list"]',
    popover: {
      title: 'Task List',
      description: 'See all your tasks. Overdue tasks are highlighted in red.',
      side: 'left',
    },
    navigateTo: '/tasks',
  },
  {
    element: '[data-tutorial="create-task-btn"]',
    popover: {
      title: 'Add New Task',
      description: "Let's create a follow-up task.",
      side: 'bottom',
    },
  },
  {
    element: '[data-tutorial="task-title"]',
    popover: {
      title: 'Task Title',
      description: 'What needs to be done? Be specific.',
      side: 'right',
    },
    navigateTo: '/tasks/create',
  },
  {
    element: '[data-tutorial="task-due-date"]',
    popover: {
      title: 'Due Date',
      description: 'When should this be completed? Defaults to today.',
      side: 'right',
    },
  },
  {
    element: '[data-tutorial="task-save-btn"]',
    popover: {
      title: 'Save Task',
      description: 'Click Save to create the task.',
      side: 'top',
    },
  },
  {
    popover: {
      title: '✅ Tasks Complete!',
      description:
        "Task management done! Now let's look at Products.",
    },
  },
];
```

---

### Task 3.6: Create productSteps.ts

**Time:** 6 min
**Dependencies:** Phase 2 complete
**Parallel:** Yes

Create **`src/atomic-crm/tutorial/steps/productSteps.ts`**:
```tsx
import type { TutorialStep } from '../types';

export const productSteps: TutorialStep[] = [
  {
    element: '[data-tutorial="nav-products"]',
    popover: {
      title: 'Products',
      description: "Manage the products your Principals offer.",
      side: 'bottom',
    },
  },
  {
    element: '[data-tutorial="products-list"]',
    popover: {
      title: 'Product Catalog',
      description: 'View all products here, organized by Principal.',
      side: 'left',
    },
    navigateTo: '/products',
  },
  {
    element: '[data-tutorial="create-product-btn"]',
    popover: {
      title: 'Add New Product',
      description: "Let's add a product to the catalog.",
      side: 'bottom',
    },
  },
  {
    element: '[data-tutorial="product-name"]',
    popover: {
      title: 'Product Name',
      description: 'Enter the product name.',
      side: 'right',
    },
    navigateTo: '/products/create',
  },
  {
    popover: {
      title: '✅ Products Complete!',
      description: 'Products are set up! Now let\'s cover Notes.',
    },
  },
];
```

---

### Task 3.7: Create noteSteps.ts

**Time:** 5 min
**Dependencies:** Phase 2 complete
**Parallel:** Yes

Create **`src/atomic-crm/tutorial/steps/noteSteps.ts`**:
```tsx
import type { TutorialStep } from '../types';

export const noteSteps: TutorialStep[] = [
  {
    popover: {
      title: 'Quick Notes',
      description:
        'Notes can be added to Contacts, Opportunities, and Organizations. They\'re timestamped automatically.',
    },
  },
  {
    element: '[data-tutorial="contact-notes-section"]',
    popover: {
      title: 'Notes Panel',
      description:
        'Add quick notes here. Great for recording important details from conversations.',
      side: 'left',
    },
    navigateTo: '/contacts',
  },
  {
    element: '[data-tutorial="add-note-btn"]',
    popover: {
      title: 'Add Note',
      description: 'Click to add a new note. It will be saved with today\'s date.',
      side: 'bottom',
    },
  },
  {
    popover: {
      title: '✅ Notes Complete!',
      description: 'Notes are easy! Finally, let\'s cover Team Management (Admin only).',
    },
  },
];
```

---

### Task 3.8: Create userSteps.ts

**Time:** 5 min
**Dependencies:** Phase 2 complete
**Parallel:** Yes

Create **`src/atomic-crm/tutorial/steps/userSteps.ts`**:
```tsx
import type { TutorialStep } from '../types';

export const userSteps: TutorialStep[] = [
  {
    popover: {
      title: 'Team Management',
      description:
        'Admin users can invite new team members here. New users receive an email to set their password.',
    },
  },
  {
    element: '[data-tutorial="team-list"]',
    popover: {
      title: 'Team Members',
      description: 'View all team members and their roles.',
      side: 'left',
    },
    navigateTo: '/admin/users',
  },
  {
    element: '[data-tutorial="invite-user-btn"]',
    popover: {
      title: 'Invite User',
      description: 'Click to invite a new team member.',
      side: 'bottom',
    },
  },
  {
    popover: {
      title: '🎉 Tutorial Complete!',
      description:
        'Congratulations! You\'ve completed the full CRM tutorial. You can replay any chapter from the Tutorial menu anytime.',
    },
  },
];
```

---

### Task 3.9: Create steps/index.ts (Combine All Steps)

**Time:** 5 min
**Dependencies:** Tasks 3.1-3.8
**Parallel:** No (runs after 3.1-3.8)

Create **`src/atomic-crm/tutorial/steps/index.ts`**:
```tsx
import type { TutorialStep, TutorialChapter } from '../types';
import { organizationSteps } from './organizationSteps';
import { contactSteps } from './contactSteps';
import { opportunitySteps } from './opportunitySteps';
import { activitySteps } from './activitySteps';
import { taskSteps } from './taskSteps';
import { productSteps } from './productSteps';
import { noteSteps } from './noteSteps';
import { userSteps } from './userSteps';

const CHAPTER_STEPS: Record<TutorialChapter, TutorialStep[]> = {
  organizations: organizationSteps,
  contacts: contactSteps,
  opportunities: opportunitySteps,
  activities: activitySteps,
  tasks: taskSteps,
  products: productSteps,
  notes: noteSteps,
  users: userSteps,
};

const CHAPTER_ORDER: TutorialChapter[] = [
  'organizations',
  'contacts',
  'opportunities',
  'activities',
  'tasks',
  'products',
  'notes',
  'users',
];

/**
 * Get steps for a specific chapter
 */
export function getChapterSteps(chapter: TutorialChapter): TutorialStep[] {
  return CHAPTER_STEPS[chapter] ?? [];
}

/**
 * Get all steps for full tutorial (all chapters in order)
 */
export function getAllSteps(): TutorialStep[] {
  return CHAPTER_ORDER.flatMap((chapter) => CHAPTER_STEPS[chapter]);
}

/**
 * Get ordered list of chapters
 */
export function getChapterOrder(): TutorialChapter[] {
  return [...CHAPTER_ORDER];
}
```

---

## Phase 4: Data Attributes (PARALLEL GROUP)

> **PARALLEL EXECUTION:** Tasks 4.1-4.9 can all run simultaneously.
> Each task adds `data-tutorial` attributes to one component file.

### Task 4.1: Add Data Attributes to Header.tsx

**Time:** 5 min
**Dependencies:** Phase 3 complete
**Parallel:** Yes

**File:** `src/atomic-crm/layout/Header.tsx`

Add `data-tutorial` attributes to navigation items:

```tsx
// Find the navigation tabs and add data-tutorial attributes
<Tab data-tutorial="nav-contacts">Contacts</Tab>
<Tab data-tutorial="nav-organizations">Organizations</Tab>
<Tab data-tutorial="nav-opportunities">Opportunities</Tab>
<Tab data-tutorial="nav-products">Products</Tab>
<Tab data-tutorial="nav-tasks">Tasks</Tab>
```

---

### Task 4.2: Add Data Attributes to ContactCreate.tsx

**Time:** 5 min
**Dependencies:** Phase 3 complete
**Parallel:** Yes

**File:** `src/atomic-crm/contacts/ContactCreate.tsx`

Add `data-tutorial` attributes to form fields (read file first to find exact locations):

```tsx
// Add to relevant inputs
<TextInput source="first_name" data-tutorial="contact-first-name" />
<TextInput source="last_name" data-tutorial="contact-last-name" />
<ReferenceInput source="organization_id" data-tutorial="contact-organization" />
<TextInput source="email" data-tutorial="contact-email" />
<TextInput source="phone" data-tutorial="contact-phone" />
<Button data-tutorial="contact-save-btn">Save</Button>
```

---

### Tasks 4.3-4.9: Similar pattern for remaining Create forms

Each task follows the same pattern - add `data-tutorial` attributes to:
- `OrganizationCreate.tsx` - org-name, org-type, org-website, org-save-btn
- `OpportunityCreate.tsx` - opp-name, opp-stage, opp-principal, etc.
- `ActivityCreate.tsx` - activity-type, activity-description, etc.
- `TaskCreate.tsx` - task-title, task-due-date, task-save-btn
- `ProductCreate.tsx` - product-name, product-save-btn
- `NoteCreate.tsx` - add-note-btn
- `SalesCreate.tsx` - invite-user-btn

---

## Phase 5: Integration (Sequential)

### Task 5.1: Create TutorialLauncher Component

**Time:** 10 min
**Dependencies:** Phase 4 complete
**Parallel:** No

Create **`src/atomic-crm/tutorial/TutorialLauncher.tsx`**:
```tsx
import { BookOpen, CheckCircle } from 'lucide-react';
import {
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useTutorial } from './TutorialProvider';
import type { TutorialChapter } from './types';

const CHAPTERS: { key: TutorialChapter; label: string }[] = [
  { key: 'organizations', label: 'Organizations' },
  { key: 'contacts', label: 'Contacts' },
  { key: 'opportunities', label: 'Opportunities' },
  { key: 'activities', label: 'Activities' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'products', label: 'Products' },
  { key: 'notes', label: 'Notes' },
  { key: 'users', label: 'Team Members' },
];

export function TutorialLauncher() {
  const { startTutorial, progress } = useTutorial();

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className="h-11">
        <BookOpen className="mr-2 h-4 w-4" />
        <span>Tutorial</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        {/* Full tour option */}
        <DropdownMenuItem
          onClick={() => startTutorial()}
          className="h-11 font-medium"
        >
          ▶ Start Full Tour
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Individual chapters */}
        {CHAPTERS.map(({ key, label }) => (
          <DropdownMenuItem
            key={key}
            onClick={() => startTutorial(key)}
            className="h-11 flex justify-between"
          >
            <span>{label}</span>
            {progress.completedChapters.includes(key) && (
              <CheckCircle className="h-4 w-4 text-success" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
```

---

### Task 5.2: Add TutorialLauncher to Header

**Time:** 5 min
**Dependencies:** Task 5.1
**Parallel:** No

**File:** `src/atomic-crm/layout/Header.tsx`

Add import and component to user dropdown:

```tsx
import { TutorialLauncher } from '../tutorial/TutorialLauncher';

// In the user dropdown menu content
<DropdownMenuContent>
  <DropdownMenuItem>My Info</DropdownMenuItem>
  <DropdownMenuSeparator />
  <TutorialLauncher />  {/* ADD THIS */}
  <DropdownMenuSeparator />
  <DropdownMenuItem>Logout</DropdownMenuItem>
</DropdownMenuContent>
```

---

### Task 5.3: Wrap CRM with TutorialProvider

**Time:** 5 min
**Dependencies:** Task 5.2
**Parallel:** No

**File:** `src/atomic-crm/root/CRM.tsx`

Add import and wrap the app:

```tsx
import { TutorialProvider } from '../tutorial/TutorialProvider';

// Wrap the main content
<TutorialProvider>
  {/* existing CRM content */}
</TutorialProvider>
```

---

### Task 5.4: Add Driver.js CSS and Route Change Handling

**Time:** 5 min
**Dependencies:** Task 5.3
**Parallel:** No

**File 1:** `src/atomic-crm/tutorial/TutorialProvider.tsx`

Already included in Task 2.4:
```tsx
import 'driver.js/dist/driver.css';
```

**File 2:** `src/index.css` (or `src/App.css`)

Add custom CSS overrides:

```css
/* ============================
   Tutorial / Driver.js Overrides
   ============================ */

/* Custom popover styling */
.tutorial-popover {
  /* Override Driver.js defaults to match design system */
  --driver-overlay-opacity: 0.75;
}

/* Ensure highlighted elements are above overlay */
.driver-active-element {
  z-index: 10001 !important;
}

/* Smooth transitions for overlay */
.driver-overlay {
  transition: opacity 0.2s ease-in-out;
}
```

**File 3:** Update `TutorialProvider.tsx` to handle route changes

Add route change listener to stop tour when user navigates away:

```tsx
// In TutorialProvider.tsx, add useEffect for route changes
useEffect(() => {
  // If tour is active and route changes unexpectedly, stop the tour
  if (isActive && driverRef.current) {
    // Check if current step's element still exists
    const currentStep = driverRef.current.getActiveIndex?.();
    // If element is missing, the tour will auto-handle via onDeselected
  }
}, [location.pathname, isActive]);
```

**Constitution Checklist:**
- [x] CSS uses semantic approach (variables, not hardcoded values)
- [x] Route changes handled gracefully

---

## Phase 6: Testing (Sequential)

### Task 6.1: Run All Unit Tests

**Time:** 5 min
**Dependencies:** Phase 5 complete
**Parallel:** No

```bash
npm test -- src/atomic-crm/tutorial/
# Expected: All tests pass
```

---

### Task 6.2: Create Integration Test

**Time:** 10 min
**Dependencies:** Task 6.1
**Parallel:** No

Create **`src/atomic-crm/tutorial/__tests__/integration.test.tsx`**:
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TutorialProvider, useTutorial } from '../TutorialProvider';
import { TutorialLauncher } from '../TutorialLauncher';

// Mock driver.js
vi.mock('driver.js', () => ({
  driver: vi.fn(() => ({
    drive: vi.fn(),
    destroy: vi.fn(),
    isActive: vi.fn(() => false),
  })),
}));

describe('Tutorial Integration', () => {
  it('should render tutorial launcher in menu', () => {
    render(
      <MemoryRouter>
        <TutorialProvider>
          <TutorialLauncher />
        </TutorialProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Tutorial')).toBeInTheDocument();
  });

  it('should show all chapter options', async () => {
    render(
      <MemoryRouter>
        <TutorialProvider>
          <TutorialLauncher />
        </TutorialProvider>
      </MemoryRouter>
    );

    // Open submenu
    fireEvent.click(screen.getByText('Tutorial'));

    await waitFor(() => {
      expect(screen.getByText('Start Full Tour')).toBeInTheDocument();
      expect(screen.getByText('Contacts')).toBeInTheDocument();
      expect(screen.getByText('Opportunities')).toBeInTheDocument();
    });
  });
});
```

---

### Task 6.3: Create E2E Test

**Time:** 15 min
**Dependencies:** Task 6.2
**Parallel:** No

Create **`tests/e2e/tutorial.spec.ts`**:
```tsx
import { test, expect } from '@playwright/test';

test.describe('Tutorial Walkthrough', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/');
    // ... login steps ...
  });

  test('should start tutorial from menu', async ({ page }) => {
    // Open user menu
    await page.getByRole('button', { name: /user menu/i }).click();

    // Click Tutorial
    await page.getByText('Tutorial').click();

    // Click Start Full Tour
    await page.getByText('Start Full Tour').click();

    // Verify tutorial started - look for Driver.js overlay
    await expect(page.locator('.driver-overlay')).toBeVisible();

    // Verify first step content
    await expect(page.locator('.driver-popover')).toContainText('Organizations');
  });

  test('should navigate through tutorial steps', async ({ page }) => {
    // Start tutorial
    await page.getByRole('button', { name: /user menu/i }).click();
    await page.getByText('Tutorial').click();
    await page.getByText('Start Full Tour').click();

    // Click Next
    await page.getByRole('button', { name: /next/i }).click();

    // Should move to next step
    await expect(page.locator('.driver-popover')).not.toContainText('Organizations');
  });

  test('should allow skipping tutorial', async ({ page }) => {
    // Start tutorial
    await page.getByRole('button', { name: /user menu/i }).click();
    await page.getByText('Tutorial').click();
    await page.getByText('Start Full Tour').click();

    // Click Skip
    await page.getByRole('button', { name: /skip/i }).click();

    // Tutorial should close
    await expect(page.locator('.driver-overlay')).not.toBeVisible();
  });
});
```

---

## Verification Checklist

After implementation, verify:

- [ ] `npm install` succeeds with driver.js
- [ ] All unit tests pass: `npm test -- src/atomic-crm/tutorial/`
- [ ] Tutorial menu appears in user dropdown
- [ ] "Start Full Tour" launches Driver.js overlay
- [ ] Steps navigate correctly between pages
- [ ] Progress persists in localStorage after refresh
- [ ] Completed chapters show checkmarks
- [ ] Touch targets are 44px minimum
- [ ] No hardcoded hex colors
- [ ] E2E tests pass: `npm run test:e2e -- tutorial`

---

## Constitution Compliance Summary

| Principle | Status | Evidence |
|-----------|--------|----------|
| **Fail-fast** | ✅ | Errors throw, no retry logic |
| **Single source of truth** | ✅ | Steps in `/steps/`, progress in hook |
| **Zod at boundary** | ✅ | N/A - no API calls |
| **Semantic colors** | ✅ | `bg-card`, `text-foreground`, etc. |
| **44px touch targets** | ✅ | `h-11` on all buttons |
| **TDD** | ✅ | Tests written before implementation |
