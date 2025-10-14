# Build System Research for MCP Workflow Transition

Comprehensive analysis of the current build system, developer commands, and dependencies for transitioning from Docker-based local development to MCP-based remote development workflow.

## Current Command Structure

### Core Package.json Scripts
The application uses 65 npm scripts organized in distinct categories:

**Database Operations**
- `generate:types` - Auto-generates TypeScript from database schema using local Supabase CLI
- `generate:types:watch` - Continuous type generation with file watching
- `generate:types:force` - Force regeneration ignoring migration hash
- `db:check` - Runs smoke tests against database
- `db:pre-deploy` - Pre-deployment validation checks

**Development Workflow**
- `dev` - Generates types then starts Vite dev server (`npm run generate:types && vite --force`)
- `build` - Full production build (`npm run generate:types && tsc && vite build`)
- `prebuild` - Pre-build hook for type generation

**Testing Suite**
- `test` - Vitest runner for all tests
- `test:smoke` - Database smoke tests (`src/tests/smoke/db-smoke.test.ts`)
- `test:critical` - Critical path testing (`src/tests/smoke/critical-path.test.ts`)
- `test:security` - Security-focused tests
- `test:coverage` - Test coverage reporting

**Validation & Quality**
- `validate:all` - Runs all validation checks (schema, colors, types)
- `validate:schema` - Database schema validation via TypeScript script
- `validate:env` - Environment variable validation
- `lint:check` / `lint:apply` - ESLint operations
- `prettier:check` / `prettier:apply` - Code formatting

**Migration & Production**
- 20+ migration scripts (`migrate:*`) including dry-run, backup, rollback, monitoring
- `migrate:advisor` - Uses Supabase advisor for performance/security validation

### Makefile Commands
The makefile provides high-level orchestration with Docker dependency:

**Development Stack**
- `make start` - Starts both Supabase (`npx supabase start`) and app (`npm run dev`)
- `make start-supabase` - Local Supabase via Docker
- `make start-app` - Vite development server
- `make stop` - Stops local Supabase Docker containers

**Database Operations**
- `make supabase-migrate-database` - Apply migrations locally
- `make supabase-reset-database` - Reset local database
- `make supabase-deploy` - Push to remote (`npx supabase db push`)

**Production**
- `make build` - Production build
- `make prod-deploy` - Build and deploy to GitHub Pages
- `make supabase-remote-init` - Initialize remote Supabase project

## Build Pipeline

### Type Generation Dependency Chain
The entire build process depends on database-first architecture:

1. **Database Schema** (PostgreSQL) → **Supabase CLI** → **Generated Types** → **TypeScript Compilation** → **Vite Build**

2. **Critical Path**: `scripts/generate-types.cjs`
   - Calculates migration hash to detect schema changes
   - Runs `npx supabase gen types typescript --local`
   - Validates generated types against expected schema structure
   - Creates fallback placeholder if Docker/Supabase unavailable
   - Extensive schema validation for required tables, views, enums

3. **Build Hook Integration**:
   - `prebuild` - Ensures types are generated before build
   - `dev` - Generates types before starting development server
   - CI/CD validates types are committed and up-to-date

### Vite Configuration
Advanced build optimization in `vite.config.ts`:
- Manual chunk splitting for vendor, UI, utils, React Admin, data layers
- Brotli and Gzip compression
- Security headers middleware for development
- Bundle analysis with rollup-plugin-visualizer

### Test Configuration
Comprehensive test setup with Vitest:
- Coverage thresholds: 60% global, 70-80% for critical paths
- Test categories: unit, integration, smoke, e2e, performance
- Database-dependent smoke tests require Supabase connectivity

## Development Workflow

### Current Local Development
1. **Prerequisites**: Docker, Node.js 20+, Supabase CLI
2. **Startup**: `make start` (starts Docker + Supabase + Vite)
3. **Type Safety**: Automatic type generation from local database
4. **Testing**: Direct database connectivity for smoke tests
5. **Hot Reload**: File watching for migrations triggers type regeneration

### Database Dependency Pattern
Every development command has potential database dependency:

**Direct Dependencies**:
- All `npm run test:*` commands (require database connectivity)
- `npm run generate:types` (requires Supabase CLI + Docker)
- `npm run validate:schema` (database schema introspection)
- `npm run db:*` commands (database operations)

**Indirect Dependencies**:
- `npm run dev` (generates types which requires database)
- `npm run build` (type generation in prebuild hook)
- `npm run lint:type-safety` (depends on generated types)

### Environment Configuration

#### Required Variables
- `VITE_SUPABASE_URL` - Supabase project URL (client-safe)
- `VITE_SUPABASE_ANON_KEY` - Anonymous key with RLS protection
- `SUPABASE_SERVICE_ROLE_KEY` - Server-side operations (migration scripts)
- `DATABASE_URL` - Direct PostgreSQL connection for scripts

