# Search Query Parser Design Spike

**Date:** November 3, 2024
**Spike ID:** P4-E2-S0-T2
**Confidence Before:** 45%
**Confidence After:** 90%
**Time Spent:** 2 hours

## Executive Summary

After researching search parser approaches and analyzing the existing codebase, we recommend **enhancing the current working ILIKE search** with a simple regex-based field extractor rather than implementing a complex parser. The existing search already handles basic text search well using PostgREST's `@ilike` operator.

## Current Implementation (Working)

The codebase already has functional search:
- **Location:** `src/atomic-crm/providers/supabase/dataProviderUtils.ts`
- **Method:** `applyFullTextSearch()` using ILIKE across configured fields
- **Features:**
  - Multi-field search with OR logic
  - Soft delete filtering
  - Configurable searchable fields per resource

## Requirements Analysis

### Basic Search Features (Selected)
✅ Simple terms: `john smith`
✅ Basic AND/OR: `john AND smith`
✅ Field filters: `status:active`
✅ Exclusions: `-archived`
✅ Email wildcards: `email:*@gmail.com`

### Not Required (Per User Selection)
❌ Quoted phrases: `"john smith"`
❌ Complex parentheses: `(john OR jane) AND company`
❌ Date ranges: `created:2024-01-01..2024-12-31`
❌ Fuzzy matching: `john~2`

## Research Findings

### Option 1: PEG.js Grammar Parser (Not Recommended)
- **Pros:** Handles complex syntax, good error messages, maintainable
- **Cons:** Overkill for Basic Search, adds dependency, increases bundle size
- **Verdict:** Too complex for our Basic Search requirements

### Option 2: Hand-Written Recursive Descent (Not Recommended)
- **Pros:** Fast, no dependencies
- **Cons:** Hard to maintain, error-prone for extensions
- **Verdict:** Unnecessary complexity given existing ILIKE works

### Option 3: Simple Regex Enhancement (✅ Recommended)
- **Pros:**
  - Builds on existing working code
  - Simple to implement and test
  - No new dependencies
  - Sufficient for Basic Search
- **Cons:**
  - Limited to simple patterns
  - Can't handle nested expressions
- **Verdict:** Perfect fit for Basic Search requirements

## Recommended Implementation

### Parser Design

```typescript
interface ParsedQuery {
  textSearch: string;        // Pass to existing ILIKE search
  fieldFilters: Array<{
    field: string;
    operator: 'eq' | 'neq' | 'like' | 'ilike';
    value: string;
  }>;
}

function parseBasicSearch(query: string): ParsedQuery {
  // Pattern for field:value searches
  const fieldPattern = /(\w+):(\S+)/g;
  // Pattern for exclusions
  const excludePattern = /-(\w+)(?::(\S+))?/g;

  let textSearch = query;
  const fieldFilters: ParsedQuery['fieldFilters'] = [];

  // Extract field:value filters
  let match;
  while ((match = fieldPattern.exec(query)) !== null) {
    const [fullMatch, field, value] = match;

    // Handle wildcards for LIKE operations
    if (value.includes('*')) {
      fieldFilters.push({
        field,
        operator: 'ilike',
        value: value.replace(/\*/g, '%')
      });
    } else {
      fieldFilters.push({
        field,
        operator: 'eq',
        value
      });
    }

    textSearch = textSearch.replace(fullMatch, '').trim();
  }

  // Extract exclusions
  textSearch = textSearch.replace(excludePattern, (match, field, value) => {
    if (value) {
      // -field:value format
      fieldFilters.push({
        field,
        operator: 'neq',
        value
      });
    } else {
      // -field format (boolean exclusion)
      fieldFilters.push({
        field,
        operator: 'neq',
        value: 'true'
      });
    }
    return ''; // Remove from text search
  });

  // Clean up boolean operators (treat as text for now)
  textSearch = textSearch
    .replace(/\bAND\b/g, ' ')
    .replace(/\bOR\b/g, ' ')
    .trim()
    .replace(/\s+/g, ' '); // Normalize spaces

  return { textSearch, fieldFilters };
}
```

### Integration with Existing Code

