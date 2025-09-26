BEGIN;

-- Remove constraint
ALTER TABLE tags DROP CONSTRAINT IF EXISTS valid_tag_colors;

-- Restore original colors from backup
UPDATE tags t
SET color = b.color
FROM tags_color_backup b
WHERE t.id = b.id
AND b.backup_date = (SELECT MAX(backup_date) FROM tags_color_backup);

-- Data integrity validation queries
DO $$
DECLARE
  restored_count INTEGER;
  backup_count INTEGER;
BEGIN
  -- Count how many tags were restored
  SELECT COUNT(*) INTO restored_count
  FROM tags t
  INNER JOIN tags_color_backup b ON t.id = b.id
  WHERE b.backup_date = (SELECT MAX(backup_date) FROM tags_color_backup)
  AND t.color = b.color;

  -- Count total backup records
  SELECT COUNT(*) INTO backup_count
  FROM tags_color_backup
  WHERE backup_date = (SELECT MAX(backup_date) FROM tags_color_backup);

  -- Verify restoration
  IF restored_count != backup_count THEN
    RAISE WARNING 'Rollback may be incomplete: % of % tags restored', restored_count, backup_count;
  ELSE
    RAISE NOTICE 'Rollback completed successfully: % tags restored to original colors', restored_count;
  END IF;
END $$;

-- Verify restoration before dropping backup
-- DROP TABLE tags_color_backup; -- Run manually after verification

COMMIT;