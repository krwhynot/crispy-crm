-- Add missing role column to contact_organizations table
-- This column is required by the contact import functionality
-- UI is the single source of truth - only adding what the UI actually uses

-- Add role column using the existing contact_role enum
ALTER TABLE public.contact_organizations
ADD COLUMN role public.contact_role;

-- Add index for queries filtering by role
CREATE INDEX idx_contact_organizations_role
ON public.contact_organizations(role)
WHERE deleted_at IS NULL;

-- Add comment explaining the role column
COMMENT ON COLUMN public.contact_organizations.role IS 'Contact role at organization (decision_maker, influencer, buyer, etc.)';
