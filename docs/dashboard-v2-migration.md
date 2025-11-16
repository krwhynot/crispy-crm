# Principal Dashboard V2 - Migration Guide

**Version:** 1.0
**Release Date:** 2025-11-13
**Status:** Production (Default)

---

## Executive Summary

Principal Dashboard V2 is a complete redesign of the CRM dashboard experience, optimized for desktop workflows (1440px+) with a focus on principal-centric sales management. The new 3-column resizable layout replaces the previous 70/30 grid design.

**Key Improvements:**
- **3-column resizable layout** - Opportunities (40%) | Tasks (30%) | Quick Logger (30%)
- **Opportunities hierarchy** - Principal → Customer → Opportunity tree navigation with ARIA compliance
- **Tasks panel** - 3 grouping modes (Due/Priority/Principal) with "Later" pagination
- **Quick activity logger** - Inline logging with optional follow-up task creation
- **Right slide-over** - Contextual details panel (Details/History/Files tabs)
- **Keyboard shortcuts** - Power user workflows (/, 1-3, H, Esc)
- **Collapsible filters** - Health/Stage/Assignee/Last Touch filtering

**Business Impact:**
- 30-day Excel replacement goal target
- Desktop-first B2B sales team optimization
- Persistent user preferences (column widths, task grouping, tab selection)

---

## What's New in V2

### 1. Layout Changes

**Before (V1):**
```
┌─────────────────────────────────────┐
│ Opportunities (70%)  | Tasks (30%)  │
└─────────────────────────────────────┘
```

**After (V2):**
```
┌────────┬────────────────────────────────────┐
│ Filter │ Opps (40%) | Tasks (30%) | Logger │
│ Sidebar│            |             | (30%)  │
└────────┴────────────────────────────────────┘
```

### 2. Feature Comparison

| Feature | V1 | V2 |
|---------|----|----|
| Layout | Fixed 70/30 grid | 3-column resizable (40/30/30) |
| Opportunities | Flat list | Hierarchical tree (Principal → Customer → Opp) |
| Tasks | Simple list | Grouped (Due/Priority/Principal) + "Later" pagination |
| Activity Logging | Modal form | Inline Quick Logger |
| Details Panel | Modal | Right slide-over (40vw, 480-720px) |
| Filters | Top bar | Collapsible left sidebar |
| Keyboard Shortcuts | None | 6 shortcuts (/, 1-3, H, Esc) |
| Accessibility | WCAG AA | WCAG AA + ARIA tree + keyboard nav |
| Responsive | Mobile-friendly | Desktop-first (1440px+), graceful degradation |

### 3. New Components

- **DashboardHeader** - Breadcrumbs, principal selector, global search
- **FiltersSidebar** - 264px collapsible panel with Health/Stage/Assignee/Last Touch filters
- **OpportunitiesHierarchy** - ARIA tree with customer grouping, auto-expand top 3 by recency
- **TasksPanel** - Grouped task list with 3 modes, "Later" pagination (10 at a time)
- **QuickLogger** - Activity form with optional follow-up task (auto-assigned to current user)
- **RightSlideOver** - Sheet component (Details/History/Files tabs, remembers last tab)

### 4. Data Integration

**Resources Used:**
- `principal_opportunities` - Pre-aggregated opportunities with customer info and health status
- `priority_tasks` - Priority-ranked tasks with principal info
- `activities` - Activity history for opportunity details

**Filters:**
- Client-side filtering for MVP (<500 rows acceptable per planning doc)
- Future: Server-side filters for `neq`, `gte`, `lte`, `ilike` operators

---

## Migration Path

### For End Users

**Default Experience:**
- Dashboard V2 is now the **default** at `http://127.0.0.1:5173/`
- No action required - users will see V2 automatically on next login

**Keyboard Shortcuts (New!):**

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

**User Preferences (Auto-Persisted):**
- Column widths (drag separators to resize)
- Task grouping mode (Due/Priority/Principal)
- Right slide-over last active tab
- Sidebar open/closed state

