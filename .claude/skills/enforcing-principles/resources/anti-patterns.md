# Anti-Patterns

## Purpose

Document common mistakes in Atomic CRM development and how to avoid them. Covers validation, error handling, forms, database, and testing anti-patterns with real examples of what NOT to do.

## Core Principle: Learn from Mistakes

**Anti-Pattern:** A common solution that appears correct but creates problems.

**This document answers:** "What NOT to do and why."

##Anti-Pattern 1: Over-Engineering (Most Common)

### The Problem

Adding retry logic, circuit breakers, or graceful fallbacks during pre-launch phase.

### ❌ WRONG

```typescript
// ❌ Circuit breaker for pre-launch app
class CircuitBreaker {
  private state: 'OPEN' | 'CLOSED' | 'HALF-OPEN' = 'CLOSED';
  private failureCount = 0;
  private threshold = 5;

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      throw new Error('Circuit breaker is OPEN');
    }

    try {
      const result = await operation();
      this.reset();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private recordFailure() {
    this.failureCount++;
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
    }
  }

  private reset() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }
}

// Using circuit breaker
const breaker = new CircuitBreaker();
await breaker.execute(() => supabase.from('contacts').select());
```

**Why it's wrong:**
- 100+ lines of complexity
- No users yet = no benefit
- Hides real problems
- Hard to test and debug
- Maintenance burden

### ✅ CORRECT

```typescript
// ✅ Let it throw - simple and clear
const { data, error } = await supabase.from('contacts').select();
if (error) throw error; // Operator sees error immediately
```

**Why it's right:**
- 2 lines instead of 100+
- Loud failures = immediate investigation
- Simple code = easy to maintain
- Pre-launch = velocity over resilience

## Anti-Pattern 2: Multiple Validation Sources

### The Problem

Validating data in components, utils, AND Zod schemas.

### ❌ WRONG

```typescript
// ❌ Validation in component
function ContactForm() {
  const validateEmail = (email: string) => {
    if (!email.includes('@')) {
      return "Invalid email";
    }
    return undefined;
  };

  return <TextInput source="email" validate={validateEmail} />;
}

// ❌ Validation in utility
function isValidContact(data: any): boolean {
  if (!data.email?.includes('@')) return false;
  if (!data.first_name) return false;
  return true;
}

// ❌ Validation in schema (third definition!)
const contactSchema = z.object({
  email: z.string().email(),
  first_name: z.string().min(1),
});
```

**Why it's wrong:**
- Three different email validation definitions
- Rules can drift over time (component says valid, schema says invalid)
- Hard to maintain (change one, forget to change others)
- Violates single composable entry point (validation scattered across files)

### ✅ CORRECT

```typescript
// ✅ Centralized validation - Zod schema at API boundary
const contactSchema = z.object({
  email: z.string().email("Invalid email address"),
  first_name: z.string().min(1, "First name is required"),
});

// Component uses schema (no validation)
function ContactForm() {
  return <TextInput source="email" />; // Validation from schema
}

// Utility uses schema (no validation)
function isValidContact(data: any): boolean {
  return contactSchema.safeParse(data).success;
}
```

**Why it's right:**
- One definition of validation rules
- Changes in schema apply everywhere
- Type-safe with `z.infer`
- Easy to test

## Anti-Pattern 3: Hardcoded Form Defaults

### The Problem

Duplicating default values in components instead of deriving from schema.

### ❌ WRONG

```typescript
// ❌ Hardcoded defaults in component
const OpportunityCreate = () => {
  const formDefaults = {
    stage: 'new_lead',      // Out of sync with schema!
    priority: 'medium',
    estimated_close_date: '2025-12-31', // Wrong calculation
  };

  return <Form defaultValues={formDefaults}>...</Form>;
};

// ❌ Using defaultValue props
<SelectInput source="stage" defaultValue="new_lead" />
<SelectInput source="priority" defaultValue="medium" />
```

**Why it's wrong:**
- Defaults duplicated in schema and component
- Schema changes don't reflect in form
- Easy for defaults to drift over time

### ✅ CORRECT

