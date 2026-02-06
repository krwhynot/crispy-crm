# Search Architecture

This document explains how search and filtering currently works in the Crispy CRM Supabase data layer.

## Runtime Flow (Actual Order)

For `getList`, search processing happens in this order:

1. UI builds a filter object from autocomplete input:
   - `getQSearchAutocompleteProps()` -> `{ q: "kyle" }`
   - `getAutocompleteProps("name")` -> `{ "name@ilike": "%kyle%" }`
2. `composedDataProvider.getList()` calls `applySearchParams(resource, params)` first.
3. `applySearchParams()` transforms filters:
   - virtual filters (`stale`)
   - `$or` -> `@or`
   - arrays -> PostgREST operators (`@in`, `@cs`)
   - soft-delete filters (when needed)
   - `q` -> raw PostgREST `or@` search (for configured resources)
4. Request is routed to the resource handler (if resource is in `HANDLED_RESOURCES`), where `beforeGetList` may apply additional transforms.
5. Query executes on the mapped database table/view from `getDatabaseResource()`.

## Two Input Search Helpers

### 1. `getQSearchAutocompleteProps()` (Multi-field `q`)

Use when backend supports `q` transformation for that resource.

```tsx
<ReferenceInput source="contact_id" reference="contacts">
  <AutocompleteInput {...getQSearchAutocompleteProps()} />
</ReferenceInput>
```

### 2. `getAutocompleteProps(fieldName)` (Single-field ILIKE)

Use for simple, explicit field search.

```tsx
<ReferenceInput source="tag_id" reference="tags">
  <AutocompleteInput {...getAutocompleteProps("name")} />
</ReferenceInput>
```

## `q` Search Coverage

### Central `applySearchParams()` (`SEARCHABLE_RESOURCES`)

All `q` search transformations are handled centrally in `applySearchParams()` before callbacks run.
Configured in `resources.ts`:

| Resource | Fields |
|----------|--------|
| organizations | name, phone, website, postal_code, city, state, description |
| organizations_summary | name, phone, website, postal_code, city, state, description |
| contacts | first_name, last_name, company_name, title |
| contacts_summary | first_name, last_name |
| opportunities | name, description, next_action, lead_source, customer_organization_name |
| opportunities_summary | name, description, next_action, lead_source, principal_organization_name, customer_organization_name |
| products | name, category, description, manufacturer_part_number |
| sales | first_name, last_name, email |

### Callback-level `q` transforms

**None.** All `q` search logic has been consolidated to the central `SEARCHABLE_RESOURCES` layer.
Callbacks only handle:
- Soft-delete filtering
- Computed field stripping
- Resource-specific data transforms

## Resource Name Guidance

Prefer base resource names in `ReferenceInput` (`contacts`, `organizations`, `opportunities`, `products`, etc.).

Why:
- You keep handler-specific behavior (`beforeGetList`, soft-delete handling, callback logic).
- `getDatabaseResource()` still maps list calls to summary views when appropriate.

Using a summary resource directly (for example `contacts_summary`) may still search if that resource is configured in `SEARCHABLE_RESOURCES`, but it bypasses handler-level callback logic.

## Common Mistakes

### Assuming `q` is transformed in callbacks

`q` is processed **exclusively** by `applySearchParams()` in the central layer. Callbacks no longer handle `q` transformation. To add `q` search support for a resource, add it to `SEARCHABLE_RESOURCES` in `resources.ts`.

### Using summary resources in inputs expecting handler behavior

If you need callback-specific behavior, use base resource names in `ReferenceInput`.

### Using `q` for resources not configured for central `q` search

If a resource is not in `SEARCHABLE_RESOURCES`, `q` does not produce central multi-field search behavior. Use `getAutocompleteProps(field)` or add search config for that resource.

## Files Reference

| File | Purpose |
|------|---------|
| `src/atomic-crm/utils/autocompleteDefaults.ts` | Autocomplete helper props (`q` and field-specific search) |
| `src/atomic-crm/providers/supabase/composedDataProvider.ts` | Routes resources and applies `applySearchParams()` |
| `src/atomic-crm/providers/supabase/dataProviderUtils.ts` | Search/filter transformation pipeline (`applySearchParams`) |
| `src/atomic-crm/providers/supabase/resources.ts` | `SEARCHABLE_RESOURCES` and resource mappings |
| `src/atomic-crm/providers/supabase/callbacks/*.ts` | Resource-specific `beforeGetList` transforms |
