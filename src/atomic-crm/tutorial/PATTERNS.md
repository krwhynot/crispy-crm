# Tutorial Patterns

Standard patterns for interactive product tours using Driver.js, including state management, progress tracking, element targeting, and cross-page navigation.

## Component Hierarchy

```
TutorialProvider (context + Driver.js orchestration)
    |
    +-- useTutorialProgress (localStorage state + progress tracking)
    |       |
    |       +-- progress: {currentChapter, currentStepIndex, completedChapters, visitedPages}
    |       +-- setCurrentChapter, setCurrentStep, markChapterComplete
    |       +-- hasVisitedPage, markPageVisited (first-visit detection)
    |
    +-- prepareStep (navigation + element waiting)
    |       |
    |       +-- navigate to route if needed
    |       +-- waitForElement with skeleton detection
    |       +-- return ready/not-found status
    |
    +-- Driver.js lifecycle
            |
            +-- onNextClick: prepareStep BEFORE moveNext
            +-- onPrevClick: prepareStep BEFORE movePrevious
            +-- onDestroyStarted: markChapterComplete if final step
            +-- onDestroyed: cleanup state

TutorialLauncher (dropdown menu with chapter list)
    |
    +-- Shows completion checkmarks for finished chapters
    +-- Triggers startTutorial(chapter) on click

PageTutorialTrigger (per-page floating help button)
    |
    +-- First visit: Auto-start tutorial after 500ms
    +-- Subsequent visits: Show floating "?" button
    +-- Hidden during active tutorial

Steps Registry (steps/index.ts)
    |
    +-- getChapterSteps(chapter) -> TutorialStep[]
    +-- CHAPTER_STEPS map: chapter -> step definitions
    +-- Each step: { element?, popover, navigateTo? }

waitForElement utility
    |
    +-- Polls DOM every 100ms via requestAnimationFrame
    +-- Extends timeout if skeleton loading states detected
    +-- Rejects with error on timeout
```

---

## Pattern A: Tutorial Context Provider

Central orchestrator for Driver.js tours with cross-page navigation and element readiness checks.

**When to use**: Wrapping the app to provide tutorial functionality globally.

### Data Flow

```
User clicks "Start Tutorial"
    |
    v
startTutorial(chapter)
    |
    +-- getChapterSteps(chapter) -> TutorialStep[]
    +-- setCurrentChapter(chapter)
    +-- prepareStep(firstStep)
    |       |
    |       +-- Navigate if step.navigateTo differs from current route
    |       +-- Wait for step.element to appear (or skip if no element)
    |       +-- Return ready: boolean
    |
    +-- driver(config) -> Initialize Driver.js
    |
    v
Driver.js Tour Active
    |
    +-- User clicks "Next" -> onNextClick
    |       |
    |       +-- prepareStep(nextStep) BEFORE moveNext
    |       +-- Element ready? -> moveNext() : skip/log
    |
    +-- User clicks "Previous" -> onPrevClick
    |       |
    |       +-- prepareStep(prevStep) BEFORE movePrevious
    |
    +-- User clicks "Done" (final step) -> onDestroyStarted
    |       |
    |       +-- markChapterComplete(chapter)
    |
    +-- Tour destroyed -> onDestroyed
            |
            +-- setIsActive(false)
            +-- Cleanup refs
```

### Provider Implementation

