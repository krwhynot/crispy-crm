# Error Handling: Quick Start Guide

**TL;DR:** Always use `useSafeNotify().error(err)` - not `notify(error.message)`

---

## The One Rule

### ✅ DO THIS (In any React component with notify access)

```typescript
import { useSafeNotify } from "@/atomic-crm/hooks/useSafeNotify";

function MyComponent() {
  const { error } = useSafeNotify();

  const handleAction = async () => {
    try {
      await someOperation();
    } catch (err) {
      error(err); // That's it! Error is automatically user-friendly
    }
  };
}
```

### ❌ NEVER DO THIS

```typescript
// ❌ BAD - Raw error.message may contain Postgres codes, SQL terms, etc.
notify(error.message, { type: "error" });

// ❌ BAD - Template string doesn't sanitize
notify(`Error: ${error.message}`, { type: "error" });
```

---

## Three Scenarios

### Scenario 1: Simple Error (Most Common)

```typescript
const { error } = useSafeNotify();

try {
  await create("contacts", { data });
} catch (err) {
  error(err); // ✅ Shows: "Couldn't create contact. Please try again."
}
```

**Result:** Context-aware message based on operation

### Scenario 2: Error with Context

```typescript
const { error } = useSafeNotify();

try {
  await deleteContactOperation(id);
} catch (err) {
  error(err, {
    operation: "delete",
    entity: "contact"
  });
  // ✅ Shows: "Couldn't delete contact. Please try again."
  // Or if FK violation: "Cannot delete — other records depend on this."
}
```

**Result:** Smart context-aware messages

### Scenario 3: Custom Fallback

```typescript
const { error } = useSafeNotify();

try {
  await complexImportOperation();
} catch (err) {
  error(err, "Failed to import. Please check the file format and try again.");
  // ✅ Shows custom message if error can't be mapped
}
```

**Result:** Fallback is user-friendly, not a raw error

---

## Real Examples from Codebase

### Example 1: Quick Add (useQuickAdd.ts)

**BEFORE:**
```typescript
onError: (error: Error) => {
  notify(`Failed to create opportunity: ${error.message}`, {
    type: "error",
  });
},
```

**AFTER:**
```typescript
import { useSafeNotify } from "@/atomic-crm/hooks/useSafeNotify";

// In component:
const { error } = useSafeNotify();

onError: (error: Error) => {
  error(error, { operation: "create", entity: "opportunity" });
},
```

### Example 2: Tag Quick Input (TagQuickInput.tsx)

**BEFORE:**
```typescript
onError: (error) => {
  notify(`Error: ${error.message}`, { type: "error" });
},
```

**AFTER:**
```typescript
import { useSafeNotify } from "@/atomic-crm/hooks/useSafeNotify";

// In component:
const { error } = useSafeNotify();

onError: (error) => {
  error(error, { operation: "create", entity: "tag" });
},
```

### Example 3: Organization Import (useOrganizationImportExecution.ts)

**BEFORE:**
```typescript
catch (error: unknown) {
  notify(`Import failed: ${error instanceof Error ? error.message : "Import failed"}`, {
    type: "error",
  });
  // ...
}
```

**AFTER:**
```typescript
import { useSafeNotify } from "@/atomic-crm/hooks/useSafeNotify";

// In component:
const { error } = useSafeNotify();

catch (error: unknown) {
  error(error, { operation: "import", entity: "organization" });
  // Automatically shows friendly message
}
```

---

## What Gets Fixed Automatically

### Before (Raw Error Message)
- "violates foreign key constraint" ❌
- "duplicate key value violates unique constraint" ❌
- "null value in column 'email' violates not-null constraint" ❌
- "JWT token has expired" ❌
- "Failed to fetch" ❌

### After (User-Friendly Message)
- "Cannot delete — other records depend on this." ✅
- "This already exists. Please use a different value." ✅
- "Email is required." ✅
- "Your session expired. Please sign in again." ✅
- "Connection issue. Please check your internet and try again." ✅

---

## 5-Minute Checklist for Your PR

- [ ] Search PR for `error.message` - should find 0 results
- [ ] Search PR for `notify(` with error - should use `useSafeNotify()`
- [ ] If error is caught, user is notified (no silent failures)
- [ ] If you added a service, it doesn't throw raw errors
- [ ] Tests include at least 1 error scenario

---

## "But What If...?"

### "What if I need to show different messages for different errors?"

Use the context parameter:

```typescript
try {
  await operation();
} catch (err) {
  if (err instanceof ValidationError) {
    error(err, { operation: "create", entity: "contact" });
    // Shows validation-specific message
  } else {
    error(err);
    // Shows generic fallback
  }
}
```

### "What if I need to retry on network error?"

Use error type guards:

```typescript
import { isNetworkErrorType } from "@/utils/errorMapper";

try {
  await operation();
} catch (err) {
  if (isNetworkErrorType(err)) {
    // Show retry button
    setShowRetry(true);
  } else {
    error(err);
  }
}
```

### "What if I'm not in a component (no useNotify)?"

Use the mapper directly:

```typescript
import { mapErrorToUserMessage } from "@/utils/errorMapper";

// In service or utility
try {
  await operation();
} catch (err) {
  const friendlyMessage = mapErrorToUserMessage(err, {
    operation: "create",
    entity: "contact"
  });
  throw new Error(friendlyMessage);
  // Caller will use useSafeNotify().error() to show it
}
```

### "What if the error is already a nice message?"

It still works:

```typescript
const friendlyError = new Error("Username is already taken");
error(friendlyError);
// ✅ Shows: "Username is already taken"
// (mapErrorToUserMessage detects it's user-friendly and passes it through)
```

---

