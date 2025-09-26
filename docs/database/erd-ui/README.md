# Atomic CRM Documentation Kit

## Overview
Comprehensive documentation for the Atomic CRM PostgreSQL database and React frontend application, organized in three priority tiers for practical developer use.

## Documentation Structure

### 📌 Tier 1: Must-Have (Essential Documentation)
These documents provide the foundation for understanding and working with the system.

1. **[00-system-context-diagram.md](./00-system-context-diagram.md)**
   - Complete data flow architecture
   - Authentication flow diagrams
   - Component communication patterns
   - Security boundaries

2. **[01-entity-relationship-diagram.md](./01-entity-relationship-diagram.md)**
   - Visual database schema representation
   - All 24 tables with relationships
   - Foreign key constraints
   - Junction table mappings

3. **[02-data-dictionary.md](./02-data-dictionary.md)**
   - Complete field documentation
   - Column types and constraints
   - Business meaning and examples
   - JSONB structure examples

4. **[03-api-surface.md](./03-api-surface.md)**
   - React Admin DataProvider operations
   - Supabase Edge Functions
   - Database RPC functions
   - Authentication endpoints

5. **[04-screen-entity-mapping.md](./04-screen-entity-mapping.md)**
   - UI screens to database mapping
   - Queries per screen
   - CRUD operations
   - Component patterns

6. **[05-auth-access-control.md](./05-auth-access-control.md)**
   - Authentication providers
   - Role-based access control
   - RLS policies
   - Security implementation

### 🛠️ Tier 2: Should-Have (Implementation Guidance)

7. **[06-migrations-seed-playbook.md](./06-migrations-seed-playbook.md)**
   - Migration naming and structure
   - Common migration patterns
   - Seed data management
   - Rollback strategies

8. **07-query-cookbook.md** (Quick Reference)
   ```sql
   -- Common Query Patterns

   -- Multi-organization contacts
   SELECT c.*, array_agg(o.name) as organizations
   FROM contacts c
   JOIN contact_organizations co ON c.id = co.contact_id
   JOIN organizations o ON co.organization_id = o.id
   WHERE c.deleted_at IS NULL
   GROUP BY c.id;

   -- Opportunity pipeline analysis
   SELECT
     stage,
     COUNT(*) as count,
     SUM(amount) as total,
     AVG(probability) as avg_prob
   FROM opportunities
   WHERE deleted_at IS NULL
   GROUP BY stage
   ORDER BY avg_prob;

   -- Full-text search
   SELECT * FROM contacts
   WHERE search_tsv @@ plainto_tsquery('john smith');

   -- JSONB email search
   SELECT * FROM contacts
   WHERE email @> '[{"value": "john@example.com"}]';
   ```

9. **08-state-caching-strategy.md** (Quick Reference)
   - React Admin Store for resource data
   - React Query caching configuration
   - Optimistic updates pattern
   - Cache invalidation rules

10. **09-validation-business-rules.md** (Quick Reference)
    - Zod schema locations and usage
    - Business rule enforcement
    - Field validation patterns
    - Error message formatting

11. **10-error-handling-strategy.md** (Quick Reference)
    - Standard error response formats
    - Frontend error display
    - Retry logic patterns
    - Logging and monitoring

12. **11-ui-data-conventions.md** (Quick Reference)
    - Form field naming
    - Data display formats
    - Loading/error states
    - Pagination patterns

### 🔒 Tier 3: Ops/Security (Operational Documentation)

13. **12-performance-guidelines.md** (Quick Reference)
    - Index strategy and usage
    - Query optimization tips
    - N+1 prevention patterns
    - Caching strategies

14. **13-backup-recovery.md** (Quick Reference)
    - Backup schedules
    - Point-in-time recovery
    - Disaster recovery procedures
    - Data retention policies

