-- Add soft-delete columns to tables missing deleted_at support
-- Engineering Constitution: soft-deletes rule - "Use deleted_at timestamp, never hard delete"
-- Audit finding: 8 tables missing deleted_at columns

-- Add deleted_at columns
ALTER TABLE segments ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE "contactNotes" ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE interaction_participants ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE tags ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE opportunity_products ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE notifications ADD COLUMN deleted_at TIMESTAMPTZ;

-- Add partial indexes for performance (only index non-deleted rows)
-- Queries filtering WHERE deleted_at IS NULL will use these indexes
CREATE INDEX idx_segments_deleted_at ON segments(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_contactNotes_deleted_at ON "contactNotes"(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_interaction_participants_deleted_at ON interaction_participants(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_tags_deleted_at ON tags(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_opportunity_products_deleted_at ON opportunity_products(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_notifications_deleted_at ON notifications(deleted_at) WHERE deleted_at IS NULL;

-- Add column comments for documentation
COMMENT ON COLUMN segments.deleted_at IS 'Soft delete timestamp (Constitution: soft-deletes rule)';
COMMENT ON COLUMN "contactNotes".deleted_at IS 'Soft delete timestamp (Constitution: soft-deletes rule)';
COMMENT ON COLUMN interaction_participants.deleted_at IS 'Soft delete timestamp (Constitution: soft-deletes rule)';
COMMENT ON COLUMN tags.deleted_at IS 'Soft delete timestamp (Constitution: soft-deletes rule)';
COMMENT ON COLUMN opportunity_products.deleted_at IS 'Soft delete timestamp (Constitution: soft-deletes rule)';
COMMENT ON COLUMN notifications.deleted_at IS 'Soft delete timestamp (Constitution: soft-deletes rule)';
