# Performance Testing Suite

## Overview
Performance and load testing suite for the CRM migration, focusing on the new opportunities schema and junction table performance.

## Test Files

### 1. opportunity-queries.spec.ts
Tests query performance for the new opportunities table with 10,000+ records.

**Test Coverage:**
- Simple list queries (threshold: 100ms)
- Filtered list queries with multiple conditions (threshold: 150ms)
- Complex joins with multiple relationships (threshold: 300ms)
- Aggregation queries for dashboard data (threshold: 200ms)
- Full-text search performance (threshold: 250ms)
- Pagination efficiency (threshold: 100ms per page)
- Concurrent query handling

**Key Metrics:**
- Baseline comparison with original deals table performance
- Response time percentiles (P50, P95, P99)
- Query throughput under load

### 2. junction-table-performance.spec.ts
Tests the performance of many-to-many junction tables introduced in the migration.

**Junction Tables Tested:**
- `contact_organizations` - Contact to Organization relationships
- `opportunity_participants` - Organizations participating in opportunities
- `interaction_participants` - Participants in activities/interactions

**Test Coverage:**
- Many-to-many join performance (threshold: 200ms)
- Multi-level nested queries (threshold: 400ms)
- Bulk insert operations (threshold: 500ms)
- Bulk update operations (threshold: 600ms)
- Complex filtering on junction data (threshold: 300ms)

### 3. load-test.js
Comprehensive load testing script simulating real user behavior.

**Features:**
- Configurable concurrent users (default: 10)
- Adjustable test duration (default: 60s)
- Weighted endpoint selection mimicking real usage patterns
- Ramp-up time for gradual load increase

**Endpoints Tested (with weights):**
- List Opportunities (30%)
- Get Opportunity Details (20%)
- List Contacts (15%)
- Get Contact with Organizations (10%)
- List Companies (10%)
- Search Opportunities (5%)
- Dashboard Aggregations (5%)
- Complex Join Query (3%)
- Create Activity (2%)

**Metrics Collected:**
- Total requests and success/failure rates
- Response time statistics (min, mean, median, P95, P99, max)
- Throughput (requests per second)
- Peak concurrency
- Error distribution by type
- Request distribution by endpoint

## Running the Tests

### Performance Tests
```bash
# Run all performance tests
npm run test:performance

# Run specific test file
npx vitest run tests/performance/opportunity-queries.spec.ts
npx vitest run tests/performance/junction-table-performance.spec.ts
```

### Load Testing
```bash
# Run with defaults (10 users, 60s, 5 req/s per user)
npm run test:load

# Custom configuration
node ./scripts/load-test.js [users] [duration] [requests-per-second]

# Example: 50 concurrent users for 120 seconds at 10 req/s
node ./scripts/load-test.js 50 120 10
```

## Performance Baselines

### Query Performance Targets
| Query Type | Target | Baseline (Deals) |
|------------|--------|------------------|
| Simple List | <100ms | 85ms |
| Filtered List | <150ms | 120ms |
| Complex Join | <300ms | 250ms |
| Aggregation | <200ms | N/A |
| Search | <250ms | N/A |
| Pagination | <100ms | N/A |

### Junction Table Targets
| Operation | Target | Notes |
|-----------|--------|-------|
| Contact-Org Join | <200ms | Many-to-many with nested select |
| Opportunity Participants | <250ms | With filters and relations |
| Interaction Participants | <150ms | Multiple relations |
| Multi-Junction Query | <400ms | Multiple junction tables |
| Bulk Insert | <500ms | 150 records |
| Bulk Update | <600ms | 100 records |

### Load Test Success Criteria
- Median response time: <200ms (Excellent), <500ms (Good)
- P95 response time: <1s (Excellent), <2s (Acceptable)
- Error rate: <1% (Excellent), <5% (Acceptable)
- Throughput: >100 req/s (Excellent), >50 req/s (Good)

## Test Data Management

### Setup
- Tests automatically create test data in `beforeAll` hooks
- Opportunities: 10,000+ records with varied stages/statuses
- Contacts: 500 with multiple organization relationships
- Organizations: 100 with different types (customer, principal, distributor)
- Activities: 300 with participants

### Cleanup
- All test data is cleaned up in `afterAll` hooks
- Load test activities are auto-deleted after 5 seconds
- No persistent test data remains after test completion

## Reports

### Performance Test Output
Tests display a summary table after completion showing:
- Query type and execution time
- Pass/fail status against thresholds
- Record counts processed
- Comparison with baseline performance

### Load Test Reports
Reports are saved to `logs/load-tests/load-test-[timestamp].json` containing:
- Summary statistics
- Response time percentiles
- Request distribution
- Error analysis
- Configuration used

## Troubleshooting

### Common Issues

1. **Connection Errors**
   - Ensure Supabase is running: `npx supabase start`
   - Check environment variables are set correctly

2. **Slow Performance**
   - Check database indexes are created
   - Verify RLS policies are optimized
   - Consider connection pooling settings

3. **Test Data Conflicts**
   - Tests use unique identifiers to avoid conflicts
   - Clean up may fail if tests are interrupted - run cleanup manually if needed

4. **Memory Issues**
   - Large test datasets may require increased Node memory
   - Use: `NODE_OPTIONS="--max-old-space-size=4096" npm run test:performance`

## CI/CD Integration

These tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run Performance Tests
  run: |
    npm run test:performance
  env:
    VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}

- name: Run Load Test
  run: |
    node ./scripts/load-test.js 20 30 5
  continue-on-error: true
```

## Future Enhancements

- [ ] Add database query plan analysis
- [ ] Implement performance regression detection
- [ ] Add memory usage tracking
- [ ] Create performance dashboard
- [ ] Add comparative analysis between environments
- [ ] Implement automated performance alerts