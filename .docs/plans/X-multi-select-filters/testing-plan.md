# Multi-Select Filters Testing Plan

## Testing Overview
Comprehensive testing strategy for multi-select filter implementation, covering unit tests, integration tests, and manual validation scenarios.

## Phase 0: Array Conversion Testing

### Unit Test: PostgREST Conversion with CORRECT Escaping
```javascript
// Test file: scripts/postgrest-correct-escaping.mjs
// IMPORTANT: PostgREST uses BACKSLASH escaping, not doubled quotes!
describe('Array to PostgREST IN operator conversion', () => {
  test('Single value remains unchanged', () => {
    input: { stage: 'qualified' }
    expected: { stage: 'qualified' }
  });

  test('Array converts to IN operator', () => {
    input: { stage: ['qualified', 'proposal'] }
    expected: { 'stage@in': '(qualified,proposal)' }
  });

  test('Empty array removes filter', () => {
    input: { stage: [] }
    expected: {}
  });

  test('String with comma gets escaped with quotes', () => {
    input: { category: ['Tech, Inc.', 'Sales Co'] }
    expected: { 'category@in': '("Tech, Inc.","Sales Co")' }
  });

  test('Double quotes use BACKSLASH escaping', () => {
    input: { name: ['he said "hi"', 'normal'] }
    expected: { 'name@in': '("he said \\"hi\\"",normal)' }
  });

  test('Backslashes are doubled', () => {
    input: { path: ['C:\\Users\\Name', 'normal'] }
    expected: { 'path@in': '("C:\\\\Users\\\\Name",normal)' }
  });

  test('Mixed operators preserved', () => {
    input: {
      stage: ['qualified', 'proposal'],
      'amount@gte': 10000
    }
    expected: {
      'stage@in': '(qualified,proposal)',
      'amount@gte': 10000
    }
  });
});
```

### Network Validation
- **Tool**: Browser DevTools Network Tab
- **Expected Query Format**: `?stage=in.(qualified,proposal)`
- **Validation Points**:
  - Correct operator syntax
  - Proper URL encoding
  - No duplicate parameters

## Phase 1: Multi-Select Component Testing

### Manual Test Scenarios

#### Test Case 1.1: Basic Multi-Selection
1. Open OpportunityList page
2. Click Stage filter dropdown
3. Select "Qualified" and "Proposal"
4. **Expected**: Both items checked, list filters correctly

#### Test Case 1.2: Default Stage Behavior
1. Clear browser localStorage
2. Navigate to OpportunityList
3. **Expected**: All stages shown except "Closed Won" and "Closed Lost"
4. Select "Closed Won"
5. Navigate away and return
6. **Expected**: Returns to default (closed stages hidden)

#### Test Case 1.3: URL Parameter Override
1. Set localStorage preference hiding "Qualified"
2. Navigate to `/opportunities?filter={"stage":["qualified","proposal"]}`
3. **Expected**: URL parameters override localStorage, shows Qualified

### React Admin Integration Tests
```typescript
// Test useListContext integration
test('Multi-select updates filter context', () => {
  const { result } = renderHook(() => useListContext());

  // Simulate multi-select change
  act(() => {
    result.current.setFilters({
      stage: ['qualified', 'proposal']
    });
  });

  expect(result.current.filterValues).toEqual({
    stage: ['qualified', 'proposal']
  });
});
```

## Phase 2: UI Enhancement Testing

### Visual Regression Tests

#### Test Case 2.1: Selected Count Display
1. Select 0 items → Shows "Select items"
2. Select 1 item → Shows "Select items (1 selected)"
3. Select 3 items → Shows "Select items (3 selected)"

#### Test Case 2.2: Active State Styling
1. No selection → Default border color
2. With selection → Primary color border (`border-primary`)
3. Hover state → Appropriate hover effect

#### Test Case 2.3: Clear All Function
1. Select multiple items
2. Click "Clear all"
3. **Expected**: All checkboxes unchecked, filter removed

### Accessibility Testing
- **Keyboard Navigation**: Tab through dropdowns, Space to select
- **Screen Reader**: Announces selected count
- **ARIA Labels**: Proper `aria-checked` and `aria-expanded`

## Phase 3: Filter Chips Testing

### Component Tests

#### Test Case 3.1: Chip Display
```typescript
test('Filter chips render for each selected value', () => {
  const filterValues = {
    stage: ['qualified', 'proposal'],
    priority: ['high']
  };

  render(<FilterChipsPanel />);

  expect(screen.getByText('stage: Qualified')).toBeInTheDocument();
  expect(screen.getByText('stage: Proposal')).toBeInTheDocument();
  expect(screen.getByText('priority: High')).toBeInTheDocument();
});
```

