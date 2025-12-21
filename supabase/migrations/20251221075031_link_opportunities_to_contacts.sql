-- Migration: Link Grand Rapids Opportunities to Contacts
-- Purpose: Fix missing opportunity_contacts junction table entries
-- Context: Grand Rapids campaign created opportunities named "Contact @ Org"
--          but never linked them to contacts via the junction table
--
-- Two issues to fix:
-- 1. 184 opportunities have matching contacts but no junction entry
-- 2. 185 opportunities have organizations with no contacts at all

-- =====================================================
-- STEP 1: Link existing contacts to their opportunities
-- =====================================================

-- Insert junction entries for opportunities where contact exists
-- Match by: contact name = everything before ' @ ' in opportunity name
-- AND contact belongs to same customer organization

INSERT INTO opportunity_contacts (opportunity_id, contact_id, created_at)
SELECT DISTINCT
  o.id as opportunity_id,
  c.id as contact_id,
  CURRENT_TIMESTAMP
FROM opportunities o
LEFT JOIN opportunity_contacts oc ON o.id = oc.opportunity_id
JOIN contacts c ON c.organization_id = o.customer_organization_id
  AND c.name = split_part(o.name, ' @ ', 1)
WHERE oc.id IS NULL
  AND o.deleted_at IS NULL
  AND c.deleted_at IS NULL
ON CONFLICT DO NOTHING;

-- =====================================================
-- STEP 2: Create missing contacts for unlinked opportunities
-- =====================================================

-- For opportunities where no matching contact exists,
-- create the contact using the name from the opportunity

INSERT INTO contacts (name, organization_id, created_at)
SELECT DISTINCT
  split_part(o.name, ' @ ', 1) as name,
  o.customer_organization_id as organization_id,
  CURRENT_TIMESTAMP
FROM opportunities o
LEFT JOIN opportunity_contacts oc ON o.id = oc.opportunity_id
LEFT JOIN contacts c ON c.organization_id = o.customer_organization_id
  AND c.name = split_part(o.name, ' @ ', 1)
  AND c.deleted_at IS NULL
WHERE oc.id IS NULL
  AND o.deleted_at IS NULL
  AND c.id IS NULL
  AND o.name LIKE '%@%'  -- Only process opportunities with @ pattern
ON CONFLICT DO NOTHING;

-- =====================================================
-- STEP 3: Link the newly created contacts
-- =====================================================

-- Now link the opportunities to the contacts we just created

INSERT INTO opportunity_contacts (opportunity_id, contact_id, created_at)
SELECT DISTINCT
  o.id as opportunity_id,
  c.id as contact_id,
  CURRENT_TIMESTAMP
FROM opportunities o
LEFT JOIN opportunity_contacts oc ON o.id = oc.opportunity_id
JOIN contacts c ON c.organization_id = o.customer_organization_id
  AND c.name = split_part(o.name, ' @ ', 1)
WHERE oc.id IS NULL
  AND o.deleted_at IS NULL
  AND c.deleted_at IS NULL
ON CONFLICT DO NOTHING;

-- =====================================================
-- STEP 4: Verify Results
-- =====================================================

DO $$
DECLARE
  unlinked_count INTEGER;
  total_links INTEGER;
BEGIN
  -- Count opportunities still without contacts
  SELECT COUNT(*) INTO unlinked_count
  FROM opportunities o
  LEFT JOIN opportunity_contacts oc ON o.id = oc.opportunity_id
  WHERE oc.id IS NULL AND o.deleted_at IS NULL;

  -- Count total links created
  SELECT COUNT(*) INTO total_links
  FROM opportunity_contacts;

  RAISE NOTICE '============================================';
  RAISE NOTICE 'OPPORTUNITY-CONTACT LINKING COMPLETE';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Total opportunity_contacts entries: %', total_links;
  RAISE NOTICE 'Opportunities still unlinked: %', unlinked_count;

  IF unlinked_count = 0 THEN
    RAISE NOTICE 'SUCCESS: All opportunities now have contact links';
  ELSE
    RAISE NOTICE 'Note: % opportunities remain unlinked (may not have @ pattern)', unlinked_count;
  END IF;
END $$;