```tsx
// src/atomic-crm/tutorial/TutorialProvider.tsx

export function TutorialProvider({ children }: TutorialProviderProps) {
  const navigate = useNavigate();
  const driverRef = useRef<Driver | null>(null);
  const [isActive, setIsActive] = useState(false);
  const currentStepIndexRef = useRef(0);
  const totalStepsRef = useRef(0);
  const stepsRef = useRef<TutorialStep[]>([]);

  const {
    progress,
    setCurrentChapter,
    setCurrentStep,
    markChapterComplete,
    hasVisitedPage,
    markPageVisited,
  } = useTutorialProgress();

  // Navigate + wait for element to appear
  const prepareStep = useCallback(
    async (step: TutorialStep): Promise<boolean> => {
      const currentPath = window.location.pathname;

      // Navigate if needed
      if (step.navigateTo && currentPath !== step.navigateTo) {
        navigate(step.navigateTo);
        await new Promise((resolve) => setTimeout(resolve, 150)); // React Router transition
      }

      // Wait for element if present
      if (step.element) {
        try {
          await waitForElement(step.element, 8000);
          return true;
        } catch {
          logger.warn(`Tutorial: Element not found: ${step.element}`);
          return false;
        }
      }

      return true; // Steps without elements (intro/outro) are always ready
    },
    [navigate]
  );

  const startTutorial = useCallback(
    async (chapter: TutorialChapter) => {
      stopTutorial(); // Stop any existing tour

      const steps = getChapterSteps(chapter);
      if (steps.length === 0) return;

      totalStepsRef.current = steps.length;
      currentStepIndexRef.current = 0;
      stepsRef.current = steps;
      setCurrentChapter(chapter);

      const firstStepReady = await prepareStep(steps[0]);
      if (!firstStepReady) {
        logger.warn("Tutorial: First step element not found, aborting");
        return;
      }

      const config: Config = {
        showProgress: true,
        animate: true,
        smoothScroll: true,
        allowClose: true,
        allowKeyboardControl: true,
        showButtons: ["next", "previous", "close"],

        // Handle navigation BEFORE step advances
        onNextClick: async () => {
          const nextIndex = currentStepIndexRef.current + 1;
          if (nextIndex >= steps.length) {
            driverRef.current?.destroy();
            return;
          }

          const nextStep = steps[nextIndex];
          const stepReady = await prepareStep(nextStep);

          if (stepReady && driverRef.current) {
            currentStepIndexRef.current = nextIndex;
            setCurrentStep(nextIndex);
            driverRef.current.moveNext();
          } else {
            logger.warn(`Skipping step ${nextIndex}: element not ready`);
            currentStepIndexRef.current = nextIndex;
            driverRef.current?.moveNext();
          }
        },

        onPrevClick: async () => {
          const prevIndex = currentStepIndexRef.current - 1;
          if (prevIndex < 0) return;

          const prevStep = steps[prevIndex];
          await prepareStep(prevStep);

          currentStepIndexRef.current = prevIndex;
          setCurrentStep(prevIndex);
          driverRef.current?.movePrevious();
        },

        onCloseClick: () => {
          driverRef.current?.destroy();
        },

        onDestroyStarted: () => {
          const reachedFinalStep = currentStepIndexRef.current >= totalStepsRef.current - 1;
          if (reachedFinalStep) {
            markChapterComplete(chapter);
          }
        },

        onDestroyed: () => {
          setIsActive(false);
          driverRef.current = null;
        },

        steps: steps.map((step) => ({
          element: step.element,
          popover: {
            title: step.popover.title,
            description: step.popover.description,
            side: step.popover.side,
            align: step.popover.align,
          },
        })),
      };

      driverRef.current = driver(config);
      setIsActive(true);
      driverRef.current.drive();
    },
    [stopTutorial, setCurrentChapter, setCurrentStep, markChapterComplete, prepareStep]
  );

  const contextValue = useMemo(
    () => ({
      startTutorial,
      stopTutorial,
      isActive,
      progress,
      hasVisitedPage,
      markPageVisited,
    }),
    [isActive, progress]
  );

  return <TutorialContext.Provider value={contextValue}>{children}</TutorialContext.Provider>;
}
```

**Key points:**
- `prepareStep` navigates AND waits for element before Driver.js highlights it
- `onNextClick` runs BEFORE `moveNext()` to ensure element is ready
- `currentStepIndexRef` tracks position independently of Driver.js internal state
- `markChapterComplete` only fires if user reached final step (prevents partial completion)
- `allowClose: true` enables escape hatch without breaking flow

**Example:** `src/atomic-crm/tutorial/TutorialProvider.tsx`

---

## Pattern B: Progress Tracking with Local Storage