```typescript
// In Edge Function
export async function enhancedSearch(query: string, resource: string) {
  const parsed = parseBasicSearch(query);

  // Build filter object
  let filter: any = {};

  // Add text search using existing ILIKE logic
  if (parsed.textSearch) {
    filter.q = parsed.textSearch; // Existing applyFullTextSearch handles this
  }

  // Add field-specific filters
  for (const fieldFilter of parsed.fieldFilters) {
    const filterKey = `${fieldFilter.field}@${fieldFilter.operator}`;
    filter[filterKey] = fieldFilter.value;
  }

  // Call existing data provider
  return dataProvider.getList(resource, {
    filter,
    pagination: { page: 1, perPage: 50 },
    sort: { field: 'created_at', order: 'DESC' }
  });
}
```

## Test Cases

### Core Functionality Tests

```typescript
describe('parseBasicSearch', () => {
  test('plain text search', () => {
    expect(parseBasicSearch("john smith")).toEqual({
      textSearch: "john smith",
      fieldFilters: []
    });
  });

  test('field filter', () => {
    expect(parseBasicSearch("status:active")).toEqual({
      textSearch: "",
      fieldFilters: [{ field: "status", operator: "eq", value: "active" }]
    });
  });

  test('exclusion', () => {
    expect(parseBasicSearch("-archived")).toEqual({
      textSearch: "",
      fieldFilters: [{ field: "archived", operator: "neq", value: "true" }]
    });
  });

  test('field exclusion', () => {
    expect(parseBasicSearch("-status:closed")).toEqual({
      textSearch: "",
      fieldFilters: [{ field: "status", operator: "neq", value: "closed" }]
    });
  });

  test('email wildcard', () => {
    expect(parseBasicSearch("email:*@gmail.com")).toEqual({
      textSearch: "",
      fieldFilters: [{ field: "email", operator: "ilike", value: "%@gmail.com" }]
    });
  });

  test('complex combination', () => {
    expect(parseBasicSearch("john smith status:active -archived")).toEqual({
      textSearch: "john smith",
      fieldFilters: [
        { field: "status", operator: "eq", value: "active" },
        { field: "archived", operator: "neq", value: "true" }
      ]
    });
  });

  test('CRM use case: trade show', () => {
    expect(parseBasicSearch("NRA Show principal:Fishpeople -status:closed")).toEqual({
      textSearch: "NRA Show",
      fieldFilters: [
        { field: "principal", operator: "eq", value: "Fishpeople" },
        { field: "status", operator: "neq", value: "closed" }
      ]
    });
  });
});
```

### Performance Requirements

- Parse time: < 5ms for typical queries
- Parse time: < 10ms for 100+ character queries
- No memory leaks with repeated parsing
- Safe against malformed input (no crashes)

### Security Considerations

- Parser only extracts patterns, doesn't generate SQL
- PostgREST parameterization handles SQL injection prevention
- Field names validated against allowed list in Edge Function
- Values escaped by Supabase client library

## Migration Path

1. **Phase 1:** Implement parser in Edge Function (2h)
2. **Phase 2:** Add field filter support to frontend (2h)
3. **Phase 3:** Update search UI with syntax hints (1h)
4. **Phase 4:** Add search syntax documentation (1h)

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Users expect quoted phrase support | Add in Phase 5 if needed |
| Complex boolean logic needed | Upgrade to PEG.js parser |
| Performance at scale | Add caching layer if needed |
| SQL injection | Use parameterized queries (already done) |

## Recommendations

1. **Implement simple regex parser** - It's sufficient for Basic Search
2. **Keep existing ILIKE search** - It already works well
3. **Deploy in Edge Function** - Better security and maintainability
4. **Start with MVP** - Add complexity only if users request it
5. **Monitor usage** - Track which features users actually use

## Conclusion

By enhancing the existing working search with a simple field filter parser, we can deliver Phase 4 search requirements with minimal complexity and risk. The confidence level increases from 45% to 90% because:

- ✅ We're building on proven, working code
- ✅ Simple implementation reduces bugs
- ✅ Comprehensive test coverage defined
- ✅ Clear migration path
- ✅ Security handled by existing infrastructure

## Next Steps

1. Update `P4-E2-S1-T5` task description with this design
2. Reduce estimate from 4h to 2h (simpler than expected)
3. Create Edge Function with parser
4. Add integration tests
5. Update frontend to use new endpoint