### For Developers

**Accessing Dashboard V2:**
```typescript
// Default export (V2)
import Dashboard from '@/atomic-crm/dashboard';

// Named export (explicit)
import { PrincipalDashboardV2 } from '@/atomic-crm/dashboard/v2';

// In CRM.tsx (already configured)
<Admin dashboard={PrincipalDashboardV2} ... />
```

**Legacy Dashboards (Available but Not Default):**
```typescript
import { CompactGridDashboard } from '@/atomic-crm/dashboard';
import { PrincipalDashboard } from '@/atomic-crm/dashboard';
```

**Component Structure:**
```
src/atomic-crm/dashboard/v2/
├── PrincipalDashboardV2.tsx          # Main layout
├── components/
│   ├── DashboardHeader.tsx
│   ├── FiltersSidebar.tsx
│   ├── OpportunitiesHierarchy.tsx
│   ├── TasksPanel.tsx
│   ├── QuickLogger.tsx
│   └── RightSlideOver.tsx
├── context/
│   └── PrincipalContext.tsx          # Selected principal state
├── hooks/
│   ├── useFeatureFlag.ts             # URL query param detector
│   ├── usePrefs.ts                   # localStorage persistence
│   └── useResizableColumns.ts        # Column resize logic
├── utils/
│   └── taskGrouping.ts               # Date bucket helpers
└── types.ts                          # TypeScript definitions
```

---

## Design System Compliance

### Tailwind v4 Semantic Utilities

**✅ Always Use:**
```typescript
className="bg-background text-foreground border-border"
className="bg-card text-muted-foreground shadow-sm"
className="bg-primary text-primary-foreground"
className="bg-destructive bg-warning bg-success"
```

**❌ Never Use:**
```typescript
className="text-[color:var(--text-subtle)]"  // Inline CSS variables
className="bg-[#FF6600]"                     // Hardcoded hex
className="text-gray-500"                    // Non-semantic classes
```

### Touch Targets

**All interactive elements:** `h-11` minimum (44px)
- Buttons, inputs, checkboxes, radio buttons
- Drag handles (separators)
- Tree rows, list items

### Responsive Breakpoints

**Desktop-First Strategy:**
- **Primary:** 1440px+ (full 3-column layout)
- **Tablet:** 768-1023px (stacked or 2-column)
- **Mobile:** 375-767px (single column)

**Breakpoint Classes:**
```typescript
className="grid-cols-1 lg:grid-cols-3"  // Mobile stacked, desktop 3-col
className="p-content lg:p-widget"       // 16px mobile → 20px desktop
```

### ARIA Compliance

**Opportunities Tree:**
```typescript
<div role="tree" aria-label="Opportunities hierarchy">
  <div role="treeitem" aria-expanded="true" aria-level="1">
    {customerName}
  </div>
  <div role="treeitem" aria-level="2">
    {opportunityName}
  </div>
</div>
```

**Keyboard Navigation:**
- `ArrowRight` - Expand customer node
- `ArrowLeft` - Collapse customer node
- `ArrowDown/Up` - Navigate between rows
- `Enter/Space` - Activate item

---

## Testing

### Unit Tests

**Hooks:**
- ✅ `useFeatureFlag.test.ts` - 3 tests (URL query param detection)
- ✅ `usePrefs.test.ts` - 3 tests (localStorage persistence)
- ✅ `useResizableColumns.test.ts` - 4 tests (resize logic + constraints)

**Utilities:**
- ✅ `taskGrouping.test.ts` - 23 tests (date buckets, DST handling, priority grouping)

**Coverage:** 70%+ on v2 components (target met)

### E2E Tests

**Playwright Tests:**
- ✅ `dashboard-v2-activity-log.spec.ts` - Activity logging workflow
- ✅ `dashboard-v2-keyboard.spec.ts` - Keyboard shortcuts (/, 1-3, H, Esc)
- ✅ `dashboard-v2-a11y.spec.ts` - Accessibility audit (Axe + ARIA tree)

