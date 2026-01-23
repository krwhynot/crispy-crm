# Database Layer: RLS, Views & Triggers

Border control that enforces soft deletes and performance rules when frontend fails.

## View Duality (Performance)

DO:
- `contacts_summary`, `opportunities_summary` - SQL views for reads
- Pre-calculate expensive operations (counts, joins, computed fields)
- `SELECT * FROM contacts_summary` - read from views
- `INSERT INTO contacts` - write to base tables

DON'T:
- Fetch base tables for list views
- Calculate aggregates in JavaScript
- Mix read/write destinations

## Soft Delete Enforcement (Security)

DO:
- RLS policies with `deleted_at IS NULL` - enforce at row level
- Cascade soft deletes via triggers/policies
- Test: manually querying Supabase should hide deleted records

DON'T:
- Rely only on frontend filtering `deleted_at`
- Skip RLS policies - attackers can bypass frontend

## Immutable Fields (Data Integrity)

DO:
- SQL triggers for `created_at` and `updated_at`
- Generated columns for computed values (search vectors)

DON'T:
- Allow frontend to set timestamps manually

## Violation Fixes

### Leaky Delete

WRONG:
```javascript
// Frontend only - hackers can bypass
supabase.from('contacts').select().is('deleted_at', null)
```

RIGHT:
```sql
-- RLS enforced at database level
CREATE POLICY "Hide deleted contacts"
ON contacts FOR SELECT
USING (deleted_at IS NULL);
```

### Slow Dashboard

WRONG:
```javascript
// Fetching 1000 rows to filter in JS
opportunities.filter(o => o.updated_at < Date.now() - 14*24*60*60*1000)
```

RIGHT:
```sql
CREATE VIEW opportunities_summary AS
SELECT *,
  CASE WHEN updated_at < NOW() - INTERVAL '14 days'
    THEN true ELSE false END as is_stale
FROM opportunities;
```

## Audit Command

```bash
grep -r "CREATE POLICY" supabase/migrations/
```

## Checklist

- [ ] List views have `_summary` SQL views with pre-calculated fields
- [ ] SELECT policies enforce `deleted_at IS NULL`
- [ ] Soft-delete cascades handled by triggers/policies
- [ ] `created_at`/`updated_at` managed by triggers (not frontend)
- [ ] Computed columns auto-generated
