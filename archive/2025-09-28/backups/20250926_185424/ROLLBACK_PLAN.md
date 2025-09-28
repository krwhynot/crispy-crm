# Rollback Plan for Migration Consolidation

## Emergency Rollback Procedure

### If Issues Occur During Consolidation:

1. **Stop All Operations**
   ```bash
   # Cancel any running migrations
   pkill -f "supabase"
   ```

2. **Restore Migration Files**
   ```bash
   # Restore original migration files
   rm -rf supabase/migrations/*
   cp -r backups/[timestamp]/migrations/* supabase/migrations/
   ```

3. **Restore Migration History**
   ```sql
   -- Connect to database and run:
   TRUNCATE supabase_migrations.schema_migrations;
   INSERT INTO supabase_migrations.schema_migrations
   SELECT * FROM public.migration_history_backup_20250127;
   ```

4. **Verify Database State**
   ```sql
   -- Check table count
   SELECT COUNT(*) FROM information_schema.tables
   WHERE table_schema = 'public';

   -- Check migration count
   SELECT COUNT(*) FROM supabase_migrations.schema_migrations;
   ```

### If Data Corruption Occurs:

1. **Use Supabase Point-in-Time Recovery**
   - Go to Supabase Dashboard > Settings > Backups
   - Select restore point before consolidation
   - Initiate restore

2. **Alternative: Manual Schema Restore**
   ```bash
   # Run the backed up schema
   psql $DATABASE_URL < backups/[timestamp]/database/export_schema.sql
   ```

### Validation After Rollback:

1. Check all tables exist
2. Verify RLS policies are active
3. Test application connectivity
4. Confirm data integrity

### Support Contacts:

- Supabase Support: support.supabase.com
- Database Admin: [your contact]
- Emergency Escalation: [backup contact]
