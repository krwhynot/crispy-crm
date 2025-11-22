# Task Completion Checklist

## Before Committing Code

### 1. Type Checking
```bash
npm run typecheck
```
Must pass with no errors.

### 2. Linting & Formatting
```bash
npm run lint:apply    # Auto-fix issues
npm run prettier:apply # Format code
```

### 3. Color System Validation
```bash
npm run validate:colors
```
Ensure no legacy Tailwind color classes.

### 4. Testing
```bash
npm run test:ci       # Unit/integration tests
npm run test:e2e      # E2E tests (if UI changes)
```
Coverage minimum: 70%

### 5. Build Verification
```bash
npm run build
```
Must complete without errors.

## Database Changes

### Creating Migrations
```bash
npx supabase migration new <descriptive_name>
```

### Before Deploying
```bash
npm run db:cloud:push:dry-run  # Always validate first!
```

### Migration Checklist
- [ ] Table has RLS enabled
- [ ] GRANT statements for authenticated role
- [ ] RLS policies created
- [ ] Sequence grants if using IDENTITY columns

### Security Pattern
```sql
CREATE TABLE my_table (...);
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON my_table TO authenticated;
GRANT USAGE ON SEQUENCE my_table_id_seq TO authenticated;
CREATE POLICY ... ON my_table FOR SELECT TO authenticated USING (...);
```

## Adding New Resources

1. Create directory: `src/atomic-crm/<name>/`
2. Add List/Show/Edit/Create components
3. Create lazy-loaded index.ts
4. Register in `CRM.tsx`
5. Create database migration
6. Add to `filterRegistry.ts` if filterable
7. Create Zod schema in `validation/`

## Boy Scout Rule
When editing any file, fix inconsistencies:
- Convert `type Foo = {...}` → `interface Foo {...}`
- Replace legacy color classes with semantic tokens
- Add missing TypeScript types
