-- Add 'operator' to existing organization_type enum
-- Existing enum has: {customer, prospect, principal, distributor}
-- Adding 'operator' for restaurant/foodservice end customers

DO $$
BEGIN
  -- Add 'operator' to organization_type enum if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'operator'
    AND enumtypid = 'organization_type'::regtype
  ) THEN
    ALTER TYPE organization_type ADD VALUE 'operator';
  END IF;
END $$;

COMMENT ON TYPE organization_type IS 'Organization classification: customer, prospect, principal, distributor, operator';
