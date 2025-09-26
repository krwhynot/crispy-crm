BEGIN;

-- Create backup table for rollback capability
CREATE TABLE tags_color_backup AS
SELECT id, name, color, NOW() as backup_date FROM tags;

-- Map old hex colors to new semantic identifiers
UPDATE tags
SET color = CASE
  WHEN color = '#eddcd2' THEN 'warm'
  WHEN color = '#fff1e6' THEN 'yellow'
  WHEN color = '#fde2e4' THEN 'pink'
  WHEN color = '#fad2e1' THEN 'pink'
  WHEN color = '#c5dedd' THEN 'teal'
  WHEN color = '#dbe7e4' THEN 'green'
  WHEN color = '#f0efeb' THEN 'gray'
  WHEN color = '#d6e2e9' THEN 'blue'
  WHEN color = '#bcd4e6' THEN 'blue'
  WHEN color = '#99c1de' THEN 'teal'
  ELSE 'gray' -- Fallback for any unexpected values
END
WHERE color LIKE '#%';

-- Add check constraint to prevent invalid colors
ALTER TABLE tags
ADD CONSTRAINT valid_tag_colors
CHECK (color IN ('warm','green','teal','blue','purple','yellow','gray','pink'));

-- Data integrity validation queries
DO $$
DECLARE
  invalid_count INTEGER;
BEGIN
  -- Check if any tags have invalid colors after migration
  SELECT COUNT(*) INTO invalid_count
  FROM tags
  WHERE color NOT IN ('warm','green','teal','blue','purple','yellow','gray','pink');

  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'Migration failed: % tags have invalid colors', invalid_count;
  END IF;

  -- Log migration success
  RAISE NOTICE 'Tag color migration completed successfully. All colors are valid.';
END $$;

COMMIT;