Persistent tutorial progress using Zod-validated localStorage with first-visit detection.

**When to use**: Tracking user progress across sessions and preventing auto-trigger on repeat visits.

### State Schema

```tsx
// src/atomic-crm/tutorial/types.ts

export interface TutorialProgress {
  currentChapter: TutorialChapter | null;      // Active chapter (null if not running)
  currentStepIndex: number;                     // Current step within chapter
  completedChapters: TutorialChapter[];         // Finished chapters (checkmark display)
  visitedPages: TutorialChapter[];              // Pages user has seen (prevent auto-trigger)
  lastUpdated: string;                          // ISO timestamp
}
```

### Hook Implementation

```tsx
// src/atomic-crm/tutorial/useTutorialProgress.ts

const STORAGE_KEY = "tutorial-progress";

const DEFAULT_PROGRESS: TutorialProgress = {
  currentChapter: null,
  currentStepIndex: 0,
  completedChapters: [],
  visitedPages: [],
  lastUpdated: new Date().toISOString(),
};

const tutorialProgressSchema = z
  .object({
    currentChapter: tutorialChapterSchema.nullable(),
    currentStepIndex: z.number(),
    completedChapters: z.array(tutorialChapterSchema),
    visitedPages: z.array(tutorialChapterSchema),
    lastUpdated: z.string().max(50),
  })
  .passthrough();

function loadProgress(): TutorialProgress {
  const parsed = getStorageItem<TutorialProgress>(STORAGE_KEY, {
    type: "local",
    schema: tutorialProgressSchema,
  });

  if (parsed) {
    return {
      ...parsed,
      visitedPages: parsed.visitedPages ?? [], // Migrate old data
    } as TutorialProgress;
  }

  return { ...DEFAULT_PROGRESS, lastUpdated: new Date().toISOString() };
}

function saveProgress(progress: TutorialProgress): void {
  setStorageItem(STORAGE_KEY, progress, { type: "local" });
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

  const markChapterComplete = useCallback((chapter: TutorialChapter) => {
    setProgress((prev) => {
      if (prev.completedChapters.includes(chapter)) {
        return prev; // Prevent duplicates
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

  const hasVisitedPage = useCallback(
    (chapter: TutorialChapter) => {
      return progress.visitedPages.includes(chapter);
    },
    [progress.visitedPages]
  );

  const markPageVisited = useCallback((chapter: TutorialChapter) => {
    setProgress((prev) => {
      if (prev.visitedPages.includes(chapter)) {
        return prev; // Prevent duplicates
      }
      return {
        ...prev,
        visitedPages: [...prev.visitedPages, chapter],
        lastUpdated: new Date().toISOString(),
      };
    });
  }, []);

  return {
    progress,
    setCurrentChapter,
    setCurrentStep,
    markChapterComplete,
    resetProgress,
    hasVisitedPage,
    markPageVisited,
  };
}
```

**Key points:**
- Zod schema validation prevents corrupted localStorage from crashing app
- `.passthrough()` allows future field additions without migration
- `visitedPages` tracks first visits separately from completions
- Duplicate prevention: check array before adding
- `lastUpdated` timestamp for potential future sync/cleanup

**Example:** `src/atomic-crm/tutorial/useTutorialProgress.ts`

---

## Pattern C: Step Definitions Registry

Centralized step definitions with chapter-to-steps mapping for DRY tour configuration.

**When to use**: Defining tutorial content for each page/feature module.

### Step Type Definition

```tsx
// src/atomic-crm/tutorial/types.ts

export interface TutorialStep {
  element?: string;                     // CSS selector (optional for intro/outro)
  popover: {
    title: string;                      // Popover heading
    description: string;                // Popover body (supports HTML)
    side?: "top" | "bottom" | "left" | "right";  // Popover position
    align?: "start" | "center" | "end"; // Alignment relative to element
  };
  navigateTo?: string;                  // Route to navigate before this step
}
```

### Step Definition Example

