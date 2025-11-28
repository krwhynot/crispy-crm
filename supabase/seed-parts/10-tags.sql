-- ============================================================================
-- PART 10: TAGS (10 tags)
-- ============================================================================
-- Contact classification tags
-- Tags are assigned to contacts via contacts.tags bigint[] array
-- ============================================================================

INSERT INTO "public"."tags" (id, name, color, created_at, updated_at)
VALUES
  (1, 'Decision Maker', '#10B981', NOW(), NOW()),      -- Green
  (2, 'Champion', '#3B82F6', NOW(), NOW()),            -- Blue
  (3, 'Gatekeeper', '#F59E0B', NOW(), NOW()),          -- Amber
  (4, 'Influencer', '#8B5CF6', NOW(), NOW()),          -- Purple
  (5, 'Technical', '#EC4899', NOW(), NOW()),           -- Pink
  (6, 'Budget Holder', '#EF4444', NOW(), NOW()),       -- Red
  (7, 'New Contact', '#06B6D4', NOW(), NOW()),         -- Cyan
  (8, 'VIP', '#F97316', NOW(), NOW()),                 -- Orange
  (9, 'Needs Follow-up', '#84CC16', NOW(), NOW()),     -- Lime
  (10, 'Cold Lead', '#6B7280', NOW(), NOW());          -- Gray

-- Reset sequence
SELECT setval(pg_get_serial_sequence('tags', 'id'), 10, true);

-- ============================================================================
-- ASSIGN TAGS TO CONTACTS VIA UPDATE
-- ============================================================================
-- Tags are stored as bigint[] arrays in contacts.tags

-- Decision Makers (executives and VPs) - tag_id = 1
UPDATE "public"."contacts" SET tags = ARRAY[1]::bigint[] WHERE id IN (3, 5, 7, 13, 17, 27, 37, 78);

-- Champions (our advocates inside accounts) - tag_id = 2
UPDATE "public"."contacts" SET tags = ARRAY[2]::bigint[] WHERE id IN (1, 11, 19, 39);

-- Gatekeepers (control access) - tag_id = 3
UPDATE "public"."contacts" SET tags = ARRAY[3]::bigint[] WHERE id IN (20, 46, 54);

-- Influencers - tag_id = 4
UPDATE "public"."contacts" SET tags = ARRAY[4]::bigint[] WHERE id IN (45, 55, 72);

-- Technical contacts - tag_id = 5
UPDATE "public"."contacts" SET tags = ARRAY[5]::bigint[] WHERE id IN (41, 43, 57);

-- Budget Holders - tag_id = 6
UPDATE "public"."contacts" SET tags = ARRAY[6]::bigint[] WHERE id IN (21, 42, 59);

-- New Contacts (recently added) - tag_id = 7
UPDATE "public"."contacts" SET tags = ARRAY[7]::bigint[] WHERE id IN (10, 14, 32);

-- VIP (high-value relationships) - tag_id = 8
UPDATE "public"."contacts" SET tags = ARRAY[8]::bigint[] WHERE id IN (25, 33, 62);

-- Needs Follow-up - tag_id = 9
UPDATE "public"."contacts" SET tags = ARRAY[9]::bigint[] WHERE id IN (48, 52, 67);

-- Cold Leads - tag_id = 10
UPDATE "public"."contacts" SET tags = ARRAY[10]::bigint[] WHERE id IN (24, 30, 44);
