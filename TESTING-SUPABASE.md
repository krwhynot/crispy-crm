# Testing Your Supabase Docker Setup

This guide covers comprehensive testing of your local Supabase Docker environment.

## Quick Start

### 1. Run Automated Tests

```bash
# Test Docker services and database connectivity
./test-supabase-setup.sh

# Test API endpoints with your app credentials
./test-api-endpoints.sh
```

### 2. Access Web Interfaces

- **Supabase Studio**: http://localhost:54323
  - Visual database editor
  - Table browser
  - SQL editor
  - Authentication manager

- **Inbucket** (Email Testing): http://localhost:54324
  - Catch all emails sent by your app
  - Test password resets, invitations, etc.

## Test Checklist

### ✅ Infrastructure Tests

- [x] Docker containers running and healthy
- [x] PostgreSQL database accessible (port 54322)
- [x] Kong API Gateway responding (port 54321)
- [x] Supabase Studio accessible (port 54323)
- [x] Database schema with 25+ tables

### ✅ API Tests

- [x] REST API endpoint accessible
- [x] Authentication system responding
- [x] Anonymous key authentication working
- [ ] Storage buckets operational (may be 503 initially)
- [ ] Realtime websocket connections
- [ ] Edge Functions runtime

### ✅ Database Tests

1. **Connection Test**
   ```bash
   docker exec supabase_db_atomic-crm-demo psql -U postgres -c "SELECT version();"
   ```

2. **Table Count**
   ```bash
   docker exec supabase_db_atomic-crm-demo psql -U postgres -c "\dt public.*"
   ```

3. **Query Test**
   ```bash
   docker exec supabase_db_atomic-crm-demo psql -U postgres -c "SELECT COUNT(*) FROM contacts;"
   ```

### ✅ Application Integration Tests

1. **Start Dev Server**
   ```bash
   npm run dev
   # Access at http://localhost:5173
   ```

2. **Run Test Suite**
   ```bash
   npm test
   ```

3. **Test Authentication Flow**
   - Navigate to login page
   - Try signing up with test email
   - Check Inbucket for confirmation email
   - Verify login works

4. **Test CRUD Operations**
   - Create a contact
   - View contact list
   - Edit contact details
   - Delete contact (soft delete)

## Manual API Testing

### Using cURL

```bash
# Set your credentials
export SUPABASE_URL="http://localhost:54321"
export SUPABASE_ANON_KEY="your-anon-key-from-env-local"

# List contacts
curl "$SUPABASE_URL/rest/v1/contacts?select=*&limit=10" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY"

# Create a contact
curl -X POST "$SUPABASE_URL/rest/v1/contacts" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Contact",
    "emails": [{"email": "test@example.com"}]
  }'

# Query opportunities
curl "$SUPABASE_URL/rest/v1/opportunities?select=id,name,stage&limit=10" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY"

# Query organizations
curl "$SUPABASE_URL/rest/v1/organizations?select=id,name&limit=10" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY"
```

### Using Supabase Studio

1. Open http://localhost:54323
2. Navigate to "Table Editor"
3. Select a table (e.g., `contacts`)
4. Click "Insert row" to add test data
5. Use SQL Editor for complex queries

## Testing RLS Policies

### 1. Check Current Policies

```bash
docker exec supabase_db_atomic-crm-demo psql -U postgres -c "
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
"
```

### 2. Test Anonymous Access

```bash
# This should work (RLS allows authenticated users)
curl "$SUPABASE_URL/rest/v1/contacts?select=id" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY"
```

### 3. Test Without Auth (should fail)

```bash
# This should return 401 or empty results
curl "$SUPABASE_URL/rest/v1/contacts?select=id"
```

## Testing Edge Functions

### 1. List Functions

```bash
docker exec supabase_edge_runtime_atomic-crm-demo ls /home/deno/functions
```

### 2. Call a Function

```bash
curl -X POST "$SUPABASE_URL/functions/v1/your-function-name" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"key": "value"}'
```

## Testing Storage

### 1. Create a Bucket

Using Supabase Studio:
1. Navigate to Storage
2. Click "New bucket"
3. Name it (e.g., "avatars")
4. Set public/private

### 2. Upload a File via API

```bash
curl -X POST "$SUPABASE_URL/storage/v1/object/avatars/test.jpg" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: image/jpeg" \
  --data-binary "@/path/to/image.jpg"
```

## Performance Testing

### 1. Query Performance

```bash
# Time a query
time curl "$SUPABASE_URL/rest/v1/contacts?select=*&limit=1000" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY"
```

### 2. Load Testing

```bash
# Run load tests
npm run test:load
```

## Common Issues & Solutions

### Storage Returns 503

**Issue**: Storage service not fully initialized
**Solution**: Wait 30 seconds after `supabase start`, or restart:
```bash
npx supabase stop
npx supabase start
```

### RLS Policies Blocking Queries

**Issue**: Queries return empty results
**Solution**: Check RLS policies and ensure user is authenticated:
```bash
docker exec supabase_db_atomic-crm-demo psql -U postgres -c "
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public';
"
```

### Connection Refused

**Issue**: Cannot connect to database
**Solution**: Verify Docker containers are running:
```bash
docker ps | grep supabase
```

### Migration Failures

**Issue**: Database schema doesn't match expected
**Solution**: Reset and reapply migrations:
```bash
npx supabase db reset
npx supabase db push
```

## Continuous Testing

### Pre-Commit Testing

```bash
# Run before committing
npm run lint
npm test
npm run build
```

### CI/CD Testing

Your GitHub Actions should test:
1. Build succeeds
2. Tests pass
3. Type checking passes
4. Linting passes

## Monitoring & Debugging

### Check Logs

```bash
# All services
npx supabase logs

# Specific service
npx supabase logs postgres
npx supabase logs auth
npx supabase logs storage
```

### Monitor Database

```bash
# Active connections
docker exec supabase_db_atomic-crm-demo psql -U postgres -c "
SELECT count(*) as connections FROM pg_stat_activity;
"

# Table sizes
docker exec supabase_db_atomic-crm-demo psql -U postgres -c "
SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size('public.' || tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size('public.' || tablename) DESC;
"
```

## Next Steps

1. ✅ Verify all core services are running
2. ✅ Test API endpoints with your credentials
3. ✅ Run application in dev mode (`npm run dev`)
4. ⬜ Seed test data (`npm run seed:data`)
5. ⬜ Run full test suite (`npm test`)
6. ⬜ Test authentication flow
7. ⬜ Test CRUD operations for each entity
8. ⬜ Verify RLS policies work as expected
9. ⬜ Test file uploads (avatars, attachments)
10. ⬜ Performance test with realistic data volume

## Resources

- **Supabase Docs**: https://supabase.com/docs
- **Local Development**: https://supabase.com/docs/guides/cli/local-development
- **Testing Guide**: https://supabase.com/docs/guides/getting-started/testing
- **Studio**: http://localhost:54323
- **API Docs**: http://localhost:54321/rest/v1/

---

**Status**: Your Supabase Docker setup is operational! Core services verified and ready for development.