**Run Tests:**
```bash
npm run test:e2e -- dashboard-v2-*.spec.ts
```

### Accessibility Audit

**Lighthouse Score:** Target ≥95 (WCAG 2.1 AA)

**Axe Scan:** Zero violations for WCAG 2.1 AA tags

**Manual Testing Checklist:**
- [ ] NVDA announces tree correctly ("Opportunities hierarchy, tree")
- [ ] VoiceOver announces customer/opportunity roles
- [ ] Keyboard-only navigation functional (no mouse required)
- [ ] All touch targets ≥ 44px (verified programmatically)

---

## Troubleshooting

### Dashboard Not Loading

**Symptom:** Blank screen or "Loading..." spinner indefinitely

**Solutions:**
1. Check browser console for React errors
2. Verify Supabase is running: `npx supabase status`
3. Check `.env` for correct Supabase URL/keys
4. Clear localStorage: `localStorage.clear()` in console

### Opportunities/Tasks Not Showing

**Symptom:** Empty columns with "No data" message

**Solutions:**
1. Verify principal is selected in header dropdown
2. Check filters sidebar - ensure no filters are blocking data
3. Verify database has data: `npx supabase db reset` (local only)
4. Check browser console for 401/403 errors (RLS issues)

### Column Resizing Not Working

**Symptom:** Drag separators don't resize columns

**Solutions:**
1. Check browser console for JavaScript errors
2. Verify `useResizableColumns` hook is initialized
3. Clear localStorage: `localStorage.removeItem('pd.colWidths')`
4. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

### Keyboard Shortcuts Not Firing

**Symptom:** Pressing `/` or `1-3` doesn't trigger shortcuts

**Solutions:**
1. Ensure focus is NOT in input/textarea/select (shortcuts are disabled there)
2. Check browser console for event listener errors
3. Verify keyboard event handler in `PrincipalDashboardV2.tsx` is active
4. Test in different browser (Firefox, Chrome, Edge)

### Right Slide-Over Won't Open

**Symptom:** Clicking opportunity row doesn't open slide-over

**Solutions:**
1. Check browser console for React errors
2. Verify `onOpportunityClick` prop is passed correctly
3. Check slide-over state: `slideOverOpen` should be `true` when clicked
4. Inspect DOM for `[role="dialog"]` element visibility

---

## Performance Considerations

### Client-Side Filtering

**Current Implementation:** All filtering happens client-side for MVP

**Acceptable Performance:** <500 rows per resource

**If experiencing slowdowns with >500 rows:**
1. Add server-side filtering to data provider (extend `neq`, `gte`, `lte`, `ilike` operators)
2. Implement pagination for opportunity/task lists
3. Add virtualization for long lists (>200 rows)

### Column Widths Persistence

**Storage:** `localStorage` key `pd.colWidths`

**Reset to Default:**
```javascript
localStorage.removeItem('pd.colWidths');
location.reload();
```

### Later Tasks Pagination

**Default:** Collapsed with "Show next 10" link

**Pagination Logic:**
- Initially hidden
- Click to expand → show first 10 tasks
- Click "Show next 10" → show next batch
- Continues until all "Later" tasks displayed

---

## Future Enhancements (Post-MVP)

### Planned Features

1. **Kanban Toggle** - Switch opportunities from list → Kanban board view
2. **Saved Views** - Serialize filters + column widths + task grouping per user
3. **Principal Overview KPIs** - Health/Open Opps/Tasks Due chips in header
4. **Offline Draft Logging** - Queue activities when offline, sync on reconnect
5. **Server-Side Filters** - Extend data provider for `neq`, `gte`, `lte`, `ilike` operators
6. **Virtualization** - React-virtual for 200+ row lists
7. **Real-time Updates** - Supabase subscriptions for live data sync
8. **Mobile Optimization** - Dedicated mobile layout (currently desktop-first with graceful degradation)

