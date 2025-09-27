# Data Provider Filter Patterns Research

Research findings on how the Atomic CRM data provider handles filters and queries, specifically focusing on array-based filters and multi-select patterns for implementing PostgREST IN operator support.

## Relevant Files
- `/src/atomic-crm/providers/supabase/unifiedDataProvider.ts`: Main data provider with filter processing and search transformation
- `/node_modules/@raphiniert/ra-data-postgrest/esm/urlBuilder.js`: PostgREST filter parsing and URL query generation
- `/node_modules/@raphiniert/ra-data-postgrest/esm/index.js`: Core PostgREST data provider implementation
- `/node_modules/ra-supabase-core/esm/dataProvider.js`: Supabase wrapper around PostgREST provider
- `/src/atomic-crm/providers/supabase/resources.ts`: Resource configuration including searchable fields
- `/src/components/admin/toggle-filter-button.tsx`: Single-value filter toggle implementation
- `/src/components/admin/multi-select-input.tsx`: Multi-select input component for forms
- `/src/atomic-crm/providers/commons/activity.ts`: Existing IN operator usage examples

## Architectural Patterns

### **Data Provider Chain Architecture**
- **Unified Layer**: `unifiedDataProvider.ts` handles validation, transformations, and search processing
- **Base Layer**: `ra-supabase-core` provides authentication and session management
- **PostgREST Layer**: `@raphiniert/ra-data-postgrest` converts React Admin filters to PostgREST query syntax
- **Query Generation**: Filter objects are converted to URL query parameters using `parseFilters()` function

### **Filter Processing Flow**
1. **React Admin Filter Object** → Unified Data Provider
2. **Search Parameter Processing** → `applySearchParams()` adds full-text search and soft delete filters
3. **PostgREST Filter Parsing** → `parseFilters()` converts to PostgREST operators
4. **URL Query Generation** → `qs.stringify()` creates final HTTP query string

### **Filter Operator Support**
- **Direct Operators**: `eq`, `gt`, `gte`, `lt`, `lte`, `neq`, `like`, `ilike`, `in`, `is`, etc.
- **Special Syntax**: Filters with `@` operator syntax (e.g., `"field@operator": value`)
- **Logical Operators**: `@or` and `@and` for complex filter combinations
- **Array Operators**: `@in` operator with parentheses syntax: `"field@in": "(value1,value2,value3)"`

### **Existing Array Filter Patterns**
- **IN Operator Usage**: Found in `/src/atomic-crm/providers/commons/activity.ts`
  - Pattern: `"sales_id@in": "(${salesId})"` for single value
  - Pattern: `"contact_id@in": "(${contactIds})"` for comma-separated values
  - Pattern: `"name@in": "(${names.map(name => `"${name}"`).join(",")})"` for quoted strings

## Edge Cases & Gotchas

### **PostgREST IN Operator Requirements**
- Values must be wrapped in parentheses: `"(value1,value2,value3)"`
- String values need proper escaping/quoting when containing special characters
- Array conversion happens in `parseFilters()` - filters are processed as strings initially
- No automatic array-to-IN conversion exists - manual formatting required

### **Database Schema Constraints**
- **Tags Field**: `contacts.tags` is `bigint[]` array type in PostgreSQL
- **Array Queries**: Use `@>` operator for "contains" or `@in` for "in list" operations
- **Index Support**: GIN indexes recommended for array field performance (noted in performance docs)

### **Filter State Management Limitations**
- `ToggleFilterButton` only handles single-value filters with simple add/remove logic
- Multi-value filters need custom state management for accumulating selected values
- Filter objects are merged/replaced - no built-in array accumulation pattern

### **Data Normalization Patterns**
- `normalizeJsonbArrayFields()` ensures JSONB fields like `email`, `phone`, `tags` are always arrays
- Applied in `getList`, `getOne`, `getMany`, `getManyReference` to prevent runtime errors
- Essential for components expecting array data (like `SingleFieldList`)

## Relevant Docs
- [PostgREST API Reference - Operators](https://postgrest.org/en/stable/api.html#operators)
- [React Admin Filter Documentation](https://marmelab.com/react-admin/FilteringTutorial.html)
- [Supabase PostgREST Guide](https://supabase.com/docs/guides/api/rest-filters)
- Internal: `/docs/database/05-performance-index-report.md` - Array query optimization patterns