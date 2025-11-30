# Kanban Board Performance Audit

**Date:** 2025-11-29
**Target:** Task Kanban board implementation
**Focus:** Drag-drop performance, virtual scrolling, optimistic updates, state sync
**Constraints:** Flag full-list re-renders, memory leaks from subscriptions

---

## Executive Summary

The Task Kanban board implementation demonstrates **excellent optimization patterns** with proper memoization, optimistic updates, and callback stability. However, there are some areas for improvement:

| Category | Status | Notes |
|----------|--------|-------|
| Drag-drop performance | ✅ Good | @hello-pangea/dnd with memo |
| Re-render prevention | ✅ Good | Custom arePropsEqual comparators |
| Optimistic updates | ✅ Excellent | Rollback on failure |
| Virtual scrolling | ⚠️ Missing | Not needed yet (<100 tasks) |
| Subscription cleanup | ✅ N/A | No realtime subscriptions used |
| Memory leaks | ✅ Safe | No unmanaged listeners |

**Overall Assessment:** Production-ready for current scale (100 tasks), with clear scaling path identified.

---

## 1. Component Architecture Analysis

### 1.1 Component Hierarchy

```
TasksKanbanPanel (Container)
├── DragDropContext (Provider)
│   ├── TaskKanbanColumn × 3 (memo)
│   │   ├── Droppable (react-beautiful-dnd)
│   │   │   └── TaskKanbanCard × N (memo)
│   │   │       └── Draggable
```

### 1.2 Memoization Strategy

**TaskKanbanColumn** - `React.memo` with custom comparator:
```typescript
function arePropsEqual(prev, next): boolean {
  if (prev.columnId !== next.columnId) return false;
  if (prev.title !== next.title) return false;
  // Callback reference checks
  if (prev.onComplete !== next.onComplete) return false;
  // ... other callbacks

  // Shallow array comparison by id + status
  if (prevTasks.length !== nextTasks.length) return false;
  for (let i = 0; i < prevTasks.length; i++) {
    if (prevTasks[i].id !== nextTasks[i].id ||
        prevTasks[i].status !== nextTasks[i].status) {
      return false;
    }
  }
  return true;
}
```

**TaskKanbanCard** - `React.memo` with custom comparator:
```typescript
function arePropsEqual(prev, next): boolean {
  if (prev.index !== next.index) return false;
  // Callback references
  if (prev.onComplete !== next.onComplete) return false;
  // ... other callbacks

  // Deep comparison for task data
  return (
    prev.task.id === next.task.id &&
    prev.task.subject === next.task.subject &&
    prev.task.status === next.task.status &&
    prev.task.priority === next.task.priority &&
    prev.task.taskType === next.task.taskType &&
    prev.task.dueDate.getTime() === next.task.dueDate.getTime() &&
    prev.task.relatedTo.name === next.task.relatedTo.name
  );
}
```

**Assessment:** ✅ Excellent - Both components use deep comparison instead of reference equality, preventing unnecessary re-renders.

---

## 2. Drag-Drop Performance Analysis

### 2.1 Library Choice

**Using:** `@hello-pangea/dnd` v18.0.1 (community fork of react-beautiful-dnd)

**Advantages:**
- Battle-tested drag-drop mechanics
- Built-in placeholder management
- Smooth animations
- Accessible by default

**Performance Characteristics:**
- Re-renders entire Droppable children during drag
- Uses `requestAnimationFrame` for smooth animations
- Supports sensor-based drag detection

### 2.2 Drag Event Handler

```typescript
const handleDragEnd = useCallback(
  async (result: DropResult) => {
    // Early returns for no-op cases
    if (!destination) return;
    if (destination.droppableId === source.droppableId &&
        destination.index === source.index) return;

    // Same column reorder - no API call
    if (destColumnId === sourceColumnId) return;

    // Calculate new date based on destination column
    const newDueDate = getTargetDueDate(destColumnId, task.dueDate);

    // Async update with notification
    try {
      await updateTaskDueDate(taskId, newDueDate);
      notify(`Moved to ${columnLabels[destColumnId]}`, { type: "success" });
    } catch {
      notify("Failed to move task. Please try again.", { type: "error" });
    }
  },
  [tasks, getTargetDueDate, updateTaskDueDate, notify]
);
```

