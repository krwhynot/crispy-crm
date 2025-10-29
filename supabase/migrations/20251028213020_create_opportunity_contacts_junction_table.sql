-- Create opportunity_contacts junction table
-- This implements the industry-standard pattern for many-to-many relationships
-- between opportunities and contacts (used by Salesforce, HubSpot, Pipedrive, etc.)
-- See: https://wiki.example.com/database-patterns/junction-tables

CREATE TABLE IF NOT EXISTS opportunity_contacts (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  opportunity_id BIGINT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  contact_id BIGINT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  role VARCHAR(50),
  is_primary BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_opportunity_contact UNIQUE (opportunity_id, contact_id)
);

-- Enable Row Level Security
ALTER TABLE opportunity_contacts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies matching the opportunities table pattern
-- Policy 1: Users can view opportunity_contacts through their organization's opportunities
CREATE POLICY "Users can view opportunity_contacts through opportunities"
  ON opportunity_contacts FOR SELECT
  USING (
    -- Check if user's organization has access to the opportunity
    EXISTS (
      SELECT 1 FROM opportunities o
      WHERE o.id = opportunity_contacts.opportunity_id
      AND (
        -- User's organization is a participant in this opportunity
        EXISTS (
          SELECT 1 FROM opportunity_participants op
          INNER JOIN sales s ON s.id = get_current_sales_id()
          WHERE op.opportunity_id = o.id
        )
        -- OR user created/owns the opportunity
        OR o.created_by = get_current_sales_id()
        OR o.opportunity_owner_id = get_current_sales_id()
        OR o.account_manager_id = get_current_sales_id()
      )
    )
  );

-- Policy 2: Users can insert opportunity_contacts
CREATE POLICY "Users can insert opportunity_contacts"
  ON opportunity_contacts FOR INSERT
  WITH CHECK (
    -- Check if user has access to modify the opportunity
    EXISTS (
      SELECT 1 FROM opportunities o
      WHERE o.id = opportunity_contacts.opportunity_id
      AND (
        o.created_by = get_current_sales_id()
        OR o.opportunity_owner_id = get_current_sales_id()
        OR o.account_manager_id = get_current_sales_id()
      )
    )
  );

-- Policy 3: Users can update opportunity_contacts
CREATE POLICY "Users can update opportunity_contacts"
  ON opportunity_contacts FOR UPDATE
  USING (
    -- Check if user has access to modify the opportunity
    EXISTS (
      SELECT 1 FROM opportunities o
      WHERE o.id = opportunity_contacts.opportunity_id
      AND (
        o.created_by = get_current_sales_id()
        OR o.opportunity_owner_id = get_current_sales_id()
        OR o.account_manager_id = get_current_sales_id()
      )
    )
  );

-- Policy 4: Users can delete opportunity_contacts
CREATE POLICY "Users can delete opportunity_contacts"
  ON opportunity_contacts FOR DELETE
  USING (
    -- Check if user has access to modify the opportunity
    EXISTS (
      SELECT 1 FROM opportunities o
      WHERE o.id = opportunity_contacts.opportunity_id
      AND (
        o.created_by = get_current_sales_id()
        OR o.opportunity_owner_id = get_current_sales_id()
        OR o.account_manager_id = get_current_sales_id()
      )
    )
  );

-- Create indexes for common queries
CREATE INDEX idx_opportunity_contacts_opportunity_id
  ON opportunity_contacts(opportunity_id);

CREATE INDEX idx_opportunity_contacts_contact_id
  ON opportunity_contacts(contact_id);

CREATE INDEX idx_opportunity_contacts_is_primary
  ON opportunity_contacts(opportunity_id, is_primary)
  WHERE is_primary = true;

-- Migrate existing data from opportunities.contact_ids array to junction table
-- This preserves all existing contact relationships with is_primary defaulting to false
INSERT INTO opportunity_contacts (opportunity_id, contact_id)
SELECT o.id, unnest(o.contact_ids)
FROM opportunities o
WHERE o.contact_ids IS NOT NULL AND array_length(o.contact_ids, 1) > 0
ON CONFLICT (opportunity_id, contact_id) DO NOTHING;

-- Add comment for documentation
COMMENT ON TABLE opportunity_contacts IS 'Junction table for opportunity-contact relationships. This is the canonical source for opportunity-contact associations. The contact_ids array field on opportunities table is maintained for backward compatibility during frontend migration.';
COMMENT ON COLUMN opportunity_contacts.id IS 'Primary key, auto-generated';
COMMENT ON COLUMN opportunity_contacts.opportunity_id IS 'Foreign key to opportunities table';
COMMENT ON COLUMN opportunity_contacts.contact_id IS 'Foreign key to contacts table';
COMMENT ON COLUMN opportunity_contacts.role IS 'Role of the contact in the opportunity (e.g., decision maker, influencer, end-user)';
COMMENT ON COLUMN opportunity_contacts.is_primary IS 'Whether this is the primary contact for the opportunity';
COMMENT ON COLUMN opportunity_contacts.notes IS 'Additional notes about this contact relationship in the context of the opportunity';