## File Locations (Where Things Are)

| What | File | What It Does |
|------|------|--------------|
| Core logic | `/src/utils/errorMapper.ts` | Maps errors to user-friendly messages |
| UI hook | `/src/atomic-crm/hooks/useSafeNotify.ts` | Use this in components |
| Service helper | `/src/atomic-crm/services/utils/handleServiceError.ts` | Use in services |
| Handler wrapper | `/src/atomic-crm/providers/supabase/wrappers/withErrorLogging.ts` | Automatic error handling for data provider |
| Docs | `/src/atomic-crm/ERROR_PATTERNS.md` | Decision tree & patterns |
| Full strategy | `/docs/ERROR_HANDLING_STRATEGY.md` | Everything (you are here!) |

---

## Copy-Paste Templates

### Template 1: React Component with Error Handling

```typescript
import { useSafeNotify } from "@/atomic-crm/hooks/useSafeNotify";

function MyComponent() {
  const { success, error } = useSafeNotify();

  const handleSave = async (data: FormData) => {
    try {
      const result = await dataProvider.create("organizations", { data });
      success("Organization created");
      return result;
    } catch (err) {
      error(err, { operation: "create", entity: "organization" });
    }
  };

  return (
    <form onSubmit={() => handleSave(/* data */)}>
      {/* form fields */}
    </form>
  );
}
```

### Template 2: useMutation with Error Handling

```typescript
import { useMutation } from "@tanstack/react-query";
import { useSafeNotify } from "@/atomic-crm/hooks/useSafeNotify";

const mutation = useMutation({
  mutationFn: async (data) => {
    return await dataProvider.create("contacts", { data });
  },
  onSuccess: () => {
    const { success } = useSafeNotify();
    success("Contact created");
  },
  onError: (error) => {
    const { error: safeError } = useSafeNotify();
    safeError(error, { operation: "create", entity: "contact" });
  },
});
```

### Template 3: Service Error Handling

```typescript
import { mapErrorToUserMessage } from "@/utils/errorMapper";

export class ContactsService {
  async create(contact: ContactInput): Promise<Contact> {
    try {
      return await this.dataProvider.create("contacts", { data: contact });
    } catch (err) {
      const friendlyMsg = mapErrorToUserMessage(err, {
        operation: "create",
        entity: "contact",
      });
      throw new Error(friendlyMsg);
    }
  }
}
```

---

## Test Template

```typescript
describe("MyComponent Error Handling", () => {
  it("shows user-friendly error on constraint violation", async () => {
    const mockError = new Error(
      'duplicate key value violates unique constraint "email"'
    );
    vi.mocked(useCreate).mockRejectedValueOnce(mockError);

    render(<MyComponent />);
    await userEvent.click(screen.getByRole("button", { name: /create/i }));

    // Error message should be friendly, not technical
    expect(screen.getByRole("alert")).toHaveTextContent(/already in use/i);
  });

  it("shows user-friendly error on network failure", async () => {
    const mockError = new Error("Failed to fetch");
    vi.mocked(useCreate).mockRejectedValueOnce(mockError);

    render(<MyComponent />);
    await userEvent.click(screen.getByRole("button", { name: /create/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(/connection|internet/i);
  });
});
```

---

## Common Errors (What You'll See)

### Error: "Cannot find module 'useSafeNotify'"

**Fix:** Import from correct path
```typescript
// ❌ Wrong
import { useSafeNotify } from "@/hooks/useSafeNotify";

// ✅ Right
import { useSafeNotify } from "@/atomic-crm/hooks/useSafeNotify";
```

### Error: "useSafeNotify is not a function"

**Fix:** Make sure you're calling it as a hook
```typescript
// ❌ Wrong (not in a component)
const result = useSafeNotify();

// ✅ Right (in a component)
function MyComponent() {
  const { error } = useSafeNotify();
}
```

### Error: "Cannot read property 'error' of undefined"

**Fix:** Destructure correctly
```typescript
// ❌ Wrong
const result = useSafeNotify();
result.error(err);

// ✅ Right
const { error } = useSafeNotify();
error(err);
```

---

## FAQ

**Q: Should I always use useSafeNotify?**
A: Yes. If you're in a component and showing an error to the user, use it.

**Q: What if I want a completely custom message?**
A: Pass it as the second parameter: `error(err, "My custom message")`

**Q: What about warnings or info messages?**
A: Use `warning()` and `info()` as normal - they don't need sanitization since you control them.

**Q: Will this break my existing code?**
A: No. useSafeNotify is a wrapper around React Admin's useNotify. All existing code works the same.

**Q: How do I test error handling?**
A: Mock the error, render component, check that user-friendly message is shown (not raw error).

**Q: What if I have a service that's throwing errors?**
A: Use `mapErrorToUserMessage()` in the service, then throw with the friendly message. UI will use `useSafeNotify()` to show it.

---

## Next Steps

1. **Review** `/src/atomic-crm/ERROR_PATTERNS.md` for decision tree
2. **Check** `/docs/ERROR_HANDLING_STRATEGY.md` for full details
3. **Use** the templates above for your code
4. **Test** error scenarios in your component
5. **PR** and mention in description: "Error handling via useSafeNotify()"

---

## Questions?

- 📖 **Patterns:** See `/src/atomic-crm/ERROR_PATTERNS.md`
- 🏗️ **Architecture:** See `/docs/ERROR_HANDLING_STRATEGY.md`
- 🧪 **Testing:** See `/src/utils/__tests__/errorMapper.test.ts` for examples
- 🤔 **Decision tree:** See ERROR_PATTERNS.md top section

---

**Version:** 1.0
**Updated:** January 21, 2026
**Status:** Ready for implementation
