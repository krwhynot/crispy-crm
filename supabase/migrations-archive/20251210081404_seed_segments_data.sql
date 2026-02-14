-- Migration: Seed segments table with playbook categories
-- Purpose: Fix organizations_segment_id_fkey constraint violation in cloud environments
--
-- This migration ensures the 9 required playbook category segments exist in all environments.
-- The UUIDs are deterministic and match the hardcoded values in src/atomic-crm/validation/segments.ts

INSERT INTO segments (id, name, segment_type, display_order, created_at) VALUES
  ('22222222-2222-4222-8222-000000000001', 'Major Broadline', 'playbook', 1, NOW()),
  ('22222222-2222-4222-8222-000000000002', 'Specialty/Regional', 'playbook', 2, NOW()),
  ('22222222-2222-4222-8222-000000000003', 'Management Company', 'playbook', 3, NOW()),
  ('22222222-2222-4222-8222-000000000004', 'GPO', 'playbook', 4, NOW()),
  ('22222222-2222-4222-8222-000000000005', 'University', 'playbook', 5, NOW()),
  ('22222222-2222-4222-8222-000000000006', 'Restaurant Group', 'playbook', 6, NOW()),
  ('22222222-2222-4222-8222-000000000007', 'Chain Restaurant', 'playbook', 7, NOW()),
  ('22222222-2222-4222-8222-000000000008', 'Hotel & Aviation', 'playbook', 8, NOW()),
  ('22222222-2222-4222-8222-000000000009', 'Unknown', 'playbook', 9, NOW())
ON CONFLICT (id) DO NOTHING;
