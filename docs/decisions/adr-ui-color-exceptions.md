# ADR: Intentional Color Exceptions to Semantic Token System

## Status

Accepted

## Context

Crispy CRM enforces the use of semantic color tokens (e.g., `text-destructive`, `bg-success`, `text-muted-foreground`) instead of hardcoded Tailwind utility classes or hex values (e.g., `text-red-500`, `#ef4444`). This promotes consistency, theming support, and maintainability across the application.

However, certain technical constraints and backward compatibility requirements necessitate exceptions to this rule. This ADR documents files that intentionally use hex color values and the justification for each exception.

## Decision

We accept the use of literal hex color values in the following scenarios:

### 1. Email Templates (ACCEPTABLE)

**Files:**
- `src/emails/daily-digest.generator.ts`
- `src/emails/daily-digest.types.ts`
- `supabase/functions/digest-opt-out/index.ts`

**Justification:** Email templates require inline styles with literal hex values because CSS variables and external stylesheets are not reliably supported across email clients. Email rendering engines have limited CSS support, necessitating inline styles with hardcoded color values for consistent cross-client rendering.

**Example:**
```typescript
style="color: #059669; background-color: #f0fdf4;"
```

### 2. Color Types Mapping (ACCEPTABLE)

**File:**
- `src/lib/color-types.ts`

**Justification:** This file serves as a mapping layer between legacy hex color values stored in the database and semantic color names. It exists to support data migration and maintain backward compatibility with existing data that was created before the semantic token system was implemented. The hex values here are reference constants used for translation, not UI rendering.

**Example:**
```typescript
const colorMap = {
  '#ef4444': 'destructive',
  '#059669': 'success',
  // ...
};
```

## Consequences

### Positive

- Email templates render consistently across email clients by using inline styles with hex values
- Legacy data can be migrated to semantic colors without breaking existing functionality
- The semantic token system remains enforced throughout the rest of the application
- Exceptions are documented and traceable

### Negative

- Email template colors must be manually updated if the design system changes
- The `color-types.ts` mapping must be maintained as long as legacy data exists
- Developers must understand which contexts allow hex values versus requiring semantic tokens

### Mitigation

- All exceptions are documented in this ADR
- Code comments in exception files should reference this ADR
- Future audits should verify no new hex values are introduced outside these approved contexts
