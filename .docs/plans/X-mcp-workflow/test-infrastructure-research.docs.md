# Test Infrastructure Research for MCP Workflow Transition

Comprehensive analysis of the current testing infrastructure to identify areas requiring updates for the MCP (Model Context Protocol) workflow transition from localhost-based development to cloud-based Supabase instances.

## Current Test Architecture

### Test Configuration Files
- `vitest.config.ts`: Primary test configuration with jsdom environment, coverage thresholds (60% global, 70-80% for critical paths)
- `test-setup.ts`: Minimal setup loading environment variables from `.env.development`
- `package.json`: Comprehensive test script collection including smoke, critical, security, and integration tests

### Test Layer Structure
1. **Smoke Tests** (`src/tests/smoke/`): Basic connectivity and database existence checks
2. **Integration Tests** (`src/tests/integration/`): Data provider and transformer end-to-end testing
3. **Critical Path Tests** (`src/tests/smoke/critical-path.test.ts`): Business workflow validation
4. **Unit Tests**: Co-located with source files (`__tests__/` subdirectories)
5. **Migration Tests** (`src/tests/migration/`): Schema drift and breaking change detection
6. **Performance Tests** (`tests/performance/`): Load testing and query optimization validation

## Database Connection Patterns

### Environment Variable Usage
- **Primary Connection**: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for client-side tests
- **Service Role**: `SUPABASE_SERVICE_ROLE_KEY` for administrative operations in critical path tests
- **Fallback Pattern**: Most scripts default to `http://127.0.0.1:54321` when environment variables are missing
- **Configuration Source**: Tests load from `.env.development` via dotenv

### Connection Initialization
```typescript
// Standard pattern across all test files
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
```

### Database Access Patterns
- **Smoke Tests**: Quick table existence and basic query validation
- **Integration Tests**: Full CRUD operations through unified data provider
- **Critical Path Tests**: Complex business workflows with test data cleanup
- **Connection Validation**: Error handling for missing tables and RLS policy enforcement

## Test Data Management

### Data Cleanup Mechanisms
- **Automatic Cleanup**: `afterAll` hooks in critical path tests track and delete test records
- **Test Data Tracking**: Arrays track created IDs for organizations, contacts, opportunities
- **Service Role Usage**: Critical tests use service role to bypass RLS for cleanup operations
- **Isolation Strategy**: Each test creates unique data with timestamps to avoid conflicts

### Test Data Creation Patterns
```typescript
// Consistent pattern for test data lifecycle
const testData = {
  organizations: [] as number[],
  contacts: [] as number[],
  opportunities: [] as number[]
};

// Cleanup in afterAll hook
if (testData.opportunities.length > 0) {
  await supabase.from('opportunities').delete().in('id', testData.opportunities);
}
```

### RLS Policy Testing
- **Anonymous Access**: Tests verify RLS policies block unauthorized operations
- **Service Role**: Administrative tests use service role for full database access
- **Permission Validation**: Systematic testing of table-level access controls

## Environment Configuration

### Localhost URL Hardcoding
**Identified Hardcoded References:**
- `src/tests/integration/auth-flow.test.ts:48-49`: Mock location object with `http://localhost:3000`
- `.env.example:7`: Default Supabase URL `http://127.0.0.1:54321`
- `.env.example:15`: Default database URL `postgres://postgres:postgres@127.0.0.1:54322/postgres`
- `.env.example:28`: CORS origins including localhost variants
- Multiple script files defaulting to `127.0.0.1:54321`

### Environment Variable Dependencies
- **Required Variables**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- **Administrative Variables**: `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`
- **Configuration Validation**: Scripts check for missing environment variables before execution
- **Environment Files**: Tests load from `.env.development`, scripts may use `.env.local` or `.env`

### Test Environment Isolation
- **Development Environment**: All tests configured for local development setup
- **No Production Testing**: No evidence of production or staging test configurations
- **Single Environment Strategy**: Tests assume single local Supabase instance

## Performance Considerations

### Current Performance Testing
- **Database Query Speed**: Smoke tests expect queries under 500ms
- **Batch Transformation**: Integration tests validate 100 records processed in <100ms
- **Complex Queries**: Multi-table joins expected to complete in <2 seconds
- **Per-Record Processing**: Transformer tests expect <1ms per record

### Performance Baselines
```typescript
// Established performance thresholds
const duration = Date.now() - start;
expect(duration).toBeLessThan(500); // Basic queries
expect(duration).toBeLessThan(100); // Batch transformations
expect(perRecord).toBeLessThan(1);  // Per-record processing
```

### Connection Pooling
- **No Explicit Pooling**: Tests create individual Supabase clients per test file
- **Client Reuse**: Single client instance shared across tests within same file
- **Connection Management**: No explicit connection lifecycle management in tests

## MCP Transition Requirements

### Critical Updates Needed

1. **Environment Configuration**
   - Replace hardcoded localhost URLs with environment-driven configuration
   - Add support for multiple environment targets (local, staging, production)
   - Update `.env.example` with cloud-based defaults
   - Implement environment-specific test configuration

2. **Connection Management**
   - Add connection pooling for cloud-based testing
   - Implement retry logic for network-dependent tests
   - Add connection timeout configuration for cloud latency
   - Update error handling for cloud-specific connection issues

3. **Test Data Management**
   - Enhance cleanup mechanisms for cloud environments
   - Add test database isolation strategies
   - Implement test data seeding for consistent test environments
   - Update RLS testing for cloud-based authentication

4. **Performance Adaptation**
   - Adjust performance thresholds for cloud latency
   - Add network-aware retry logic
   - Update batch operation expectations for cloud connectivity
   - Implement connection health checks

5. **Configuration Management**
   - Add MCP-specific environment variables
   - Update test scripts for cloud-based Supabase instances
   - Implement environment validation for MCP workflow
   - Add support for multiple project environments

### Implementation Priority
1. **High Priority**: Environment variable updates and localhost hardcoding removal
2. **Medium Priority**: Connection management and retry logic implementation
3. **Low Priority**: Performance threshold adjustments and advanced pooling

### Testing Strategy for MCP Transition
- Maintain local testing capability alongside cloud testing
- Implement feature flags for gradual MCP adoption
- Add integration tests for MCP-specific functionality
- Create migration validation tests for MCP workflow transition

## Relevant Documentation
- [Vitest Configuration Guide](https://vitest.dev/config/)
- [Supabase Client Library Documentation](https://supabase.com/docs/reference/javascript)
- Internal transformer documentation in `src/atomic-crm/transformers/`
- Database schema documentation in migration files