```tsx
// src/atomic-crm/tutorial/steps/organizationSteps.ts

export const organizationSteps: TutorialStep[] = [
  // Step 1: List overview
  {
    element: '[data-tutorial="organizations-list"]',
    popover: {
      title: "Organization List",
      description:
        "View all your organizations here - Principals, Distributors, and Operators. Click any row to see details.",
      side: "left",
    },
    navigateTo: "/organizations",
  },
  // Step 2: Filter sidebar
  {
    element: '[data-tutorial="org-filters"]',
    popover: {
      title: "Filter Organizations",
      description:
        "Use filters to narrow down your view. Filter by Type (Principal, Distributor, Operator), Priority (A-D), Category, or your own accounts.",
      side: "right",
    },
  },
  // Step 3: Sort button
  {
    element: '[data-tutorial="org-sort-btn"]',
    popover: {
      title: "Sort Results",
      description:
        "Sort organizations by Name, Type, or Priority. Click again to reverse the order.",
      side: "bottom",
    },
  },
  // Final step: Completion (no element)
  {
    popover: {
      title: "✅ Organization List Tutorial Complete!",
      description:
        "You've learned how to navigate, filter, and manage your organizations. Click any row to view or edit details in the slide-over panel.",
    },
  },
];
```

### Central Registry

```tsx
// src/atomic-crm/tutorial/steps/index.ts

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
  "organizations",
  "contacts",
  "opportunities",
  "activities",
  "tasks",
  "products",
  "notes",
  "users",
];

export function getChapterSteps(chapter: TutorialChapter): TutorialStep[] {
  return CHAPTER_STEPS[chapter] ?? [];
}

export function getChapterOrder(): TutorialChapter[] {
  return [...CHAPTER_ORDER];
}
```

**Key points:**
- `data-tutorial` attributes in DOM enable stable selectors
- Steps without `element` field are intro/outro screens (no highlight)
- `navigateTo` triggers route change before highlighting element
- `side` and `align` control popover positioning to avoid overlapping UI
- Central registry ensures all chapters follow same structure

**Example:** `src/atomic-crm/tutorial/steps/organizationSteps.ts`, `steps/index.ts`

---

## Pattern D: Element Waiting with Loading Detection

Robust DOM polling that extends timeout when skeleton states are detected.

**When to use**: Waiting for React Admin components to render after navigation.

### Implementation

```tsx
// src/atomic-crm/tutorial/waitForElement.ts

const LOADING_SELECTOR = '[data-slot="skeleton"]';
const LOADING_EXTENDED_TIMEOUT = 15000;

export async function waitForElement(selector: string, timeout = 8000): Promise<Element> {
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const check = () => {
      const element = document.querySelector(selector);

      if (element) {
        resolve(element);
        return;
      }

      // Extend timeout if loading skeletons are visible
      const isLoading = document.querySelector(LOADING_SELECTOR) !== null;
      const elapsed = Date.now() - startTime;
      const effectiveTimeout = isLoading ? Math.max(timeout, LOADING_EXTENDED_TIMEOUT) : timeout;

      if (elapsed >= effectiveTimeout) {
        reject(new Error(`Element "${selector}" not found within ${elapsed}ms`));
        return;
      }

      // Poll every 100ms
      requestAnimationFrame(check);
    };

    check();
  });
}
```

### Usage in prepareStep

```tsx
// src/atomic-crm/tutorial/TutorialProvider.tsx

const prepareStep = useCallback(
  async (step: TutorialStep): Promise<boolean> => {
    const currentPath = window.location.pathname;

    // Navigate if needed
    if (step.navigateTo && currentPath !== step.navigateTo) {
      navigate(step.navigateTo);
      await new Promise((resolve) => setTimeout(resolve, 150)); // React Router transition
    }

    // Wait for element if present
    if (step.element) {
      try {
        await waitForElement(step.element, 8000);
        return true;
      } catch (_error) {
        logger.warn(`Tutorial: Element not found: ${step.element}`);
        return false;
      }
    }

    return true; // Steps without elements are always ready
  },
  [navigate]
);
```

