-- Phase 2D: Consolidate Duplicate Organizations
-- Merges duplicates identified in Phase 2B into their "keep" records
--
-- Summary:
-- - GROUP 1: 7 Monks Taproom (ID 5 -> ID 10005)
-- - GROUP 2: Notre Dame Dining (ID 1338 -> ID 10206)
-- - GROUP 3: Al Peake & Sons (IDs 1533, 21 -> ID 20)
--
-- Note: Only consolidates if BOTH source and target IDs exist in database

DO $$
BEGIN
  -- GROUP 1: 7 Monks Taproom (ID 5 -> ID 10005)
  IF EXISTS (SELECT 1 FROM organizations WHERE id IN (5, 10005) GROUP BY 1 HAVING COUNT(*) = 2) THEN
    UPDATE contacts SET organization_id = 10005 WHERE organization_id = 5;
    UPDATE activities SET organization_id = 10005 WHERE organization_id = 5;
    UPDATE interaction_participants SET organization_id = 10005 WHERE organization_id = 5;
    UPDATE opportunity_participants SET organization_id = 10005 WHERE organization_id = 5;
    UPDATE opportunities SET customer_organization_id = 10005 WHERE customer_organization_id = 5;
    UPDATE opportunities SET principal_organization_id = 10005 WHERE principal_organization_id = 5;
    UPDATE opportunities SET distributor_organization_id = 10005 WHERE distributor_organization_id = 5;
    DELETE FROM organizations WHERE id = 5;
    RAISE NOTICE 'GROUP 1: Consolidated 7 Monks Taproom (ID 5 -> ID 10005)';
  ELSE
    RAISE NOTICE 'GROUP 1: Skipped - IDs 5 or 10005 not found in database';
  END IF;

  -- GROUP 2: Notre Dame Dining (ID 1338 -> ID 10206)
  IF EXISTS (SELECT 1 FROM organizations WHERE id IN (1338, 10206) GROUP BY 1 HAVING COUNT(*) = 2) THEN
    UPDATE contacts SET organization_id = 10206 WHERE organization_id = 1338;
    UPDATE activities SET organization_id = 10206 WHERE organization_id = 1338;
    UPDATE interaction_participants SET organization_id = 10206 WHERE organization_id = 1338;
    UPDATE opportunity_participants SET organization_id = 10206 WHERE organization_id = 1338;
    UPDATE opportunities SET customer_organization_id = 10206 WHERE customer_organization_id = 1338;
    UPDATE opportunities SET principal_organization_id = 10206 WHERE principal_organization_id = 1338;
    UPDATE opportunities SET distributor_organization_id = 10206 WHERE distributor_organization_id = 1338;
    DELETE FROM organizations WHERE id = 1338;
    RAISE NOTICE 'GROUP 2: Consolidated Notre Dame Dining (ID 1338 -> ID 10206)';
  ELSE
    RAISE NOTICE 'GROUP 2: Skipped - IDs 1338 or 10206 not found in database';
  END IF;

  -- GROUP 3: Al Peake & Sons (IDs 1533, 21 -> ID 20)
  IF EXISTS (SELECT 1 FROM organizations WHERE id = 20) THEN
    IF EXISTS (SELECT 1 FROM organizations WHERE id IN (1533, 21)) THEN
      UPDATE contacts SET organization_id = 20 WHERE organization_id IN (1533, 21);
      UPDATE activities SET organization_id = 20 WHERE organization_id IN (1533, 21);
      UPDATE interaction_participants SET organization_id = 20 WHERE organization_id IN (1533, 21);
      UPDATE opportunity_participants SET organization_id = 20 WHERE organization_id IN (1533, 21);
      UPDATE opportunities SET customer_organization_id = 20 WHERE customer_organization_id IN (1533, 21);
      UPDATE opportunities SET principal_organization_id = 20 WHERE principal_organization_id IN (1533, 21);
      UPDATE opportunities SET distributor_organization_id = 20 WHERE distributor_organization_id IN (1533, 21);
      DELETE FROM organizations WHERE id IN (1533, 21);
      RAISE NOTICE 'GROUP 3: Consolidated Al Peake & Sons (IDs 1533, 21 -> ID 20)';
    ELSE
      RAISE NOTICE 'GROUP 3: Skipped - IDs 1533 or 21 not found in database';
    END IF;
  ELSE
    RAISE NOTICE 'GROUP 3: Skipped - ID 20 not found in database';
  END IF;
END $$;
