# Developer Getting Started Guide

## Overview
This guide helps developers quickly set up, understand, and work with the Atomic CRM database. It covers local development setup, common operations, debugging techniques, and best practices.

## Quick Setup

### Prerequisites
- Node.js 18+ and npm
- Git for version control
- Access to a Supabase project (create at https://supabase.com)

### Local Development Setup

#### 1. Clone and Install
```bash
git clone <repository-url>
cd atomic
npm install
```

#### 2. Environment Configuration
```bash
# Copy environment template
cp .env.example .env.local

# Key environment variables (get from Supabase dashboard)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

#### 3. Run Application
```bash
# Start development server
npm run dev

# Open http://localhost:5173
```

#### 5. First User Setup
1. Navigate to sign-up page
2. Create account with email/password
3. Check email for verification link
4. First user automatically becomes administrator
5. Start exploring the CRM interface

---

## Database Connection Methods

### Local Development
```typescript
// Using Supabase client
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
)
```

### Direct Database Access (PostgreSQL)
```bash
# Connect to local Supabase DB
psql "postgresql://postgres:postgres@localhost:54322/postgres"

# Or using Supabase CLI
npx supabase db shell
```

### Production Database
```bash
# Remote connection (when configured)
npx supabase db shell --linked
```

---

## Essential Database Operations

### Creating New Companies
```sql
-- SQL approach
INSERT INTO companies (name, sector, sales_id)
VALUES ('Acme Corp', 'Technology', 1);

-- TypeScript/Supabase approach
const { data, error } = await supabase
  .from('companies')
  .insert({
    name: 'Acme Corp',
    sector: 'Technology',
    sales_id: currentUserId
  });
```

### Working with JSONB Contacts
```sql
-- Create contact with multiple emails
INSERT INTO contacts (first_name, last_name, email_jsonb, company_id)
VALUES (
  'John',
  'Smith',
  '[{"email": "john@acme.com", "type": "Work"}]'::jsonb,
  1
);

-- Query by email (JSONB search)
SELECT * FROM contacts
WHERE email_jsonb @> '[{"email": "john@acme.com"}]';

-- Extract all emails as text
SELECT first_name, last_name,
       jsonb_path_query_array(email_jsonb, '$[*].email') as emails
FROM contacts;
```

### Deal Pipeline Queries
```sql
-- Active deals by stage
SELECT stage, COUNT(*), SUM(amount)
FROM deals
WHERE archived_at IS NULL
GROUP BY stage
ORDER BY
  CASE stage
    WHEN 'opportunity' THEN 1
    WHEN 'proposal-sent' THEN 2
    WHEN 'in-negociation' THEN 3
    WHEN 'won' THEN 4
    WHEN 'lost' THEN 5
    ELSE 6
  END;

-- Sales rep performance
SELECT s.first_name, s.last_name,
       COUNT(d.id) as deal_count,
       SUM(CASE WHEN d.stage = 'won' THEN d.amount ELSE 0 END) as revenue
FROM sales s
LEFT JOIN deals d ON s.id = d.sales_id
WHERE d.archived_at IS NULL OR d.archived_at IS NULL
GROUP BY s.id, s.first_name, s.last_name;
```

### Working with Tags
```sql
-- Create new tag
INSERT INTO tags (name, color) VALUES ('enterprise', 'blue');

-- Add tag to contact
UPDATE contacts
SET tags = tags || ARRAY[6]  -- Append tag ID 6
WHERE id = contact_id;

-- Find contacts with specific tag
SELECT c.*
FROM contacts c
WHERE 3 = ANY(c.tags);  -- Has tag ID 3

-- Tag usage statistics
SELECT t.name, COUNT(DISTINCT c.id) as usage_count
FROM tags t
LEFT JOIN contacts c ON t.id = ANY(c.tags)
GROUP BY t.id, t.name
ORDER BY usage_count DESC;
```

---

## Common Query Patterns

### Dashboard Metrics
```sql
-- KPI Summary
SELECT
  (SELECT COUNT(*) FROM companies) as total_companies,
  (SELECT COUNT(*) FROM contacts) as total_contacts,
  (SELECT COUNT(*) FROM deals WHERE archived_at IS NULL) as active_deals,
  (SELECT SUM(amount) FROM deals WHERE stage = 'won') as total_revenue;

-- Recent Activity
SELECT 'deal' as type, name as title, created_at
FROM deals
WHERE created_at >= NOW() - INTERVAL '7 days'
UNION ALL
SELECT 'contact', first_name || ' ' || last_name, first_seen
FROM contacts
WHERE first_seen >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