**Key points:**
- `requestAnimationFrame` for efficient polling (60fps max, pauses when tab hidden)
- Skeleton detection prevents premature timeout during data fetching
- Returns Promise for async/await pattern in prepareStep
- Logging on timeout helps debug missing `data-tutorial` attributes

**Example:** `src/atomic-crm/tutorial/waitForElement.ts`

---

## Pattern E: Page Tutorial Trigger

Per-page floating help button with first-visit auto-trigger.

**When to use**: Providing contextual tutorial access on feature pages.

### Implementation

```tsx
// src/atomic-crm/tutorial/PageTutorialTrigger.tsx

interface PageTutorialTriggerProps {
  chapter: TutorialChapter;
  position?: "bottom-right" | "bottom-left" | "top-right";
}

const POSITION_CLASSES = {
  "bottom-right": "bottom-4 right-4",
  "bottom-left": "bottom-4 left-4",
  "top-right": "top-20 right-4", // Below header
} as const;

const CHAPTER_LABELS: Record<TutorialChapter, string> = {
  organizations: "Organizations",
  contacts: "Contacts",
  opportunities: "Opportunities",
  activities: "Activities",
  tasks: "Tasks",
  products: "Products",
  notes: "Notes",
  users: "Users",
};

export function PageTutorialTrigger({
  chapter,
  position = "bottom-left",
}: PageTutorialTriggerProps) {
  const { startTutorial, isActive, hasVisitedPage, markPageVisited } = useTutorial();
  const hasAutoTriggered = useRef(false);

  // First-visit auto-trigger
  useEffect(() => {
    if (hasAutoTriggered.current) return;
    if (isActive) return;

    const alreadyVisited = hasVisitedPage(chapter);
    if (alreadyVisited) return;

    hasAutoTriggered.current = true;

    const timer = window.setTimeout(() => {
      markPageVisited(chapter); // Mark BEFORE starting (prevent double-trigger)
      startTutorial(chapter);
    }, 500);

    return () => window.clearTimeout(timer);
  }, [chapter, hasVisitedPage, isActive, markPageVisited, startTutorial]);

  // Hide button during active tutorial
  if (isActive) return null;

  return (
    <div className={`fixed ${POSITION_CLASSES[position]} z-50`}>
      <Tooltip>
        <TooltipTrigger asChild>
          <AdminButton
            variant="default"
            size="icon"
            onClick={() => startTutorial(chapter)}
            className="h-11 w-11 rounded-full shadow-lg bg-primary text-primary-foreground hover:scale-105 transition-transform"
            aria-label={`Start ${CHAPTER_LABELS[chapter]} tutorial`}
          >
            <HelpCircle className="h-5 w-5" />
          </AdminButton>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Learn about {CHAPTER_LABELS[chapter]}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
```

### Usage in Feature Page

```tsx
// src/atomic-crm/organizations/OrganizationList.tsx

export const OrganizationList = () => (
  <>
    <List>
      <Datagrid data-tutorial="organizations-list">
        {/* ... */}
      </Datagrid>
    </List>
    <PageTutorialTrigger chapter="organizations" position="bottom-left" />
  </>
);
```

**Key points:**
- `hasVisitedPage` check prevents auto-trigger on subsequent visits
- `markPageVisited` called BEFORE `startTutorial` to prevent race condition
- 500ms delay gives user time to orient themselves before tour starts
- `isActive` check prevents duplicate triggers
- `hasAutoTriggered` ref prevents multiple useEffect runs

**Example:** `src/atomic-crm/tutorial/PageTutorialTrigger.tsx`

---

## Pattern F: Tutorial Launcher Menu

Global tutorial launcher with chapter list and completion indicators.

**When to use**: Providing global access to all tutorials from app header.

### Implementation

