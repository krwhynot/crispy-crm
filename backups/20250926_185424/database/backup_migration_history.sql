-- Backup Supabase migration history
CREATE TABLE IF NOT EXISTS public.migration_history_backup_20250127 AS
SELECT * FROM supabase_migrations.schema_migrations;

-- Backup any custom migration tracking
CREATE TABLE IF NOT EXISTS public.custom_migration_backup_20250127 AS
SELECT * FROM public.migration_history;

-- Export migration history as JSON for reference
COPY (
    SELECT json_agg(row_to_json(t))
    FROM (
        SELECT * FROM supabase_migrations.schema_migrations
        ORDER BY version
    ) t
) TO '/tmp/migration_history.json';