#### Development vs Production
- **Local**: `http://127.0.0.1:54321` (Docker Supabase)
- **Remote**: `https://[project-ref].supabase.co` (hosted Supabase)
- **Security**: Clear separation between client-safe and server-only keys

## CI/CD Integration

### GitHub Actions Workflow (`.github/workflows/check.yml`)
Four-stage validation pipeline:

**Stage 1: Lint**
- ESLint and Prettier validation
- Uses `wearerequired/lint-action` for automated fixes

**Stage 2: Test**
- Runs `make test-ci` (sets `CI=1` environment)
- Requires database connectivity or test mocking

**Stage 3: Coverage**
- Full test suite with coverage reporting
- Uploads to Codecov with detailed metrics

**Stage 4: Type Check**
- Validates migration changes with `node ./scripts/check-migrations.cjs --verify`
- Ensures generated types are committed (`git diff --exit-code src/types/database.generated.ts`)
- TypeScript compilation check (`npx tsc --noEmit`)

**Stage 5: Build**
- Full production build validation
- Dependency on type generation and Docker availability

### CI Environment Challenges
- No Docker/Supabase in GitHub Actions by default
- Type generation creates placeholder files in CI mode
- Test isolation requires database mocking or remote connectivity

## MCP Transition Requirements

### Database Connection Migration
**Current**: Local Docker Supabase instance required for all development
**Target**: MCP Supabase tools for remote database operations

**Impact Assessment**:
- `scripts/generate-types.cjs` must support MCP-based type generation
- All migration scripts need MCP adapter layer
- Smoke tests require remote database connectivity configuration
- Development startup no longer requires Docker

### Script Modernization Needs

**High Priority**:
1. **Type Generation** (`scripts/generate-types.cjs`)
   - Replace `npx supabase gen types typescript --local` with MCP equivalent
   - Add remote project ID configuration
   - Maintain schema validation and migration hash checking

2. **Database Validation** (`scripts/validate-environment.cjs`)
   - Already supports remote validation via environment detection
   - Needs MCP adapter for connection testing

3. **Migration Scripts** (20+ `scripts/migrate-*.js`)
   - Currently use Supabase CLI and service role key
   - Need MCP Supabase tools integration for remote operations

4. **Smoke Tests** (`src/tests/smoke/db-smoke.test.ts`)
   - Hardcoded for local development environment
   - Require remote database configuration

**Medium Priority**:
1. **Pre-deployment Checks** (`scripts/pre-deploy-check.js`, `scripts/run-smoke-tests.js`)
   - Environment variable validation
   - Remote connectivity testing

2. **Build Pipeline** (`package.json`, `makefile`)
   - Remove Docker dependencies
   - Update environment variable requirements

**Low Priority**:
1. **Development Server** (Vite, hot reload)
   - Minimal changes required
   - Type generation integration point

### Environment Variable Updates
**New Requirements**:
- `SUPABASE_PROJECT_ID` - For MCP operations
- Remote database connection strings
- MCP authentication tokens

**Deprecated**:
- Local Docker-specific URLs (`http://127.0.0.1:54321`)
- Local-only service keys

### Testing Strategy Migration
**Current**: Direct local database connectivity
**Target**:
- Remote database connections for integration tests
- Mock/stub layers for unit tests where appropriate
- Environment-aware test configuration

### Build Optimization Opportunities
1. **Faster Development Startup**
   - Remove Docker startup time (30-60 seconds)
   - Direct MCP connections (~2-3 seconds)

2. **Simplified Dependencies**
   - Remove Docker Desktop requirement
   - Reduce local environment complexity

3. **Enhanced CI/CD**
   - True integration testing with remote database
   - Consistent environment between development and CI

4. **Team Collaboration**
   - Shared remote database for development
   - Consistent schema state across team members

## Recommended Transition Approach

### Phase 1: MCP Integration Layer
1. Create MCP adapter functions in `src/lib/mcp/`
2. Add MCP configuration to environment variables
3. Update type generation script to support both local and MCP modes
4. Test MCP connectivity in development environment

### Phase 2: Script Migration
1. Update migration scripts to use MCP adapters
2. Modify smoke tests for remote database connectivity
3. Update validation scripts for MCP compatibility
4. Test full development workflow with MCP

### Phase 3: Build System Updates
1. Remove Docker dependencies from Makefile
2. Update package.json scripts for MCP workflow
3. Modify CI/CD pipeline for remote database testing
4. Update documentation and developer onboarding

### Phase 4: Cleanup & Optimization
1. Remove legacy Docker-based configurations
2. Optimize MCP connection pooling and caching
3. Enhance error handling for remote operations
4. Performance tuning for remote database operations

This research provides the foundation for planning the MCP workflow transition while maintaining the robust database-first architecture and comprehensive validation pipeline that characterizes the current build system.