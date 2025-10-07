# Organization Form Tabs - Shared Patterns

## Component Locations
- **Tabs:** `src/components/ui/tabs.tsx` (shadcn/ui)
- **Badge:** `src/components/ui/badge.tsx` (shadcn/ui)
- **Form Hook:** `useFormState` from `react-hook-form`
- **Target:** `src/atomic-crm/organizations/OrganizationInputs.tsx`

## Key Patterns

### Tab Definition Pattern
Use TypeScript interfaces for tab configuration:
```typescript
interface TabDefinition {
  key: string;
  label: string;
  fields: string[];
}
```

### Error Counting Pattern
Count validation errors per tab by filtering form errors against field lists:
```typescript
const { errors } = useFormState();
const errorCount = Object.keys(errors).filter(key =>
  tabFields.includes(key)
).length;
```

### Responsive Grid Pattern
Single column on mobile, two columns on landscape:
```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
```

## Field Name Corrections
**IMPORTANT:** Requirements doc has outdated field names. Use these actual field names:
- `organization_type` (NOT `organization_type_id`)
- `sales_id` (NOT `account_manager_id`)
- `industry_id` (correct)

## Engineering Constitution Reminders
1. **NO OVER-ENGINEERING**: Keep implementation simple, inline error counting
2. **SEMANTIC COLORS**: Use `variant="destructive"` for error badges
3. **BOY SCOUT RULE**: Clean up any inconsistencies found
4. **FORMS**: Use admin layer components only

## Testing Patterns
- Tab navigation: `cy.contains('Details').click()`
- Error badges: `cy.get('[data-testid="tab-general"]').find('.badge')`
- Responsive: Test at 1024px and 768px breakpoints
