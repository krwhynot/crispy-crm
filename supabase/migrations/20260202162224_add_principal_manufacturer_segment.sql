-- Add Principal/Manufacturer segment for principal organizations
-- This segment is specifically for manufacturers (principals) in the MFB business model

-- Insert new playbook segment
-- Use the first auth user as created_by since this is a system segment
INSERT INTO segments (id, name, segment_type, display_order, created_at, created_by)
VALUES (
  '22222222-2222-4222-8222-000000000010',
  'Principal/Manufacturer',
  'playbook',
  10,
  NOW(),
  (SELECT id FROM auth.users LIMIT 1)
)
ON CONFLICT (id) DO NOTHING;

-- Update existing principal organizations to use the new segment
-- Only update those with NULL segment_id or Unknown segment
UPDATE organizations
SET segment_id = '22222222-2222-4222-8222-000000000010'
WHERE organization_type = 'principal'
  AND (
    segment_id IS NULL
    OR segment_id = '22222222-2222-4222-8222-000000000009' -- Unknown
  );
