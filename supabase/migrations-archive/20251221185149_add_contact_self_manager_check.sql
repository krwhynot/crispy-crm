-- P0-DAT-1: Prevent contact from being their own manager (circular reference)
-- Source: 25-Agent Forensic Audit - Agent 22
-- Engineering Constitution: Principle 6 (soft delete with cascade awareness)

-- Add CHECK constraint to prevent self-referential manager assignment
ALTER TABLE contacts
ADD CONSTRAINT contacts_no_self_manager
CHECK (id IS DISTINCT FROM manager_id);

-- Document the constraint purpose
COMMENT ON CONSTRAINT contacts_no_self_manager ON contacts IS
  'Prevents circular reference where contact manages themselves - P0-DAT-1 fix';
