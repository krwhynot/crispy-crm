# Data Provider Architecture Research

Comprehensive analysis of the unified Supabase data provider structure, database interaction patterns, and validation architecture in the Atomic CRM codebase. The system implements a clean, single-layer data provider with integrated validation and transformation patterns.

## Relevant Files

### Core Data Provider Architecture
- `/src/atomic-crm/providers/supabase/unifiedDataProvider.ts`: Main unified data provider with validation/transformations (783 lines)
- `/src/atomic-crm/providers/supabase/index.ts`: Provider exports - exposes authProvider and unifiedDataProvider
- `/src/atomic-crm/providers/supabase/supabase.ts`: Supabase client initialization with environment variables
- `/src/atomic-crm/providers/supabase/resources.ts`: Resource mapping, search config, and soft delete support
- `/src/atomic-crm/providers/types.ts`: Type exports for CrmDataProvider

### Database Connection & Configuration
- `/src/types/database.generated.ts`: Auto-generated TypeScript types from Supabase schema
- `/src/atomic-crm/providers/supabase/authProvider.ts`: Authentication provider with role-based access
- `/.env.example`: Environment variable configuration including Supabase URLs and keys

### Validation Layer (Zod Schemas at API Boundary)
- `/src/atomic-crm/validation/opportunities.ts`: Complex opportunity validation with stage-specific rules
- `/src/atomic-crm/validation/organizations.ts`: Organization validation with URL/LinkedIn validators
- `/src/atomic-crm/validation/contacts.ts`: Contact validation with JSONB email/phone support
- `/src/atomic-crm/validation/index.ts`: Centralized validation exports

### Service Layer & Business Logic
- `/src/atomic-crm/services/index.ts`: Service layer exports following Constitution principle #14
- `/src/atomic-crm/services/sales.service.ts`: Sales operations with custom methods
- `/src/atomic-crm/services/opportunities.service.ts`: Opportunity business logic
- `/src/atomic-crm/services/junctions.service.ts`: Many-to-many relationship management

### Storage & File Handling
- `/src/atomic-crm/utils/storage.utils.ts`: Supabase Storage utilities for file uploads and management
- `/src/atomic-crm/utils/avatar.utils.ts`: Avatar processing for contacts and organizations

## Architectural Patterns

### **Unified Data Provider Pattern**
- **Single Layer Architecture**: Consolidates 4+ provider layers into maximum 2 layers per Constitution principle #1
- **Registry-Based Configuration**: Uses `validationRegistry` and `transformerRegistry` for resource-specific behavior
- **Wrapper Pattern**: `wrapMethod()` function provides consistent error logging and React Admin error formatting
- **Resource Mapping**: Abstracts React Admin resources to database tables/views via `RESOURCE_MAPPING`

### **Database Interaction Flow**
- **Base Provider**: Uses `ra-supabase-core` as foundation with Supabase client configuration
- **Resource Resolution**: `getDatabaseResource()` maps logical resources to physical tables/summary views
- **Query Enhancement**: `applySearchParams()` adds full-text search and soft delete filtering
- **Service Delegation**: Custom methods delegated to specialized service classes

### **Validation Architecture (Single Point at API Boundary)**
- **Zod Schema Registry**: Each resource has validation configuration in `validationRegistry`
- **Transformation First**: Data transformations (file uploads, avatars) applied before validation
- **Error Formatting**: Zod errors converted to React Admin format `{ message, errors: { field: string } }`
- **Stage-Specific Rules**: Opportunity validation includes complex conditional logic based on stage

### **Configuration & Environment Management**
- **Environment Variables**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` for client configuration
- **Remote-Only**: No local Supabase instance required - uses MCP tools for development
- **Type Generation**: Database types auto-generated in `/src/types/database.generated.ts`

## Edge Cases & Gotchas

### **Resource Mapping Complexities**
- Summary views used for list operations (`organizations_summary`, `contacts_summary`, `opportunities_summary`) but base tables for CRUD
- Views cannot use `deleted_at` filter as it causes PostgREST errors - views handle soft delete internally
- Resource names must map through `getResourceName()` for backward compatibility removal

### **Validation Error Handling**
- Zod errors must be transformed to React Admin format or form validation fails silently
- Tags validation uses different functions for create vs update operations (`validateCreateTag` vs `validateUpdateTag`)
- Legacy field detection in opportunity validation throws helpful error messages for removed fields (`company_id`, `archived_at`)

### **File Upload Orchestration**
- File transformations happen BEFORE validation to ensure uploaded files are available for validation rules
- Multiple file uploads use sequential processing to avoid overwhelming storage
- Blob URLs must be cleaned up to prevent memory leaks via `cleanupBlobUrl()`

### **Search & Filtering Gotchas**
- Full-text search uses special FTS columns for email/phone (`email_fts@ilike`, `phone_fts@ilike`)
- Soft delete filtering automatically added unless `includeDeleted: true` or resource is a view
- Search configuration per resource in `SEARCHABLE_RESOURCES` determines which fields support search

### **Authentication & Caching**
- User identity cached in `getSaleFromCache()` to avoid repeated database calls
- Role-based access control through `canAccess()` function with admin/user roles
- Session validation skipped for specific routes (`/set-password`, `/forgot-password`)

## Schema Generation & Type Safety

### **Auto-Generated Types**
- Database types generated in `/src/types/database.generated.ts` with full table definitions
- Includes Row, Insert, Update types for each table plus relationship mappings
- Enum types defined at database level and reflected in TypeScript

### **Type Generation Process**
- Uses Supabase MCP tools for type generation (mentioned in CLAUDE.md)
- No CLI-based type generation scripts found in package.json
- Types appear to be manually generated via MCP tools rather than automated

### **Validation Schema Alignment**
- Zod schemas manually maintained to match database types
- No automated sync between database schema and Zod validation
- Validation schemas more restrictive than database (e.g., required fields, business rules)

## Database Connection Configuration

### **Environment-Based Configuration**
- Client connection via environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Service role key available for MCP tools: `SUPABASE_SERVICE_ROLE_KEY` (optional)
- Database URL for direct connections: `DATABASE_URL` (MCP tools only)

### **Connection Patterns**
- Single Supabase client instance exported from `/src/atomic-crm/providers/supabase/supabase.ts`
- Client shared across all providers (auth, data, storage)
- Remote-only development - no local Supabase instance required

### **RLS & Security**
- Simple RLS policy: `FOR ALL USING (auth.role() = 'authenticated')`
- Role-based access control implemented at application level via `canAccess()`
- Storage bucket permissions managed through Supabase dashboard

## Performance & Optimization Patterns

### **Query Optimization**
- Summary views for list operations reduce query complexity
- GIN indexes for full-text search (85+ performance indexes total)
- Search vectors updated via database triggers

### **Caching Strategy**
- User identity cached in auth provider
- React Query for server state caching (via React Admin)
- No application-level query caching beyond React Admin defaults

### **Soft Delete Implementation**
- Automatic `deleted_at` filtering for supported resources
- Views handle soft delete filtering internally
- Junction tables support soft deletes for relationship management