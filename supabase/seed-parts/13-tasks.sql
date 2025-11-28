-- ============================================================================
-- PART 13: TASKS (40 tasks)
-- ============================================================================
-- Assigned to sales reps, linked to opportunities/contacts
-- Mix of: overdue, due today, due tomorrow, upcoming
-- Schema: id, title, description, due_date, reminder_date, completed,
--         completed_at, priority, contact_id, opportunity_id, sales_id
-- ============================================================================

INSERT INTO "public"."tasks" (
  id, title, due_date, contact_id, opportunity_id, sales_id, completed,
  created_at, updated_at
)
VALUES
  -- ========================================
  -- OVERDUE TASKS (10)
  -- ========================================
  (1, 'Follow up on sample delivery confirmation', CURRENT_DATE - INTERVAL '5 days', 39, 1, 2, false, NOW() - INTERVAL '10 days', NOW()),
  (2, 'Send revised pricing proposal', CURRENT_DATE - INTERVAL '3 days', 53, 2, 3, false, NOW() - INTERVAL '8 days', NOW()),
  (3, 'Schedule chef demo at kitchen', CURRENT_DATE - INTERVAL '7 days', 59, 3, 3, false, NOW() - INTERVAL '14 days', NOW()),
  (4, 'Review contract redlines from legal', CURRENT_DATE - INTERVAL '2 days', 76, 4, 4, false, NOW() - INTERVAL '5 days', NOW()),
  (5, 'Call back about volume commitments', CURRENT_DATE - INTERVAL '4 days', 43, 5, 4, false, NOW() - INTERVAL '9 days', NOW()),
  (6, 'Submit sample request form', CURRENT_DATE - INTERVAL '6 days', 41, 6, 5, false, NOW() - INTERVAL '12 days', NOW()),
  (7, 'Prepare presentation for committee', CURRENT_DATE - INTERVAL '1 day', 66, 7, 6, false, NOW() - INTERVAL '7 days', NOW()),
  (8, 'Send product spec sheets', CURRENT_DATE - INTERVAL '8 days', 62, 8, 2, false, NOW() - INTERVAL '15 days', NOW()),
  (9, 'Coordinate shipping logistics', CURRENT_DATE - INTERVAL '3 days', 57, 9, 3, false, NOW() - INTERVAL '6 days', NOW()),
  (10, 'Follow up on budget approval', CURRENT_DATE - INTERVAL '5 days', 49, 10, 3, false, NOW() - INTERVAL '10 days', NOW()),

  -- ========================================
  -- DUE TODAY (8)
  -- ========================================
  (11, 'Call to confirm demo attendance', CURRENT_DATE, 72, 11, 4, false, NOW() - INTERVAL '3 days', NOW()),
  (12, 'Email meeting recap', CURRENT_DATE, 78, 12, 4, false, NOW() - INTERVAL '1 day', NOW()),
  (13, 'Submit distributor application', CURRENT_DATE, 55, 13, 5, false, NOW() - INTERVAL '5 days', NOW()),
  (14, 'Review feedback survey results', CURRENT_DATE, 51, 14, 5, false, NOW() - INTERVAL '2 days', NOW()),
  (15, 'Prepare QBR presentation', CURRENT_DATE, 47, 15, 2, false, NOW() - INTERVAL '7 days', NOW()),
  (16, 'Send contract for signature', CURRENT_DATE, 70, 16, 3, false, NOW() - INTERVAL '4 days', NOW()),
  (17, 'Confirm sample arrival', CURRENT_DATE, 64, 17, 3, false, NOW() - INTERVAL '2 days', NOW()),
  (18, 'Update CRM with call notes', CURRENT_DATE, 74, 18, 4, false, NOW() - INTERVAL '1 day', NOW()),

  -- ========================================
  -- DUE TOMORROW (7)
  -- ========================================
  (19, 'Schedule site visit', CURRENT_DATE + INTERVAL '1 day', 68, 19, 5, false, NOW() - INTERVAL '3 days', NOW()),
  (20, 'Send case study materials', CURRENT_DATE + INTERVAL '1 day', 54, 20, 5, false, NOW() - INTERVAL '2 days', NOW()),
  (21, 'Prepare pricing comparison', CURRENT_DATE + INTERVAL '1 day', 60, 21, 6, false, NOW() - INTERVAL '4 days', NOW()),
  (22, 'Call about menu launch date', CURRENT_DATE + INTERVAL '1 day', 45, 22, 2, false, NOW() - INTERVAL '2 days', NOW()),
  (23, 'Email reference contacts', CURRENT_DATE + INTERVAL '1 day', 58, 23, 3, false, NOW() - INTERVAL '1 day', NOW()),
  (24, 'Review pilot results data', CURRENT_DATE + INTERVAL '1 day', 79, 24, 3, false, NOW() - INTERVAL '3 days', NOW()),
  (25, 'Finalize demo logistics', CURRENT_DATE + INTERVAL '1 day', 40, 25, 4, false, NOW() - INTERVAL '2 days', NOW()),

  -- ========================================
  -- UPCOMING THIS WEEK (8)
  -- ========================================
  (26, 'Prepare for trade show', CURRENT_DATE + INTERVAL '3 days', 44, 26, 4, false, NOW() - INTERVAL '5 days', NOW()),
  (27, 'Send thank you notes', CURRENT_DATE + INTERVAL '2 days', 50, 27, 5, false, NOW() - INTERVAL '1 day', NOW()),
  (28, 'Update opportunity stage', CURRENT_DATE + INTERVAL '4 days', 42, 28, 6, false, NOW() - INTERVAL '2 days', NOW()),
  (29, 'Schedule follow-up meeting', CURRENT_DATE + INTERVAL '3 days', 19, 29, 2, false, NOW() - INTERVAL '1 day', NOW()),
  (30, 'Prepare product samples', CURRENT_DATE + INTERVAL '5 days', 21, 30, 2, false, NOW() - INTERVAL '3 days', NOW()),
  (31, 'Review distributor agreement', CURRENT_DATE + INTERVAL '2 days', 25, 31, 3, false, NOW() - INTERVAL '1 day', NOW()),
  (32, 'Call about seasonal needs', CURRENT_DATE + INTERVAL '4 days', 63, 32, 3, false, NOW() - INTERVAL '2 days', NOW()),
  (33, 'Email introduction to new buyer', CURRENT_DATE + INTERVAL '3 days', 35, 33, 4, false, NOW() - INTERVAL '1 day', NOW()),

  -- ========================================
  -- UPCOMING NEXT WEEK (7)
  -- ========================================
  (34, 'Quarterly business review', CURRENT_DATE + INTERVAL '8 days', 38, 34, 5, false, NOW() - INTERVAL '5 days', NOW()),
  (35, 'Product training session', CURRENT_DATE + INTERVAL '10 days', 23, 35, 5, false, NOW() - INTERVAL '7 days', NOW()),
  (36, 'Contract renewal discussion', CURRENT_DATE + INTERVAL '7 days', 29, 36, 6, false, NOW() - INTERVAL '3 days', NOW()),
  (37, 'Menu planning meeting', CURRENT_DATE + INTERVAL '9 days', 48, 37, 2, false, NOW() - INTERVAL '4 days', NOW()),
  (38, 'Site visit preparation', CURRENT_DATE + INTERVAL '12 days', 53, 38, 3, false, NOW() - INTERVAL '6 days', NOW()),
  (39, 'Distributor show prep', CURRENT_DATE + INTERVAL '14 days', 71, 39, 4, false, NOW() - INTERVAL '10 days', NOW()),
  (40, 'Annual review preparation', CURRENT_DATE + INTERVAL '11 days', 73, 40, 4, false, NOW() - INTERVAL '8 days', NOW());

-- Reset sequence
SELECT setval(pg_get_serial_sequence('tasks', 'id'), 40, true);
