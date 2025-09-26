# CI/CD Workflows and GitHub Actions Research

The Atomic CRM project uses GitHub Actions for CI/CD with a focus on database migration automation, testing, and deployment to Supabase. The workflows are designed around remote development (no local Supabase) and fail-fast principles.

## Relevant Files

- `/.github/workflows/check.yml`: Main CI workflow for linting, testing, and building
- `/.github/workflows/deploy.yml`: Production deployment workflow with Supabase integration
- `/makefile`: Build automation and test execution targets
- `/vitest.config.ts`: Test configuration for component and integration testing
- `/package.json`: NPM scripts for migration, validation, and testing operations
- `/scripts/validation/`: Pre-migration validation scripts and frameworks
- `/scripts/`: Migration execution and monitoring scripts
- `/eslint.config.js`: Linting configuration with architectural enforcement rules
- `/supabase/config.toml`: Supabase CLI configuration for remote deployment
- `/.env.example`: Environment variable template for CI/CD secrets

## Architectural Patterns

- **Remote-First Development**: No local Supabase instance required, all operations target remote projects
- **Fail-Fast CI**: Concurrent jobs for linting, testing, and building with early termination on failures
- **Migration-Aware Deployment**: Automated database migration push via `supabase db push` in deployment workflow
- **Service Layer Testing**: Performance tests validate unified data provider with junction table operations
- **Configuration-Driven Validation**: ESLint rules enforce architectural patterns and prevent regression
- **Conditional Deployment**: Deployment steps only execute when all required Supabase secrets are configured

## Current Workflow Files and Purposes

### Check Workflow (`check.yml`)
**Triggers**: Push to main, PR events (opened, reopened, synchronize, ready_for_review)
**Jobs**:
- **ESLint Job**: Runs comprehensive linting with architectural rule enforcement
  - Uses `wearerequired/lint-action@v2` for inline PR feedback
  - Validates TypeScript files: `**/*.{mjs,ts,tsx}`
  - Prettier formatting check: `**/*.{js,json,ts,tsx,css,md,html}`
- **Test Job**: Executes test suite via `make test-ci` (sets `CI=1` environment)
  - Runs Vitest with JSdom environment for component testing
  - Includes performance tests for junction table operations
- **Build Job**: Production build verification via `npm run build`
  - Uses Vite with optimized chunking and minification
  - Validates TypeScript compilation and bundle creation

### Deploy Workflow (`deploy.yml`)
**Triggers**: Push to main branch only
**Key Features**:
- **Supabase Integration**: Links to project, pushes migrations, deploys functions
- **Environment Management**: Comprehensive secret validation with warning reports
- **Two-Stage Deployment**: Database changes followed by static site deployment
- **Secret Validation**: Checks for missing configuration and reports in step summary

**Database Operations Sequence**:
1. Link to Supabase project: `npx supabase link --project-ref $SUPABASE_PROJECT_ID`
2. Push migrations: `npx supabase db push`
3. Deploy Edge Functions: `npx supabase functions deploy`
4. Set webhook secrets for Postmark integration

**Deployment Target**: GitHub Pages via `gh-pages` with production remote repository

## Database-Related CI/CD Steps

### Migration Automation
- **Migration Push**: Automatic execution of new migrations via `supabase db push`
- **Function Deployment**: Edge Functions deployed to Supabase runtime
- **Secret Management**: Postmark webhook credentials managed through Supabase secrets

### Environment Configuration
**Required Secrets**:
- `SUPABASE_ACCESS_TOKEN`: CLI authentication
- `SUPABASE_DB_PASSWORD`: Database connection
- `SUPABASE_PROJECT_ID`: Target project identifier
- `SUPABASE_URL`: Project API endpoint
- `SUPABASE_ANON_KEY`: Anonymous access key

**Optional Secrets**:
- `POSTMARK_WEBHOOK_USER`: Email integration authentication
- `POSTMARK_WEBHOOK_PASSWORD`: Email service credentials
- `POSTMARK_WEBHOOK_AUTHORIZED_IPS`: IP whitelist for webhooks

