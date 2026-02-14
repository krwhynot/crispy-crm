/**
 * Phase 1a: Add 'task' to activity_type enum
 *
 * IMPORTANT: This MUST be in a separate migration file because PostgreSQL
 * cannot use newly added enum values in the same transaction where they
 * were added. Supabase runs each migration file in its own transaction.
 */

-- Add 'task' to activity_type enum
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'task';

-- Add task-type mappings to interaction_type enum
ALTER TYPE interaction_type ADD VALUE IF NOT EXISTS 'administrative';
ALTER TYPE interaction_type ADD VALUE IF NOT EXISTS 'other';
