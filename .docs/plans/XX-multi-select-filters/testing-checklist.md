# Multi-Select Filters Testing Checklist

Manual testing checklist for multi-select filter enhancement implementation.

## Stage Filter

- [ ] Default hides closed_won and closed_lost on first load
- [ ] Selecting stages persists to localStorage with key `filter.opportunity_stages`
- [ ] URL parameters override localStorage preferences
- [ ] Filter chips show selected stages correctly (e.g., "Stage: Qualified")
- [ ] Removing chip updates filter state immediately
- [ ] Clear all filters button removes all stage selections
- [ ] Stage preferences persist across page refreshes
- [ ] Changing stages triggers useEffect to save preferences
- [ ] Empty selection does not save to localStorage

## Priority Filter

- [ ] Multi-select dropdown shows checkboxes for all priorities
- [ ] Selected count badge displays correctly (e.g., "(2 selected)")
- [ ] Filter updates list immediately on selection change
- [ ] Filter chips show priority labels (Low/Medium/High/Critical), not IDs
- [ ] Multiple priorities can be selected simultaneously
- [ ] Removing priority chip works correctly

## Customer Organization Filter

- [ ] Autocomplete search works for organization names
- [ ] Multiple organizations can be selected
- [ ] Organization names display in filter chips (not IDs)
- [ ] Removing organization chip works correctly
- [ ] Search dropdown shows relevant results as you type
- [ ] Selected organizations display as badges in input field

## Tags Filter (if implemented)

- [ ] Tag choices load from database
- [ ] Multi-select accumulates tag selections
- [ ] Tag names display in filter chips
- [ ] Works with both opportunities (text[]) and contacts (bigint[])
- [ ] Empty tag array does not display chips

## Filter Precedence

- [ ] URL filters override localStorage preferences
- [ ] localStorage preferences override system defaults
- [ ] Sharing URL with filters works across devices/browsers
- [ ] URL with invalid JSON falls back to localStorage
- [ ] Default stages apply when both URL and localStorage are empty

## Performance

- [ ] Filter panel loads in < 250ms
- [ ] List with 100+ opportunities renders smoothly
- [ ] No console errors or warnings during filter operations
- [ ] FilterChipsPanel updates without lag when filters change
- [ ] Name resolution (organizations, sales, tags) uses batch fetching

## Accessibility

- [ ] Keyboard navigation works in all filter dropdowns
- [ ] Tab key cycles through filter inputs correctly
- [ ] Enter/Space keys activate filter selections
- [ ] Screen reader announces filter changes
- [ ] Focus states visible and clear on all interactive elements
- [ ] Filter chips can be removed via keyboard

## Edge Cases

- [ ] Empty filter state handled gracefully (no chips displayed)
- [ ] Invalid URL parameters don't crash app
- [ ] localStorage quota exceeded handled gracefully (console warning only)
- [ ] Stale filter cleanup removes old `opportunity_hidden_stages` key
- [ ] useFilterCleanup validates filters on mount
- [ ] FilterChipsPanel handles null/undefined values correctly
- [ ] Array filter values flatten to individual chips

## Integration Tests

- [ ] OpportunityList uses useOpportunityFilters hook correctly
- [ ] Stage preferences utility functions work as expected
- [ ] FilterChipsPanel integrates tag name resolution
- [ ] Filter formatter handles all filter types (stage, priority, tags, organizations)
- [ ] Filter state persists across List component remounts

## Regression Tests

- [ ] Existing filter functionality (search, only mine) still works
- [ ] OpportunityListContent displays filtered results correctly
- [ ] Filter changes trigger list refresh
- [ ] Archived opportunities list not affected by filters
- [ ] Empty state displays when no results match filters

## Migration & Compatibility

- [ ] Old `opportunity_hidden_stages` localStorage key gracefully ignored
- [ ] Users see default stages on first load after upgrade
- [ ] New `filter.opportunity_stages` key used for subsequent sessions
- [ ] No data loss during migration
- [ ] Backward compatible with existing URL parameters

## Code Quality

- [ ] No TypeScript errors in modified files
- [ ] ESLint passes on all changed files
- [ ] Prettier formatting applied consistently
- [ ] Unit tests pass for opportunityStagePreferences
- [ ] No unused imports in refactored files
- [ ] Constitution compliance: ≤150 lines per component

## Documentation

- [ ] JSDoc comments present on all exported functions
- [ ] Inline comments explain complex logic
- [ ] Type definitions comprehensive and accurate
- [ ] README or docs reflect new filter capabilities (if applicable)

---

**Test Status**: ⬜ Not Started | 🟡 In Progress | ✅ Completed | ❌ Failed

**Last Updated**: 2025-10-10
