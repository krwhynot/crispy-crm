# MCP Troubleshooting Guide

This guide provides comprehensive troubleshooting solutions for the MCP (Model Context Protocol) workflow in Atomic CRM. The MCP workflow eliminates local Supabase CLI dependencies, using cloud-first development with the shared Crispy database.

## Table of Contents

1. [Quick Diagnosis Checklist](#quick-diagnosis-checklist)
2. [Network Connectivity Issues](#network-connectivity-issues)
3. [Type Generation Problems](#type-generation-problems)
4. [Migration Application Errors](#migration-application-errors)
5. [Test Execution Issues](#test-execution-issues)
6. [Authentication and Permission Problems](#authentication-and-permission-problems)
7. [Performance Optimization](#performance-optimization)
8. [Emergency Procedures](#emergency-procedures)
9. [Advanced Troubleshooting](#advanced-troubleshooting)
10. [Best Practices](#best-practices)

## Quick Diagnosis Checklist

Before diving into specific issues, run through this checklist:

```bash
# 1. Validate environment configuration
npm run mcp:validate

# 2. Check network connectivity
curl -I https://aaqnanddcqvfiwhshndl.supabase.co

# 3. Test basic MCP functionality
npm run mcp:generate-types:force

# 4. Verify database connection
npm run test:smoke

# 5. Check for pending migrations
npm run mcp:migrate:status
```

**Environment Variables Checklist:**
- [ ] `VITE_SUPABASE_URL` set to `https://aaqnanddcqvfiwhshndl.supabase.co`
- [ ] `VITE_SUPABASE_ANON_KEY` configured with valid anonymous key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configured for MCP operations
- [ ] `MCP_PROJECT_ID` set to `aaqnanddcqvfiwhshndl`
- [ ] `.env` file copied from `.env.example`

## Network Connectivity Issues

### Issue: MCP Operations Timeout

**Symptoms:**
- `npm run mcp:generate-types` hangs or times out
- Error: "Network request failed" or "Connection timeout"
- MCP migration commands fail with network errors

**Solutions:**

1. **Check Network Connectivity:**
```bash
# Test basic connectivity
ping supabase.com
curl -I https://aaqnanddcqvfiwhshndl.supabase.co

# Test with timeout
curl --max-time 10 https://aaqnanddcqvfiwhshndl.supabase.co/rest/v1/
```

2. **Configure Network Timeouts:**
```bash
# Increase MCP timeout in .env
MCP_MIGRATION_TIMEOUT=60000
MCP_RETRY_ATTEMPTS=5
```

3. **Retry with Exponential Backoff:**
```bash
# Use built-in retry mechanism
npm run mcp:generate-types:force
```

### Issue: Corporate Firewall Blocking MCP Calls

**Symptoms:**
- MCP operations work on personal network but fail at work
- SSL/TLS certificate errors
- Proxy-related connection failures

**Solutions:**

1. **Configure Corporate Proxy:**
```bash
# Set proxy environment variables
export HTTP_PROXY=http://your-proxy:port
export HTTPS_PROXY=http://your-proxy:port
export NO_PROXY=localhost,127.0.0.1
```

2. **Bypass SSL Verification (Development Only):**
```bash
# Add to .env for development only
NODE_TLS_REJECT_UNAUTHORIZED=0
```

3. **Request IT Whitelist:**
- Whitelist `*.supabase.co` domain
- Allow HTTPS traffic to port 443
- Enable WebSocket connections for realtime features

### Issue: Crispy Database Connection Problems

**Symptoms:**
- Error: "Database connection failed"
- Error: "Project aaqnanddcqvfiwhshndl not accessible"
- Authentication errors despite correct keys

**Solutions:**

1. **Verify Database Status:**
```bash
# Check if database is available
curl -H "apikey: YOUR_ANON_KEY" \
  https://aaqnanddcqvfiwhshndl.supabase.co/rest/v1/
```

2. **Validate API Keys:**
```bash
# Test anonymous key
curl -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  https://aaqnanddcqvfiwhshndl.supabase.co/rest/v1/organizations?limit=1

# Test service role key (server-side only)
curl -H "apikey: YOUR_SERVICE_KEY" \
  -H "Authorization: Bearer YOUR_SERVICE_KEY" \
  https://aaqnanddcqvfiwhshndl.supabase.co/rest/v1/organizations?limit=1
```

3. **Check Project Status in Supabase Dashboard:**
- Visit: https://supabase.com/dashboard/project/aaqnanddcqvfiwhshndl
- Verify project is active and not paused
- Check API settings for key validity

## Type Generation Problems

### Issue: Hash-Based Type Generation Failures

**Symptoms:**
- Types not regenerating despite migration changes
- Error: "Migration hash calculation failed"
- Stale types causing TypeScript compilation errors

**Solutions:**

1. **Force Type Regeneration:**
```bash
# Bypass hash checking
npm run mcp:generate-types:force

# Clear hash file and regenerate
rm .migration-hash
npm run mcp:generate-types
```

2. **Debug Hash Calculation:**
```bash
# Check migration files status
ls -la supabase/migrations/

# Verify migration directory structure
find supabase/migrations -name "*.sql" -type f
```

3. **Validate Generated Types:**
```bash
# Check generated types file
cat src/types/database.generated.ts | head -20

# Validate TypeScript compilation
npx tsc --noEmit
```

### Issue: Generated Types Missing Expected Tables

**Symptoms:**
- TypeScript errors for missing table types
- Error: "Property 'organizations' does not exist on type"
- Generated types file appears incomplete

**Solutions:**

1. **Check Database Schema:**
```bash
# Use MCP to list tables
npm run mcp:validate

# Manually inspect via psql if needed
psql $DATABASE_URL -c "\dt"
```

2. **Validate Migration Application:**
```bash
# Check migration status
npm run mcp:migrate:status

# Apply pending migrations
npm run mcp:migrate
```

3. **Force Complete Regeneration:**
```bash
# Clear cache and regenerate everything
rm -rf node_modules/.cache
rm .migration-hash
npm run mcp:generate-types:force
```

### Issue: Type Import Conflicts

**Symptoms:**
- Error: "Cannot resolve module '@/types/supabase'"
- Mixed imports between legacy and generated types
- TypeScript compilation errors in transformers

**Solutions:**

1. **Update Import Statements:**
```bash
# Find legacy imports
grep -r "@/types/supabase" src/

# Replace with generated imports
find src/ -name "*.ts" -o -name "*.tsx" | \
  xargs sed -i 's|@/types/supabase|@/types/database.generated|g'
```

2. **Verify Import Paths:**
```typescript
// Correct import pattern:
import type { Database } from '@/types/database.generated';

// Usage in transformers:
type DbOrganization = Database['public']['Tables']['organizations']['Row'];
```

3. **Remove Legacy Type Files:**
```bash
# Backup and remove legacy files
mv src/types/supabase.ts src/types/supabase.ts.backup
rm src/types/supabase.ts
```

## Migration Application Errors

### Issue: MCP Migration Apply Failures

**Symptoms:**
- Error: "Migration application failed"
- Database schema inconsistency after failed migration
- Transaction rollback messages in logs

**Solutions:**

1. **Check Migration Syntax:**
```bash
# Validate SQL syntax before applying
npm run mcp:migrate:dry-run
```

2. **Apply Migrations Individually:**
```bash
# Apply specific migration file
node scripts/mcp-migrate.js --file 108_feature_name.sql
```

3. **Check Database State:**
```bash
# Verify current migration state
npm run mcp:migrate:status

# Check for locks or conflicts
psql $DATABASE_URL -c "SELECT * FROM supabase_migrations.schema_migrations;"
```

### Issue: Migration State Tracking Errors

**Symptoms:**
- Migrations appear applied but database schema is incorrect
- Duplicate migration application attempts
- Inconsistent migration history

**Solutions:**

1. **Reset Migration Tracking:**
```sql
-- Connect to database and reset migration state
-- CAUTION: This will reset migration tracking
DELETE FROM supabase_migrations.schema_migrations
WHERE version = 'MIGRATION_VERSION';
```

2. **Validate Schema State:**
```bash
# Check table existence
npm run validate:schema

# Verify required views exist
psql $DATABASE_URL -c "\dv *_summary"
```

3. **Manual Migration Recovery:**
```bash
# Create backup before recovery
npm run migrate:backup

# Apply specific migration manually
psql $DATABASE_URL -f supabase/migrations/108_feature.sql
```

### Issue: Sequential Migration Numbering Conflicts

**Symptoms:**
- Error: "Migration number already exists"
- Git conflicts in migration files
- Migration order confusion

**Solutions:**

1. **Check Current Migration Numbers:**
```bash
# List migration files in order
ls -1 supabase/migrations/*.sql | sort
```

2. **Resolve Numbering Conflicts:**
```bash
# Rename conflicting migrations
mv supabase/migrations/108_feature_a.sql supabase/migrations/109_feature_a.sql
```

3. **Use Consistent Numbering:**
```bash
# Create new migration with next available number
npm run mcp:migrate:create feature_description
```

## Test Execution Issues

### Issue: Tests Failing with Cloud Database

**Symptoms:**
- Tests timeout when connecting to Crispy database
- Error: "RLS policy violation" in test runs
- Test data cleanup failures

**Solutions:**

1. **Configure Test Environment:**
```bash
# Update test configuration
export TEST_DATABASE_URL=https://aaqnanddcqvfiwhshndl.supabase.co
export TEST_TIMEOUT=15000
export TEST_SEQUENTIAL_EXECUTION=true
```

2. **Use Service Role for Tests:**
```bash
# Ensure service role key is available for test cleanup
export SUPABASE_SERVICE_ROLE_KEY=your_service_key_here
npm run mcp:test
```

3. **Implement Proper Test Isolation:**
```javascript
// Add to test files:
afterAll(async () => {
  // Cleanup test data using service role client
  const serviceClient = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Delete test records
  await serviceClient.from('test_table').delete().eq('test_flag', true);
});
```

### Issue: Test Data Cleanup Failures

**Symptoms:**
- Test data accumulating in database
- Conflicts between test runs
- "Record already exists" errors

**Solutions:**

1. **Enable Automatic Cleanup:**
```bash
# Set cleanup flags in .env
TEST_CLEANUP_ENABLED=true
TEST_SEQUENTIAL_EXECUTION=true
```

2. **Use Unique Test Identifiers:**
```javascript
// Add timestamp to test data
const testId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
const testOrg = {
  name: `Test Organization ${testId}`,
  test_flag: true
};
```

3. **Manual Cleanup Command:**
```bash
# Create cleanup script
psql $DATABASE_URL -c "
  DELETE FROM opportunities WHERE name LIKE 'Test Opportunity %';
  DELETE FROM contacts WHERE first_name LIKE 'Test Contact %';
  DELETE FROM organizations WHERE name LIKE 'Test Organization %';
"
```

### Issue: RLS Policy Interference in Tests

**Symptoms:**
- Tests can create but not read records
- Inconsistent test results based on authentication state
- "Insufficient permissions" errors in tests

**Solutions:**

1. **Use Service Role Client for Tests:**
```javascript
// Create service role client for admin operations
const serviceClient = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Use service client for test data operations
await serviceClient.from('organizations').insert(testData);
```

2. **Configure Test-Specific RLS Policies:**
```sql
-- Add test-friendly RLS policy
CREATE POLICY "Allow test operations" ON organizations
  FOR ALL
  TO authenticated, anon
  USING (name LIKE 'Test %' OR test_flag = true);
```

3. **Bypass RLS for Test Environment:**
```bash
# Set environment flag for test-specific behavior
TEST_BYPASS_RLS=true
```

## Authentication and Permission Problems

### Issue: Service Role Key Configuration Errors

**Symptoms:**
- Error: "Invalid API key" during MCP operations
- MCP commands work locally but fail in CI/CD
- Permission denied for database operations

**Solutions:**

1. **Validate Service Role Key:**
```bash
# Test service role key functionality
curl -H "apikey: YOUR_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  https://aaqnanddcqvfiwhshndl.supabase.co/rest/v1/organizations?limit=1
```

2. **Check Key Permissions:**
- Verify key has `service_role` permissions
- Confirm key is not expired
- Check Supabase dashboard for key status

3. **Rotate Keys if Compromised:**
```bash
# Generate new service role key from Supabase dashboard
# Update .env with new key
# Test operations with new key
npm run mcp:validate
```

### Issue: Client-Side Key Exposure

**Symptoms:**
- Service role key visible in browser network tab
- Build artifacts contain sensitive keys
- Security warnings about exposed secrets

**Solutions:**

1. **Audit Environment Variables:**
```bash
# Check which variables are exposed to client
npm run build
grep -r "service_role" dist/ # Should return no results
```

2. **Verify VITE_ Prefix Usage:**
```bash
# Only these should have VITE_ prefix:
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_INBOUND_EMAIL=...

# These should NOT have VITE_ prefix:
SUPABASE_SERVICE_ROLE_KEY=...
DATABASE_URL=...
```

3. **Bundle Analysis:**
```bash
# Analyze production bundle for secrets
npm run build
npx webpack-bundle-analyzer dist/assets/*.js
```

### Issue: Cross-Origin Request Blocked (CORS)

**Symptoms:**
- CORS errors in browser console
- Edge functions returning CORS policy errors
- MCP operations failing from web interface

**Solutions:**

1. **Update CORS Configuration:**
```bash
# Add your domain to ALLOWED_ORIGINS in .env
ALLOWED_ORIGINS=https://aaqnanddcqvfiwhshndl.supabase.co,http://localhost:5173,https://your-domain.com
```

2. **Configure Edge Function CORS:**
```javascript
// In edge function files:
import { corsConfig } from '../_shared/cors-config.ts';

// Apply CORS headers
return new Response(data, {
  headers: {
    ...corsConfig,
    'Content-Type': 'application/json'
  }
});
```

3. **Test CORS Configuration:**
```bash
# Test preflight request
curl -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -X OPTIONS \
  https://aaqnanddcqvfiwhshndl.supabase.co/functions/v1/your-function
```

## Performance Optimization

### Issue: Slow Type Generation

**Symptoms:**
- `npm run mcp:generate-types` takes more than 10 seconds
- Type generation blocking development workflow
- Network timeouts during type generation

**Solutions:**

1. **Optimize Hash Calculation:**
```bash
# Use watch mode for development
npm run mcp:generate-types:watch

# Only regenerate when needed
npm run mcp:generate-types  # Uses hash-based detection
```

2. **Configure Performance Settings:**
```bash
# Optimize in .env
MCP_MIGRATION_TIMEOUT=30000
TYPE_GENERATION_MODE=hash_based
TYPE_GENERATION_FORCE_REFRESH=false
```

3. **Use Local Type Caching:**
```bash
# Keep generated types in git for faster builds
git add src/types/database.generated.ts
git commit -m "chore: update generated types"
```

### Issue: Test Execution Performance

**Symptoms:**
- Test suite taking more than 2 minutes
- Individual tests timing out
- Database connection overhead

**Solutions:**

1. **Enable Test Optimizations:**
```bash
# Configure test performance settings
export TEST_SEQUENTIAL_EXECUTION=true
export TEST_TIMEOUT=10000
export TEST_CONNECTION_POOLING=true
```

2. **Use Test Data Factories:**
```javascript
// Create reusable test data factories
const createTestOrganization = (overrides = {}) => ({
  name: `Test Org ${Date.now()}`,
  organization_type: 'company',
  test_flag: true,
  ...overrides
});
```

3. **Implement Connection Pooling:**
```javascript
// Share Supabase client instances across tests
let sharedClient;
beforeAll(() => {
  sharedClient = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  );
});
```

### Issue: Build Performance Degradation

**Symptoms:**
- `npm run build` takes significantly longer
- Type checking phase consuming excessive time
- Vite build process hanging

**Solutions:**

1. **Optimize TypeScript Configuration:**
```json
// In tsconfig.json
{
  "compilerOptions": {
    "incremental": true,
    "skipLibCheck": true,
    "composite": false
  },
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

2. **Use Build Caching:**
```bash
# Enable build caching
export VITE_BUILD_CACHE=true
npm run build
```

3. **Optimize Vite Configuration:**
```javascript
// In vite.config.ts
export default defineConfig({
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js']
        }
      }
    }
  }
});
```

## Emergency Procedures

### Emergency: Complete Type Generation Failure

**When to Use:** Type generation completely broken, blocking all development

**Steps:**

1. **Create Emergency Backup Types:**
```bash
# Copy working types from git
git checkout HEAD~1 -- src/types/database.generated.ts
```

2. **Reset MCP Environment:**
```bash
# Clear all cached data
rm .migration-hash
rm -rf node_modules/.cache
npm install --force
```

3. **Manual Type Generation:**
```bash
# Force complete regeneration
rm src/types/database.generated.ts
npm run mcp:generate-types:force
```

4. **Validate and Test:**
```bash
npm run validate:all
npm run test:smoke
```

### Emergency: Database Schema Corruption

**When to Use:** Database schema inconsistencies preventing normal operation

**Steps:**

1. **Stop All Operations:**
```bash
# Cancel any running migrations or type generation
pkill -f "mcp"
```

2. **Assess Damage:**
```bash
# Check migration status
npm run mcp:migrate:status

# Validate schema
npm run validate:schema
```

3. **Recovery Options:**
   - **Minor Issues:** Apply corrective migration
   - **Major Issues:** Contact database administrator
   - **Critical Issues:** Use backup restoration procedures

4. **Prevent Further Damage:**
```bash
# Disable automatic migrations
export MCP_AUTO_MIGRATE=false
```

### Emergency: API Key Compromise

**When to Use:** Service role or API keys potentially compromised

**Immediate Steps:**

1. **Revoke Compromised Keys:**
   - Go to Supabase Dashboard: https://supabase.com/dashboard/project/aaqnanddcqvfiwhshndl/settings/api
   - Click "Regenerate" on compromised keys

2. **Update Environment Variables:**
```bash
# Update .env with new keys immediately
SUPABASE_SERVICE_ROLE_KEY=new_service_key_here
VITE_SUPABASE_ANON_KEY=new_anon_key_here
```

3. **Audit Exposure:**
```bash
# Check if keys were committed to git
git log --grep="key" --oneline
git log -S "your_old_key" --oneline

# Check production deployments
grep -r "old_key" deployment_configs/
```

4. **Verify Security:**
```bash
# Test new keys
npm run mcp:validate

# Check for unauthorized access in Supabase logs
# Monitor database logs for suspicious activity
```

### Emergency: Complete System Rollback

**When to Use:** Critical failure requiring rollback to previous working state

**Steps:**

1. **Identify Last Working State:**
```bash
# Find last working commit
git log --oneline | head -10
```

2. **Create Emergency Branch:**
```bash
# Create branch to preserve current state
git checkout -b emergency-backup-$(date +%Y%m%d-%H%M%S)
git add -A
git commit -m "Emergency backup before rollback"
```

3. **Rollback to Working State:**
```bash
# Return to last working commit
git checkout main
git reset --hard WORKING_COMMIT_HASH
```

4. **Restore Working Environment:**
```bash
# Reinstall dependencies
npm ci

# Regenerate types
npm run mcp:generate-types:force

# Validate system
npm run validate:all
```

## Advanced Troubleshooting

### Debugging MCP Network Communication

**Enable Verbose Logging:**
```bash
# Set debug environment variables
export DEBUG=mcp:*
export NODE_DEBUG=http,https,net,tls

# Run command with verbose output
npm run mcp:generate-types:force
```

**Network Traffic Analysis:**
```bash
# Use curl to replicate MCP calls
curl -v -H "apikey: YOUR_SERVICE_KEY" \
  -H "Authorization: Bearer YOUR_SERVICE_KEY" \
  "https://aaqnanddcqvfiwhshndl.supabase.co/rest/v1/"
```

**Trace Network Path:**
```bash
# Check routing to Supabase
traceroute aaqnanddcqvfiwhshndl.supabase.co
mtr --report aaqnanddcqvfiwhshndl.supabase.co
```

### Database Connection Pool Analysis

**Check Connection Status:**
```sql
-- Connect to database
psql $DATABASE_URL

-- Check active connections
SELECT
    pid,
    usename,
    application_name,
    client_addr,
    state,
    query_start,
    query
FROM pg_stat_activity
WHERE state = 'active';
```

**Monitor Connection Pool:**
```bash
# Check Supabase dashboard for connection metrics
# Monitor connection pool usage during peak times
# Adjust TEST_CONNECTION_POOLING settings as needed
```

### Advanced Migration Debugging

**Migration Lock Investigation:**
```sql
-- Check for migration locks
SELECT
    locktype,
    database,
    relation,
    pid,
    mode,
    granted
FROM pg_locks
WHERE NOT granted;

-- Check migration table status
SELECT * FROM supabase_migrations.schema_migrations
ORDER BY version DESC LIMIT 10;
```

**Migration Dependency Analysis:**
```bash
# Analyze migration dependencies
node -e "
const fs = require('fs');
const files = fs.readdirSync('supabase/migrations/');
files.forEach(file => {
  const content = fs.readFileSync(\`supabase/migrations/\${file}\`, 'utf-8');
  console.log(\`\${file}: \${content.split('\n').length} lines\`);
});
"
```

## Best Practices

### Development Workflow

1. **Always Validate Before Changes:**
```bash
npm run mcp:validate
```

2. **Use Incremental Type Generation:**
```bash
# Let hash-based system determine when to regenerate
npm run mcp:generate-types  # Not --force
```

3. **Test Migrations Before Applying:**
```bash
npm run mcp:migrate:dry-run
npm run mcp:migrate
```

4. **Maintain Clean Test Environment:**
```bash
# Enable cleanup in all test files
export TEST_CLEANUP_ENABLED=true
```

### Error Prevention

1. **Environment Variable Management:**
   - Use `.env.example` as template
   - Never commit `.env` files
   - Validate environment on startup

2. **API Key Security:**
   - Use VITE_ prefix only for client-safe variables
   - Regular key rotation (90 days)
   - Monitor for key exposure in builds

3. **Migration Safety:**
   - Sequential numbering for new migrations
   - Test migrations on development first
   - Maintain migration rollback procedures

4. **Performance Monitoring:**
   - Track type generation time
   - Monitor test execution duration
   - Watch for build performance regression

### Monitoring and Alerting

1. **Set Up Performance Baselines:**
```bash
# Track key metrics
time npm run mcp:generate-types
time npm run test:smoke
time npm run build
```

2. **Monitor Database Health:**
   - Check Supabase dashboard regularly
   - Monitor connection pool usage
   - Track query performance

3. **Automate Health Checks:**
```bash
# Add to CI pipeline
npm run mcp:validate
npm run test:critical
npm run validate:all
```

### Documentation Maintenance

1. **Keep Troubleshooting Guide Updated:**
   - Document new issues as they arise
   - Update solutions based on experience
   - Remove outdated workarounds

2. **Maintain Environment Configuration:**
   - Update `.env.example` with new variables
   - Document configuration changes
   - Provide migration guides for breaking changes

3. **Share Knowledge:**
   - Document team-specific issues
   - Create runbooks for common procedures
   - Maintain FAQ based on support requests

---

## Getting Help

If this guide doesn't resolve your issue:

1. **Check Recent Changes:**
   - Review recent commits for related changes
   - Check if issue appeared after specific deployment
   - Look for similar issues in project history

2. **Gather Diagnostic Information:**
   - Environment configuration (`npm run mcp:validate`)
   - Error logs with full stack traces
   - Network connectivity status
   - Database migration status

3. **Contact Support Channels:**
   - Project documentation
   - Team communication channels
   - Supabase support for infrastructure issues

4. **Contribute Back:**
   - Document new issues and solutions
   - Update this guide with your findings
   - Share knowledge with the team

Remember: The MCP workflow is designed to be reliable and performant. Most issues stem from network connectivity, environment configuration, or API key problems. Systematic diagnosis using this guide should resolve the majority of issues.

**Last Updated:** 2024-09-24
**Version:** 1.0.0
**Covers:** MCP Workflow v1.0, Crispy Database (aaqnanddcqvfiwhshndl)