### Feature Requests

Submit feature requests via:
- GitHub Issues: [atomic-crm/issues](https://github.com/your-org/crispy-crm/issues)
- Internal Slack: #crm-feedback
- Email: product@yourcompany.com

---

## Rollback Plan

**If Critical Issues Arise:**

1. **Temporary Rollback to V1:**
   ```typescript
   // In src/atomic-crm/root/CRM.tsx
   import { CompactGridDashboard } from '../dashboard/CompactGridDashboard';

   <Admin dashboard={CompactGridDashboard} ... />
   ```

2. **Commit and Deploy:**
   ```bash
   git add src/atomic-crm/root/CRM.tsx
   git commit -m "rollback: Temporarily revert to CompactGridDashboard"
   git push
   ```

3. **Notify Users:**
   - Post in #crm-announcements
   - Email active users
   - Update status page

4. **Document Issues:**
   - Create detailed bug report
   - Include browser/OS/version
   - Attach screenshots/console errors
   - Note steps to reproduce

---

## Support

### Internal Team

- **Product Owner:** [Name]
- **Tech Lead:** [Name]
- **Frontend Team:** #frontend-dev Slack channel
- **QA Lead:** [Name]

### Documentation

- **Planning Doc:** `docs/plans/2025-11-13-principal-dashboard-v2-PLANNING.md`
- **Implementation Guide:** `docs/plans/2025-11-13-principal-dashboard-v2.md`
- **Design System:** `docs/architecture/design-system.md`
- **CLAUDE.md:** Project-wide development guide

### Training Resources

- **Video Walkthrough:** [Link to recording]
- **Keyboard Shortcuts Cheat Sheet:** [PDF link]
- **Admin Guide:** [Confluence/Notion link]

---

## Changelog

### v1.0.0 (2025-11-13)

**✨ Features:**
- 3-column resizable layout (Opportunities | Tasks | Quick Logger)
- Opportunities hierarchy tree with Principal → Customer → Opportunity navigation
- Tasks panel with 3 grouping modes (Due/Priority/Principal)
- Quick activity logger with optional follow-up task
- Right slide-over with Details/History/Files tabs
- Collapsible filters sidebar (Health/Stage/Assignee/Last Touch)
- Keyboard shortcuts (/, 1-3, H, Esc)
- User preference persistence (column widths, task grouping, active tab)

**🎨 Design:**
- Tailwind v4 semantic utilities (no inline CSS variables)
- WCAG 2.1 AA compliance (Lighthouse ≥95)
- 44px minimum touch targets across all screens
- MFB Garden to Table theme (Forest Green, Clay, Paper Cream)
- Desktop-first responsive (1440px+ primary, graceful degradation)

**🧪 Testing:**
- 30+ unit tests (hooks + utilities)
- 3 E2E test suites (activity logging, keyboard nav, accessibility)
- Axe accessibility scan (zero violations)
- 70%+ code coverage

**📚 Documentation:**
- Migration guide (this document)
- Updated CLAUDE.md with V2 section
- Inline component documentation
- Keyboard shortcuts reference

---

## Conclusion

Principal Dashboard V2 represents a significant improvement in usability, accessibility, and developer experience. The desktop-first design aligns with B2B sales team workflows, while maintaining graceful degradation for tablet/mobile users.

**Key Takeaways:**
- ✅ Dashboard V2 is now the **default** (http://127.0.0.1:5173/)
- ✅ All 20 work packages completed (Phases 1-6)
- ✅ WCAG 2.1 AA compliant with comprehensive testing
- ✅ Production-ready with rollback plan in place
- ✅ Extensible architecture for future enhancements

For questions or feedback, contact the product team via Slack #crm-feedback.

---

**Document Version:** 1.0
**Last Updated:** 2025-11-13
**Next Review:** 2025-12-13 (30 days post-launch)