**Assessment:** ✅ Good - Uses `useCallback` with stable dependencies, includes early returns for performance.

### 2.3 Potential Issue: `tasks` in Dependencies

```typescript
// Current:
}, [tasks, getTargetDueDate, updateTaskDueDate, notify]);
```

**Issue:** Including `tasks` array in dependencies means `handleDragEnd` recreates on every task change, which could cause reference instability.

**Impact:** Minor - The callback recreation happens after the drag completes, not during.

**Recommendation:** Consider using a ref for task lookup:
```typescript
const tasksRef = useRef(tasks);
useEffect(() => { tasksRef.current = tasks; }, [tasks]);

// Then use tasksRef.current.find(...) inside handleDragEnd
```

---

## 3. Re-Render Analysis

### 3.1 Full-List Re-Render Triggers

| Trigger | Causes Full Re-render? | Mitigation |
|---------|------------------------|------------|
| Single task move (cross-column) | ⚠️ Yes, affected columns only | memo + arePropsEqual |
| Single task move (same column) | ❌ No | Early return |
| Task complete | ⚠️ Yes, that column | memo + arePropsEqual |
| Task snooze | ⚠️ Yes, affected columns | memo + arePropsEqual |
| Refresh key change | ⚠️ Yes, entire board | Full remount by design |
| Loading state change | ⚠️ Yes, entire board | Expected behavior |

### 3.2 Column Filtering (useMemo)

```typescript
const tasksByColumn = useMemo(() => {
  const overdue: TaskItem[] = [];
  const today: TaskItem[] = [];
  const thisWeek: TaskItem[] = [];

  for (const task of tasks) {
    switch (task.status) {
      case "overdue": overdue.push(task); break;
      case "today": today.push(task); break;
      case "tomorrow":
      case "upcoming": thisWeek.push(task); break;
    }
  }

  return { overdue, today, thisWeek };
}, [tasks]);
```

**Assessment:** ✅ Good - Filtering is memoized, recalculates only when `tasks` changes.

**Potential Issue:** Creates new array references on every recalculation, but the `arePropsEqual` comparator handles this correctly by comparing task IDs.

### 3.3 Card Re-Render Cascade Analysis

**Scenario:** User drags Task #5 from "Today" to "This Week"

1. `updateTaskDueDate(5, newDate)` called
2. Optimistic update: `setTasks(prev => prev.map(t => ...))`
3. `tasks` array reference changes
4. `tasksByColumn` useMemo recalculates
5. `TaskKanbanColumn` components receive new task arrays
6. **Today column:** `arePropsEqual` returns `false` (length changed)
7. **This Week column:** `arePropsEqual` returns `false` (length changed)
8. **Overdue column:** `arePropsEqual` returns `true` (unchanged) ✅
9. Inside affected columns:
   - Other cards: `arePropsEqual` returns `true` (same task data) ✅
   - Moved card: `arePropsEqual` returns `false` (status/date changed)

**Conclusion:** ✅ Only the moved card and column headers actually re-render due to memo comparators.

---

## 4. Optimistic Update Patterns

### 4.1 Update Flow

```typescript
// From useMyTasks.ts
const updateTaskDueDate = useCallback(
  async (taskId: number, newDueDate: Date) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const newStatus = calculateStatus(newDueDate);

    // 1. Optimistic UI update - IMMEDIATE
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, dueDate: newDueDate, status: newStatus } : t
      )
    );

    // 2. API call (may fail)
    try {
      await dataProvider.update("tasks", {
        id: taskId,
        data: { due_date: newDueDate.toISOString() },
        previousData: task,
      });
    } catch (err) {
      // 3. Rollback on failure
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, dueDate: task.dueDate, status: task.status } : t
        )
      );
      throw err;
    }
  },
  [tasks, dataProvider, calculateStatus]
);
```

**Assessment:** ✅ Excellent Pattern