### Search and Filtering
```sql
-- Global search across entities
SELECT 'company' as type, id, name as title
FROM companies
WHERE name ILIKE '%search_term%'
UNION ALL
SELECT 'contact', id, first_name || ' ' || last_name
FROM contacts
WHERE first_name ILIKE '%search_term%'
   OR last_name ILIKE '%search_term%'
UNION ALL
SELECT 'deal', id, name
FROM deals
WHERE name ILIKE '%search_term%'
   AND archived_at IS NULL;

-- Advanced contact filtering
SELECT c.*, co.name as company_name
FROM contacts c
LEFT JOIN companies co ON c.company_id = co.id
WHERE (c.status = 'hot' OR 'vip' = ANY(c.tags))
  AND c.last_seen >= NOW() - INTERVAL '30 days';
```

### Reporting Queries
```sql
-- Monthly deal progression
SELECT
  DATE_TRUNC('month', created_at) as month,
  stage,
  COUNT(*) as deal_count,
  SUM(amount) as total_value
FROM deals
WHERE created_at >= NOW() - INTERVAL '12 months'
GROUP BY month, stage
ORDER BY month, stage;

-- Sales rep activity
SELECT s.first_name, s.last_name,
       COUNT(DISTINCT cn.id) as notes_written,
       COUNT(DISTINCT t.id) as tasks_completed,
       COUNT(DISTINCT d.id) as deals_managed
FROM sales s
LEFT JOIN "contactNotes" cn ON s.id = cn.sales_id
LEFT JOIN tasks t ON s.id = t.sales_id AND t.done_date IS NOT NULL
LEFT JOIN deals d ON s.id = d.sales_id
WHERE cn.date >= NOW() - INTERVAL '30 days'
   OR t.done_date >= NOW() - INTERVAL '30 days'
   OR d.created_at >= NOW() - INTERVAL '30 days'
GROUP BY s.id, s.first_name, s.last_name;
```

---

## TypeScript Integration

### Working with Generated Types
```typescript
// If using Supabase type generation
import type { Database } from './types/supabase'

type Company = Database['public']['Tables']['companies']['Row']
type CompanyInsert = Database['public']['Tables']['companies']['Insert']
type CompanyUpdate = Database['public']['Tables']['companies']['Update']

// Create typed client
const supabase = createClient<Database>(url, key)
```

### React Admin Integration
```typescript
// Using the DataProvider
import { useDataProvider } from 'react-admin'

const dataProvider = useDataProvider()

// Create company
const company = await dataProvider.create('companies', {
  data: {
    name: 'New Company',
    sector: 'Technology',
    sales_id: currentUserId
  }
})

// Query with filters
const contacts = await dataProvider.getList('contacts', {
  pagination: { page: 1, perPage: 10 },
  sort: { field: 'last_seen', order: 'DESC' },
  filter: { status: 'hot' }
})
```

### JSONB Handling
```typescript
// Email JSONB structure
interface EmailAndType {
  email: string
  type: 'Work' | 'Home' | 'Other'
}

// Working with contact emails
const contact = {
  first_name: 'John',
  last_name: 'Smith',
  email_jsonb: [
    { email: 'john@work.com', type: 'Work' },
    { email: 'john@personal.com', type: 'Home' }
  ] as EmailAndType[]
}

// Extracting emails for display
const emails = contact.email_jsonb.map(e => e.email).join(', ')
```

---

## Running Migrations

### Creating New Migrations
```bash
# Create new migration file
npx supabase migration new description_of_change

# Edit the generated file in supabase/migrations/
# Write SQL DDL statements

# Apply to local database
npx supabase db reset  # Fresh start with all migrations

# Or apply just new migrations
npx supabase migration up
```

### Migration Best Practices
```sql
-- Always use transactions for complex migrations
BEGIN;

-- Example: Adding new column with default
ALTER TABLE companies ADD COLUMN industry_code VARCHAR(10);
UPDATE companies SET industry_code = 'TECH' WHERE sector = 'Technology';

-- Validate change
SELECT industry_code, COUNT(*) FROM companies GROUP BY industry_code;

COMMIT;
```

### Seeding Data
```sql
-- Insert sample data (local development)
INSERT INTO tags (name, color) VALUES
  ('enterprise', 'blue'),
  ('startup', 'green'),
  ('government', 'gray');

-- Create test company
INSERT INTO companies (name, sector, size)
VALUES ('Test Corp', 'Technology', 50);
```

---

## Debugging and Troubleshooting

### Common Issues and Solutions

