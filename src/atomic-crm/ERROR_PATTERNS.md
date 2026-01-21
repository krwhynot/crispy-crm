# Error Handling Patterns - Decision Tree & Examples

**Version:** 1.0
**Last Updated:** January 21, 2026
**Engineering Constitution:** Single source of truth for errors

---

## Quick Decision Tree

### "I'm in a React component and need to show an error"
```
                    ┌─ Do you have useNotify()?
                    │
         YES ◄──────┤     ┌─ Use useSafeNotify()
                    │     │  const { error } = useSafeNotify();
                    │     │  error(err, { operation: "create" });
                    │     │
                    └─────┤
                          │
                          └─ Recommended for 99% of cases
```

### "I'm in a service or utility function"
```
                    ┌─ Can you just throw the error?
                    │
         YES ◄──────┤     ┌─ throw mappedError(err, context)
                    │     │  (caller will handle with useSafeNotify)
                    │     │
         NO ◄───────┤
                    │     ┌─ Use handleServiceError()
                    │     │  or throw with mapErrorToUserMessage()
                    └─────┘
```

### "I'm in a DataProvider handler or wrapper"
```
                    ┌─ Is it a custom method or RPC?
                    │
         YES ◄──────┤     ┌─ Use withErrorLogging wrapper (automatic)
                    │     │  or manually throw with mapErrorToUserMessage()
                    │     │
         NO ◄───────┤
                    │     └─ Error already logged by withErrorLogging
                    │        (don't double-log)
                    └─
```

---

## Pattern 1: UI Hooks (Most Common)

### ✅ DO: Use `useSafeNotify` for toast/notification errors

```typescript
import { useSafeNotify } from "@/atomic-crm/hooks/useSafeNotify";

function MyComponent() {
  const { success, error, warning } = useSafeNotify();
  const [create] = useCreate();

  const handleCreate = async () => {
    try {
      await create("contacts", { data: { name: "John Doe" } });
      success("Contact created");
    } catch (err) {
      // ✅ GOOD: Let useSafeNotify handle sanitization
      error(err, { operation: "create", entity: "contact" });
      // Or with custom fallback:
      error(err, "Couldn't create contact. Please try again.");
    }
  };

  return <button onClick={handleCreate}>Create</button>;
}
```

### ✅ DO: Use context for dynamic messages

```typescript
// With operation context for fallback
error(err, { operation: "create", entity: "organization" });
// Result if unknown error: "Couldn't create organization. Please try again."

error(err, { operation: "delete", entity: "contact" });
// Result if unknown error: "Couldn't delete contact. Please try again."

error(err, { operation: "import", entity: "opportunity" });
// Result if unknown error: "Couldn't import opportunity. Please try again."
```

### ✅ DO: Provide fallback text for complex operations

```typescript
// When the operation has special context not captured by operation/entity
error(err, "Failed to import organizations. Please check the CSV format and try again.");

// Or mix context with fallback:
error(err, {
  operation: "import",
  entity: "organization",
  fallback: "Failed to import organizations. Please check the CSV format.",
});
```

### ❌ DON'T: Pass raw error.message

```typescript
// ❌ BAD: Technical message may leak to user
notify(error.message, { type: "error" });

// ❌ BAD: Template string with error message
notify(`Error: ${error.message}`, { type: "error" });

// ❌ BAD: Conditional fallback doesn't sanitize
notify(error.message || "Failed", { type: "error" });
```

---

## Pattern 2: Service Layer

### ✅ DO: Use `mapErrorToUserMessage` in services

```typescript
// src/atomic-crm/services/contacts.service.ts
import { mapErrorToUserMessage, type ErrorContext } from "@/utils/errorMapper";

export class ContactsService {
  async createBatch(contacts: Contact[]): Promise<Contact[]> {
    try {
      return await this.validateAndCreate(contacts);
    } catch (err) {
      const userMessage = mapErrorToUserMessage(err, {
        operation: "create",
        entity: "contacts",
        customContext: { batchSize: contacts.length },
      });

      // Re-throw with user message for UI to show
      const error = new Error(userMessage);
      error.cause = err;
      throw error;
    }
  }
}
```

