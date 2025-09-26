# MCP Tools Research

Research findings on Model Context Protocol (MCP) tools usage patterns in the Atomic CRM codebase, focusing on database operations, migrations, and development workflow integration.

## Relevant Files
- `/.mcp.json`: Core MCP server configuration with environment variables
- `/.claude/settings.local.json`: Claude Code MCP permissions and enabled servers
- `/docs/mcp-troubleshooting.md`: Comprehensive troubleshooting guide for MCP workflow
- `/scripts/mcp-migrate.js`: Migration application engine using MCP tools
- `/scripts/mcp-generate-types.cjs`: TypeScript type generation with hash-based change detection
- `/scripts/mcp-migrate-status.js`: Migration status checker with rollback eligibility tracking
- `/scripts/mcp-migrate-create.js`: Migration file creation tool with templates

## Architectural Patterns

### MCP Server Configuration
- **Multi-server setup**: Sequential thinking, Perplexity, and Supabase servers configured
- **Environment isolation**: Service role keys and access tokens separated from client variables
- **Priority levels**: Essential (Supabase), optional (sequential-thinking), disabled (Perplexity)
- **Startup delays**: Configured to prevent race conditions (200-1300ms delays)

### Database Operations via MCP
- **Direct MCP execution**: Uses `mcp__supabase__apply_migration` for DDL operations instead of CLI
- **Query execution**: `mcp__supabase__execute_sql` for data operations and status checks
- **Type generation**: `mcp__supabase__generate_typescript_types` with hash-based change detection
- **Project management**: `mcp__supabase__list_projects`, `mcp__supabase__get_project` for environment verification

### Migration-Specific MCP Functions
- **apply_migration**: Core function for applying DDL migrations with proper naming and validation
- **execute_sql**: Used for data queries, migration history tracking, and rollback operations
- **list_migrations**: Retrieval of migration status from database tracking tables
- **generate_typescript_types**: Automated type generation with comprehensive schema validation

## Edge Cases & Gotchas

### Network Resilience
- **Retry logic**: Type generation implements 3-attempt retry with exponential backoff
- **Timeout handling**: Configurable timeouts (15-30 seconds) prevent hanging operations
- **Graceful degradation**: Placeholder type files created when MCP unavailable
- **Progress indicators**: Visual feedback for long-running MCP operations

### Hash-Based Change Detection
- **Migration hash calculation**: Includes filename, modification time, and file size
- **Incremental generation**: Types only regenerated when migrations change
- **Force override**: `--force` flag bypasses hash checking for development
- **State persistence**: Hash stored in `.migration-hash` file for consistency

### Migration State Management
- **48-hour rollback window**: Tracked in migration_history table with eligibility checks
- **Sequential numbering**: Enforced starting from 108+ with conflict detection
- **Dry-run capabilities**: All migration tools support validation mode
- **Comprehensive logging**: JSON-structured logs with metadata for debugging

### Error Handling Patterns
- **Network vs logic errors**: Different retry strategies for different error types
- **CI/CD compatibility**: Graceful continuation in automated environments
- **Validation enforcement**: Schema validation prevents drift with configurable severity levels
- **Rollback safety**: Automatic backup creation for data migrations

## Relevant Docs

### Internal Documentation
- `/docs/mcp-troubleshooting.md`: Complete troubleshooting guide with network diagnostics
- `/.docs/plans/X-mcp-workflow`: Workflow documentation directory
- Migration templates and validation patterns in scripts directory

### MCP Integration Points
- **Claude Code permissions**: Explicit MCP tool allowlist in `.claude/settings.local.json`
- **Environment configuration**: Service role keys isolated from client-side variables
- **Project ID resolution**: Auto-extraction from VITE_SUPABASE_URL or explicit configuration
- **Development vs CI**: Different behavior patterns for local vs automated environments

### Key Configuration Variables
```bash
# MCP-specific environment variables
VITE_SUPABASE_URL=https://project.supabase.co
VITE_SUPABASE_ANON_KEY=public_key_here
SUPABASE_SERVICE_ROLE_KEY=service_key_here  # Server-side only
SUPABASE_ACCESS_TOKEN=access_token_here     # MCP operations
MCP_PROJECT_ID=project_id                   # Optional explicit setting

# Performance tuning
MCP_MIGRATION_TIMEOUT=60000
MCP_RETRY_ATTEMPTS=5
TYPE_GENERATION_MODE=hash_based
```

### Workflow Best Practices
- **Local development**: Direct MCP tool usage with shared Crispy database
- **Type generation**: Hash-based incremental updates with forced refresh capability
- **Migration workflow**: Sequential numbering with comprehensive validation and rollback planning
- **Testing integration**: MCP tools used for test data setup and cleanup operations
- **Error recovery**: Systematic troubleshooting with network diagnostics and state validation