```typescript
// ✅ Defaults from schema
const OpportunityCreate = () => {
  const formDefaults = {
    ...opportunitySchema.partial().parse({}), // Extracts .default() values
    opportunity_owner_id: identity?.id, // Runtime values merged
  };

  return <Form defaultValues={formDefaults}>...</Form>;
};

// NO defaultValue props
<SelectInput source="stage" /> // Default comes from schema
<SelectInput source="priority" /> // Default comes from schema
```

**Why it's right:**
- Centralized validation (Zod schema at API boundary)
- Schema changes automatically apply to forms
- Type-safe
- Less code

## Anti-Pattern 4: RLS Without GRANT

### The Problem

Creating RLS policies but forgetting to GRANT table access.

### ❌ WRONG

```sql
-- ❌ Only RLS, no GRANT
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_contacts ON contacts
  FOR SELECT TO authenticated
  USING (true);

-- Result: "permission denied for table contacts"
-- Why: authenticated role has no GRANT on table
```

**Why it's wrong:**
- RLS policies are useless without GRANT
- Cryptic error message ("permission denied")
- Hard to debug (looks like policy issue, actually GRANT issue)

### ✅ CORRECT

```sql
-- ✅ Both GRANT and RLS required
-- Step 1: Enable RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Step 2: GRANT table access
GRANT SELECT, INSERT, UPDATE, DELETE ON contacts TO authenticated;
GRANT USAGE ON SEQUENCE contacts_id_seq TO authenticated;

-- Step 3: Create RLS policies
CREATE POLICY select_contacts ON contacts
  FOR SELECT TO authenticated
  USING (true);
```

**Why it's right:**
- Two-layer security (GRANT + RLS)
- GRANT allows table access
- RLS filters rows
- Clear error messages

## Anti-Pattern 5: Promise.all() for Bulk Operations

### The Problem

Using `Promise.all()` for bulk operations causes total failure if one operation fails.

### ❌ WRONG

```typescript
// ❌ Promise.all() - fails completely if one fails
const markAllAsRead = async (ids: number[]) => {
  try {
    await Promise.all(
      ids.map((id) => update("notifications", { id, data: { read: true } }))
    );
    notify("All notifications marked as read");
  } catch (error) {
    notify("Failed to mark notifications as read");
  }
};

// If 1 out of 100 operations fails, ALL 100 fail
// Wastes work (discards 99 successes)
```

**Why it's wrong:**
- Total failure for partial failure
- Wastes successful operations
- Poor user experience (no partial success feedback)

### ✅ CORRECT

```typescript
// ✅ Promise.allSettled() - handles partial failures
const markAllAsRead = async (ids: number[]) => {
  const results = await Promise.allSettled(
    ids.map((id) => update("notifications", { id, data: { read: true } }))
  );

  const successes = results.filter(r => r.status === "fulfilled").length;
  const failures = results.filter(r => r.status === "rejected").length;

  if (failures === 0) {
    notify(`${successes} notifications marked as read`, { type: "success" });
  } else if (successes > 0) {
    notify(`${successes} succeeded, ${failures} failed`, { type: "warning" });
  } else {
    notify("All operations failed", { type: "error" });
  }
};
```

**Why it's right:**
- Partial success allowed
- Accurate user feedback
- No wasted work

## Anti-Pattern 6: Skipping CSV Validation

### The Problem

Not validating CSV uploads allows DoS attacks, formula injection, and malware uploads.

### ❌ WRONG

```typescript
// ❌ No validation - accepts any file
function ContactImport() {
  const handleFileUpload = (file: File) => {
    Papa.parse(file, {
      complete: (results) => {
        // Directly importing without validation!
        importContacts(results.data);
      }
    });
  };

  return <input type="file" onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])} />;
}
```

**Why it's wrong:**
- No file size limit (DoS via 1GB CSV)
- No format validation (accepts .exe renamed to .csv)
- No formula sanitization (Excel formula injection)
- No binary detection (malware uploads)

### ✅ CORRECT