### ✅ DO: Use `handleServiceError` for logging + throwing

```typescript
import { handleServiceError } from "@/atomic-crm/services/utils/handleServiceError";

export class OpportunitiesService {
  async archiveWithRelations(opportunityId: string): Promise<void> {
    try {
      // ... archive logic
    } catch (err) {
      handleServiceError("OpportunitiesService", "archive with relations", {
        opportunityId,
      }, err);
      // handleServiceError will re-throw with mapErrorToUserMessage
    }
  }
}
```

### ❌ DON'T: Throw raw errors from services

```typescript
// ❌ BAD: Caller won't know error is already sanitized
throw err;

// ❌ BAD: Technical message leaks through
throw new Error(`Failed: ${error.message}`);

// ✅ GOOD instead:
throw new Error(mapErrorToUserMessage(err, { operation: "create", entity: "contact" }));
```

---

## Pattern 3: DataProvider Handlers

### ✅ DO: Let `withErrorLogging` handle errors

```typescript
// src/atomic-crm/providers/supabase/handlers/contactsHandler.ts
import { withErrorLogging, withValidation, withLifecycleCallbacks } from "../wrappers";

export function createContactsHandler(baseProvider: DataProvider): DataProvider {
  // withErrorLogging is OUTERMOST - catches all errors
  return withErrorLogging(
    withLifecycleCallbacks(
      withValidation(baseProvider),
      [contactsCallbacks]
    )
  );
}

// withErrorLogging automatically:
// 1. Logs error with full context
// 2. Transforms Supabase errors to validation format
// 3. Maps technical errors to user messages (in logs)
```

### ✅ DO: Use validation errors for form feedback

```typescript
// When Zod validation fails in a handler
function beforeSave(resource: string, data: unknown) {
  try {
    const validated = contactSchema.parse(data);
    return validated;
  } catch (err) {
    // Zod errors are caught by withErrorLogging
    // withErrorLogging transforms them to React Admin format
    throw err; // withErrorLogging handles the rest
  }
}
```

### ❌ DON'T: Add extra error handling in handlers

```typescript
// ❌ BAD: Double logging, breaks withErrorLogging chain
try {
  await operation();
} catch (err) {
  console.error("Custom error:", err);
  throw err;
}

// ✅ GOOD: Let withErrorLogging handle it
try {
  await operation();
} catch (err) {
  throw err; // Caught by withErrorLogging wrapper
}
```

---

## Pattern 4: Specialized Cases

### For Async Operations (Mutations)

```typescript
// useMutation from @tanstack/react-query
const mutation = useMutation({
  mutationFn: async (data: CreateInput) => {
    return await dataProvider.create("contacts", { data });
  },
  onError: (error: Error) => {
    const { error: safeError } = useSafeNotify();
    safeError(error, { operation: "create", entity: "contact" });
  },
});
```

### For Dialog Forms

```typescript
function MyDialog({ onClose }: Props) {
  const { error: safeError } = useSafeNotify();
  const [create] = useCreate();

  const onSubmit = async (data: FormData) => {
    try {
      await create("organizations", { data });
      onClose();
    } catch (err) {
      // Show error in dialog, not toast
      safeError(err, "Failed to create organization");
      // Dialog stays open for user to retry
    }
  };

  return <form onSubmit={onSubmit}>...</form>;
}
```

### For File Uploads

```typescript
async function handleFileUpload(file: File) {
  try {
    const result = await uploadToStorage(file);
    success(`Uploaded ${file.name}`);
  } catch (err) {
    error(err, {
      operation: "import",
      entity: "file",
      customContext: { filename: file.name, size: file.size },
    });
  }
}
```

