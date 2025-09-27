-- Export current migration history
SELECT
    version,
    name,
    'archived' as status,
    now() as archived_at
FROM supabase_migrations.schema_migrations
ORDER BY version;
