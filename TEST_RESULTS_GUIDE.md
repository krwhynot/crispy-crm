# Test Results Guide - Atomic CRM Data Provider Error Testing

## Overview
This guide documents the expected results when testing for data provider errors, specifically the `nb_tasks` field error found in `fix-auth-advanced.html`.

## The Primary Error

### Error Message
```
HttpError2: column contacts_summary.nb_tasks does not exist
```

### When It Occurs
- URL: `/rest/v1/contacts_summary?offset=0&limit=25&nb_tasks=gt.0&order=last_seen.desc.nullslast`
- HTTP Status: 400 Bad Request
- Error Code: PGRST202

### Root Cause
The `contacts_summary` view does not have a `nb_tasks` column. The frontend is attempting to filter contacts by task count using a non-existent field.

## Test Files Created

### 1. `src/atomic-crm/tests/dataProviderSchemaValidation.test.ts`
**Purpose:** Validates database schema against data provider queries

**Key Tests:**
- ✅ Detects when fields don't exist in tables/views
- ✅ Validates filter fields before queries
- ✅ Checks sort field existence
- ✅ Verifies required columns for each resource

**Expected Results:**
```javascript
// Should FAIL (as expected)
contacts_summary.nb_tasks → "column does not exist"

// Should PASS
contacts_summary.last_seen → Valid field
contacts_summary.first_name → Valid field
```

### 2. `src/atomic-crm/tests/dataProviderErrors.test.ts`
**Purpose:** Tests error handling and recovery strategies

**Key Tests:**
- ✅ HttpError transformation
- ✅ Schema mismatch detection
- ✅ Error logging with context
- ✅ Safe fallback generation

**Expected Results:**
```javascript
// Error detection
expect(error.status).toBe(400);
expect(error.message).toContain('nb_tasks does not exist');

// Safe query building (filters out invalid fields)
Input: { nb_tasks: { gt: 0 }, last_seen: { not: null } }
Output: { last_seen: { not: null } } // nb_tasks removed
```

### 3. `src/atomic-crm/tests/unifiedDataProvider.test.ts`
**Purpose:** Tests against real Supabase database

**Key Tests:**
- ✅ Reproduces exact production error
- ✅ Lists valid fields for each table
- ✅ Validates HTTP 400 error responses
- ✅ Provides migration suggestions

**Expected Results:**
```javascript
// Valid fields for contacts_summary (nb_tasks NOT included)
[
  'id', 'name', 'first_name', 'last_name', 'email', 'phone',
  'title', 'role', 'department', 'purchase_influence',
  'decision_authority', 'address', 'city', 'state',
  'postal_code', 'country', 'birthday', 'linkedin_url',
  'twitter_handle', 'notes', 'sales_id', 'created_at',
  'updated_at', 'created_by', 'deleted_at', 'search_tsv',
  'first_seen', 'last_seen', 'gender', 'tags', 'organization_ids'
]
```

### 4. `src/atomic-crm/tests/httpErrorPatterns.test.ts`
**Purpose:** Pattern matching for HTTP errors from production

**Key Tests:**
- ✅ Identifies column does not exist errors
- ✅ Parses error details (table, field)
- ✅ Builds safe URLs by filtering invalid params
- ✅ Provides migration hints

**Expected Results:**
```javascript
// Error pattern extraction
Input: "column contacts_summary.nb_tasks does not exist"
Output: { type: 'column', table: 'contacts_summary', field: 'nb_tasks' }

// Safe URL building
Input: ?nb_tasks=gt.0&last_seen=desc
Output: ?last_seen=desc // nb_tasks removed
```

## Running the Tests

### Individual Test Suites
```bash
# Test error handling patterns
npm run test -- src/atomic-crm/tests/dataProviderErrors.test.ts --run

# Test schema validation
npm run test -- src/atomic-crm/tests/dataProviderSchemaValidation.test.ts --run

# Test against real database
npm run test -- src/atomic-crm/tests/unifiedDataProvider.test.ts --run

# Test HTTP error patterns
npm run test -- src/atomic-crm/tests/httpErrorPatterns.test.ts --run
```

### All Data Provider Tests
```bash
npm run test -- src/atomic-crm/tests/ --run
```

## Using fix-auth-advanced.html

### Steps to Test
1. Open `fix-auth-advanced.html` in a browser
2. Click **"Check Auth"** → Should show "Connected"
3. Click **"Test nb_tasks Error"** button (red button in Database panel)
4. Observe the error in the log:
   ```
   ✅ Expected error caught: column contacts_summary.nb_tasks does not exist
   Error code: PGRST202
   This confirms the nb_tasks field does not exist in contacts_summary
   💡 Solution: To count tasks per contact, you need to:
   1. Join with tasks table, OR
   2. Create a computed column in the view, OR
   3. Use a separate aggregation query
   ```

### Expected Status Indicators
- **Auth**: 🟢 Connected
- **Database**: 🟢 Connected
- **RLS**: 🟢 Active
- **UI**: 🟢 Monitoring

### Health Check Results
Running "Full Health Check" should show:
- ✅ Authentication: Healthy
- ✅ Database Connection: Healthy
- ✅ RLS Policies: Healthy
- ✅ Storage Access: Healthy
- ✅ Network Connectivity: Healthy
- ✅ JWT Token Valid: Healthy

**Result**: Passed 6/6

## Solutions for nb_tasks Error

### Option 1: Join with tasks table
```sql
SELECT
  cs.*,
  COUNT(t.id) as nb_tasks
FROM contacts_summary cs
LEFT JOIN tasks t ON t.contact_id = cs.id
GROUP BY cs.id;
```

### Option 2: Add computed column to view
```sql
ALTER VIEW contacts_summary AS
SELECT
  c.*,
  (SELECT COUNT(*) FROM tasks WHERE contact_id = c.id) as nb_tasks
FROM contacts c;
```

### Option 3: Remove filter from frontend
Update the data provider to not filter by `nb_tasks` or handle it separately.

## Console Error Detection

The error monitoring will capture:
```javascript
[DataProvider Error] Object Object
HttpError2: column contacts_summary.nb_tasks does not exist
    at new HttpError2 (chunk-QWXYEWFL.js:2849:21)
    at chunk-QWXYEWFL.js:2925:29
    at async unifiedDataProvider.ts:514:22
```

## Test Coverage Summary

| Test Type | Coverage | Status |
|-----------|----------|--------|
| Schema Validation | ✅ | Detects missing fields |
| Error Handling | ✅ | Properly transforms errors |
| HTTP 400 Errors | ✅ | Catches schema mismatches |
| Recovery Strategies | ✅ | Provides safe fallbacks |
| Migration Hints | ✅ | Suggests solutions |
| Real Database | ✅ | Validates against production |

## Continuous Monitoring

The test suite will catch:
- New schema mismatches
- Field naming inconsistencies
- Missing database columns
- Invalid filter operations
- Broken foreign key relationships

## Next Steps

1. **Fix the root cause**: Either add `nb_tasks` to the view or update the frontend
2. **Run tests regularly**: Include in CI/CD pipeline
3. **Monitor production**: Use error tracking to catch new schema issues
4. **Document changes**: Update this guide when schema changes

## Related Files

- `/home/krwhynot/Projects/atomic/fix-auth-advanced.html` - Interactive testing tool
- `/home/krwhynot/Projects/atomic/src/atomic-crm/tests/` - Test suite directory
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/unifiedDataProvider.ts` - Data provider implementation