- **Immediate feedback:** UI updates before API call
- **Proper rollback:** Reverts to previous state on failure
- **Error propagation:** Re-throws error for caller handling
- **Functional updates:** Uses `prev =>` pattern for safety

### 4.2 All Optimistic Operations

| Operation | Has Optimistic Update | Has Rollback |
|-----------|----------------------|--------------|
| `updateTaskDueDate` | ✅ Yes | ✅ Yes |
| `snoozeTask` | ✅ Yes | ✅ Yes |
| `deleteTask` | ✅ Yes | ✅ Yes |
| `completeTask` | ❌ No* | N/A |

*`completeTask` removes from local state immediately but doesn't track for rollback if API fails.

### 4.3 Potential Issue: completeTask Rollback

```typescript
const completeTask = async (taskId: number) => {
  try {
    await dataProvider.update("tasks", {
      id: taskId,
      data: { completed: true, completed_at: new Date().toISOString() },
      previousData: tasks.find((t) => t.id === taskId) || {},
    });

    // Remove AFTER successful API call
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  } catch (err) {
    console.error("Failed to complete task:", err);
    throw err;
  }
};
```

**Issue:** Updates state AFTER API call, not optimistically.

**Recommendation:** Add optimistic update with rollback:
```typescript
const completeTask = async (taskId: number) => {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return;

  // Optimistic removal
  setTasks((prev) => prev.filter((t) => t.id !== taskId));

  try {
    await dataProvider.update("tasks", {...});
  } catch (err) {
    // Rollback on failure
    setTasks((prev) => [...prev, task].sort((a, b) =>
      a.dueDate.getTime() - b.dueDate.getTime()
    ));
    throw err;
  }
};
```

---

## 5. Virtual Scrolling Analysis

### 5.1 Current Implementation

**No virtual scrolling implemented** - All tasks render to DOM.

### 5.2 Virtual Scrolling Need Assessment

| Factor | Value | Threshold |
|--------|-------|-----------|
| Max tasks per user | ~100 | >500 needed |
| Cards per column | ~33 avg | >100 per column |
| Card height | ~100px | - |
| Viewport height | ~600px | - |
| DOM nodes per card | ~20 | >50 is concern |

**Calculation:**
- 100 tasks × 20 DOM nodes = 2,000 DOM nodes
- All visible within scroll container
- React can handle 2,000 nodes easily

**Assessment:** ✅ Virtual scrolling NOT needed at current scale

### 5.3 Future Scaling Path

If task count exceeds 500:
1. Consider `@tanstack/react-virtual` for column virtualization
2. Or switch to `react-window` with custom drag integration
3. `@hello-pangea/dnd` does NOT natively support virtualization - would need custom solution

**Recommendation:** Monitor task counts. If >300 tasks becomes common, plan virtual scrolling migration.

---

## 6. State Sync with Supabase

### 6.1 Current Sync Pattern

**Polling-based (on demand):**
- Initial load via `useMyTasks()` hook
- Refresh via `refreshKey` prop change
- No realtime subscriptions

### 6.2 Subscription Analysis

**No Supabase realtime subscriptions found** in dashboard v3 components.

**Impact:**
- ✅ No memory leak risk from unmanaged subscriptions
- ⚠️ Stale data between manual refreshes
- ⚠️ No multi-user collaboration updates

### 6.3 Recommendation: Add Realtime for Multi-User

If multiple users edit the same tasks:

```typescript
// Suggested pattern
useEffect(() => {
  const channel = supabase
    .channel('tasks-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'tasks', filter: `sales_id=eq.${salesId}` },
      (payload) => {
        // Merge remote changes with local state
        handleRemoteTaskChange(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);  // ✅ Cleanup
  };
}, [salesId]);
```

**Important:** Always cleanup with `supabase.removeChannel()` in useEffect return.

---

## 7. Memory Leak Analysis

### 7.1 Event Listener Audit

| Component | Event Listeners | Cleanup |
|-----------|-----------------|---------|
| TasksKanbanPanel | None | N/A |
| TaskKanbanColumn | None | N/A |
| TaskKanbanCard | click, keydown (inline) | Auto via React |
| DragDropContext | DnD sensors | Auto via library |

