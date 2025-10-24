-- Migration: Enforce priority inheritance from customer organization
-- Business Rule: Opportunity priority ALWAYS matches customer org priority

-- Function to map organization priority (A/B/C/D) to opportunity priority_level
CREATE OR REPLACE FUNCTION map_org_priority_to_opp_priority(org_priority varchar(1))
RETURNS priority_level AS $$
BEGIN
  RETURN CASE org_priority
    WHEN 'A' THEN 'critical'::priority_level
    WHEN 'B' THEN 'high'::priority_level
    WHEN 'C' THEN 'medium'::priority_level
    WHEN 'D' THEN 'low'::priority_level
    ELSE 'medium'::priority_level  -- Default if NULL
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION map_org_priority_to_opp_priority IS
  'Maps organization priority (A/B/C/D) to opportunity priority_level enum';

-- Function to sync opportunity priority with customer organization
CREATE OR REPLACE FUNCTION sync_opportunity_priority()
RETURNS TRIGGER AS $$
DECLARE
  v_org_priority varchar(1);
BEGIN
  -- Get priority from customer organization
  SELECT priority INTO v_org_priority
  FROM organizations
  WHERE id = NEW.customer_organization_id;

  -- FAIL FAST: If customer org doesn't exist, abort
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Customer organization % does not exist', NEW.customer_organization_id;
  END IF;

  -- Force opportunity priority to match customer org
  NEW.priority := map_org_priority_to_opp_priority(v_org_priority);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION sync_opportunity_priority IS
  'Enforces business rule: opportunity priority inherits from customer organization';

-- Trigger on INSERT or UPDATE of customer_organization_id
DROP TRIGGER IF EXISTS enforce_priority_inheritance_on_opportunity ON opportunities;

CREATE TRIGGER enforce_priority_inheritance_on_opportunity
  BEFORE INSERT OR UPDATE OF customer_organization_id ON opportunities
  FOR EACH ROW
  EXECUTE FUNCTION sync_opportunity_priority();

-- Function to cascade priority changes to opportunities
CREATE OR REPLACE FUNCTION cascade_priority_to_opportunities()
RETURNS TRIGGER AS $$
BEGIN
  -- Update all opportunities linked to this org
  UPDATE opportunities
  SET priority = map_org_priority_to_opp_priority(NEW.priority)
  WHERE customer_organization_id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cascade_priority_to_opportunities IS
  'Cascades organization priority changes to all linked opportunities';

-- Trigger on UPDATE of organization priority
DROP TRIGGER IF EXISTS cascade_priority_on_org_update ON organizations;

CREATE TRIGGER cascade_priority_on_org_update
  AFTER UPDATE OF priority ON organizations
  FOR EACH ROW
  WHEN (OLD.priority IS DISTINCT FROM NEW.priority)
  EXECUTE FUNCTION cascade_priority_to_opportunities();
