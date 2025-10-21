-- Add missing columns to contact_organizations table
-- These columns are referenced by get_organization_contacts() function
-- and are required by the contact import functionality

-- Add role column using the existing contact_role enum
ALTER TABLE public.contact_organizations
ADD COLUMN role public.contact_role;

-- Add purchase_influence column for tracking contact influence level (0-100)
ALTER TABLE public.contact_organizations
ADD COLUMN purchase_influence SMALLINT;

-- Add check constraint to ensure purchase_influence is within valid range
ALTER TABLE public.contact_organizations
ADD CONSTRAINT valid_purchase_influence
CHECK (purchase_influence IS NULL OR (purchase_influence >= 0 AND purchase_influence <= 100));

-- Add index for queries filtering by role
CREATE INDEX idx_contact_organizations_role
ON public.contact_organizations(role)
WHERE deleted_at IS NULL;

-- Add comment explaining the role column
COMMENT ON COLUMN public.contact_organizations.role IS 'Contact role at organization (decision_maker, influencer, buyer, etc.)';

-- Add comment explaining the purchase_influence column
COMMENT ON COLUMN public.contact_organizations.purchase_influence IS 'Influence level on purchasing decisions (0-100, where 100 is highest influence)';