### Migration Execution Pattern
1. **Pre-deployment**: All tests and builds must pass
2. **Database First**: Migrations applied before application deployment
3. **Function Sync**: Edge Functions deployed with database changes
4. **Rollback Strategy**: Limited to 48-hour window per project documentation

## Pre-Commit Hooks and Validation Mechanisms

### Husky Configuration
- **Location**: `/.husky/_/` directory with boilerplate hook files
- **Status**: Configured but no active pre-commit scripts detected
- **Framework**: Uses Husky v2+ with hook delegation pattern

### ESLint Architectural Enforcement
**Constitution Compliance Rules**:
- **Form Validation Prevention**: Blocks React Admin validation in favor of API boundary validation
- **Legacy Field Protection**: Prevents reintroduction of deprecated fields (company_id, archived_at)
- **Color System Enforcement**: Validates semantic color usage over legacy Tailwind classes
- **Import Restrictions**: Blocks forbidden validation imports from ra-core

### Validation Scripts
**Pre-Migration Framework** (`/scripts/validation/`):
- `run-pre-validation.js`: Orchestrates comprehensive validation suite
- `data-quality.js`: Validates data integrity before migrations
- `referential-integrity.js`: Checks foreign key constraints
- `required-fields.js`: Validates mandatory field completeness
- `unique-constraints.js`: Verifies uniqueness requirements
- `go-no-go.js`: Final migration readiness assessment

### Migration Scripts
**Execution Pipeline** (`/scripts/`):
- `mcp-migrate.js`: MCP-based migration execution
- `migration-validate.sh`: Pre-migration validation runner
- `post-migration-validation.js`: Post-migration verification
- `production-safety-wrapper.js`: Production deployment safety checks

## Testing Infrastructure Requirements

### Database Setup
- **Remote Connection**: Tests connect to Supabase via environment variables
- **Test Data**: Performance tests create comprehensive junction table datasets
- **Cleanup**: Automatic teardown after test completion
- **Performance Thresholds**: Defined limits for junction table operations

### Test Configuration
- **Framework**: Vitest with JSdom environment for React component testing
- **Setup**: `@testing-library/jest-dom` for DOM assertions
- **Path Aliases**: `@/` alias maps to `src/` directory
- **CI Mode**: `CI=1` environment variable enables headless testing

### Performance Monitoring
**Junction Table Benchmarks**:
- Contact-Organization joins: 200ms threshold
- Opportunity participants: 250ms threshold
- Interaction participants: 150ms threshold
- Multi-table joins: 400ms threshold
- Bulk operations: 500-600ms thresholds

## Deployment and Environment Management Patterns

### Two-Phase Deployment
1. **Database Phase**: Schema changes applied first via Supabase CLI
2. **Application Phase**: Static assets deployed to GitHub Pages

### Environment Isolation
- **Development**: Uses remote Supabase development project
- **Production**: Separate Supabase project with production data
- **Testing**: Connects to remote development environment

### Secret Management
- **GitHub Secrets**: Centralized secret storage for Supabase credentials
- **Environment Variables**: Public configuration via GitHub Variables
- **Validation**: Comprehensive secret presence checking with failure reporting

### Rollback Strategy
- **Database**: 48-hour rollback window via Supabase dashboard
- **Application**: Git-based rollback through GitHub Pages deployment
- **Coordination**: Manual coordination required between database and application rollbacks

## Edge Cases & Gotchas

- **No Local Supabase**: All development and testing uses remote projects, requiring network connectivity
- **Migration Timing**: Database migrations applied during deployment may cause brief downtime
- **Secret Dependencies**: Deployment silently skips Supabase operations if secrets are missing
- **Performance Test Dependencies**: Junction table tests require significant test data setup time
- **ESLint False Positives**: Some architectural rules may flag valid patterns due to Tailwind v4 limitations
- **Function Deployment**: Edge Function deployment happens after migration, creating potential inconsistency window

## Relevant Docs

- [GitHub Actions Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Supabase CLI Migration Guide](https://supabase.com/docs/guides/cli/managing-migrations)
- [Vitest Configuration Reference](https://vitest.dev/config/)
- [ESLint Flat Config Format](https://eslint.org/docs/latest/use/configure/configuration-files)