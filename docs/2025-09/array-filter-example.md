# Array Filter Transformation in UnifiedDataProvider

## Overview
The `unifiedDataProvider` now automatically transforms array filter values to the appropriate PostgREST operators, enabling support for multi-select filters in React Admin components.

## Implementation Details

### Transformation Logic
The provider detects array values in filters and converts them to PostgREST syntax:

1. **JSONB Array Fields** (tags, email, phone):
   - Uses `@cs` (contains) operator
   - Format: `{value1,value2,value3}`
   - Example: `{ tags: [1, 2, 3] }` → `{ "tags@cs": "{1,2,3}" }`

2. **Regular Fields** (enums, text):
   - Uses `@in` operator
   - Format: `(value1,value2,value3)`
   - Example: `{ status: ["active", "pending"] }` → `{ "status@in": "(active,pending)" }`

### Code Location
The transformation is implemented in:
- File: `/src/atomic-crm/providers/supabase/unifiedDataProvider.ts`
- Function: `transformArrayFilters()`
- Integration: Called within `applySearchParams()`

## Usage Examples

### Using MultiSelectInput for Tags
```tsx
import { MultiSelectInput, ReferenceInput } from "@/components/admin";

// In a filter component
<ReferenceInput source="tags" reference="tags">
  <MultiSelectInput
    optionText="name"
    emptyText="Select tags"
  />
</ReferenceInput>
```

### Direct Filter Usage
```typescript
// The data provider handles array transformation automatically
const result = await dataProvider.getList("contacts", {
  filter: {
    tags: [1, 2, 3],  // Array of tag IDs
    status: ["active", "qualified"]  // Array of status values
  },
  // ... other params
});
```

### Filter Components
```tsx
// Example: Product filter with multi-select
const ProductListFilter = () => {
  const [selectedTags, setSelectedTags] = useState([]);

  return (
    <FilterLiveForm>
      {/* This will send { tags: [1, 2, 3] } to the data provider */}
      <MultiSelectInput
        source="tags"
        choices={tagChoices}
        value={selectedTags}
        onChange={setSelectedTags}
      />
    </FilterLiveForm>
  );
};
```

## Technical Details

### How It Works
1. React Admin component sends filter with array value
2. `unifiedDataProvider.getList()` receives the filter
3. `applySearchParams()` is called with the filter
4. `transformArrayFilters()` converts arrays to PostgREST operators
5. Transformed filter is sent to Supabase

### Supported Operations
- `getList()` - List views with filters
- `getManyReference()` - Reference fields with filters
- Works with search (`q` parameter) simultaneously

### View vs Table Handling
- Summary views (`contacts_summary`, etc.) don't need `deleted_at` filter (handled internally)
- Base tables (`contacts`, etc.) automatically get `deleted_at: null` for soft delete support
- `getManyReference` uses base tables, not summary views

## Testing
Test file: `/src/atomic-crm/providers/supabase/unifiedDataProvider.arrayFilter.test.ts`

Run tests:
```bash
npm test -- unifiedDataProvider.arrayFilter.test.ts
```

## Benefits
1. **Seamless Integration**: No changes needed in React Admin components
2. **Automatic Conversion**: Arrays are automatically converted to correct PostgREST syntax
3. **Type Safety**: Works with TypeScript and existing validation
4. **Backward Compatible**: Existing filters with PostgREST operators continue to work

## Migration Notes
- No migration needed for existing code
- Components can now use arrays in filters directly
- The provider handles the conversion transparently