#### Test Case 3.2: Individual Removal
1. Display chips for multiple filters
2. Click 'x' on "stage: Qualified"
3. **Expected**: Only "Qualified" removed, "Proposal" remains

#### Test Case 3.3: Collapsible Behavior
1. With active filters → Panel auto-expanded
2. Click collapse → Panel collapses
3. No filters → Panel hidden

## Phase 4: Organization Resolution Testing

### Performance Tests

#### Test Case 4.1: N+1 Query Prevention
1. Select 5 organizations in filter
2. Open Network tab
3. **Expected**: Single batch query for all 5 organizations
4. **Not Expected**: 5 separate queries

#### Test Case 4.2: Caching Behavior
1. Select organizations A, B, C
2. Clear filter
3. Select organizations A, B again
4. **Expected**: No new network requests (cached)

### Data Integrity Tests
```typescript
test('Organization names resolve correctly', async () => {
  const filterValues = {
    customer_organization_id: [123, 456]
  };

  // Mock organization data
  mockDataProvider.getMany.mockResolvedValue({
    data: [
      { id: 123, name: 'Acme Corp' },
      { id: 456, name: 'Tech Inc' }
    ]
  });

  render(<FilterChipsPanel />);

  await waitFor(() => {
    expect(screen.getByText('customer: Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('customer: Tech Inc')).toBeInTheDocument();
  });
});
```

## Phase 5: Category Choices Testing

### Dynamic Categories Test
1. Load OpportunityList
2. Check Network tab for category fetch
3. **Expected**: Single query for distinct categories
4. Open category filter
5. **Expected**: All unique categories listed

### Edge Cases
- Empty category handling
- Null category values
- Special characters in categories

## Performance Testing

### Load Testing
```javascript
// Measure filter performance with large datasets
test('Performance with 1000+ records', async () => {
  const startTime = performance.now();

  // Apply complex multi-select filters
  await applyFilters({
    stage: ['qualified', 'proposal', 'negotiation'],
    priority: ['high', 'critical'],
    customer_organization_id: [1, 2, 3, 4, 5]
  });

  const endTime = performance.now();
  const responseTime = endTime - startTime;

  expect(responseTime).toBeLessThan(2000); // Under 2 seconds
});
```

### Database Query Analysis
- Enable PostgreSQL query logging
- Apply various filter combinations
- Verify indexes are used
- Check query execution plans

## Regression Testing

### Existing Functionality
- [ ] Single-value filters still work
- [ ] Search filter not affected
- [ ] OnlyMine toggle unchanged
- [ ] Sort functionality preserved
- [ ] Pagination works correctly
- [ ] Export features unaffected

### Backward Compatibility
- [ ] Old bookmarks with single filters work
- [ ] Saved views load correctly
- [ ] No console errors on load

## User Acceptance Testing

### Scenario 1: Sales Manager Workflow
1. View all active opportunities (default)
2. Add closed opportunities to view
3. Filter by high priority only
4. Select specific customer organizations
5. **Success**: Can analyze pipeline including closed deals

### Scenario 2: Quick Filtering
1. Start with all opportunities
2. Rapidly change filter combinations
3. Use clear all to reset
4. **Success**: Smooth, responsive filtering

### Scenario 3: Sharing Filtered Views
1. Apply complex filters
2. Copy URL
3. Send to colleague
4. Colleague opens URL
5. **Success**: Same filtered view appears

## Error Handling Tests

### Network Failure
1. Apply filters
2. Simulate network failure
3. **Expected**: Graceful error message, filters remain in UI

### Invalid Filter Values
1. Manually edit URL with invalid filter
2. **Expected**: Invalid filters ignored, valid ones applied

### Empty Results
1. Apply very restrictive filters
2. **Expected**: "No opportunities found" message
3. Filter chips still visible for easy adjustment

## Automated Test Coverage Goals

- Unit Tests: 90% coverage of new functions
- Integration Tests: All critical paths covered
- E2E Tests: Happy path + key edge cases
- Performance Tests: Sub-2-second response time

## Test Execution Schedule

1. **During Development**: Unit tests on each function
2. **After Each Phase**: Integration tests for that phase
3. **Before PR**: Full regression suite
4. **Post-Deployment**: UAT with stakeholders

## Bug Reporting Template

```markdown
### Bug Description
[Clear description of the issue]

### Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]

### Expected Behavior
[What should happen]

### Actual Behavior
[What actually happens]

### Filter State
- Active filters: [List filters]
- URL parameters: [Copy URL]
- Browser console errors: [Any errors]

### Environment
- Browser: [Chrome/Firefox/Safari version]
- Screen size: [Desktop/Tablet/Mobile]
```

## Success Metrics

- ✅ All test cases pass
- ✅ No performance regression (< 2s response)
- ✅ Zero console errors
- ✅ Accessibility score maintained
- ✅ User satisfaction (ease of use)