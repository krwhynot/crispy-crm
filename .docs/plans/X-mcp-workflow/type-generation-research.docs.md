# Type Generation System Research

Research findings on the current type generation implementation and requirements for MCP workflow transition.

## Overview

The application uses a database-first architecture with automatic TypeScript type generation from Supabase database schema. The type generation system includes hash-based change detection, comprehensive validation, and sophisticated build integration.

## Relevant Files

- `/scripts/generate-types.cjs`: Main type generation script with validation and hash tracking
- `/src/types/database.generated.ts`: Auto-generated TypeScript types from database schema
- `/src/types/supabase.ts`: Legacy types file that should be removed during MCP transition
- `/.migration-hash`: Git-ignored file tracking migration changes for efficient regeneration
- `/supabase/migrations/`: SQL migrations directory monitored for changes
- `/package.json`: Build scripts integration with type generation hooks

## Current Implementation

### Core Generation Script (/scripts/generate-types.cjs)

**Key Features:**
- **Supabase CLI Dependency**: Uses `npx supabase gen types typescript --local` for type generation
- **Migration Hash Tracking**: Calculates SHA256 hash of migration files (name, mtime, size) to detect changes
- **Schema Validation**: Validates generated types against expected table/view/enum structure
- **Placeholder Generation**: Creates placeholder types when Supabase is unavailable (Docker issues)
- **CI/CD Compatibility**: Graceful handling in continuous integration environments

**Command Options:**
- `--force`: Force regeneration regardless of hash changes
- `--remote`: Generate from remote Supabase instance (requires SUPABASE_PROJECT_ID)
- `--watch`: Monitor migrations directory for changes
- `--skip-validation`: Skip schema structure validation

**Validation Rules:**
- Required tables: `organizations`, `contacts`, `opportunities`, `tasks`, `tags`, etc.
- Required views: `organizations_summary`, `contacts_summary`, `opportunities_summary`
- Required enums: `organization_type`, `opportunity_stage`, `opportunity_pipeline`
- Column validation for key tables (organizations, opportunities, contacts)
- Checks for deprecated backward compatibility views

## Migration Hash System

### Implementation Details
- **Hash Calculation**: Combines filename, modification time, and file size for each .sql file
- **Storage Location**: `/.migration-hash` file (git-ignored)
- **Change Detection**: Compares current hash with stored hash to determine if regeneration needed
- **Performance**: Avoids unnecessary type generation when migrations unchanged

### Hash Algorithm
```javascript
// For each migration file:
content += `${filename}:${mtime.getTime()}:${fileSize}\n`;
hash = crypto.createHash('sha256').update(content).digest('hex');
```

## Key Files and Patterns

### Generated Types Structure
```typescript
// Auto-generated header with timestamp
export type Database = {
  public: {
    Tables: { /* table definitions */ }
    Views: { /* view definitions */ }
    Functions: { /* function definitions */ }
    Enums: { /* enum definitions */ }
    CompositeTypes: { /* composite types */ }
  }
}

export type Tables<T> = Database['public']['Tables'][T]['Row']
export type Enums<T> = Database['public']['Enums'][T]
```

### Current Schema Focus
- **Organizations** (renamed from companies): Core business entity tracking
- **Opportunities** (renamed from deals): Sales pipeline management
- **Contacts**: People with JSONB email/phone arrays
- **Junction Tables**: `contact_organization`, `opportunity_contacts`
- **Summary Views**: Optimized list operations with computed fields

## Type Import Patterns

### Active Usage
- **Transformer Files**: Use `Database['public']['Tables']['table_name']['Row']` pattern
- **Legacy Import**: Still using `@/types/supabase` in some transformers (needs cleanup)
- **Generated Import**: `../../types/database.generated` in tests

### Import Patterns Found
```typescript
// Current legacy (to be replaced):
import type { Database } from '@/types/supabase';

// Target pattern:
import type { Database } from '@/types/database.generated';

// Usage in transformers:
type DbTag = Database['public']['Tables']['tags']['Row'];
```

