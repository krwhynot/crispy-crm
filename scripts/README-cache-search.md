# Cache and Search Management Scripts

This directory contains scripts for managing cache invalidation and search index rebuilding during the CRM migration from deals to opportunities.

## Scripts Overview

### Cache Invalidation Script (`cache-invalidation.js`)

Clears all caching layers during migration to prevent stale data issues.

**Usage:**
```bash
# Clear all caches (live execution)
npm run cache:clear

# Dry run to see what would be cleared
npm run cache:clear:dry-run

# Advanced options
node scripts/cache-invalidation.js --verbose
node scripts/cache-invalidation.js --skip-browser --skip-cdn
```

**Cache Layers Handled:**
- Browser localStorage (React Admin store, auth tokens)
- React Query cache (automatic on resource changes)
- Supabase cache (PostgreSQL query cache, RPC functions)
- CDN cache (instructions for CloudFlare, AWS CloudFront, etc.)
- Application cache directories

### Search Reindex Script (`search-reindex.js`)

Rebuilds all search indexes for optimal performance after schema changes.

**Usage:**
```bash
# Rebuild all search indexes
npm run search:reindex

# Dry run to see what would be rebuilt
npm run search:reindex:dry-run

# Advanced options
node scripts/search-reindex.js --verbose
node scripts/search-reindex.js --tables=opportunities,contacts
node scripts/search-reindex.js --skip-postgres --skip-views
```

**Search Components Rebuilt:**
- PostgreSQL B-tree indexes (primary keys, foreign keys)
- PostgreSQL GIN indexes (JSONB columns, full-text search)
- Full-text search vectors (tsvector columns)
- Materialized views (summary tables)
- Custom migration indexes for new tables

## Environment Requirements

### Required Environment Variables

```bash
# Required for search reindex script
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Database Permissions

The search reindex script requires database permissions for:
- Creating and dropping indexes (`CREATE`, `DROP`)
- Analyzing tables (`ANALYZE`)
- Refreshing materialized views (`REFRESH MATERIALIZED VIEW`)
- Executing arbitrary SQL (`execute_sql` RPC function)

## Migration Workflow

### Recommended Execution Order

1. **Before Migration:**
   ```bash
   # Run dry runs to verify scripts work
   npm run cache:clear:dry-run
   npm run search:reindex:dry-run
   ```

2. **During Migration:**
   ```bash
   # Clear caches first
   npm run cache:clear

   # Run database migration
   npm run migrate:production

   # Rebuild search indexes
   npm run search:reindex
   ```

3. **After Migration:**
   ```bash
   # Clear browser caches manually (see instructions in cache script output)
   # Test search functionality in the application
   # Monitor query performance
   ```

## Cache TTLs and Gradual Expiry

### Cache Expiration Times

| Cache Layer | TTL | Notes |
|-------------|-----|-------|
| React Query | 5 minutes | Default staleTime, auto-invalidates on resource changes |
| Browser localStorage | Manual | No automatic expiry, requires manual clearing |
| PostgreSQL | Session-based | Cleared with `DISCARD ALL` |
| CDN | 1-24 hours | Varies by provider, manual invalidation required |
| Materialized Views | Manual | Refreshed by script |

### Gradual Cache Expiry Strategy

1. **Immediate**: PostgreSQL query cache, application caches
2. **5 minutes**: React Query cache (staleTime)
3. **Manual**: Browser localStorage, CDN cache
4. **On-demand**: Materialized views (refresh as needed)

## Troubleshooting

### Common Issues

**Cache Script Issues:**
- Missing Supabase credentials: Set environment variables
- Permission denied: Ensure database user has required permissions
- Log file errors: Check write permissions for `logs/` directory

**Search Script Issues:**
- Index creation fails: Check for naming conflicts or insufficient permissions
- Materialized view refresh fails: Views may not exist yet (migration incomplete)
- Full-text search errors: Ensure tsvector columns exist

### Log Files

Both scripts create detailed log files:
- `logs/cache-invalidation.log`
- `logs/search-reindex.log`

Use these logs for debugging and audit trails.

### Testing Search Functionality

After running the search reindex script, test these features:
- Opportunity search by name, description, category
- Contact search by name, email, phone
- Company search by name, website, location
- Multi-organization contact relationships
- Opportunity participant queries

## Performance Considerations

### Large Database Optimization

For databases with >10,000 records:
- Use `--tables` option to reindex specific tables only
- Run during low-traffic periods
- Monitor disk space (reindexing requires ~2x table size)
- Consider `CONCURRENTLY` option impact on performance

### Memory Usage

The scripts use batched operations to minimize memory usage:
- Cache clearing: Minimal memory impact
- Search reindexing: Uses PostgreSQL's built-in batching
- Large JSONB columns: May require increased `work_mem`

## Security Notes

### Data Protection

- Scripts only clear caches, never modify user data
- Dry run mode shows operations without executing
- Log files may contain metadata but no sensitive data
- Browser localStorage clearing is user-initiated only

### Production Safety

- Always run dry-run first in production
- Test scripts on staging environment
- Have rollback plan ready
- Monitor application performance after execution

## Integration with Migration Scripts

These scripts integrate with the broader migration system:
- Called automatically by `migrate:production`
- Can be run independently for maintenance
- Support the same logging and monitoring patterns
- Follow the same error handling conventions

For more information about the complete migration process, see the main migration documentation in `.docs/plans/crm-migration/`.