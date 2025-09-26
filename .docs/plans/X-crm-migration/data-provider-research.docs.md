# Data Provider Architecture and Migration Research

Comprehensive analysis of Atomic CRM's dual data provider architecture, migration execution strategy, backup/rollback patterns, testing infrastructure, and CLI automation for seamless environment switching.

## Data Provider Architecture

### Dual Provider Design Pattern

The application implements a sophisticated dual provider architecture supporting both development/demo and production environments:

**Seed Data System** (`/home/krwhynot/Projects/atomic/src/atomic-crm/scripts/seed-datadataProvider.ts`):
- Simulates async operations with 300ms delays for realistic UX
- Base64 file conversion instead of real uploads
- Generates demo data through `dataGenerator`
- Uses `withSupabaseFilterAdapter` for Supabase filter compatibility

**Supabase Provider** (`/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/dataProvider.ts`):
- Production PostgreSQL backend using `ra-supabase-core`
- Real file uploads to Supabase storage buckets
- Optimized views (`companies_summary`, `contacts_summary`) for performance
- Full-text search with `@ilike` operators for contacts/companies
- RLS policy support for multi-tenant security

### Unified Interface Pattern

Both providers implement the identical `CrmDataProvider` interface, enabling:
- Seamless switching via `VITE_IS_DEMO` environment variable
- Consistent business logic across environments
- Identical lifecycle callbacks and data transformations
- Same custom methods: `signUp`, `salesCreate`, `unarchiveDeal`, `getActivityLog`

### Lifecycle Callbacks Architecture

**Contact Processing**:
- Avatar generation from email using Gravatar API
- Company data fetching and name normalization
- Relationship count updates (`nb_contacts`, `nb_tasks`)

**File Upload Handling**:
- Supabase: Real uploads to storage bucket with signed URLs
- Attachment processing for notes with validation

**Tag Color Migration Logic**:
- Validates colors against semantic token system
- Migrates legacy hex colors to semantic identifiers
- Enforces color constraints through validation

## Migration Execution Strategy

### SQL-Based Migration System

Migrations follow timestamp-based naming convention in `/home/krwhynot/Projects/atomic/supabase/migrations/`:

**Transaction Safety Pattern**:
```sql
BEGIN;
-- Migration operations
-- Data integrity validation
COMMIT;
```

**Example Migration** (`20241221120000_migrate_tag_colors.sql`):
- Creates backup table with timestamp
- Maps legacy hex colors to semantic tokens
- Adds check constraints for validation
- Includes integrity validation with custom error handling

### Data Transformation Patterns

**Filter Transformation Layer** (`/home/krwhynot/Projects/atomic/src/atomic-crm/scripts/seed-datainternal/supabaseAdapter.ts`):
- Removes `_summary` suffix from resource names
- Transforms filters for compatibility
- Enables identical query patterns across providers

**Activity Aggregation** (`/home/krwhynot/Projects/atomic/src/atomic-crm/providers/commons/activity.ts`):
- Aggregates data from companies, contacts, deals, and notes
- Uses Promise.all for parallel queries with 250-item limits
- Implements sorting and pagination for activity feeds
- Performance note: Requires 5 large queries (candidate for optimization)

### Environment Configuration

**Development/Demo Mode** (`VITE_IS_DEMO=true`):
- Uses seed data system with generated demo data
- Local file handling with base64 conversion
- No external dependencies for development

**Production Mode** (`VITE_IS_DEMO=false`):
- Requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Real database operations with RLS policies
- File uploads to Supabase storage

## Backup and Rollback Patterns

### Backup Table Strategy

**Creation Pattern**:
```sql
CREATE TABLE {table}_backup AS
SELECT *, NOW() as backup_date FROM {table};
```

**Rollback Implementation** (`20241221120001_rollback_tag_colors.sql`):
- Removes constraints before restoration
- Restores data from most recent backup using timestamp
- Validates restoration with count comparisons
- Provides warnings for incomplete rollbacks

### Data Integrity Validation

**Migration Validation**:
- Custom DO blocks with error handling
- Count-based verification of changes
- Rollback verification with detailed logging
- Manual backup table cleanup after verification

**Constraint Management**:
- Removes constraints before rollback
- Re-adds constraints after successful migration
- Uses CHECK constraints for data validation

## Testing Infrastructure

### Unit Testing Framework

**Test Coverage**:
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/commons/getContactAvatar.spec.ts`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/commons/getCompanyAvatar.spec.ts`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/scripts/seed-datainternal/supabaseAdapter.spec.ts`
- Filter transformation tests for various Supabase operators

**Testing Patterns**:
- Vitest for unit testing framework
- Co-located test files with source code
- Tests for data transformations and provider logic
- Avatar generation and company logo processing tests

### Provider Compatibility Testing

**Supabase Adapter Tests**:
- Filter transformation validation
- Resource name normalization
- Contains, In, and Or filter operations
- Summary view compatibility

## CLI Commands and Scripts

### Development Commands

**Core Development**:
- `npm run dev` - Vite development server with force reload
- `npm run dev:demo` - Demo mode with seed data system
- `npm run build` - TypeScript check + production build
- `npm run build:demo` - Demo build configuration

**Quality Assurance**:
- `npm run lint:check` / `npm run lint:apply` - ESLint validation
- `npm run prettier:check` / `npm run prettier:apply` - Code formatting
- `npm run validate:colors` - Color usage validation
- `npm test` - Vitest test execution

### Supabase Automation

**Project Initialization** (`/home/krwhynot/Projects/atomic/scripts/supabase-remote-init.mjs`):
1. **Authentication**: `supabase login` with interactive prompts
2. **Project Creation**: Interactive project creation with JSON output parsing
3. **Readiness Polling**: Waits for `ACTIVE_HEALTHY` status
4. **Project Linking**: Links local development to remote project
5. **Database Setup**: Pushes migrations with `supabase db push --linked`
6. **Environment Setup**: Creates `.env.production.local` with credentials

**Configuration Management** (`/home/krwhynot/Projects/atomic/supabase/config.toml`):
- Local development ports (API: 54321, DB: 54322, Studio: 54323)
- Email testing with Inbucket (port 54324)
- Storage configuration with 50MiB file size limit
- Auth configuration with JWT expiry and refresh token rotation
- Custom email templates for invite and recovery

### Migration Commands

**Database Operations**:
- `npx supabase start` - Start local Supabase instance
- `npx supabase stop` - Stop local instance
- `npx supabase db push` - Push migrations to linked project
- `npx supabase link` - Link to remote project

**Migration Management**:
- Timestamp-based file naming (YYYYMMDDHHMMSS_description.sql)
- Transaction-wrapped operations with validation
- Backup table creation for rollback capability
- Data integrity checks with custom error handling

## Architectural Patterns

### Provider Abstraction
- Identical interface implementation across providers
- Environment-based provider selection
- Shared business logic through lifecycle callbacks
- Consistent data transformation patterns

### File Handling Strategy
- Supabase: Real uploads with signed URL validation
- Attachment processing with MIME type preservation
- Error handling for upload failures

### Performance Optimizations
- Database views for optimized queries (`companies_summary`, `contacts_summary`)
- Full-text search indexing for efficient filtering
- Parallel query execution in activity aggregation
- Pagination limits to prevent large data transfers

### Security Considerations
- RLS policies for multi-tenant data isolation
- Signed URL verification for file access
- API key management through environment variables
- Transaction safety for migration operations

This architecture provides a robust foundation for data migration and environment management while maintaining development velocity and production reliability.