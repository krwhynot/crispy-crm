-- Migration: Convert legacy color values to semantic color names
-- Purpose: Migrate hex colors and Tailwind utilities to MFB Garden Theme semantic names
-- Date: 2025-01-17
-- Related: MFB Garden Theme Migration (January 2025)

-- Step 1: Create a mapping function for legacy hex colors to semantic names
-- This mirrors the HEX_TO_SEMANTIC_MAP from src/lib/color-types.ts
CREATE OR REPLACE FUNCTION map_hex_to_semantic(hex_color TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE LOWER(hex_color)
    WHEN '#eddcd2' THEN 'warm'
    WHEN '#fff1e6' THEN 'yellow'
    WHEN '#fde2e4' THEN 'pink'
    WHEN '#fad2e1' THEN 'pink'
    WHEN '#c5dedd' THEN 'teal'
    WHEN '#dbe7e4' THEN 'green'
    WHEN '#f0efeb' THEN 'gray'
    WHEN '#d6e2e9' THEN 'blue'
    WHEN '#bcd4e6' THEN 'blue'
    WHEN '#99c1de' THEN 'teal'
    WHEN '#ef4444' THEN 'warm'  -- Test compatibility
    WHEN '#3b82f6' THEN 'blue'  -- Test compatibility
    ELSE NULL
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 2: Create a mapping function for Tailwind color utilities to semantic names
CREATE OR REPLACE FUNCTION map_tailwind_to_semantic(tailwind_color TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Extract base color from Tailwind format (e.g., 'blue-500' → 'blue')
  RETURN CASE
    WHEN tailwind_color LIKE 'blue%' THEN 'blue'
    WHEN tailwind_color LIKE 'green%' THEN 'green'
    WHEN tailwind_color LIKE 'teal%' THEN 'teal'
    WHEN tailwind_color LIKE 'purple%' THEN 'purple'
    WHEN tailwind_color LIKE 'yellow%' THEN 'yellow'
    WHEN tailwind_color LIKE 'gray%' THEN 'gray'
    WHEN tailwind_color LIKE 'pink%' THEN 'pink'
    WHEN tailwind_color LIKE 'rose%' THEN 'pink'
    WHEN tailwind_color LIKE 'red%' THEN 'warm'
    WHEN tailwind_color LIKE 'orange%' THEN 'amber'
    WHEN tailwind_color LIKE 'amber%' THEN 'amber'
    WHEN tailwind_color LIKE 'lime%' THEN 'green'
    WHEN tailwind_color LIKE 'emerald%' THEN 'green'
    WHEN tailwind_color LIKE 'cyan%' THEN 'teal'
    WHEN tailwind_color LIKE 'sky%' THEN 'blue'
    WHEN tailwind_color LIKE 'indigo%' THEN 'purple'
    WHEN tailwind_color LIKE 'violet%' THEN 'purple'
    WHEN tailwind_color LIKE 'fuchsia%' THEN 'purple'
    WHEN tailwind_color LIKE 'slate%' THEN 'gray'
    WHEN tailwind_color LIKE 'zinc%' THEN 'gray'
    WHEN tailwind_color LIKE 'neutral%' THEN 'gray'
    WHEN tailwind_color LIKE 'stone%' THEN 'cocoa'
    WHEN tailwind_color LIKE 'brown%' THEN 'cocoa'
    ELSE NULL
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 3: Backup existing tag colors (for rollback)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tags_color_backup') THEN
    CREATE TABLE public.tags_color_backup AS
    SELECT id, color, created_at, NOW() as backup_date
    FROM public.tags;

    RAISE NOTICE 'Created backup table: tags_color_backup with % rows',
      (SELECT COUNT(*) FROM public.tags_color_backup);
  ELSE
    RAISE NOTICE 'Backup table already exists, skipping...';
  END IF;
END $$;

-- Step 4: Migrate hex colors to semantic names
UPDATE public.tags
SET
  color = map_hex_to_semantic(color),
  updated_at = NOW()
WHERE
  color LIKE '#%'
  AND map_hex_to_semantic(color) IS NOT NULL;

-- Step 5: Migrate Tailwind color utilities to semantic names
UPDATE public.tags
SET
  color = map_tailwind_to_semantic(color),
  updated_at = NOW()
WHERE
  color LIKE '%-%'  -- Matches patterns like 'blue-500'
  AND map_tailwind_to_semantic(color) IS NOT NULL;

-- Step 6: Set default for any remaining invalid colors
UPDATE public.tags
SET
  color = 'gray',
  updated_at = NOW()
WHERE
  color NOT IN (
    'warm', 'yellow', 'pink', 'green', 'teal',
    'blue', 'purple', 'gray', 'clay', 'sage', 'amber', 'cocoa'
  );

-- Step 7: Update the default value constraint for the color column
ALTER TABLE public.tags
  ALTER COLUMN color SET DEFAULT 'gray';

-- Step 8: Add a check constraint to enforce valid semantic color names
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tags_color_check'
    AND conrelid = 'public.tags'::regclass
  ) THEN
    ALTER TABLE public.tags
      ADD CONSTRAINT tags_color_check
      CHECK (color IN (
        'warm', 'yellow', 'pink', 'green', 'teal',
        'blue', 'purple', 'gray', 'clay', 'sage', 'amber', 'cocoa'
      ));
    RAISE NOTICE 'Added constraint: tags_color_check';
  ELSE
    RAISE NOTICE 'Constraint tags_color_check already exists';
  END IF;
END $$;

-- Step 9: Clean up mapping functions (no longer needed after migration)
-- Uncomment these after verifying migration success:
-- DROP FUNCTION IF EXISTS map_hex_to_semantic(TEXT);
-- DROP FUNCTION IF EXISTS map_tailwind_to_semantic(TEXT);

-- Step 10: Report migration results
DO $$
DECLARE
  total_tags INTEGER;
  migrated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_tags FROM public.tags;

  SELECT COUNT(*) INTO migrated_count
  FROM public.tags t
  INNER JOIN public.tags_color_backup b ON t.id = b.id
  WHERE t.color != b.color;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Color Migration Summary:';
  RAISE NOTICE '  Total tags: %', total_tags;
  RAISE NOTICE '  Colors migrated: %', migrated_count;
  RAISE NOTICE '  Backup table: tags_color_backup';
  RAISE NOTICE '========================================';
END $$;

-- Rollback instructions (save for reference):
-- To rollback this migration:
-- UPDATE public.tags t
-- SET color = b.color, updated_at = NOW()
-- FROM public.tags_color_backup b
-- WHERE t.id = b.id;
--
-- To cleanup after successful migration:
-- DROP TABLE IF EXISTS public.tags_color_backup;
-- DROP FUNCTION IF EXISTS map_hex_to_semantic(TEXT);
-- DROP FUNCTION IF EXISTS map_tailwind_to_semantic(TEXT);