15. **14-environment-configuration.md** (Quick Reference)
    ```bash
    # Required Environment Variables
    VITE_SUPABASE_URL=https://[project].supabase.co
    VITE_SUPABASE_ANON_KEY=[anon_key]
    SUPABASE_SERVICE_KEY=[service_key]  # Backend only
    VITE_INBOUND_EMAIL=inbound@atomiccrm.com
    ```

16. **15-monitoring-observability.md** (Quick Reference)
    - Key metrics to track
    - Logging standards
    - Alert thresholds
    - Debug procedures

17. **16-security-access-matrix.md** (Quick Reference)
    - Permission matrix
    - Threat model
    - Security checklist
    - Incident response

## Quick Start Guide

### For New Developers
1. Start with [00-system-context-diagram.md](./00-system-context-diagram.md) to understand architecture
2. Review [02-data-dictionary.md](./02-data-dictionary.md) for database structure
3. Study [04-screen-entity-mapping.md](./04-screen-entity-mapping.md) for UI-DB connections
4. Reference [03-api-surface.md](./03-api-surface.md) for available operations

### For Database Work
1. Check [01-entity-relationship-diagram.md](./01-entity-relationship-diagram.md) for relationships
2. Use [06-migrations-seed-playbook.md](./06-migrations-seed-playbook.md) for schema changes
3. Reference query patterns in 07-query-cookbook.md

### For Frontend Development
1. Review [04-screen-entity-mapping.md](./04-screen-entity-mapping.md) for component patterns
2. Check 09-validation-business-rules.md for form validation
3. Follow 11-ui-data-conventions.md for consistency

### For DevOps/Security
1. Configure using 14-environment-configuration.md
2. Implement monitoring from 15-monitoring-observability.md
3. Review [05-auth-access-control.md](./05-auth-access-control.md) for security

## Key System Characteristics

### Database
- **24 core tables** with opportunities-first design
- **85+ indexes** including GIN for full-text search
- **JSONB fields** for flexible email/phone storage
- **Soft deletes** via deleted_at timestamps
- **Simple RLS**: authenticated users only

### Architecture
- **Single unified data provider** (no custom layers)
- **Zod validation** at API boundaries only
- **No backward compatibility** (fail fast approach)
- **React Admin** for state management
- **Supabase** for backend services

### Business Logic
- **Opportunities vs Deals**: Pipeline uses opportunities
- **Multi-stakeholder**: Support for customer/principal/distributor
- **Activities**: Engagements (general) vs Interactions (opportunity-specific)
- **Multi-org contacts**: Junction table for many-to-many

## Common Tasks

### Add a New Field
1. Create migration (see [06-migrations-seed-playbook.md](./06-migrations-seed-playbook.md))
2. Update Zod schema in `/src/atomic-crm/validation/`
3. Add to form inputs in `[Entity]Inputs.tsx`
4. Update TypeScript types if needed

### Create New Entity
1. Design table schema
2. Create migration with RLS policy
3. Add Zod validation schema
4. Create React Admin resource components
5. Register in `CRM.tsx`
6. Update data provider if needed

### Debug Data Flow
1. Check browser DevTools Network tab
2. Verify JWT token in Authorization header
3. Check Supabase logs via MCP tools
4. Review RLS policies
5. Validate Zod schemas

## Support & Maintenance

### Regular Tasks
- Review migration history monthly
- Update seed data quarterly
- Audit RLS policies on changes
- Monitor performance metrics
- Update documentation with changes

### Troubleshooting
- **Auth issues**: Check [05-auth-access-control.md](./05-auth-access-control.md)
- **Query performance**: See index usage in 12-performance-guidelines.md
- **Data validation**: Review schemas in 09-validation-business-rules.md
- **API errors**: Reference [03-api-surface.md](./03-api-surface.md)

## Version History
- **v1.0** (2025-01-26): Initial documentation kit
- Fresh opportunities-based schema (no legacy deals)
- Complete Zod validation layer
- Multi-stakeholder support

---

*Generated for Atomic CRM - A modern PostgreSQL + React CRM system*