### For Network Retries

```typescript
async function fetchWithRetry(url: string, maxRetries = 3) {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fetch(url);
    } catch (err) {
      lastError = err;
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }

  // After all retries exhausted, throw with user message
  const userMessage = mapErrorToUserMessage(lastError, {
    operation: "fetch",
    customContext: { retries: maxRetries },
  });
  throw new Error(userMessage);
}
```

---

## Pattern 5: Error Type Checks

### ✅ DO: Use type guard functions

```typescript
import {
  isNetworkErrorType,
  isAuthErrorType,
  isValidationErrorType,
  isConstraintViolation,
} from "@/utils/errorMapper";

// Use for conditional logic
if (isAuthErrorType(error)) {
  // Redirect to login
  navigate("/login");
} else if (isNetworkErrorType(error)) {
  // Show retry button
  showRetryOption();
} else if (isValidationErrorType(error)) {
  // Focus on first invalid field
  focusFirstInvalidField();
} else if (isConstraintViolation(error)) {
  // Show deletion prevention message
  showCantDeleteMessage();
}
```

---

## Pattern 6: Testing Error Paths

### ✅ DO: Test error scenarios

```typescript
describe("ContactsForm", () => {
  it("shows user-friendly message on constraint violation", async () => {
    const mockError = new Error(
      'duplicate key value violates unique constraint "email"'
    );
    vi.mocked(useCreate).mockRejectedValueOnce(mockError);

    render(<ContactsForm />);
    await userEvent.click(screen.getByRole("button", { name: /create/i }));

    // Should show user-friendly message, NOT the constraint violation text
    expect(screen.getByRole("alert")).toHaveTextContent("already in use");
  });

  it("shows user-friendly message on network error", async () => {
    const mockError = new Error("Failed to fetch");
    vi.mocked(useCreate).mockRejectedValueOnce(mockError);

    render(<ContactsForm />);
    await userEvent.click(screen.getByRole("button", { name: /create/i }));

    expect(screen.getByRole("alert")).toHaveTextContent("Connection issue");
  });

  it("shows fallback message for unknown errors", async () => {
    const mockError = new Error("Unknown database error XYZ");
    vi.mocked(useCreate).mockRejectedValueOnce(mockError);

    render(<ContactsForm />);
    await userEvent.click(screen.getByRole("button", { name: /create/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Couldn't create contact"
    );
  });
});
```

---

## Ban List (Anti-Patterns)

### ❌ BANNED PATTERNS

1. **Raw error.message in notify**
   ```typescript
   notify(error.message, { type: "error" }); // ❌
   ```
   Replace with:
   ```typescript
   const { error } = useSafeNotify();
   error(err); // ✅
   ```

2. **Template strings with error.message**
   ```typescript
   notify(`Error: ${error.message}`, { type: "error" }); // ❌
   ```
   Replace with:
   ```typescript
   error(err, "User-friendly fallback"); // ✅
   ```

3. **Conditional fallback without sanitization**
   ```typescript
   notify(error.message || "Failed", { type: "error" }); // ❌ (might show technical error)
   ```
   Replace with:
   ```typescript
   error(err, "Friendly fallback"); // ✅
   ```

4. **Silent error swallowing**
   ```typescript
   try {
     await create(...);
   } catch (err) {
     // No error shown to user ❌
   }
   ```
   Replace with:
   ```typescript
   try {
     await create(...);
   } catch (err) {
     error(err); // ✅ Always notify user
   }
   ```

5. **Passing error objects directly to UI**
   ```typescript
   setState({ error }); // ❌ Will render [object Object]
   ```
   Replace with:
   ```typescript
   const userMessage = mapErrorToUserMessage(error);
   setState({ errorMessage: userMessage }); // ✅
   ```

---

## Common Error Scenarios & Solutions

### Scenario: User tries to delete a contact with opportunities