```typescript
// ✅ Multi-layer validation
function ContactImport() {
  const handleFileUpload = async (file: File) => {
    // 1. Validate file
    const validation = await validateCsvFile(file);
    if (!validation.valid && validation.errors) {
      setValidationErrors(validation.errors);
      return;
    }

    // 2. Use secure config
    Papa.parse(file, {
      ...getSecurePapaParseConfig(),
      complete: async (results) => {
        // 3. Sanitize cells
        const sanitized = results.data.map(row => ({
          name: sanitizeCsvValue(row.name),
          email: sanitizeCsvValue(row.email),
        }));

        // 4. Validate with Zod
        await importContacts(sanitized);
      }
    });
  };

  return <input type="file" accept=".csv" onChange={...} />;
}
```

**Why it's right:**
- File size limit (10MB)
- Format validation (CSV only)
- Formula sanitization (prefix with ')
- Binary detection (magic bytes)
- Zod validation (API boundary)

## Anti-Pattern 7: Testing Implementation Details

### The Problem

Testing private methods, internal state, or implementation instead of behavior.

### ❌ WRONG

```typescript
// ❌ Testing private method
test('_calculateTotal returns correct sum', () => {
  const calculator = new Calculator();
  expect(calculator._calculateTotal([1, 2, 3])).toBe(6);
});

// ❌ Testing internal state
test('counter increments internal _count variable', () => {
  const counter = new Counter();
  counter.increment();
  expect(counter._count).toBe(1); // Testing private state!
});

// ❌ Testing implementation
test('uses reduce to sum array', () => {
  const spy = vi.spyOn(Array.prototype, 'reduce');
  sum([1, 2, 3]);
  expect(spy).toHaveBeenCalled(); // Testing HOW, not WHAT
});
```

**Why it's wrong:**
- Tests break when refactoring (even if behavior unchanged)
- Tight coupling to implementation
- Hard to maintain

### ✅ CORRECT

```typescript
// ✅ Test public behavior
test('calculates total correctly', () => {
  const calculator = new Calculator();
  expect(calculator.getTotal([1, 2, 3])).toBe(6); // Public API
});

// ✅ Test observable behavior
test('counter displays correct count', () => {
  const counter = new Counter();
  counter.increment();
  expect(counter.getValue()).toBe(1); // Observable behavior
});

// ✅ Test outcome
test('returns sum of array', () => {
  expect(sum([1, 2, 3])).toBe(6); // WHAT, not HOW
});
```

**Why it's right:**
- Tests behavior, not implementation
- Refactoring doesn't break tests
- Tests document public API

## Anti-Pattern 8: Ignoring Enum Migration Complexity

### The Problem

Trying to remove values from PostgreSQL enums (not supported).

### ❌ WRONG

```sql
-- ❌ Cannot remove enum values in PostgreSQL
ALTER TYPE priority_level DROP VALUE 'urgent'; -- Not supported!

-- ❌ Trying to work around it
DELETE FROM tasks WHERE priority = 'urgent'; -- Doesn't remove enum value
```

**Why it's wrong:**
- PostgreSQL doesn't support removing enum values
- Attempting to remove causes errors
- Leaves database in inconsistent state

### ✅ CORRECT

```sql
-- ✅ Option 1: Deprecate with comment
COMMENT ON TYPE priority_level IS 'DEPRECATED: urgent value no longer used. Use critical instead.';

-- Update existing data
UPDATE tasks SET priority = 'critical' WHERE priority = 'urgent';

-- ✅ Option 2: Create new enum and migrate
CREATE TYPE priority_level_v2 AS ENUM ('low', 'medium', 'high', 'critical');

-- Add new column
ALTER TABLE tasks ADD COLUMN priority_v2 priority_level_v2;

-- Migrate data
UPDATE tasks SET priority_v2 = priority::text::priority_level_v2 WHERE priority != 'urgent';
UPDATE tasks SET priority_v2 = 'critical' WHERE priority = 'urgent';

-- Swap columns
ALTER TABLE tasks DROP COLUMN priority;
ALTER TABLE tasks RENAME COLUMN priority_v2 TO priority;
```

**Why it's right:**
- Works within PostgreSQL limitations
- Migrates data safely
- Clear documentation

## Anti-Pattern 9: Skipping Error Logging Context

### The Problem

Throwing errors without context makes debugging impossible.

### ❌ WRONG

```typescript
// ❌ No context
try {
  await supabase.from('contacts').insert(data);
} catch (error) {
  console.error(error); // Just the error, no context!
  throw error;
}

// When it fails: "RLS policy violation"
// Questions: Which table? Which user? What data?
```

**Why it's wrong:**
- No context for debugging
- Can't reproduce issue
- Wastes investigation time

### ✅ CORRECT

```typescript
// ✅ Structured error logging
function logError(method: string, resource: string, params: any, error: unknown): void {
  const context = {
    method,
    resource,
    params: {
      id: params?.id,
      filter: params?.filter,
      data: params?.data ? "[Data Present]" : undefined,
    },
    timestamp: new Date().toISOString(),
  };

  console.error(`[DataProvider Error]`, context, {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    validationErrors: error?.body?.errors || error?.errors,
  });
}

// Usage
try {
  await baseDataProvider.create(resource, params);
} catch (error) {
  logError('create', resource, params, error);
  throw error;
}

// When it fails: Full context logged
// Method: create, Resource: contacts, Params: {...}, Error: RLS policy violation
```

**Why it's right:**
- All context in one place
- Easy to reproduce
- Faster debugging

## Anti-Pattern 10: Skipping Verification Blocks in Migrations

### The Problem

Not verifying migrations leaves uncertainty about success.

### ❌ WRONG

```sql
-- ❌ No verification
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'rep');

ALTER TABLE sales ADD COLUMN role user_role DEFAULT 'rep';

CREATE POLICY select_sales ON sales FOR SELECT TO authenticated USING (true);

-- Did it work? Who knows!
```

**Why it's wrong:**
- No confirmation migration succeeded
- Silent failures possible
- Manual verification required

### ✅ CORRECT

```sql
-- ✅ Verification block
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'rep');

ALTER TABLE sales ADD COLUMN role user_role DEFAULT 'rep';

CREATE POLICY select_sales ON sales FOR SELECT TO authenticated USING (true);

-- Verify
DO $$
BEGIN
  -- Check enum exists
  PERFORM 1 FROM pg_type WHERE typname = 'user_role';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'user_role enum not created';
  END IF;

  -- Check column exists
  PERFORM 1 FROM information_schema.columns
  WHERE table_name = 'sales' AND column_name = 'role';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'role column not added';
  END IF;

  -- Check policy exists
  PERFORM 1 FROM pg_policies WHERE policyname = 'select_sales';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'select_sales policy not created';
  END IF;

  RAISE NOTICE 'Migration verified successfully';
END $$;
```

**Why it's right:**
- Immediate verification
- Clear success/failure
- Catches errors early

## Anti-Pattern Checklist

**Before committing, check for these:**

- [ ] ❌ Retry logic or circuit breakers (fail fast instead)
- [ ] ❌ Validation outside Zod schemas (centralized at API boundary)
- [ ] ❌ Hardcoded form defaults (use `schema.partial().parse({})`)
- [ ] ❌ RLS policies without GRANT (need both)
- [ ] ❌ `Promise.all()` for bulk operations (use `Promise.allSettled()`)
- [ ] ❌ Skipped CSV validation (DoS, formula injection, malware)
- [ ] ❌ Testing private methods (test behavior, not implementation)
- [ ] ❌ Removing enum values (deprecate or create new enum)
- [ ] ❌ Errors without context (log method, resource, params)
- [ ] ❌ Migrations without verification (add DO block)

## Related Resources

- [error-handling.md](error-handling.md) - Correct error handling patterns
- [validation-patterns.md](validation-patterns.md) - Correct validation patterns
- [form-state-management.md](form-state-management.md) - Correct form patterns
- [database-patterns.md](database-patterns.md) - Correct database patterns
- [security-patterns.md](security-patterns.md) - Correct security patterns
- [testing-patterns.md](testing-patterns.md) - Correct testing patterns

---

**Last Updated:** 2025-11-13
**Version:** 1.0.0
