# 📝 Supabase Remote Configuration

**Updated:** 2025-10-17

## What We Added

Added `[remotes.production]` configuration block to `supabase/config.toml` following [Supabase's official recommendations](https://supabase.com/docs/guides/deployment/branching/configuration).

## Configuration Details

```toml
# Production Environment
[remotes.production]
project_id = "aaqnanddcqvfiwhshndl"

# Production seed configuration
[remotes.production.db.seed]
enabled = false  # ⚠️ Never seed production!
```

## What This Does

### 1. **Links Production Project**
- Explicitly declares your production Supabase project ID
- Used by CI/CD and branching workflows
- Enables environment-specific configuration

### 2. **Protects Production Data**
- `enabled = false` prevents accidental seeding
- Seed scripts are for local/staging only
- Production data comes from real users, not seed files

## Benefits

✅ **CI/CD Ready**
- GitHub Actions can reference this configuration
- Automated deployments know which project to target

✅ **Prevents Accidents**
- Explicit seed disablement protects production
- Clear separation between environments

✅ **Future-Proof**
- Ready for staging environment when needed
- Supports Supabase branching feature

## When to Use Staging

Uncomment the staging block when you create a staging Supabase project:

```toml
[remotes.staging]
project_id = "your-staging-project-ref"

[remotes.staging.db.seed]
enabled = true                    # OK for staging
sql_paths = ["./supabase/seed.sql"]
```

## Engineering Constitution Compliance

✅ **NO OVER-ENGINEERING**
- Minimal configuration (only what's needed)
- Removed unsupported options (pool_size, etc.)
- Follows Supabase's actual schema

✅ **SINGLE SOURCE OF TRUTH**
- Production project ID defined once in config.toml
- Referenced by all tooling

## What We Learned

Initially added more configuration options (pool_size, max_rows), but these aren't supported in the `[remotes]` block:

```bash
# ❌ This failed:
[remotes.production.db]
pool_size = 20  # Invalid key!

# ✅ This works:
[remotes.production.db.seed]
enabled = false
```

**Lesson:** Stick to documented options only. The CLI validates config.toml strictly.

## Related Documentation

- [Supabase Branching Configuration](https://supabase.com/docs/guides/deployment/branching/configuration)
- [Managing Config & Secrets](https://supabase.com/docs/guides/local-development/managing-config)
- [CLI Config Reference](https://supabase.com/docs/guides/cli/config)

## Testing

Verify config validity:

```bash
npx supabase status
# Should show no errors
```

## Future Enhancements

When you're ready for full CI/CD:

1. Create staging Supabase project
2. Uncomment `[remotes.staging]` block
3. Set up GitHub Actions (see SUPABASE-WORKFLOW-GUIDE.md)
4. Configure secrets with `npx supabase secrets set`
