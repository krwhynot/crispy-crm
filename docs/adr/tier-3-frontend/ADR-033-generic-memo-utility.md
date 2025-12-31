# ADR-033: Generic Memo Utility for TypeScript Components

## Status

**Accepted**

## Date

Original: 2024-11 | Documented: 2025-12-30

## Deciders

- krwhynot

---

## Context

React's `React.memo()` loses TypeScript generic type parameters when wrapping a component. This is a fundamental limitation of how TypeScript infers return types.

### The Problem

When you have a generic component like this:

```typescript
// Generic component with type parameter
const DateFieldImpl = <RecordType extends Record<string, any>>(
  props: DateFieldProps<RecordType>
) => {
  // Can access props.record with full type safety
  return <span>{props.record?.someField}</span>;
};
```

Wrapping it with standard `React.memo()` loses the generic:

```typescript
// PROBLEM: Type parameter is lost
export const DateField = React.memo(DateFieldImpl);
// TypeScript sees: React.MemoExoticComponent<...>
// NOT: <RecordType>(props: DateFieldProps<RecordType>) => JSX.Element

// This fails type checking:
<DateField<MyCustomRecord> source="name" /> // Error: Expected 0 type arguments
```

### Why This Matters

Crispy CRM uses React Admin field components that are generic over their record type. This enables:
- Type-safe access to record fields
- Autocomplete for field names in IDEs
- Compile-time errors when accessing non-existent fields

Without generic preservation, we'd lose these benefits on memoized components.

### Alternatives Considered

| Alternative | Pros | Cons |
|------------|------|------|
| **Don't memoize generic components** | Simple, no workarounds | Performance cost, inconsistent patterns |
| **Use `as` cast at each usage site** | Works | Verbose, error-prone, bad DX |
| **Create wrapper utility** | Single definition, reusable | Requires `@ts-expect-error` |
| **Wait for ra-core version** | Official support | Not available yet |

---

## Decision

**Create a `genericMemo` utility** that wraps `React.memo()` and preserves generic type parameters through TypeScript type casting.

### Implementation

```typescript
// src/lib/genericMemo.ts

import type { FunctionComponent } from "react";
import { memo } from "react";

/**
 * A version of React.memo that preserves the original component type allowing it to accept generics.
 * See {@link https://stackoverflow.com/a/70890101}
 * @deprecated Use genericMemo from "ra-core" when available.
 */
export function genericMemo<T>(component: T): T {
  const result = memo(component as FunctionComponent);

  // Set displayName on the memoized version for React DevTools
  // @ts-expect-error: genericMemo does not have a displayName property
  result.displayName = component.displayName?.replace("Impl", "");
  return result as unknown as T;
}
```

### How It Works

1. **Type Parameter `<T>`**: Captures the exact type of the input component, including generics
2. **Cast to FunctionComponent**: Required because `memo()` expects this type signature
3. **Return as `T`**: Casts the memoized result back to the original type, preserving generics
4. **displayName Handling**: Strips "Impl" suffix for cleaner React DevTools display

### Usage Pattern

```typescript
// 1. Define implementation with "Impl" suffix and displayName
const DateFieldImpl = <RecordType extends Record<string, any>>(
  props: DateFieldProps<RecordType>
) => {
  // Implementation
};
DateFieldImpl.displayName = "DateFieldImpl";

// 2. Export memoized version (displayName becomes "DateField")
export const DateField = genericMemo(DateFieldImpl);

// 3. Use with full generic support
<DateField<MyRecord> source="created_at" />
```

---

## Consequences

### Positive

- **Type Preservation**: Generic parameters work correctly on memoized components
- **Performance**: Components benefit from memo's referential equality checks
- **Clean DevTools**: displayName transformation provides clear component names
- **Consistent Pattern**: All field components follow the same `Impl` → `genericMemo` pattern

### Negative

- **`@ts-expect-error` Required**: The displayName assignment requires suppressing a TypeScript error
- **Deprecation**: Should migrate to ra-core version when available
- **Indirection**: Developers must understand why `genericMemo` is used vs `React.memo`

### Neutral

- **Trade-off Accepted**: The `@ts-expect-error` is documented and justified in code audit

---

## Code Examples

### Before: Type Loss with React.memo

```typescript
// Define generic component
const SelectFieldImpl = <TValue extends string | number>(
  props: SelectFieldProps<TValue>
) => { /* ... */ };

// Wrap with React.memo
export const SelectField = React.memo(SelectFieldImpl);

// BROKEN: Cannot pass type argument
<SelectField<"pending" | "approved"> source="status" choices={statusChoices} />
//          ^^^^^^^^^^^^^^^^^^^^^^^^ Error: Expected 0 type arguments
```

### After: Type Preserved with genericMemo

```typescript
// Define generic component with Impl pattern
const SelectFieldImpl = <TValue extends string | number>(
  props: SelectFieldProps<TValue>
) => { /* ... */ };
SelectFieldImpl.displayName = "SelectFieldImpl";

// Wrap with genericMemo
export const SelectField = genericMemo(SelectFieldImpl);

// WORKS: Full type inference
<SelectField<"pending" | "approved"> source="status" choices={statusChoices} />
//          ^^^^^^^^^^^^^^^^^^^^^^^^ Type argument works correctly
```

### Components Using This Pattern

```typescript
// src/components/admin/date-field.tsx:101
export const DateField = genericMemo(DateFieldImpl);

// src/components/admin/url-field.tsx:57
export const UrlField = genericMemo(UrlFieldImpl);

// src/components/admin/email-field.tsx:57
export const EmailField = genericMemo(EmailFieldImpl);

// src/components/admin/select-field.tsx:128
export const SelectField = genericMemo(SelectFieldImpl);
```

### Anti-Pattern (NEVER DO THIS)

```typescript
// WRONG: Missing displayName on Impl
const MyFieldImpl = <T>(...) => { ... };
export const MyField = genericMemo(MyFieldImpl);
// DevTools will show "undefined" instead of "MyField"

// WRONG: Using React.memo on generic components
export const MyField = React.memo(MyFieldImpl);
// Type parameter <T> is lost

// WRONG: Not using Impl suffix
const MyField = <T>(...) => { ... };
MyField.displayName = "MyField";
export const MemoizedMyField = genericMemo(MyField);
// displayName becomes "" (empty string) after .replace("Impl", "")
```

---

## Related ADRs

- None directly related (standalone utility pattern)

---

## References

- Implementation: `src/lib/genericMemo.ts`
- Stack Overflow solution: https://stackoverflow.com/a/70890101
- TypeScript issue on memo generics: https://github.com/DefinitelyTyped/DefinitelyTyped/issues/37087
- Code audit justification: `docs/archive/audits/code-quality/tier-2/16-typescript-strictness-audit.md`
