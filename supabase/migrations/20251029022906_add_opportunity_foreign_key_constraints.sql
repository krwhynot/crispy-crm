-- Add missing foreign key constraints to opportunities table
-- These constraints ensure referential integrity while preserving opportunity records

-- 1. Add FK constraint for founding_interaction_id -> activities(id)
-- This is a new constraint that was completely missing
ALTER TABLE public.opportunities
ADD CONSTRAINT opportunities_founding_interaction_id_fkey
FOREIGN KEY (founding_interaction_id)
REFERENCES public.activities(id)
ON DELETE SET NULL;

-- 2. Modify opportunity_owner_id FK from NO ACTION to SET NULL
-- This allows sales records to be deleted without breaking opportunities
ALTER TABLE public.opportunities
DROP CONSTRAINT opportunities_sales_id_fkey;

ALTER TABLE public.opportunities
ADD CONSTRAINT opportunities_opportunity_owner_id_fkey
FOREIGN KEY (opportunity_owner_id)
REFERENCES public.sales(id)
ON DELETE SET NULL;

-- Note: account_manager_id already has correct FK with SET NULL
-- (opportunities_account_manager_id_fkey)
