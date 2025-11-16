# Dashboard V2 Polish & Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete the Dashboard V2 feature by fixing interactive gaps, missing wiring, accessibility issues, and adding test coverage.

**Architecture:** Client-side React components with React Admin data hooks, localStorage preferences via usePrefs, ARIA-compliant interactive widgets, TDD approach with Vitest + React Testing Library.

**Tech Stack:** React 19, TypeScript, React Admin, Tailwind CSS 4, Vitest, React Testing Library, ARIA tree pattern

---

## Phase 1: Critical Functionality & Data Flow (P0-P1)

### Task 1: Fix Task Completion Refetch

**Files:**
- Modify: `src/atomic-crm/dashboard/v2/components/TasksPanel.tsx:65-79`
- Test: `tests/e2e/dashboard-v2-tasks.spec.ts` (new file)

**Step 1: Write failing E2E test for task completion**

Create test file:

```typescript
// tests/e2e/dashboard-v2-tasks.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Dashboard V2 - Tasks Panel', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');

    // Navigate to dashboard v2
    await page.goto('/?layout=v2');

    // Select a principal with tasks
    await page.click('[data-testid="principal-select-trigger"]');
    await page.click('text="MFB Family Brands"');
    await page.waitForTimeout(1000); // Wait for data load
  });

  test('should remove completed task from list immediately', async ({ page }) => {
    // Find first task checkbox
    const firstTask = page.locator('[role="listitem"]').first();
    const taskTitle = await firstTask.locator('span.truncate').textContent();

    // Click checkbox to complete task
    await firstTask.locator('button[aria-label*="Mark"]').click();

    // Wait for success notification
    await expect(page.locator('text="Task marked as complete"')).toBeVisible();

    // Verify task is removed from list (should not find it anymore)
    await expect(page.locator(`text="${taskTitle}"`).first()).not.toBeVisible({ timeout: 2000 });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test:e2e tests/e2e/dashboard-v2-tasks.spec.ts`
Expected: FAIL - Task remains visible after completion

**Step 3: Add refetch to handleComplete**

```typescript
// src/atomic-crm/dashboard/v2/components/TasksPanel.tsx:39-40
import { useGetList, useUpdate, useNotify, useRefresh } from 'react-admin';

// src/atomic-crm/dashboard/v2/components/TasksPanel.tsx:38
const refresh = useRefresh();

// src/atomic-crm/dashboard/v2/components/TasksPanel.tsx:65-81
const handleComplete = async (taskId: number) => {
  try {
    await update('tasks', {
      id: taskId,
      data: {
        completed: true,
        completed_at: new Date().toISOString(),
      },
      previousData: { id: taskId },
    });
    notify('Task marked as complete', { type: 'success' });

    // Immediately refetch priority_tasks to update UI
    refresh();
  } catch (error) {
    console.error('Task completion failed:', error);
    notify('Failed to complete task', { type: 'error' });
  }
};
```

**Step 4: Run test to verify it passes**

Run: `npm run test:e2e tests/e2e/dashboard-v2-tasks.spec.ts`
Expected: PASS - Task disappears from list after completion

**Step 5: Commit**

