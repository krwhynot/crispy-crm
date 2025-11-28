-- ============================================================================
-- PART 10: TAGS (10 tags) + CONTACT-TAG LINKS
-- ============================================================================
-- Contact classification tags
-- Plus links to assign tags to various contacts
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
-- CONTACT-TAG LINKS
-- ============================================================================
-- Assign tags to contacts based on their roles

INSERT INTO "public"."contact_tags" (id, contact_id, tag_id, created_at)
VALUES
  -- Decision Makers (executives and VPs)
  (1, 3, 1, NOW()),   -- Michael Chen (CEO)
  (2, 5, 1, NOW()),   -- Raj Patel (Owner)
  (3, 7, 1, NOW()),   -- Tom Harrison (President)
  (4, 13, 1, NOW()),  -- Sam Galletti (Founder)
  (5, 17, 1, NOW()),  -- Robert James (President)
  (6, 27, 1, NOW()),  -- Dan Shamrock (President)
  (7, 37, 1, NOW()),  -- Christopher Pappas (CEO)
  (8, 78, 1, NOW()),  -- Larry Levy (Chairman)

  -- Champions (our advocates inside accounts)
  (9, 1, 2, NOW()),   -- John McCrum
  (10, 11, 2, NOW()), -- David Thompson
  (11, 19, 2, NOW()), -- Mike Reynolds
  (12, 39, 2, NOW()), -- Andrew Sterling

  -- Gatekeepers (control access)
  (13, 20, 3, NOW()), -- Susan Clark
  (14, 46, 3, NOW()), -- Nancy Wright
  (15, 54, 3, NOW()), -- Rebecca Stone

  -- Influencers
  (16, 45, 4, NOW()), -- Kevin Brinker
  (17, 55, 4, NOW()), -- Chef Nate Appleman
  (18, 72, 4, NOW()), -- Chef Philippe

  -- Technical contacts
  (19, 41, 5, NOW()), -- Chef William Hayes
  (20, 43, 5, NOW()), -- Chef Antonio Russo
  (21, 57, 5, NOW()), -- Chef Mark Rosati

  -- Budget Holders
  (22, 21, 6, NOW()), -- James Patterson (VP)
  (23, 42, 6, NOW()), -- Sharon Wood (VP Supply Chain)
  (24, 59, 6, NOW()), -- Chef Antoine (VP Global)

  -- New Contacts (recently added)
  (25, 10, 7, NOW()), -- Anna Bianchi
  (26, 14, 7, NOW()), -- Nicole Green
  (27, 32, 7, NOW()), -- Diane Foster

  -- VIP (high-value relationships)
  (28, 25, 8, NOW()), -- Paul Gordon (GFS VP)
  (29, 33, 8, NOW()), -- Tracy Dot (Dot Foods VP)
  (30, 62, 8, NOW()), -- Chef Thomas Keller

  -- Needs Follow-up
  (31, 48, 9, NOW()), -- Christine Hall
  (32, 52, 9, NOW()), -- Kimberly Scott
  (33, 67, 9, NOW()), -- Betty Cook

  -- Cold Leads
  (34, 24, 10, NOW()), -- Mary Davis
  (35, 30, 10, NOW()), -- Amanda Torres
  (36, 44, 10, NOW()); -- Barbara Chen

-- Reset sequence
SELECT setval(pg_get_serial_sequence('contact_tags', 'id'), 36, true);
