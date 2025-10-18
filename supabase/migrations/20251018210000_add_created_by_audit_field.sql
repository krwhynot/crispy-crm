-- Add created_by audit field
-- Following Engineering Constitution: NO OVER-ENGINEERING
-- This is a basic audit field, not over-engineering

-- Add created_by column with DEFAULT for automatic population
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS created_by bigint DEFAULT public.get_current_sales_id() REFERENCES sales(id) ON DELETE SET NULL;

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS created_by bigint DEFAULT public.get_current_sales_id() REFERENCES sales(id) ON DELETE SET NULL;

ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS created_by bigint DEFAULT public.get_current_sales_id() REFERENCES sales(id) ON DELETE SET NULL;

ALTER TABLE "contactNotes"
  ADD COLUMN IF NOT EXISTS created_by bigint DEFAULT public.get_current_sales_id() REFERENCES sales(id) ON DELETE SET NULL;

ALTER TABLE "opportunityNotes"
  ADD COLUMN IF NOT EXISTS created_by bigint DEFAULT public.get_current_sales_id() REFERENCES sales(id) ON DELETE SET NULL;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS created_by bigint DEFAULT public.get_current_sales_id() REFERENCES sales(id) ON DELETE SET NULL;

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS created_by bigint DEFAULT public.get_current_sales_id() REFERENCES sales(id) ON DELETE SET NULL;

-- Add comments
COMMENT ON COLUMN contacts.created_by IS 'Sales rep who created this contact. Auto-populated on INSERT.';
COMMENT ON COLUMN organizations.created_by IS 'Sales rep who created this organization. Auto-populated on INSERT.';
COMMENT ON COLUMN opportunities.created_by IS 'Sales rep who created this opportunity. Auto-populated on INSERT.';
COMMENT ON COLUMN "contactNotes".created_by IS 'Sales rep who created this note. Auto-populated on INSERT.';
COMMENT ON COLUMN "opportunityNotes".created_by IS 'Sales rep who created this note. Auto-populated on INSERT.';
COMMENT ON COLUMN products.created_by IS 'Sales rep who created this product. Auto-populated on INSERT.';
COMMENT ON COLUMN tasks.created_by IS 'Sales rep who created this task. Auto-populated on INSERT.';