**Raw Error:** "violates foreign key constraint"
**User Message (with our mapping):** "Cannot delete — other records depend on this."

```typescript
try {
  await dataProvider.delete("contacts", { id });
} catch (err) {
  // mapErrorToUserMessage automatically handles this
  error(err);
  // Shows: "Cannot delete — other records depend on this."
}
```

### Scenario: User tries to create duplicate organization name

**Raw Error:** "duplicate key value violates unique constraint"
**User Message:** "This name is already in use. Please choose a different name."

```typescript
onError: (err) => {
  error(err, { operation: "create", entity: "organization" });
  // mapErrorToUserMessage detects "duplicate key" + "name"
  // Shows: "This name is already in use. Please choose a different name."
}
```

### Scenario: User session times out

**Raw Error:** "JWT token has expired"
**User Message:** "Your session expired. Please sign in again."

```typescript
try {
  const data = await fetchData();
} catch (err) {
  if (isAuthErrorType(err)) {
    // Trigger logout
    logout();
    // Show message
    error(err);
    // Shows: "Your session expired. Please sign in again."
  }
}
```

### Scenario: Network connection lost during import

**Raw Error:** "Failed to fetch"
**User Message:** "Connection issue. Please check your internet and try again."

```typescript
try {
  await importFile(file);
} catch (err) {
  error(err, {
    operation: "import",
    entity: "organizations",
  });
  // If network error: "Connection issue. Please check your internet..."
  // If other error: "Couldn't import organizations. Please try again."
}
```

---

## Checklist for Code Review

When reviewing a PR, check:

- [ ] **No raw `error.message`** - All errors use `useSafeNotify()` or `mapErrorToUserMessage()`
- [ ] **User-friendly messages** - No Postgres codes, SQL terms, or stack traces visible to users
- [ ] **Proper context** - Error has operation/entity context for smart fallback messages
- [ ] **Type safety** - Uses error type guards (`isAuthErrorType`, etc.) when needed
- [ ] **Test coverage** - At least 2-3 error scenarios tested (constraint, network, validation)
- [ ] **No silent failures** - All error paths show user notification
- [ ] **Service errors** - Services use `mapErrorToUserMessage()` or `handleServiceError()`
- [ ] **Handler errors** - DataProvider errors flow through `withErrorLogging`

---

## File Organization

```
src/
├── utils/
│   ├── errorMapper.ts           ← Core: mapErrorToUserMessage()
│   └── __tests__/
│       └── errorMapper.test.ts   ← 50+ test cases
│
├── atomic-crm/
│   ├── hooks/
│   │   └── useSafeNotify.ts      ← UI layer
│   │
│   ├── services/
│   │   ├── utils/
│   │   │   └── handleServiceError.ts  ← Service layer
│   │   │
│   │   ├── contacts.service.ts   ← Uses mapErrorToUserMessage()
│   │   ├── opportunities.service.ts
│   │   └── ...
│   │
│   ├── providers/
│   │   └── supabase/
│   │       ├── wrappers/
│   │       │   └── withErrorLogging.ts  ← Handler layer
│   │       │
│   │       └── handlers/
│   │           ├── contactsHandler.ts
│   │           └── ...
│   │
│   └── ERROR_PATTERNS.md         ← This file!
│
└── docs/
    └── ERROR_HANDLING_STRATEGY.md ← Full strategy
```

---

## References

- **Strategy Document:** `/docs/ERROR_HANDLING_STRATEGY.md`
- **Error Mapper:** `/src/utils/errorMapper.ts`
- **Safe Notify Hook:** `/src/atomic-crm/hooks/useSafeNotify.ts`
- **Service Error Handler:** `/src/atomic-crm/services/utils/handleServiceError.ts`
- **Error Logging Wrapper:** `/src/atomic-crm/providers/supabase/wrappers/withErrorLogging.ts`

---

**Questions?** Check the decision tree at the top, then reference the appropriate pattern section.
