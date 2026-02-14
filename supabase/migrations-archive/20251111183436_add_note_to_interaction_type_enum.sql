-- Add 'note' to interaction_type enum
-- This supports general engagement notes, status updates, and follow-up reminders
-- that don't fit into specific interaction categories like call/email/meeting

ALTER TYPE interaction_type ADD VALUE IF NOT EXISTS 'note';
