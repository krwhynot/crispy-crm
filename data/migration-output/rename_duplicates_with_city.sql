-- Rename Duplicate Organizations with City Suffix
-- This script adds city names to duplicate organizations that have different locations
--
-- Strategy:
--   1. For each duplicate set with different cities, rename each copy to include city
--   2. For duplicates in same city, keep one and merge others
--   3. For duplicates with no city, add numeric suffix or keep best one

-- ============================================================================
-- PART 1: Rename duplicates with DIFFERENT cities (4 organizations)
-- ============================================================================

-- 1. MERRILLVILLE REGIONAL MENTAL HEALTH (5 copies, 2 cities: MERRILLVILLE, South Beloit)
--    IDs and their cities need to be identified first

DO $$
DECLARE
  org_record RECORD;
  new_name TEXT;
BEGIN
  -- Process MERRILLVILLE REGIONAL MENTAL HEALTH
  FOR org_record IN
    SELECT id, name, city, state
    FROM organizations
    WHERE name = 'MERRILLVILLE REGIONAL MENTAL HEALTH'
      AND id > 5
    ORDER BY id
  LOOP
    IF org_record.city IS NOT NULL AND org_record.city != '' THEN
      new_name := org_record.name || ' - ' || org_record.city;
    ELSE
      new_name := org_record.name || ' - Location ' || org_record.id;
    END IF;

    RAISE NOTICE 'Renaming org ID %: "%" -> "%"', org_record.id, org_record.name, new_name;

    UPDATE organizations
    SET name = new_name
    WHERE id = org_record.id;
  END LOOP;

  -- Process Faklandia Brewing (4 copies, 2 cities: Chicago, St Francis)
  FOR org_record IN
    SELECT id, name, city, state
    FROM organizations
    WHERE name = 'Faklandia Brewing'
      AND id > 5
    ORDER BY id
  LOOP
    IF org_record.city IS NOT NULL AND org_record.city != '' THEN
      new_name := org_record.name || ' - ' || org_record.city;
    ELSE
      new_name := org_record.name || ' - Location ' || org_record.id;
    END IF;

    RAISE NOTICE 'Renaming org ID %: "%" -> "%"', org_record.id, org_record.name, new_name;

    UPDATE organizations
    SET name = new_name
    WHERE id = org_record.id;
  END LOOP;

  -- Process Lutherdale (3 copies, 2 cities: Elkhorn, Ludington)
  FOR org_record IN
    SELECT id, name, city, state
    FROM organizations
    WHERE name = 'Lutherdale'
      AND id > 5
    ORDER BY id
  LOOP
    IF org_record.city IS NOT NULL AND org_record.city != '' THEN
      new_name := org_record.name || ' - ' || org_record.city;
    ELSE
      new_name := org_record.name || ' - Location ' || org_record.id;
    END IF;

    RAISE NOTICE 'Renaming org ID %: "%" -> "%"', org_record.id, org_record.name, new_name;

    UPDATE organizations
    SET name = new_name
    WHERE id = org_record.id;
  END LOOP;

  -- Process KNIGHTS OF COLUMBUS #1282 (3 copies, 2 cities: Dwight, South holland)
  FOR org_record IN
    SELECT id, name, city, state
    FROM organizations
    WHERE name = 'KNIGHTS OF COLUMBUS #1282'
      AND id > 5
    ORDER BY id
  LOOP
    IF org_record.city IS NOT NULL AND org_record.city != '' THEN
      new_name := org_record.name || ' - ' || org_record.city;
    ELSE
      new_name := org_record.name || ' - Location ' || org_record.id;
    END IF;

    RAISE NOTICE 'Renaming org ID %: "%" -> "%"', org_record.id, org_record.name, new_name;

    UPDATE organizations
    SET name = new_name
    WHERE id = org_record.id;
  END LOOP;

END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check renamed organizations
SELECT '═══ RENAMED ORGANIZATIONS ═══' as section;

SELECT
  id,
  name,
  city,
  (SELECT COUNT(*) FROM contacts c WHERE c.organization_id = o.id) as contact_count
FROM organizations o
WHERE id > 5
  AND (
    name LIKE 'MERRILLVILLE REGIONAL MENTAL HEALTH%'
    OR name LIKE 'Faklandia Brewing%'
    OR name LIKE 'Lutherdale%'
    OR name LIKE 'KNIGHTS OF COLUMBUS #1282%'
  )
ORDER BY name, id;

-- Check remaining duplicates after renaming
SELECT '═══ REMAINING DUPLICATES AFTER CITY RENAMING ═══' as section;

SELECT
  name,
  COUNT(*) as duplicate_count
FROM organizations
WHERE id > 5
GROUP BY name
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC, name
LIMIT 20;

-- Summary statistics
SELECT '═══ SUMMARY STATISTICS ═══' as section;

WITH duplicates AS (
  SELECT name
  FROM organizations
  WHERE id > 5
  GROUP BY name
  HAVING COUNT(*) > 1
)
SELECT
  'Total organizations:' as metric,
  COUNT(*)::text as value
FROM organizations WHERE id > 5
UNION ALL
SELECT
  'Duplicate organization names:' as metric,
  COUNT(*)::text as value
FROM duplicates
UNION ALL
SELECT
  'Organizations with city suffix:' as metric,
  COUNT(*)::text as value
FROM organizations
WHERE id > 5
  AND (name LIKE '%- %' OR name LIKE '%Location %');