```tsx
// src/atomic-crm/tutorial/TutorialLauncher.tsx

const CHAPTERS: { key: TutorialChapter; label: string }[] = [
  { key: "organizations", label: "Organizations" },
  { key: "contacts", label: "Contacts" },
  { key: "opportunities", label: "Opportunities" },
  { key: "activities", label: "Activities" },
  { key: "tasks", label: "Tasks" },
  { key: "products", label: "Products" },
  { key: "notes", label: "Notes" },
  { key: "users", label: "Team Members" },
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
        {CHAPTERS.map(({ key, label }) => (
          <DropdownMenuItem
            key={key}
            onClick={() => startTutorial(key)}
            className="h-11 flex justify-between"
          >
            <span>{label}</span>
            {progress.completedChapters.includes(key) && (
              <CheckCircle className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
```

**Key points:**
- Checkmark icon shows completed chapters (encourages completion)
- `DropdownMenuSub` for nested menu (keeps header clean)
- 44px minimum touch targets (`h-11`) for iPad
- `onClick` directly calls `startTutorial` (no intermediate state)

**Example:** `src/atomic-crm/tutorial/TutorialLauncher.tsx`

---

## Pattern Comparison Tables

### Step Types

| Step Type | Has `element` | Has `navigateTo` | Use Case |
|-----------|---------------|------------------|----------|
| **Intro/Outro** | No | No | Welcome/completion screens |
| **Same-Page Highlight** | Yes | No | Highlight existing element on current page |
| **Cross-Page Highlight** | Yes | Yes | Navigate to page, then highlight element |

### State Transitions

| From State | Action | To State | Side Effects |
|------------|--------|----------|--------------|
| No chapter | `startTutorial(chapter)` | Chapter active, step 0 | Navigate to first step, initialize Driver.js |
| Active step N | "Next" button | Step N+1 | `prepareStep(N+1)`, then `moveNext()` |
| Active step N | "Previous" button | Step N-1 | `prepareStep(N-1)`, then `movePrevious()` |
| Final step | "Done" button | No chapter | `markChapterComplete`, destroy driver |
| Any step | "Close" button | No chapter | Destroy driver (no completion) |

### Tutorial Storage

| Field | Type | Persistence | Purpose |
|-------|------|-------------|---------|
| `currentChapter` | TutorialChapter \| null | localStorage | Resume tutorial on refresh |
| `currentStepIndex` | number | localStorage | Resume at exact step |
| `completedChapters` | TutorialChapter[] | localStorage | Checkmark display, achievement tracking |
| `visitedPages` | TutorialChapter[] | localStorage | Prevent auto-trigger on repeat visits |

---

## Anti-Patterns

### 1. Direct Driver.js moveNext Without Preparing

```tsx
// WRONG: Element may not exist yet
onNextClick: () => {
  driverRef.current.moveNext(); // Element not ready!
}

// CORRECT: Wait for element before advancing
onNextClick: async () => {
  const nextStep = steps[nextIndex];
  const stepReady = await prepareStep(nextStep);
  if (stepReady) {
    driverRef.current.moveNext();
  }
}
```

### 2. Navigating Without Delay

```tsx
// WRONG: Query selector runs before React Router finishes
if (step.navigateTo) {
  navigate(step.navigateTo);
  await waitForElement(step.element); // Fails - old route still rendering
}

// CORRECT: Give React Router time to start transition
if (step.navigateTo) {
  navigate(step.navigateTo);
  await new Promise((resolve) => setTimeout(resolve, 150));
  await waitForElement(step.element);
}
```

### 3. Hardcoded Selectors in Components

```tsx
// WRONG: Brittle CSS class selectors
element: '.flex.items-center.gap-2 > button'

// CORRECT: Use data-tutorial attributes
<button data-tutorial="create-organization-btn">Create</button>
element: '[data-tutorial="create-organization-btn"]'
```

### 4. Missing First-Visit Guard

```tsx
// WRONG: Auto-trigger on every page load
useEffect(() => {
  startTutorial("organizations");
}, []);

// CORRECT: Only auto-trigger on first visit
useEffect(() => {
  if (!hasVisitedPage("organizations") && !isActive) {
    markPageVisited("organizations");
    startTutorial("organizations");
  }
}, [hasVisitedPage, isActive]);
```

