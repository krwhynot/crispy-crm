-- Status + status_reason (Microsoft Dynamics pattern)

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive')),
  ADD COLUMN IF NOT EXISTS status_reason TEXT
    CHECK (status_reason IN (
      'active_customer',
      'prospect',
      'authorized_distributor',
      'account_closed',
      'out_of_business',
      'disqualified'
    ));

COMMENT ON COLUMN organizations.status IS 'Active/inactive state';
COMMENT ON COLUMN organizations.status_reason IS 'Why this status';
