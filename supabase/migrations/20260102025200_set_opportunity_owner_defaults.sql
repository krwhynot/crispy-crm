-- ============================================================================
-- Industry Standard: Database handles ownership defaults
-- Pattern: BEFORE INSERT trigger sets owner from current authenticated user
-- ============================================================================

-- Function: Set opportunity owner and account manager defaults
CREATE OR REPLACE FUNCTION public.set_opportunity_owner_defaults()
RETURNS TRIGGER AS $$
BEGIN
  -- Default opportunity_owner_id to current user if not provided
  IF NEW.opportunity_owner_id IS NULL THEN
    NEW.opportunity_owner_id := public.current_sales_id();
  END IF;

  -- Default account_manager_id to owner if not provided
  IF NEW.account_manager_id IS NULL THEN
    NEW.account_manager_id := NEW.opportunity_owner_id;
  END IF;

  -- Final validation: Ensure we have an owner
  IF NEW.opportunity_owner_id IS NULL THEN
    RAISE EXCEPTION 'Cannot determine opportunity owner. User may not have a sales record.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if present (idempotent)
DROP TRIGGER IF EXISTS trigger_set_opportunity_owner_defaults ON public.opportunities;

-- Create trigger to run BEFORE INSERT
CREATE TRIGGER trigger_set_opportunity_owner_defaults
  BEFORE INSERT ON public.opportunities
  FOR EACH ROW
  EXECUTE FUNCTION public.set_opportunity_owner_defaults();

-- Add comment for documentation
COMMENT ON FUNCTION public.set_opportunity_owner_defaults() IS
  'Sets opportunity_owner_id and account_manager_id from current_sales_id() if not provided. Industry standard pattern for ownership defaults.';
