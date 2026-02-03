-- Prevent organization from being its own parent (self-reference CHECK constraint)
-- Mirrors: contacts_no_self_manager in 20251221185149_add_contact_self_manager_check.sql
-- Complements: prevent_organization_cycle() trigger in 20251117105523_add_organization_cycle_protection.sql
-- The trigger handles multi-level cycles; this CHECK is a faster guard for the trivial self-parent case.

-- Verify no existing violations before adding constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM organizations WHERE id = parent_organization_id
  ) THEN
    RAISE EXCEPTION 'Cannot add self-parent CHECK constraint: existing rows violate id = parent_organization_id';
  END IF;
END $$;

-- Add CHECK constraint using IS DISTINCT FROM to handle NULLs correctly
ALTER TABLE organizations
ADD CONSTRAINT organizations_no_self_parent
CHECK (id IS DISTINCT FROM parent_organization_id);

-- Verification: constraint is active and enforced
COMMENT ON CONSTRAINT organizations_no_self_parent ON organizations IS
  'Prevents circular reference where organization is its own parent - mirrors contacts_no_self_manager pattern';
