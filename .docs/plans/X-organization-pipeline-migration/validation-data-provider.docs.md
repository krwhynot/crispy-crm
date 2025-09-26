# Validation and Data Provider Architecture Research

This research documents the validation and data provider patterns in the Atomic CRM codebase, focusing on understanding the architecture that will need updating for the organization-pipeline migration.

## Relevant Files
- `/src/atomic-crm/providers/supabase/unifiedDataProvider.ts`: Main unified data provider with validation integration
- `/src/atomic-crm/providers/supabase/dataProvider.ts`: Legacy data provider with lifecycle callbacks
- `/src/atomic-crm/providers/supabase/resources.ts`: Resource mapping and configuration
- `/src/atomic-crm/validation/opportunities.ts`: Opportunity Zod validation schemas
- `/src/atomic-crm/validation/organizations.ts`: Organization/Company Zod validation schemas
- `/src/atomic-crm/validation/contacts.ts`: Contact validation with multi-organization support
- `/src/atomic-crm/root/CRM.tsx`: React Admin resource registration and configuration
- `/src/atomic-crm/types.ts`: TypeScript type definitions for CRM entities

## Architectural Patterns

### Dual Data Provider System
- **Legacy Provider**: `dataProvider.ts` with lifecycle callbacks and resource-specific transformations
- **Unified Provider**: `unifiedDataProvider.ts` consolidates validation and error logging into a single layer
- **Provider Chain**: Current system maintains 2-layer architecture (base + unified) while preserving all functionality
- **Resource Mapping**: Centralized resource name mapping with `getResourceName()` function for backward compatibility

### Validation Architecture
- **Single Point Validation**: Zod schemas validate at API boundary only (no multi-layer validation)
- **Validation Registry**: Centralized mapping of resources to validation functions in `unifiedDataProvider.ts`
- **Error Formatting**: Consistent React Admin error format with field-specific messages
- **Operation-Specific Schemas**: Separate schemas for create, update, and general operations

### Database Access Patterns
- **Summary Views**: Optimized queries using `_summary` views for list/detail operations (`opportunities_summary`, `companies_summary`, `contacts_summary`)
- **Soft Delete Support**: Automatic `deleted_at` filtering for supported resources
- **Full-Text Search**: Specialized FTS handling for email/phone fields with `_fts` columns
- **Resource Name Mapping**: Clean separation between React Admin resource names and database table names

## Edge Cases & Gotchas

### Resource Naming Complexity
- **Companies vs Organizations**: Code uses "companies" resource name but validation files are named "organizations.ts"
- **Backward Compatibility**: Dual exports in validation files (`companySchema` = `organizationSchema`)
- **Summary View Switching**: Different resource names for read vs write operations (`companies` → `companies_summary` for lists)

### Validation Registration System
- **Alias Handling**: Companies resource maps to organizations validation (`companies: { validate: validateOrganizationForSubmission }`)
- **Tag Special Case**: Complex validation logic with legacy hex color migration in validation registry
- **Async Validation**: All validation functions are async but most are synchronous operations

### Data Provider Layer Interaction
- **Legacy Lifecycle Callbacks**: Old provider has extensive before/after hooks for images, search, and transformations
- **Unified Provider Bypass**: New provider handles validation but delegates complex transformations to base provider
- **Custom Methods**: Junction table operations (`getContactOrganizations`, `addContactToOrganization`) exist in legacy provider only

### Multi-Organization Complexity
- **Contact Relationships**: Contacts can belong to multiple organizations via `contact_organizations` junction table
- **Opportunity Participants**: Three-way relationships between opportunities, organizations, and roles (`opportunity_participants`)
- **Primary Organization Logic**: Complex business rules for determining primary contact/organization relationships

## Validation Patterns

### Schema Structure
```typescript
// Standard pattern for all resources
export const resourceSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  required_field: z.string().min(1, 'Field is required'),
  optional_field: z.string().optional(),
  // ... field definitions
});

// Operation-specific schemas
export const createResourceSchema = resourceSchema.omit({
  id: true,
  created_at: true,
  // ... system fields
}).required({
  required_field: true,
});

export const updateResourceSchema = resourceSchema.partial().required({
  id: true,
});
```

### Error Handling Pattern
```typescript
export async function validateResourceForm(data: any): Promise<void> {
  try {
    resourceSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        formattedErrors[path] = err.message;
      });
      throw {
        message: 'Validation failed',
        errors: formattedErrors,
      };
    }
    throw error;
  }
}
```

### Resource Configuration Pattern
```typescript
// Resource mapping
export const RESOURCE_MAPPING = {
  companies: 'companies',
  opportunities: 'opportunities',
  companies_summary: 'companies_summary',
  // ... mappings
} as const;

// Validation registry
const validationRegistry: Record<string, ValidationConfig> = {
  opportunities: { validate: validateOpportunityForm },
  organizations: { validate: validateOrganizationForSubmission },
  companies: { validate: validateOrganizationForSubmission }, // Alias
  // ... registrations
};
```

## Type Generation and Integration

### Database Schema Integration
- **Summary Views**: Database provides optimized read-only views with computed fields (`nb_contacts`, `nb_opportunities`)
- **JSONB Support**: Complex fields like `email_jsonb` and `phone_jsonb` for flexible contact information
- **Search Vectors**: Full-text search support with dedicated FTS columns updated via triggers

### React Admin Integration
- **Resource Registration**: Simple object exports from feature modules (`{ list, create, edit, show }`)
- **Lazy Loading**: Opportunity components use `React.lazy()` for code splitting
- **Provider Injection**: CRM component accepts custom data/auth providers for testing

### TypeScript Type System
- **Generated Types**: Database-first approach with types generated from Supabase schema
- **Validation Types**: Zod schema inference for compile-time type safety
- **Interface vs Type Usage**: Consistent pattern using `interface` for objects, `type` for unions/utilities

## Migration Impact Analysis

### Critical Update Points
1. **Validation Registry**: Need to update resource mapping from "companies" to "organizations"
2. **Resource Configuration**: Update `RESOURCE_MAPPING` and `SEARCHABLE_RESOURCES` configurations
3. **Summary Views**: Database views may need schema updates for new organization structure
4. **Junction Tables**: Multi-organization relationships require careful migration of existing data

### Fail-Fast Architecture Benefits
- **No Backward Compatibility**: Clean migration without legacy layer maintenance
- **Single Validation Point**: Centralized validation makes schema updates straightforward
- **Automated Enforcement**: ESLint rules and type checking catch violations early

### Risk Areas
- **Multi-Organization Data**: Complex relationships between contacts, companies, and opportunities
- **Search Configuration**: FTS fields and searchable field lists need synchronization
- **Custom Methods**: Legacy provider methods for junction tables may need unified provider integration

## Relevant Docs

- [React Admin Data Provider Documentation](https://marmelab.com/react-admin/DataProvider.html)
- [Zod Schema Validation](https://zod.dev/)
- [Supabase PostgREST API Reference](https://supabase.com/docs/guides/api/rest/introduction)