# Anti-Patterns: Database

## Purpose

Document database-related anti-patterns for Supabase/PostgreSQL.

## Anti-Pattern 1: RLS Without GRANT

### The Problem

Creating RLS policies but forgetting to GRANT table access.

### WRONG

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

### CORRECT

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

## Anti-Pattern 2: Ignoring Enum Migration Complexity

### The Problem

Trying to remove values from PostgreSQL enums (not supported).

### WRONG

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

### CORRECT

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

## Anti-Pattern 3: Skipping Verification Blocks in Migrations

### The Problem

Not verifying migrations leaves uncertainty about success.

### WRONG

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

### CORRECT

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

## Checklist

Before committing migrations, check for:

- [ ] ❌ RLS policies without GRANT (need both)
- [ ] ❌ Removing enum values (deprecate or create new enum)
- [ ] ❌ Migrations without verification (add DO block)
- [ ] ❌ Manual migration numbering (use `npx supabase migration new`)
- [ ] ❌ Missing sequence GRANT (needed for SERIAL/BIGSERIAL columns)

## Related Resources

- [database-patterns.md](database-patterns.md) - Correct database patterns
- [security-patterns.md](security-patterns.md) - RLS policy patterns

---

**Last Updated:** 2025-12-02
**Version:** 2.0.0
