-- Add date column to contactNotes and opportunityNotes tables
-- This allows users to specify a custom date/time for notes separate from created_at

-- Add date column to contactNotes (defaults to created_at for existing records)
ALTER TABLE "contactNotes"
ADD COLUMN "date" TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add date column to opportunityNotes (defaults to created_at for existing records)
ALTER TABLE "opportunityNotes"
ADD COLUMN "date" TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing records to use created_at as the date
UPDATE "contactNotes" SET "date" = "created_at" WHERE "date" IS NULL;
UPDATE "opportunityNotes" SET "date" = "created_at" WHERE "date" IS NULL;

-- Make date NOT NULL after setting defaults
ALTER TABLE "contactNotes" ALTER COLUMN "date" SET NOT NULL;
ALTER TABLE "opportunityNotes" ALTER COLUMN "date" SET NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN "contactNotes"."date" IS 'User-specified date/time for the note, separate from system-managed created_at';
COMMENT ON COLUMN "opportunityNotes"."date" IS 'User-specified date/time for the note, separate from system-managed created_at';
