-- Organization type classification

ALTER TABLE organizations
  ADD COLUMN org_type TEXT NOT NULL DEFAULT 'distributor'
    CHECK (org_type IN ('distributor', 'principal', 'operator'));

COMMENT ON COLUMN organizations.org_type IS 'Organization classification';
