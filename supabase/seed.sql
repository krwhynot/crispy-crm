-- Seed data for development
-- Note: Email and phone fields use array format: [{"email/phone": "...", "type": "..."}]

-- Example contact with proper array format
-- INSERT INTO contacts (first_name, last_name, email, phone) VALUES
-- ('Example', 'User',
--   '[{"email": "example@test.com", "type": "primary"}]'::jsonb,
--   '[{"phone": "555-0100", "type": "mobile"}]'::jsonb
-- );