#### 1. RLS Policy Blocks
**Problem**: Queries return empty results
```sql
-- Check if user is authenticated
SELECT auth.uid(), auth.role();

-- Test policy manually
SELECT * FROM companies WHERE true;  -- Should work if policy allows
```

**Solution**: Verify authentication state and policy conditions

#### 2. Foreign Key Violations
**Problem**: Insert fails with FK constraint error
```sql
-- Check if referenced record exists
SELECT * FROM sales WHERE id = referenced_sales_id;
```

**Solution**: Ensure parent records exist before creating child records

#### 3. JSONB Query Issues
**Problem**: JSONB searches don't return expected results
```sql
-- Debug JSONB structure
SELECT email_jsonb, jsonb_typeof(email_jsonb) FROM contacts LIMIT 1;

-- Test containment operator
SELECT * FROM contacts WHERE email_jsonb @> '[{"email": "test@example.com"}]';
```

**Solution**: Verify JSONB structure matches query expectations

#### 4. Migration Failures
```bash
# Check migration status
npx supabase migration list

# Reset to clean state
npx supabase db reset

# Apply specific migration
npx supabase migration up --include-seed
```

### Performance Debugging
```sql
-- Enable query timing
\timing

-- Analyze slow queries
EXPLAIN ANALYZE SELECT * FROM companies_summary;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_tup_read > 0
ORDER BY idx_tup_read DESC;
```

### Logging and Monitoring
```sql
-- Enable statement logging (local development)
ALTER SYSTEM SET log_statement = 'all';
SELECT pg_reload_conf();

-- Monitor active connections
SELECT pid, usename, application_name, state, query
FROM pg_stat_activity
WHERE state = 'active';
```

---

## Testing Database Code

### Unit Testing Approach
```typescript
// Test database functions
describe('Contact creation', () => {
  beforeEach(async () => {
    await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'password'
    })
  })

  it('should create contact with JSONB email', async () => {
    const { data, error } = await supabase
      .from('contacts')
      .insert({
        first_name: 'Test',
        last_name: 'User',
        email_jsonb: [{ email: 'test@example.com', type: 'Work' }]
      })
      .select()

    expect(error).toBeNull()
    expect(data[0].email_jsonb).toEqual([
      { email: 'test@example.com', type: 'Work' }
    ])
  })
})
```

### Integration Testing
```bash
# Test against real Supabase instance
npm test -- --supabase-url=http://localhost:54321

# Test migrations
npx supabase db reset && npm test
```

---

## Production Deployment

### Database Preparation
```bash
# Generate types for production
npx supabase gen types typescript --linked > types/supabase.ts

# Validate migrations
npx supabase migration list --linked

# Deploy migrations
npx supabase db push --linked
```

### Environment Variables
```bash
# Production environment
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_IS_DEMO=false
```

### Monitoring Setup
- Enable slow query logging
- Set up performance monitoring
- Configure backup schedules
- Monitor RLS policy effectiveness

---

## Helpful Resources

### Development Tools
- **Supabase Dashboard**: Local at http://localhost:54323
- **Database Browser**: Direct SQL queries and table browsing
- **API Documentation**: Auto-generated REST API docs
- **Auth Management**: User management interface

### Common Commands
```bash
# Supabase commands
npx supabase link            # Link to remote project
npx supabase status          # Check service status
npx supabase db reset        # Reset database with migrations
npx supabase db shell        # Open PostgreSQL shell

# Application commands
npm run dev                  # Start development server
npm run build               # Build for production
npm test                    # Run test suite
npm run lint:check          # Check code quality
```

### Documentation References
- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [React Admin Documentation](https://marmelab.com/react-admin/)
- Project-specific docs in `/docs/database/`

---

## Getting Help

### Debugging Checklist
1. ✅ Is Supabase running? (`npx supabase status`)
2. ✅ Are environment variables correct?
3. ✅ Is user authenticated? (`auth.uid()`)
4. ✅ Do RLS policies allow the operation?
5. ✅ Are foreign key constraints satisfied?
6. ✅ Is the JSONB structure correct?
7. ✅ Are migrations applied? (`migration list`)

### Support Resources
- Check existing GitHub issues
- Review database documentation files
- Use Supabase dashboard for debugging
- Enable verbose logging for detailed errors
- Test queries directly in PostgreSQL shell

### Contributing Guidelines
- Follow naming conventions (see `07-naming-conventions-standards.md`)
- Test migrations on sample data
- Update documentation for schema changes
- Include rollback plans for major changes
- Follow TypeScript type safety practices