### Files Requiring Migration
- `/src/atomic-crm/transformers/tags.ts`: Uses legacy supabase.ts import
- `/src/atomic-crm/transformers/__tests__/tags.test.ts`: Uses legacy supabase.ts import

## Build Integration

### NPM Scripts Integration
```json
{
  "generate:types": "node ./scripts/generate-types.cjs",
  "generate:types:watch": "node ./scripts/generate-types.cjs --watch",
  "generate:types:force": "node ./scripts/generate-types.cjs --force",
  "dev": "npm run generate:types && vite --force",
  "build": "npm run generate:types && tsc && vite build",
  "prebuild": "npm run generate:types"
}
```

### Pre-build Hooks
- **Development**: Types generated before Vite starts (`npm run dev`)
- **Production**: Types generated before TypeScript compilation (`npm run build`)
- **CI/CD**: Graceful fallback with placeholder types when Supabase unavailable

### Validation Integration
- Schema validation runs during type generation
- Errors halt the build process (unless `--skip-validation`)
- Warnings logged but don't block builds
- Integration with `validate:all` command for comprehensive checks

## Architectural Patterns

### Database-First Philosophy
- **Single Source of Truth**: PostgreSQL schema drives all TypeScript types
- **Zero Schema Drift**: Compile-time type safety from database to UI
- **Transformation Layer**: Bidirectional converters between DB and app types
- **Auto-Generated Types**: Never manually edit generated types

### Transformer Integration
- Use generated types for database operations: `Database['public']['Tables'][table]['Row']`
- Transform at data layer boundaries
- Consistent patterns across all entities
- Error collection in batch transformations

## MCP Transition Requirements

### Current Dependencies
- **Supabase CLI**: Local installation required for `supabase gen types`
- **Docker**: Needed for local Supabase instance
- **File System**: Migration hash tracking and file watching

### MCP Integration Points
1. **Database Schema Access**: Replace Supabase CLI with MCP Supabase integration
2. **Type Generation**: Use MCP to generate TypeScript types from database
3. **Migration Monitoring**: Adapt hash system to work with MCP-managed migrations
4. **Validation Hooks**: Integrate schema validation with MCP workflow

### Implementation Considerations
- **Hash System**: May need adaptation for MCP-managed migration tracking
- **Build Integration**: Ensure MCP integration doesn't break existing build scripts
- **CI/CD Compatibility**: Maintain graceful fallbacks for automated environments
- **Legacy Cleanup**: Remove `src/types/supabase.ts` and update all imports
- **Watch Mode**: Adapt file watching for MCP-managed schema changes

### Migration Strategy
1. **Phase 1**: Update type import patterns to use database.generated.ts consistently
2. **Phase 2**: Replace Supabase CLI calls with MCP Supabase integration
3. **Phase 3**: Adapt hash tracking system for MCP workflow
4. **Phase 4**: Update build integration and validation hooks
5. **Phase 5**: Remove legacy files and complete transition

## Edge Cases & Gotchas

- **Docker Dependency**: Type generation fails if Supabase not running locally
- **Placeholder Generation**: Creates minimal types when generation fails
- **Schema Validation**: Strict validation can block builds during development
- **Hash Sensitivity**: Changes to migration file timestamps trigger regeneration
- **CI Environment**: Special handling for continuous integration environments
- **Remote Generation**: Requires SUPABASE_PROJECT_ID environment variable
- **Legacy Imports**: Mixed usage of old and new type import patterns

## Relevant Docs

- [Supabase CLI Type Generation](https://supabase.com/docs/reference/cli/supabase-gen-types)
- [Database-First Architecture Guide](https://supabase.com/docs/guides/api/generating-types)
- [React Admin DataProvider Interface](https://marmelab.com/react-admin/DataProvider.html)