### 5. Mutating Driver.js State Directly

```tsx
// WRONG: Bypasses lifecycle hooks
driverRef.current.destroy();
setCurrentChapter(null); // Manual cleanup

// CORRECT: Let onDestroyed handle cleanup
driverRef.current.destroy(); // onDestroyed hook runs automatically
```

### 6. Fixed Timeout Without Loading Detection

```tsx
// WRONG: Fails when API is slow
await waitForElement(selector, 5000); // Fixed 5s

// CORRECT: Extend timeout when skeletons are visible
const isLoading = document.querySelector('[data-slot="skeleton"]');
const effectiveTimeout = isLoading ? 15000 : 8000;
```

### 7. Using setTimeout Instead of requestAnimationFrame

```tsx
// WRONG: Continues polling in background tabs (battery drain)
const check = () => {
  const element = document.querySelector(selector);
  if (!element) {
    setTimeout(check, 100);
  }
};

// CORRECT: Pauses when tab is hidden
const check = () => {
  const element = document.querySelector(selector);
  if (!element) {
    requestAnimationFrame(check);
  }
};
```

---

## Migration Checklist

### Adding a New Tutorial Chapter

- [ ] Create `steps/[feature]Steps.ts` with `TutorialStep[]` export
- [ ] Add chapter key to `TutorialChapter` union in `types.ts`
- [ ] Register in `CHAPTER_STEPS` map in `steps/index.ts`
- [ ] Add to `CHAPTER_ORDER` array in `steps/index.ts`
- [ ] Add chapter label to `CHAPTER_LABELS` in `TutorialLauncher.tsx` and `PageTutorialTrigger.tsx`
- [ ] Add `data-tutorial` attributes to target elements in feature components
- [ ] Add `<PageTutorialTrigger chapter="[feature]" />` to feature page
- [ ] Test navigation flow with `navigateTo` routing
- [ ] Verify element selectors with browser DevTools
- [ ] Test skeleton loading detection if step targets async content

### Adding a Tutorial Step

- [ ] Define step in appropriate `steps/[feature]Steps.ts` file
- [ ] Add `data-tutorial` attribute to target element (if highlighting)
- [ ] Set `navigateTo` route if step requires page change
- [ ] Choose appropriate `side` and `align` to avoid UI overlap
- [ ] Test with slow network (throttling in DevTools)
- [ ] Verify skeleton detection if content is async-loaded
- [ ] Update step count in feature documentation

### Adding Progress Tracking Fields

- [ ] Add field to `TutorialProgress` interface in `types.ts`
- [ ] Add field to `tutorialProgressSchema` in `useTutorialProgress.ts`
- [ ] Add field to `DEFAULT_PROGRESS` constant
- [ ] Add migration logic in `loadProgress()` if changing existing field
- [ ] Add accessor/mutator function in `useTutorialProgress` hook
- [ ] Update context provider to expose new function
- [ ] Test with existing localStorage data (migration path)

### Debugging Missing Elements

```bash
# 1. Verify element exists in DOM
document.querySelector('[data-tutorial="your-selector"]')

# 2. Check if skeleton is blocking (should extend timeout)
document.querySelector('[data-slot="skeleton"]')

# 3. Enable tutorial logging
# In TutorialProvider.tsx, add console.log in prepareStep

# 4. Test with React DevTools
# - Inspect component tree
# - Verify data-tutorial attribute is rendered
# - Check if element is conditionally rendered
```

---

## File Reference

| Pattern | Primary Files |
|---------|--------------|
| A: Tutorial Provider | `TutorialProvider.tsx`, `types.ts` |
| B: Progress Tracking | `useTutorialProgress.ts`, `utils/secureStorage.ts` |
| C: Steps Registry | `steps/index.ts`, `steps/[feature]Steps.ts` |
| D: Element Waiting | `waitForElement.ts` |
| E: Page Trigger | `PageTutorialTrigger.tsx` |
| F: Launcher Menu | `TutorialLauncher.tsx` |
