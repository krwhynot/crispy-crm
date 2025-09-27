-- Export all table definitions
WITH table_ddl AS (
    SELECT
        'CREATE TABLE IF NOT EXISTS ' || schemaname || '.' || tablename || ' (' ||
        string_agg(
            column_name || ' ' || data_type ||
            CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
            CASE WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default ELSE '' END,
            ', ' ORDER BY ordinal_position
        ) || ');' as ddl,
        tablename,
        1 as sort_order
    FROM information_schema.columns c
    JOIN pg_tables t ON c.table_name = t.tablename AND c.table_schema = t.schemaname
    WHERE c.table_schema = 'public'
    GROUP BY schemaname, tablename
),
index_ddl AS (
    SELECT
        'CREATE INDEX IF NOT EXISTS ' || indexname || ' ON ' || tablename || ' ' || indexdef || ';' as ddl,
        tablename,
        2 as sort_order
    FROM pg_indexes
    WHERE schemaname = 'public'
),
constraint_ddl AS (
    SELECT
        'ALTER TABLE ' || tc.table_name || ' ADD CONSTRAINT ' || tc.constraint_name ||
        ' FOREIGN KEY (' || kcu.column_name || ') REFERENCES ' ||
        ccu.table_name || '(' || ccu.column_name || ');' as ddl,
        tc.table_name as tablename,
        3 as sort_order
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
)
SELECT ddl FROM (
    SELECT * FROM table_ddl
    UNION ALL
    SELECT * FROM index_ddl
    UNION ALL
    SELECT * FROM constraint_ddl
) combined
ORDER BY sort_order, tablename;