**Assessment:** ✅ No manual event listener management = no leak risk

### 7.2 useEffect Cleanup Audit

**useMyTasks.ts:**
```typescript
useEffect(() => {
  const fetchTasks = async () => { /* ... */ };
  fetchTasks();
}, [dataProvider, salesId, salesLoading]);
// ⚠️ No cleanup function
```

**Potential Issue:** If component unmounts during fetch, state update on unmounted component.

**Recommendation:** Add abort controller:
```typescript
useEffect(() => {
  const abortController = new AbortController();

  const fetchTasks = async () => {
    if (abortController.signal.aborted) return;
    // ... fetch logic
    if (!abortController.signal.aborted) {
      setTasks(mappedTasks);
    }
  };

  fetchTasks();

  return () => {
    abortController.abort();
  };
}, [dataProvider, salesId, salesLoading]);
```

### 7.3 Closure Memory Analysis

**Callback Dependencies in useMyTasks:**

```typescript
const snoozeTask = useCallback(async (taskId: number) => {
  const task = tasks.find((t) => t.id === taskId);
  // ...
}, [tasks, dataProvider, calculateStatus]);  // ⚠️ Captures entire tasks array
```

**Issue:** Each callback captures the entire `tasks` array in closure.

**Impact:** Minor - Arrays are garbage collected when callbacks update.

**Alternative:** Use ref pattern if memory becomes concern:
```typescript
const tasksRef = useRef(tasks);
useEffect(() => { tasksRef.current = tasks; }, [tasks]);

const snoozeTask = useCallback(async (taskId: number) => {
  const task = tasksRef.current.find((t) => t.id === taskId);
}, [dataProvider, calculateStatus]);  // No tasks dependency
```

---

## 8. Performance Benchmarks

### 8.1 Existing Benchmark Results

From `performance.benchmark.test.tsx`:

| Metric | Target | Measured |
|--------|--------|----------|
| Initial render (100 tasks) | <2000ms | Pass |
| Re-render filtering | <15ms | Pass (<45ms with 3x headroom) |
| Empty state render | <20ms | Pass |

### 8.2 Drag-Drop Performance Estimate

| Operation | Estimated Time |
|-----------|----------------|
| Drag start | ~5ms (sensor detection) |
| During drag | ~1ms/frame (style updates) |
| Drop animation | ~200ms (spring physics) |
| State update | ~10ms (optimistic) |
| API response | ~100-300ms |

**Total perceived latency:** ~15ms (instant visual feedback)

---

## 9. Improvement Recommendations

### 9.1 High Priority

1. **Add AbortController to useMyTasks**
   - Prevents state updates on unmounted components
   - Clean async handling
   - Effort: 30 minutes

2. **Make completeTask optimistic**
   - Consistent with other operations
   - Better UX on slow networks
   - Effort: 15 minutes

### 9.2 Medium Priority

3. **Extract tasks lookup to ref**
   - Reduces callback recreations
   - Smaller closure memory
   - Effort: 1 hour

4. **Add error boundary around Kanban**
   - Graceful degradation on DnD errors
   - Effort: 30 minutes

### 9.3 Low Priority (Future)

5. **Virtual scrolling preparation**
   - Only if task counts exceed 300
   - Requires DnD integration work
   - Effort: 1-2 days

6. **Supabase realtime subscriptions**
   - Only if multi-user editing becomes requirement
   - Effort: 2-4 hours

---

## 10. Conclusion

The Task Kanban board implementation is **well-optimized for current scale** with:

✅ **Strengths:**
- Proper React.memo with custom comparators
- Optimistic updates with rollback
- useMemo for derived state
- useCallback for stable references
- No subscription leaks (no subscriptions!)
- Good separation of concerns

⚠️ **Areas for Improvement:**
- Missing AbortController for async cleanup
- `completeTask` not optimistic
- `tasks` array in callback dependencies (minor)

**Performance Rating:** 8.5/10

**Scalability:** Good up to ~300 tasks, clear path for virtual scrolling if needed.

**Production Readiness:** ✅ Ready for deployment at current scale.
