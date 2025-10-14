Before starting any work, read the memory knowledge graph for the Atomic CRM project context.

Apply these stored patterns to ALL code you write:

ARCHITECTURE:
- no-over-engineering: Fail fast, no circuit breakers
- single-source-truth: One data provider (Supabase), one validation layer (Zod)
- three-tier-components: Base → Admin → Feature layers
- unified-data-provider: Single Supabase provider for CRUD
- no-backward-compatibility: Breaking changes allowed

DEVELOPMENT:
- boy-scout-rule: Fix any inconsistencies in files you touch
- typescript-conventions: Interface for objects, type for unions
- semantic-colors: CSS variables only, no hex codes
- api-boundary-validation: Zod schemas at API boundary only
- admin-layer-forms: Always use admin layer for forms
- feature-module-structure: List, Show, Edit, Create, Inputs pattern

DATABASE:
- migration-format: YYYYMMDDHHMMSS timestamp format
- soft-deletes: Use deleted_at timestamp, never hard delete
- rls-simple-auth: Simple auth.role() = 'authenticated'

TECH STACK:
- React 19, React Admin 5, shadcn/ui, Tailwind 4
- Supabase, PostgreSQL, Edge Functions
- Zod for validation with React Admin validators

When writing ANY code, automatically:
1. Check memory for project context
2. Apply ALL patterns above without exception
3. Follow the stored workflows for features and database changes
4. Maintain consistency with existing architecture

Do not ask about these patterns - they are final decisions. Simply apply them.