```bash
git add src/atomic-crm/dashboard/v2/components/TasksPanel.tsx tests/e2e/dashboard-v2-tasks.spec.ts
git commit -m "fix(dashboard-v2): refresh tasks after completion

- Add useRefresh() to TasksPanel
- Call refresh() after successful task completion
- Task immediately removed from list after marking complete
- Add E2E test for task completion flow

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2: Fix Opportunity Data Refetch After Stage Change

**Files:**
- Modify: `src/atomic-crm/dashboard/v2/components/RightSlideOver.tsx:55-67`

**Step 1: Write failing test for stage change refresh**

```typescript
// tests/e2e/dashboard-v2-slide-over.spec.ts (append to existing file)
test('should update opportunity details after stage change', async ({ page }) => {
  // Open slide-over for first opportunity
  await page.locator('[role="treeitem"]').nth(1).click(); // Skip customer header

  // Wait for slide-over
  await expect(page.locator('[role="dialog"]')).toBeVisible();

  // Get current stage
  const stageSelect = page.locator('#stage');
  const currentStage = await stageSelect.inputValue();

  // Change stage
  await stageSelect.click();
  const newStage = currentStage === 'qualification' ? 'proposal' : 'qualification';
  await page.click(`text="${newStage}"`);

  // Wait for success notification
  await expect(page.locator('text="Stage updated successfully"')).toBeVisible();

  // Close and reopen slide-over
  await page.keyboard.press('Escape');
  await page.locator('[role="treeitem"]').nth(1).click();

  // Verify stage persisted
  await expect(page.locator('#stage')).toHaveValue(newStage);
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test:e2e tests/e2e/dashboard-v2-slide-over.spec.ts`
Expected: FAIL - Stage reverts to old value on reopen

**Step 3: Add refresh to handleStageChange**

```typescript
// src/atomic-crm/dashboard/v2/components/RightSlideOver.tsx:36-37
import { useGetOne, useGetList, useUpdate, useNotify, useRefresh } from 'react-admin';

const refresh = useRefresh();

// src/atomic-crm/dashboard/v2/components/RightSlideOver.tsx:55-68
const handleStageChange = async (newStage: string) => {
  if (!opportunity) return;

  try {
    await update('opportunities', {
      id: opportunity.id,
      data: { stage: newStage },
      previousData: opportunity,
    });
    notify('Stage updated successfully', { type: 'success' });

    // Refresh to update OpportunitiesHierarchy and slide-over data
    refresh();
  } catch {
    notify('Failed to update stage', { type: 'error' });
  }
};
```

**Step 4: Run test to verify it passes**

Run: `npm run test:e2e tests/e2e/dashboard-v2-slide-over.spec.ts`
Expected: PASS - Stage change persists across close/reopen

**Step 5: Commit**

```bash
git add src/atomic-crm/dashboard/v2/components/RightSlideOver.tsx tests/e2e/dashboard-v2-slide-over.spec.ts
git commit -m "fix(dashboard-v2): refresh data after stage change

- Add useRefresh() to RightSlideOver
- Call refresh() after successful stage update
- Ensures OpportunitiesHierarchy and Details tab show updated stage
- Add E2E test for stage change persistence

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 3: Persist Selected Principal to Preferences

**Files:**
- Modify: `src/atomic-crm/dashboard/v2/context/PrincipalContext.tsx:24`
- Modify: `src/atomic-crm/dashboard/v2/components/DashboardHeader.tsx:39-41`

**Step 1: Write failing test for principal persistence**

```typescript
// src/atomic-crm/dashboard/v2/context/__tests__/PrincipalContext.test.tsx (new file)
import { renderHook, act } from '@testing-library/react';
import { PrincipalProvider, usePrincipalContext } from '../PrincipalContext';
import { useStore } from 'react-admin';

// Mock useStore
vi.mock('react-admin', () => ({
  useStore: vi.fn(),
}));

describe('PrincipalContext', () => {
  it('should persist selected principal to localStorage', () => {
    const mockSetStore = vi.fn();
    const mockStoreValue = null;

    (useStore as any).mockReturnValue([mockStoreValue, mockSetStore]);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <PrincipalProvider>{children}</PrincipalProvider>
    );

    const { result } = renderHook(() => usePrincipalContext(), { wrapper });

    // Initially null
    expect(result.current.selectedPrincipalId).toBe(null);

    // Set principal ID
    act(() => {
      result.current.setSelectedPrincipal(123);
    });

    // Verify setStore was called with correct key and value
    expect(mockSetStore).toHaveBeenCalledWith('pd.selectedPrincipalId', 123);
  });

  it('should restore principal from localStorage on mount', () => {
    const mockSetStore = vi.fn();
    const storedPrincipalId = 456;

    (useStore as any).mockReturnValue([storedPrincipalId, mockSetStore]);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <PrincipalProvider>{children}</PrincipalProvider>
    );

    const { result } = renderHook(() => usePrincipalContext(), { wrapper });

    // Should restore from store
    expect(result.current.selectedPrincipalId).toBe(456);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/atomic-crm/dashboard/v2/context/__tests__/PrincipalContext.test.tsx`
Expected: FAIL - useStore not called, principal not persisted

**Step 3: Implement principal persistence**

```typescript
// src/atomic-crm/dashboard/v2/context/PrincipalContext.tsx
import type { ReactNode } from 'react';
import React, { createContext, useContext } from 'react';
import { useStore } from 'react-admin';

export interface PrincipalContextValue {
  selectedPrincipalId: number | null;
  setSelectedPrincipal: (id: number | null) => void;
}

const PrincipalContext = createContext<PrincipalContextValue | null>(null);

export function usePrincipalContext(): PrincipalContextValue {
  const context = useContext(PrincipalContext);
  if (!context) {
    throw new Error('usePrincipalContext must be used within PrincipalProvider');
  }
  return context;
}

export interface PrincipalProviderProps {
  children: ReactNode;
}

export function PrincipalProvider({ children }: PrincipalProviderProps) {
  // Persist to localStorage via React Admin's useStore
  const [selectedPrincipalId, setSelectedPrincipal] = useStore<number | null>(
    'pd.selectedPrincipalId',
    null
  );

  const value: PrincipalContextValue = {
    selectedPrincipalId,
    setSelectedPrincipal,
  };

  return <PrincipalContext.Provider value={value}>{children}</PrincipalContext.Provider>;
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/atomic-crm/dashboard/v2/context/__tests__/PrincipalContext.test.tsx`
Expected: PASS - Principal persisted and restored correctly

**Step 5: Add E2E test for page refresh persistence**

```typescript
// tests/e2e/dashboard-v2.spec.ts (append)
test('should persist selected principal across page refresh', async ({ page }) => {
  // Select principal
  await page.click('[data-testid="principal-select-trigger"]');
  await page.click('text="MFB Family Brands"');

  // Wait for data to load
  await expect(page.locator('text="MFB Family Brands"')).toBeVisible();

  // Reload page
  await page.reload();

  // Verify principal still selected
  await expect(page.locator('[data-testid="principal-select-trigger"]')).toContainText('MFB Family Brands');

  // Verify data loaded for that principal
  await expect(page.locator('[role="tree"]')).not.toContainText('Select a principal');
});
```

**Step 6: Run E2E test**

Run: `npm run test:e2e tests/e2e/dashboard-v2.spec.ts`
Expected: PASS

**Step 7: Commit**

```bash
git add src/atomic-crm/dashboard/v2/context/PrincipalContext.tsx src/atomic-crm/dashboard/v2/context/__tests__/PrincipalContext.test.tsx tests/e2e/dashboard-v2.spec.ts
git commit -m "feat(dashboard-v2): persist selected principal across sessions

- Use React Admin useStore() instead of useState
- Persist to localStorage with key 'pd.selectedPrincipalId'
- Restore selection on page refresh
- Add unit tests for persistence
- Add E2E test for page reload

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 4: Wire Global Search or Hide Shortcut

**Files:**
- Modify: `src/atomic-crm/dashboard/v2/components/DashboardHeader.tsx:100-106`
- Modify: `src/atomic-crm/dashboard/v2/PrincipalDashboardV2.tsx:108-111`

**Step 1: Write test documenting current behavior**

```typescript
// src/atomic-crm/dashboard/v2/components/__tests__/DashboardHeader.test.tsx (new file)
import { render, screen } from '@testing-library/react';
import { DashboardHeader } from '../DashboardHeader';
import { PrincipalProvider } from '../../context/PrincipalContext';
import { AdminContext } from 'react-admin';

describe('DashboardHeader', () => {
  it('should not render global search input', () => {
    render(
      <AdminContext>
        <PrincipalProvider>
          <DashboardHeader />
        </PrincipalProvider>
      </AdminContext>
    );

    // Search should not be in the document
    expect(screen.queryByLabelText('Global search')).not.toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails (search currently exists)**

Run: `npm test -- src/atomic-crm/dashboard/v2/components/__tests__/DashboardHeader.test.tsx`
Expected: FAIL - Search input is currently rendered

**Step 3: Remove global search input and update shortcuts**

```typescript
// src/atomic-crm/dashboard/v2/components/DashboardHeader.tsx:82-106
<div className="flex items-center gap-3">
  <Select
    value={selectedPrincipalId?.toString() || ''}
    onValueChange={handlePrincipalChange}
    disabled={isLoading}
  >
    <SelectTrigger data-testid="principal-select-trigger" className="h-11 w-[240px]">
      <SelectValue placeholder="Select principal..." />
    </SelectTrigger>
    <SelectContent>
      {principals?.map((principal) => (
        <SelectItem key={principal.id} value={principal.id.toString()}>
          {principal.name}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>

  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button className="h-11 gap-2" aria-label="Create new item">
        <Plus className="size-4" aria-hidden="true" />
        New
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem onClick={handleNewActivity}>Activity</DropdownMenuItem>
      <DropdownMenuItem onClick={handleNewTask}>Task</DropdownMenuItem>
      <DropdownMenuItem onClick={handleNewOpportunity}>Opportunity</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</div>
```

**Step 4: Remove / keyboard shortcut**

```typescript
// src/atomic-crm/dashboard/v2/PrincipalDashboardV2.tsx:96-143
// Keyboard shortcuts
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Ignore shortcuts when typing in input/textarea
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      e.target instanceof HTMLSelectElement
    ) {
      return;
    }

    switch (e.key) {
      // REMOVED: '/' case for global search
      case '1':
        e.preventDefault();
        document.getElementById('col-opportunities')?.scrollIntoView({ behavior: 'smooth' });
        break;
      case '2':
        e.preventDefault();
        document.getElementById('col-tasks')?.scrollIntoView({ behavior: 'smooth' });
        break;
      case '3':
        e.preventDefault();
        document.getElementById('col-logger')?.scrollIntoView({ behavior: 'smooth' });
        break;
      case 'H':
      case 'h':
        e.preventDefault();
        if (selectedOpportunityId) {
          setSlideOverOpen(true);
        }
        break;
      case 'Escape':
        if (slideOverOpen) {
          e.preventDefault();
          setSlideOverOpen(false);
        }
        break;
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [slideOverOpen, selectedOpportunityId]);
```

**Step 5: Update types and documentation**

```typescript
// src/atomic-crm/dashboard/v2/types.ts:172-179
/**
 * Keyboard shortcut mapping
 *
 * Global listeners (active when not in input/textarea)
 */
export interface KeyboardShortcut {
  '1': 'scroll-to-opportunities';
  '2': 'scroll-to-tasks';
  '3': 'scroll-to-quick-logger';
  H: 'open-history-tab';
  Escape: 'close-slide-over';
}
```

**Step 6: Run test to verify it passes**

Run: `npm test -- src/atomic-crm/dashboard/v2/components/__tests__/DashboardHeader.test.tsx`
Expected: PASS - Search input not in document

**Step 7: Commit**

```bash
git add src/atomic-crm/dashboard/v2/components/DashboardHeader.tsx src/atomic-crm/dashboard/v2/PrincipalDashboardV2.tsx src/atomic-crm/dashboard/v2/types.ts src/atomic-crm/dashboard/v2/components/__tests__/DashboardHeader.test.tsx
git commit -m "refactor(dashboard-v2): remove unimplemented global search

- Remove global search input from DashboardHeader
- Remove '/' keyboard shortcut (no longer needed)
- Update KeyboardShortcut type to reflect available shortcuts
- Add test documenting search removal
- Prevents users from focusing inert control

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 5: Replace TODO Handlers with Real Navigation

**Files:**
- Modify: `src/atomic-crm/dashboard/v2/components/DashboardHeader.tsx:43-53`
- Modify: `src/atomic-crm/dashboard/v2/components/TasksPanel.tsx:82-84`

**Step 1: Wire "New" dropdown menu items**

```typescript
// src/atomic-crm/dashboard/v2/components/DashboardHeader.tsx:27-53
export function DashboardHeader() {
  const navigate = useNavigate();
  const { selectedPrincipalId, setSelectedPrincipal } = usePrincipalContext();

  const { data: principals, isLoading } = useGetList<Principal>('organizations', {
    filter: { organization_type: 'principal' },
    pagination: { page: 1, perPage: 100 },
    sort: { field: 'name', order: 'ASC' },
  });

  const selectedPrincipal = principals?.find((p) => p.id === selectedPrincipalId);

  const handlePrincipalChange = (value: string) => {
    setSelectedPrincipal(parseInt(value, 10));
  };

  const handleNewActivity = () => {
    // Navigate to activities create page with pre-filled principal
    if (selectedPrincipalId) {
      navigate(`/activities/create?organization_id=${selectedPrincipalId}`);
    } else {
      navigate('/activities/create');
    }
  };

  const handleNewTask = () => {
    navigate('/tasks/create');
  };

  const handleNewOpportunity = () => {
    // Navigate to opportunities create page with pre-filled principal
    if (selectedPrincipalId) {
      navigate(`/opportunities/create?principal_organization_id=${selectedPrincipalId}`);
    } else {
      navigate('/opportunities/create');
    }
  };
```

**Step 2: Wire "Create Task" button in empty state**

```typescript
// src/atomic-crm/dashboard/v2/components/TasksPanel.tsx:82-84
const handleCreateTask = () => {
  navigate('/tasks/create');
};

// Add import at top
import { useNavigate } from 'react-router-dom';

// In component
const navigate = useNavigate();
```

**Step 3: Write E2E test for navigation**

```typescript
// tests/e2e/dashboard-v2-navigation.spec.ts (new file)
import { test, expect } from '@playwright/test';

test.describe('Dashboard V2 - Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
    await page.goto('/?layout=v2');
  });

  test('should navigate to activity create from New menu', async ({ page }) => {
    // Select principal
    await page.click('[data-testid="principal-select-trigger"]');
    await page.click('text="MFB Family Brands"');

    // Open New menu
    await page.click('button:has-text("New")');

    // Click Activity
    await page.click('text="Activity"');

    // Verify navigation
    await expect(page).toHaveURL(/\/activities\/create/);

    // Verify principal pre-filled (check for organization_id in URL)
    expect(page.url()).toContain('organization_id=');
  });

  test('should navigate to task create from New menu', async ({ page }) => {
    await page.click('button:has-text("New")');
    await page.click('text="Task"');
    await expect(page).toHaveURL(/\/tasks\/create/);
  });

  test('should navigate to opportunity create from New menu', async ({ page }) => {
    // Select principal
    await page.click('[data-testid="principal-select-trigger"]');
    await page.click('text="MFB Family Brands"');

    await page.click('button:has-text("New")');
    await page.click('text="Opportunity"');

    await expect(page).toHaveURL(/\/opportunities\/create/);
    expect(page.url()).toContain('principal_organization_id=');
  });
});
```

**Step 4: Run E2E tests**

Run: `npm run test:e2e tests/e2e/dashboard-v2-navigation.spec.ts`
Expected: PASS - All navigation works correctly

**Step 5: Commit**

```bash
git add src/atomic-crm/dashboard/v2/components/DashboardHeader.tsx src/atomic-crm/dashboard/v2/components/TasksPanel.tsx tests/e2e/dashboard-v2-navigation.spec.ts
git commit -m "feat(dashboard-v2): wire New menu and Create Task navigation

- Replace console.log with navigate() calls
- Pre-fill principal_organization_id for Activity and Opportunity
- Wire Create Task button in empty state
- Add E2E tests for all navigation paths

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 6: Add Loading State to QuickLogger Submit

**Files:**
- Modify: `src/atomic-crm/dashboard/v2/components/QuickLogger.tsx:28-127`

**Step 1: Write test for loading state**

```typescript
// src/atomic-crm/dashboard/v2/components/__tests__/QuickLogger.test.tsx (new file)
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuickLogger } from '../QuickLogger';
import { PrincipalProvider } from '../../context/PrincipalContext';
import { AdminContext } from 'react-admin';

describe('QuickLogger', () => {
  it('should disable form during submission', async () => {
    const user = userEvent.setup();

    render(
      <AdminContext>
        <PrincipalProvider>
          <QuickLogger />
        </PrincipalProvider>
      </AdminContext>
    );

    // Fill out form
    await user.type(screen.getByLabelText(/Subject/), 'Test activity');

    // Submit
    const submitButton = screen.getByTestId('quick-logger-submit');
    await user.click(submitButton);

    // During submission, button should be disabled
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/atomic-crm/dashboard/v2/components/__tests__/QuickLogger.test.tsx`
Expected: FAIL - Button not disabled during submission

**Step 3: Add loading state**

```typescript
// src/atomic-crm/dashboard/v2/components/QuickLogger.tsx:28-127
export function QuickLogger() {
  const { selectedPrincipalId } = usePrincipalContext();
  const [activityType, setActivityType] = useState<ActivityType>('call');
  const [opportunityId, setOpportunityId] = useState<number | null>(null);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [createFollowUp, setCreateFollowUp] = useState(false);
  const [followUpTitle, setFollowUpTitle] = useState('');
  const [followUpDueDate, setFollowUpDueDate] = useState('');
  const [followUpPriority, setFollowUpPriority] = useState<Priority>('medium');
  const [isSubmitting, setIsSubmitting] = useState(false); // NEW

  const { create: createActivity } = useCreate();
  const { create: createTask } = useCreate();
  const notify = useNotify();
  const refresh = useRefresh();
  const { data: identity } = useGetIdentity();

  // ... (fetch opportunities code unchanged)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPrincipalId) {
      notify('Select a principal to log activity', { type: 'warning' });
      return;
    }

    if (!subject.trim()) {
      notify('Subject is required', { type: 'warning' });
      return;
    }

    if (createFollowUp) {
      if (!followUpTitle.trim()) {
        notify('Follow-up task title is required', { type: 'warning' });
        return;
      }
      if (!followUpDueDate) {
        notify('Follow-up due date is required', { type: 'warning' });
        return;
      }
    }

    setIsSubmitting(true); // Start loading

    try {
      const selectedType = ACTIVITY_TYPES.find((t) => t.value === activityType);

      // Create activity
      await createActivity('activities', {
        data: {
          subject: subject.trim(),
          description: description.trim() || null,
          activity_type: opportunityId ? 'interaction' : 'engagement',
          type: selectedType?.interactionType || 'check_in',
          opportunity_id: opportunityId,
          organization_id: selectedPrincipalId,
        },
      });

      // Create follow-up task if requested
      if (createFollowUp && identity?.id) {
        await createTask('tasks', {
          data: {
            title: followUpTitle.trim(),
            due_date: followUpDueDate,
            priority: followUpPriority,
            opportunity_id: opportunityId,
            sales_id: identity.id,
          },
        });
      }

      notify(createFollowUp ? 'Activity + task created' : 'Activity logged', { type: 'success' });

      // Clear form (keep principal selected)
      setSubject('');
      setDescription('');
      setOpportunityId(null);
      setCreateFollowUp(false);
      setFollowUpTitle('');
      setFollowUpDueDate('');
      setFollowUpPriority('medium');

      // Refresh to update Opportunities and Tasks columns
      refresh();
    } catch (error) {
      notify('Failed to log activity', { type: 'error' });
      console.error('Activity creation error:', error);
    } finally {
      setIsSubmitting(false); // End loading
    }
  };

  const isDisabled = !selectedPrincipalId || isSubmitting; // Update condition
```

**Step 4: Update form controls to use isDisabled**

```typescript
// src/atomic-crm/dashboard/v2/components/QuickLogger.tsx:285-292
<Button
  data-testid="quick-logger-submit"
  type="submit"
  className="w-full bg-primary text-primary-foreground h-11"
  disabled={isDisabled}
>
  {isSubmitting ? 'Logging...' : 'Log Activity'}
</Button>
```

**Step 5: Run test to verify it passes**

Run: `npm test -- src/atomic-crm/dashboard/v2/components/__tests__/QuickLogger.test.tsx`
Expected: PASS - Button disabled during submission

**Step 6: Commit**

```bash
git add src/atomic-crm/dashboard/v2/components/QuickLogger.tsx src/atomic-crm/dashboard/v2/components/__tests__/QuickLogger.test.tsx
git commit -m "feat(dashboard-v2): add loading state to QuickLogger

- Add isSubmitting state to prevent double-submit
- Disable all form controls during submission
- Show 'Logging...' text on submit button
- Add unit test for loading state

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 7: Remove or Wire groupByCustomer Toggle

**Files:**
- Modify: `src/atomic-crm/dashboard/v2/components/FiltersSidebar.tsx:260-273`
- Modify: `src/atomic-crm/dashboard/v2/types.ts:80-87`

**Step 1: Decide on approach and write test**

Decision: Remove the toggle since grouping by customer is always enabled and not a filter.

```typescript
// src/atomic-crm/dashboard/v2/components/__tests__/FiltersSidebar.test.tsx (new file)
import { render, screen } from '@testing-library/react';
import { FiltersSidebar } from '../FiltersSidebar';
import type { FilterState } from '../../types';

describe('FiltersSidebar', () => {
  const mockFilters: FilterState = {
    health: [],
    stages: [],
    assignee: null,
    lastTouch: 'any',
    showClosed: false,
  };

  it('should not render group by customer toggle', () => {
    render(
      <FiltersSidebar
        filters={mockFilters}
        onFiltersChange={vi.fn()}
        onClearFilters={vi.fn()}
        activeCount={0}
        onToggle={vi.fn()}
      />
    );

    expect(screen.queryByLabelText(/Group opportunities by customer/)).not.toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/atomic-crm/dashboard/v2/components/__tests__/FiltersSidebar.test.tsx`
Expected: FAIL - Toggle currently exists

**Step 3: Remove groupByCustomer from FilterState type**

```typescript
// src/atomic-crm/dashboard/v2/types.ts:80-86
export interface FilterState {
  health: ('active' | 'cooling' | 'at_risk')[];
  stages: string[];
  assignee: 'me' | 'team' | string | null;
  lastTouch: '7d' | '14d' | 'any';
  showClosed: boolean;
  // REMOVED: groupByCustomer: boolean;
}
```

**Step 4: Remove toggle from FiltersSidebar**

```typescript
// src/atomic-crm/dashboard/v2/components/FiltersSidebar.tsx:244-274
{/* Utilities - compact */}
<div className="space-y-2">
  <h3 className="text-foreground font-semibold text-xs">Utilities</h3>
  <div className="space-y-1">
    <div className="flex items-center min-h-8">
      <Checkbox
        id="show-closed"
        checked={filters.showClosed}
        onCheckedChange={(checked) =>
          onFiltersChange({ ...filters, showClosed: !!checked })
        }
        className="h-4 w-4"
      />
      <Label htmlFor="show-closed" className="ml-2 cursor-pointer flex-1 text-xs">
        Show closed opportunities
      </Label>
    </div>
    {/* REMOVED: Group opportunities by customer toggle */}
  </div>
</div>
```

**Step 5: Update PrincipalDashboardV2 filter initialization**

```typescript
// src/atomic-crm/dashboard/v2/PrincipalDashboardV2.tsx:41-49
const [filterState, setFilterState] = usePrefs<FilterState>('filters', {
  health: [],
  stages: [],
  assignee: null,
  lastTouch: 'any',
  showClosed: false,
  // REMOVED: groupByCustomer: true,
});
```

**Step 6: Update handleClearFilters**

```typescript
// src/atomic-crm/dashboard/v2/PrincipalDashboardV2.tsx:72-81
const handleClearFilters = useCallback(() => {
  setFilterState({
    health: [],
    stages: [],
    assignee: null,
    lastTouch: 'any',
    showClosed: false,
    // REMOVED: groupByCustomer reference
  });
}, [setFilterState]);
```

**Step 7: Run test to verify it passes**

Run: `npm test -- src/atomic-crm/dashboard/v2/components/__tests__/FiltersSidebar.test.tsx`
Expected: PASS - Toggle not in document

**Step 8: Run TypeScript check**

Run: `npm run type-check`
Expected: PASS - No type errors

**Step 9: Commit**

```bash
git add src/atomic-crm/dashboard/v2/types.ts src/atomic-crm/dashboard/v2/components/FiltersSidebar.tsx src/atomic-crm/dashboard/v2/PrincipalDashboardV2.tsx src/atomic-crm/dashboard/v2/components/__tests__/FiltersSidebar.test.tsx
git commit -m "refactor(dashboard-v2): remove unused groupByCustomer filter

- Remove groupByCustomer from FilterState type
- Remove toggle from FiltersSidebar Utilities section
- Opportunities always grouped by customer (not a filter)
- Add test documenting removal
- Prevents misleading UI control

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 8: Add ARIA Attributes to Opportunities Tree

**Files:**
- Modify: `src/atomic-crm/dashboard/v2/components/OpportunitiesHierarchy.tsx:250-333`

**Step 1: Write accessibility test**

```typescript
// src/atomic-crm/dashboard/v2/components/__tests__/OpportunitiesHierarchy.test.tsx (append)
describe('OpportunitiesHierarchy - Accessibility', () => {
  it('should have proper ARIA tree structure', async () => {
    const mockOpportunities = [
      {
        opportunity_id: 1,
        opportunity_name: 'Deal 1',
        customer_organization_id: 10,
        customer_name: 'Customer A',
        stage: 'qualification',
        health_status: 'active' as const,
        last_activity: '2024-01-01',
        days_since_activity: 5,
      },
    ];

    render(
      <AdminContext>
        <PrincipalProvider>
          <OpportunitiesHierarchy
            filters={{ health: [], stages: [], assignee: null, lastTouch: 'any', showClosed: false }}
            onOpportunityClick={vi.fn()}
          />
        </PrincipalProvider>
      </AdminContext>
    );

    // Wait for data
    await waitFor(() => {
      expect(screen.getByRole('tree')).toBeInTheDocument();
    });

    // Check customer node ARIA
    const customerNode = screen.getByRole('treeitem', { name: /Customer A/ });
    expect(customerNode).toHaveAttribute('aria-expanded');
    expect(customerNode).toHaveAttribute('aria-level', '1');
    expect(customerNode).toHaveAttribute('aria-setsize');
    expect(customerNode).toHaveAttribute('aria-posinset');

    // Check opportunity node ARIA
    const oppNode = screen.getByRole('treeitem', { name: /Deal 1/ });
    expect(oppNode).toHaveAttribute('aria-level', '2');
    expect(oppNode).toHaveAttribute('aria-setsize');
    expect(oppNode).toHaveAttribute('aria-posinset');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/atomic-crm/dashboard/v2/components/__tests__/OpportunitiesHierarchy.test.tsx`
Expected: FAIL - Missing ARIA attributes

**Step 3: Add ARIA attributes to customer nodes**

```typescript
// src/atomic-crm/dashboard/v2/components/OpportunitiesHierarchy.tsx:257-285
{customerGroups.map((group, groupIndex) => {
  const isExpanded = expandedCustomers.has(group.customerId);

  return (
    <div key={group.customerId}>
      {/* Customer Header Row */}
      <div
        role="treeitem"
        aria-expanded={isExpanded}
        aria-level={1}
        aria-setsize={customerGroups.length}
        aria-posinset={groupIndex + 1}
        aria-selected={false}
        tabIndex={0}
        className="h-11 px-3 flex items-center gap-2 border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
        onClick={() => toggleCustomer(group.customerId)}
        onKeyDown={(e) => handleKeyDown(e, group.customerId)}
      >
        <ChevronRight
          className="size-4 text-muted-foreground transition-transform shrink-0"
          style={{
            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
          aria-hidden="true"
        />
        <span className="text-foreground font-medium truncate">
          {group.customerName}
        </span>
        <Badge variant="secondary" className="ml-auto shrink-0">
          {group.opportunities.length}
        </Badge>
      </div>
```

**Step 4: Add ARIA attributes to opportunity nodes**

```typescript
// src/atomic-crm/dashboard/v2/components/OpportunitiesHierarchy.tsx:287-327
{/* Opportunity Rows (Children) */}
{isExpanded &&
  group.opportunities.map((opp, oppIndex) => (
    <div
      key={opp.opportunity_id}
      role="treeitem"
      aria-level={2}
      aria-setsize={group.opportunities.length}
      aria-posinset={oppIndex + 1}
      aria-selected={false}
      tabIndex={0}
      className="h-11 px-6 flex items-center gap-3 border-b border-border hover:bg-muted/30 cursor-pointer transition-colors"
      onClick={() => onOpportunityClick(opp.opportunity_id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpportunityClick(opp.opportunity_id);
        }
      }}
    >
      {/* Health Dot */}
      <div
        className={`w-2.5 h-2.5 rounded-full shrink-0 ${getHealthDotColor(opp.health_status)}`}
        aria-label={`Health: ${opp.health_status}`}
      />

      {/* Opportunity Name */}
      <span className="text-foreground truncate flex-1">
        {opp.opportunity_name}
      </span>

      {/* Stage Badge */}
      <Badge variant="outline" className="shrink-0 text-xs">
        {getOpportunityStageLabel(opp.stage)}
      </Badge>

      {/* Estimated Close Date */}
      {opp.estimated_close_date && (
        <span className="text-muted-foreground text-sm shrink-0 hidden md:inline">
          {formatDate(opp.estimated_close_date)}
        </span>
      )}
    </div>
  ))}
```

**Step 5: Run test to verify it passes**

Run: `npm test -- src/atomic-crm/dashboard/v2/components/__tests__/OpportunitiesHierarchy.test.tsx`
Expected: PASS - All ARIA attributes present

**Step 6: Run accessibility E2E test**

```typescript
// tests/e2e/dashboard-v2-accessibility.spec.ts (new file)
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Dashboard V2 - Accessibility', () => {
  test('should have no accessibility violations', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');

    await page.goto('/?layout=v2');
    await page.click('[data-testid="principal-select-trigger"]');
    await page.click('text="MFB Family Brands"');
    await page.waitForTimeout(1000);

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
```

Run: `npm run test:e2e tests/e2e/dashboard-v2-accessibility.spec.ts`
Expected: PASS - No accessibility violations

**Step 7: Commit**

```bash
git add src/atomic-crm/dashboard/v2/components/OpportunitiesHierarchy.tsx src/atomic-crm/dashboard/v2/components/__tests__/OpportunitiesHierarchy.test.tsx tests/e2e/dashboard-v2-accessibility.spec.ts
git commit -m "feat(dashboard-v2): add ARIA tree attributes to opportunities

- Add aria-level (1 for customers, 2 for opportunities)
- Add aria-setsize and aria-posinset for position in set
- Add aria-expanded for customer nodes
- Add aria-selected to all tree items
- Add unit test for ARIA structure
- Add E2E accessibility scan with axe-core

Ensures screen readers properly announce tree hierarchy

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Phase 2: Responsive Design & Browser Compatibility (P2)

### Task 9: Add SSR Guard to useFeatureFlag

**Files:**
- Modify: `src/atomic-crm/dashboard/v2/hooks/useFeatureFlag.ts:10-15`

**Step 1: Write test for SSR safety**

```typescript
// src/atomic-crm/dashboard/v2/hooks/__tests__/useFeatureFlag.test.ts (new file)
import { renderHook } from '@testing-library/react';
import { useFeatureFlag } from '../useFeatureFlag';

describe('useFeatureFlag', () => {
  it('should return false when window is undefined (SSR)', () => {
    // Mock SSR environment
    const originalWindow = global.window;
    // @ts-ignore
    delete global.window;

    const { result } = renderHook(() => useFeatureFlag());

    expect(result.current).toBe(false);

    // Restore
    global.window = originalWindow;
  });

  it('should return true when layout=v2 in query string', () => {
    // Mock window.location
    delete (window as any).location;
    window.location = { search: '?layout=v2' } as any;

    const { result } = renderHook(() => useFeatureFlag());

    expect(result.current).toBe(true);
  });

  it('should return false when layout is not v2', () => {
    delete (window as any).location;
    window.location = { search: '' } as any;

    const { result } = renderHook(() => useFeatureFlag());

    expect(result.current).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/atomic-crm/dashboard/v2/hooks/__tests__/useFeatureFlag.test.ts`
Expected: FAIL - Crashes when window undefined

**Step 3: Add SSR guard**

```typescript
// src/atomic-crm/dashboard/v2/hooks/useFeatureFlag.ts
import { useMemo } from "react";

/**
 * Feature flag hook for dashboard v2 layout
 *
 * Detects ?layout=v2 query parameter in URL
 * Safe for SSR environments (returns false when window undefined)
 *
 * @returns true if layout=v2 is present, false otherwise
 */
export function useFeatureFlag(): boolean {
  return useMemo(() => {
    // SSR guard: return false if window is undefined
    if (typeof window === 'undefined') {
      return false;
    }

    const params = new URLSearchParams(window.location.search);
    return params.get("layout") === "v2";
  }, []);
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/atomic-crm/dashboard/v2/hooks/__tests__/useFeatureFlag.test.ts`
Expected: PASS - All tests pass including SSR case

**Step 5: Commit**

```bash
git add src/atomic-crm/dashboard/v2/hooks/useFeatureFlag.ts src/atomic-crm/dashboard/v2/hooks/__tests__/useFeatureFlag.test.ts
git commit -m "fix(dashboard-v2): add SSR guard to useFeatureFlag

- Check typeof window !== 'undefined' before accessing
- Return false in SSR environments
- Add unit tests for SSR and browser cases
- Prevents runtime errors in test/SSR environments

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 10: Add aria-expanded to Later Bucket Toggle

**Files:**
- Modify: `src/atomic-crm/dashboard/v2/components/TasksPanel.tsx:214-246`

**Step 1: Write accessibility test**

```typescript
// src/atomic-crm/dashboard/v2/components/__tests__/TasksPanel.test.tsx (new file)
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TasksPanel } from '../TasksPanel';
import { PrincipalProvider } from '../../context/PrincipalContext';
import { AdminContext } from 'react-admin';

describe('TasksPanel - Later Bucket', () => {
  it('should have aria-expanded on Later bucket toggle', async () => {
    render(
      <AdminContext>
        <PrincipalProvider>
          <TasksPanel assignee={null} currentUserId="123" />
        </PrincipalProvider>
      </AdminContext>
    );

    await waitFor(() => {
      const laterButton = screen.getByRole('button', { name: /Later/ });
      expect(laterButton).toHaveAttribute('aria-expanded');
    });
  });

  it('should toggle aria-expanded when clicked', async () => {
    const user = userEvent.setup();

    render(
      <AdminContext>
        <PrincipalProvider>
          <TasksPanel assignee={null} currentUserId="123" />
        </PrincipalProvider>
      </AdminContext>
    );

    const laterButton = await screen.findByRole('button', { name: /Later/ });

    // Initially collapsed
    expect(laterButton).toHaveAttribute('aria-expanded', 'false');

    // Click to expand
    await user.click(laterButton);

    // Should be expanded
    expect(laterButton).toHaveAttribute('aria-expanded', 'true');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/atomic-crm/dashboard/v2/components/__tests__/TasksPanel.test.tsx`
Expected: FAIL - Missing aria-expanded

**Step 3: Add aria-expanded and aria-controls**

```typescript
// src/atomic-crm/dashboard/v2/components/TasksPanel.tsx:214-246
return (
  <div key={group.key}>
    <button
      onClick={() => {
        if (isLaterGroup) {
          setLaterExpanded(!laterExpanded);
          if (!laterExpanded) {
            setLaterPage(1);
          }
        }
      }}
      className="h-11 px-3 w-full bg-muted/50 font-semibold text-sm flex items-center justify-between hover:bg-muted/70 transition-colors"
      aria-label={
        isLaterGroup
          ? `${group.label} (${group.tasks.length} tasks) - ${laterExpanded ? 'Collapse' : 'Expand'}`
          : group.label
      }
      aria-expanded={isLaterGroup ? laterExpanded : undefined}
      aria-controls={isLaterGroup ? `later-tasks-${group.key}` : undefined}
      disabled={!isLaterGroup}
    >
      <span className="flex items-center gap-2">
        {group.label}
        {group.key === 'overdue' && (
          <Badge className="bg-destructive text-destructive-foreground">
            {group.tasks.length}
          </Badge>
        )}
        {isLaterGroup && (
          <span className="text-muted-foreground font-normal">
            ({group.tasks.length} tasks)
          </span>
        )}
      </span>
    </button>

    <div
      id={isLaterGroup ? `later-tasks-${group.key}` : undefined}
      role={isLaterGroup ? 'region' : undefined}
      aria-hidden={isLaterGroup ? !laterExpanded : undefined}
    >
      {tasksToShow.map((task) => (
        <div
          key={task.task_id}
          className="h-11 px-3 hover:bg-muted/30 flex items-center gap-3 border-b border-border/50"
          role="listitem"
        >
          <button
            onClick={() => handleComplete(task.task_id)}
            className="shrink-0 h-11 w-11 flex items-center justify-center -ml-1"
            aria-label={`Mark "${task.task_title}" as complete`}
          >
            <Checkbox checked={false} className="h-5 w-5" />
          </button>

          <span className="flex-1 text-sm truncate">{task.task_title}</span>

          {grouping !== 'priority' && (
            <span
              className={`px-2 py-0.5 text-xs font-medium rounded ${getPriorityBadgeClass(task.priority)}`}
            >
              {PRIORITY_LABELS[task.priority]}
            </span>
          )}
        </div>
      ))}
    </div>

    {isLaterGroup && laterExpanded && hasMoreTasks && (
      <div className="h-11 px-3 flex items-center">
        <button
          onClick={() => setLaterPage(laterPage + 1)}
          className="text-sm text-primary hover:underline"
          aria-label="Show next 10 tasks"
        >
          Show next 10
        </button>
      </div>
    )}
  </div>
);
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/atomic-crm/dashboard/v2/components/__tests__/TasksPanel.test.tsx`
Expected: PASS - aria-expanded present and toggles correctly

**Step 5: Commit**

```bash
git add src/atomic-crm/dashboard/v2/components/TasksPanel.tsx src/atomic-crm/dashboard/v2/components/__tests__/TasksPanel.test.tsx
git commit -m "feat(dashboard-v2): add ARIA attributes to Later bucket

- Add aria-expanded to Later bucket toggle button
- Add aria-controls pointing to tasks container
- Add aria-hidden to tasks container
- Add role=region to expandable section
- Add unit tests for ARIA toggle behavior

Improves screen reader navigation for collapsible tasks

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Phase 3: Testing Coverage (P1)

### Task 11: Add Unit Tests for Remaining Components

**Files:**
- Create: `src/atomic-crm/dashboard/v2/components/__tests__/RightSlideOver.test.tsx`
- Create: `src/atomic-crm/dashboard/v2/components/__tests__/DashboardHeader.test.tsx` (expand)
- Create: `src/atomic-crm/dashboard/v2/__tests__/PrincipalDashboardV2.test.tsx`

**Step 1: Write RightSlideOver tests**

```typescript
// src/atomic-crm/dashboard/v2/components/__tests__/RightSlideOver.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RightSlideOver } from '../RightSlideOver';
import { AdminContext } from 'react-admin';

describe('RightSlideOver', () => {
  const mockOnClose = vi.fn();

  it('should show empty state when no opportunity selected', () => {
    render(
      <AdminContext>
        <RightSlideOver isOpen={true} onClose={mockOnClose} opportunityId={null} />
      </AdminContext>
    );

    expect(screen.getByText('Select an opportunity to view details')).toBeInTheDocument();
  });

  it('should load and display opportunity details', async () => {
    render(
      <AdminContext>
        <RightSlideOver isOpen={true} onClose={mockOnClose} opportunityId={123} />
      </AdminContext>
    );

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('should switch between tabs', async () => {
    const user = userEvent.setup();

    render(
      <AdminContext>
        <RightSlideOver isOpen={true} onClose={mockOnClose} opportunityId={123} />
      </AdminContext>
    );

    // Click History tab
    const historyTab = await screen.findByRole('tab', { name: /History/ });
    await user.click(historyTab);

    // Verify tab is active
    expect(historyTab).toHaveAttribute('data-state', 'active');
  });

  it('should call onClose when Escape pressed', async () => {
    render(
      <AdminContext>
        <RightSlideOver isOpen={true} onClose={mockOnClose} opportunityId={123} />
      </AdminContext>
    );

    const sheet = await screen.findByRole('dialog');

    // Press Escape
    await userEvent.keyboard('{Escape}');

    // Verify onClose called
    expect(mockOnClose).toHaveBeenCalled();
  });
});
```

**Step 2: Run tests**

Run: `npm test -- src/atomic-crm/dashboard/v2/components/__tests__/RightSlideOver.test.tsx`
Expected: PASS - All tests pass

**Step 3: Write PrincipalDashboardV2 integration tests**

```typescript
// src/atomic-crm/dashboard/v2/__tests__/PrincipalDashboardV2.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PrincipalDashboardV2 } from '../PrincipalDashboardV2';
import { AdminContext } from 'react-admin';

describe('PrincipalDashboardV2', () => {
  it('should render 3-column layout', () => {
    render(
      <AdminContext>
        <PrincipalDashboardV2 />
      </AdminContext>
    );

    expect(screen.getByTestId('filters-sidebar')).toBeInTheDocument();
    expect(screen.getByRole('tree', { name: /Opportunities/ })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: /Tasks/ })).toBeInTheDocument();
    expect(screen.getByTestId('quick-logger-card')).toBeInTheDocument();
  });

  it('should toggle sidebar visibility', async () => {
    const user = userEvent.setup();

    render(
      <AdminContext>
        <PrincipalDashboardV2 />
      </AdminContext>
    );

    const sidebar = screen.getByTestId('filters-sidebar');

    // Initially visible
    expect(sidebar).toHaveAttribute('aria-hidden', 'false');

    // Click collapse button
    const collapseButton = screen.getByLabelText('Collapse filters sidebar');
    await user.click(collapseButton);

    // Should be hidden
    expect(sidebar).toHaveAttribute('aria-hidden', 'true');

    // Click rail to reopen
    const railButton = screen.getByLabelText('Open filters sidebar');
    await user.click(railButton);

    // Should be visible again
    expect(sidebar).toHaveAttribute('aria-hidden', 'false');
  });

  it('should handle keyboard shortcuts', async () => {
    render(
      <AdminContext>
        <PrincipalDashboardV2 />
      </AdminContext>
    );

    // Press '1' to scroll to opportunities
    await userEvent.keyboard('1');

    // Verify scroll behavior (column should have smooth scroll)
    const oppColumn = screen.getByRole('tree');
    expect(oppColumn).toHaveAttribute('id', 'col-opportunities');
  });
});
```

**Step 4: Run tests**

Run: `npm test -- src/atomic-crm/dashboard/v2/__tests__/PrincipalDashboardV2.test.tsx`
Expected: PASS - All tests pass

**Step 5: Check overall coverage**

Run: `npm run test:coverage -- src/atomic-crm/dashboard/v2/`
Expected: Coverage ≥ 70% for all files

**Step 6: Commit**

```bash
git add src/atomic-crm/dashboard/v2/components/__tests__/RightSlideOver.test.tsx src/atomic-crm/dashboard/v2/__tests__/PrincipalDashboardV2.test.tsx
git commit -m "test(dashboard-v2): add comprehensive unit test coverage

- Add RightSlideOver tests (empty state, tab switching, Escape)
- Add PrincipalDashboardV2 integration tests (layout, sidebar, shortcuts)
- Achieve 70%+ coverage across all dashboard components
- Ensures stability for future refactoring

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Phase 4: Documentation & Polish (P2)

### Task 12: Update Dashboard V2 Documentation

**Files:**
- Modify: `docs/dashboard-v2-migration.md` (update keyboard shortcuts section)
- Create: `docs/development/dashboard-v2-testing.md`

**Step 1: Update keyboard shortcuts documentation**

```markdown
<!-- docs/dashboard-v2-migration.md -->

## Keyboard Shortcuts

Dashboard V2 includes power-user keyboard shortcuts for efficient navigation:

| Key | Action | Description |
|-----|--------|-------------|
| `1` | Scroll to Opportunities | Smooth scroll to opportunities column |
| `2` | Scroll to Tasks | Smooth scroll to tasks column |
| `3` | Scroll to Quick Logger | Smooth scroll to logger column |
| `H` | Open History Tab | Opens slide-over on History tab (when opportunity selected) |
| `Esc` | Close Slide-Over | Closes the right slide-over panel |

**Notes:**
- Shortcuts are disabled when typing in input/textarea fields
- Shortcuts work globally across the dashboard
- `H` shortcut only works when an opportunity is selected

**Removed in Latest Version:**
- `/` (global search) - Search feature not yet implemented, shortcut removed to prevent confusion
```

**Step 2: Create testing documentation**

```markdown
<!-- docs/development/dashboard-v2-testing.md -->

# Dashboard V2 Testing Guide

## Overview

Dashboard V2 has comprehensive test coverage across unit, integration, and E2E tests to ensure stability and accessibility.

## Test Structure

```
src/atomic-crm/dashboard/v2/
├── __tests__/
│   └── PrincipalDashboardV2.test.tsx        # Integration tests
├── components/__tests__/
│   ├── DashboardHeader.test.tsx             # Unit tests
│   ├── FiltersSidebar.test.tsx
│   ├── OpportunitiesHierarchy.test.tsx
│   ├── TasksPanel.test.tsx
│   ├── QuickLogger.test.tsx
│   └── RightSlideOver.test.tsx
├── context/__tests__/
│   └── PrincipalContext.test.tsx
└── hooks/__tests__/
    └── useFeatureFlag.test.tsx

tests/e2e/
├── dashboard-v2.spec.ts                      # E2E smoke tests
├── dashboard-v2-tasks.spec.ts                # Task completion flow
├── dashboard-v2-slide-over.spec.ts           # Slide-over interactions
├── dashboard-v2-navigation.spec.ts           # New menu navigation
└── dashboard-v2-accessibility.spec.ts        # Axe accessibility scan
```

## Running Tests

**Unit Tests (Vitest):**
```bash
# Run all dashboard v2 unit tests
npm test -- src/atomic-crm/dashboard/v2/

# Run specific component tests
npm test -- OpportunitiesHierarchy.test.tsx

# Run with coverage
npm run test:coverage -- src/atomic-crm/dashboard/v2/
```

**E2E Tests (Playwright):**
```bash
# Run all dashboard v2 E2E tests
npm run test:e2e tests/e2e/dashboard-v2*.spec.ts

# Run specific test file
npm run test:e2e tests/e2e/dashboard-v2-tasks.spec.ts

# Run in UI mode (interactive debugging)
npm run test:e2e:ui
```

## Test Coverage Goals

- **Unit Tests:** ≥70% coverage for all components
- **Integration Tests:** Core user journeys (principal selection, filtering, task completion)
- **E2E Tests:** Critical paths (navigation, data refresh, accessibility)
- **Accessibility:** Zero Axe violations on all pages

## Key Testing Patterns

### 1. React Admin Context Wrapper

All component tests require `AdminContext` and `PrincipalProvider`:

```typescript
render(
  <AdminContext>
    <PrincipalProvider>
      <YourComponent />
    </PrincipalProvider>
  </AdminContext>
);
```

### 2. Data Fetching (useGetList)

Mock React Admin hooks for data fetching tests:

```typescript
vi.mock('react-admin', () => ({
  useGetList: vi.fn(() => ({
    data: mockData,
    isLoading: false,
    error: null,
  })),
}));
```

### 3. User Events

Use `@testing-library/user-event` for realistic interactions:

```typescript
const user = userEvent.setup();
await user.click(screen.getByRole('button'));
await user.type(screen.getByLabelText('Subject'), 'Test');
```

### 4. Accessibility Tests

Use `@axe-core/playwright` for automated a11y scans:

```typescript
const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
expect(accessibilityScanResults.violations).toEqual([]);
```

## Common Issues

### Issue: Tests fail with "window is not defined"

**Solution:** Add SSR guard to hooks:
```typescript
if (typeof window === 'undefined') return false;
```

### Issue: E2E tests timeout waiting for data

**Solution:** Increase timeout or add explicit wait:
```typescript
await page.waitForTimeout(1000); // Wait for data load
```

### Issue: React Admin hooks not mocked

**Solution:** Mock the entire module:
```typescript
vi.mock('react-admin', () => ({
  useGetList: vi.fn(),
  useUpdate: vi.fn(),
  useNotify: vi.fn(),
  // ... etc
}));
```

## CI/CD Integration

Tests run automatically on:
- Every push to `main`
- Every pull request
- Manual workflow dispatch

**Minimum Requirements:**
- All unit tests must pass
- All E2E tests must pass
- Coverage ≥70%
- Zero accessibility violations

## References

- [Testing Quick Reference](./testing-quick-reference.md)
- [Playwright MCP Guide](./playwright-mcp-guide.md)
- [React Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro/)
```

**Step 3: Commit documentation**

```bash
git add docs/dashboard-v2-migration.md docs/development/dashboard-v2-testing.md
git commit -m "docs(dashboard-v2): update keyboard shortcuts and add testing guide

- Remove '/' shortcut from documentation (search not implemented)
- Add comprehensive testing guide with examples
- Document test structure and coverage goals
- Add common issues and solutions

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Verification & Launch Checklist

### Final Verification Steps

**Step 1: Run full test suite**

```bash
# Unit tests with coverage
npm run test:coverage

# E2E tests
npm run test:e2e

# Type check
npm run type-check

# Lint
npm run lint
```

Expected: All pass with no errors

**Step 2: Manual QA checklist**

```markdown
- [ ] Principal selection persists across page refresh
- [ ] Task completion removes task from list immediately
- [ ] Stage change updates slide-over and opportunities list
- [ ] New menu navigates to correct create pages with pre-filled data
- [ ] QuickLogger shows loading state during submission
- [ ] Sidebar collapse/expand works with rail toggle
- [ ] Later tasks bucket expands/collapses properly
- [ ] All keyboard shortcuts work (1, 2, 3, H, Esc)
- [ ] Screen reader announces tree hierarchy correctly
- [ ] No console errors or warnings
```

**Step 3: Accessibility scan**

```bash
npm run test:e2e tests/e2e/dashboard-v2-accessibility.spec.ts
```

Expected: Zero violations

**Step 4: Performance check**

```markdown
- [ ] Opportunities column renders <500 items smoothly
- [ ] Tasks column renders <500 items smoothly
- [ ] Filters apply instantly (<100ms)
- [ ] No unnecessary re-renders on filter changes
- [ ] Slide-over opens/closes smoothly
```

**Step 5: Update CLAUDE.md**

Add to recent changes:
```markdown
- **Dashboard V2 Polish (2025-11-16)**: Production-ready improvements - Task/opportunity data refetch, principal persistence, navigation wiring, ARIA tree attributes, loading states, 70%+ test coverage. Keyboard shortcuts: 1/2/3 (scroll), H (history), Esc (close). All E2E and accessibility tests passing.
```

---

## Success Criteria

✅ **Functionality:**
- All TODO handlers replaced with working navigation
- Data refreshes immediately after mutations
- Principal selection persists across sessions
- Loading states prevent double-submit

✅ **Accessibility:**
- ARIA tree attributes on opportunities hierarchy
- aria-expanded on collapsible sections
- Zero Axe violations
- Keyboard navigation works across all components

✅ **Testing:**
- 70%+ unit test coverage
- E2E tests for critical paths
- Accessibility scans passing
- SSR-safe hooks (no window crashes)

✅ **Documentation:**
- Keyboard shortcuts documented accurately
- Testing guide complete with examples
- CLAUDE.md updated with recent changes

---

## Known Limitations (Future Work)

**Phase 2 Items (Not Blocking Launch):**
1. Responsive breakpoints for tablets <1024px
2. Slide-over responsive sizing for small screens
3. Header controls wrapping on narrow viewports
4. Virtualization for >500 opportunities/tasks
5. Server-side filtering for performance
6. Replace "Files" tab placeholder with real attachments

**Phase 3 Items (Nice-to-Have):**
1. Global search implementation
2. Saved filter views
3. More granular keyboard shortcuts
4. Advanced task sorting options

These can be addressed in future iterations based on user feedback.
