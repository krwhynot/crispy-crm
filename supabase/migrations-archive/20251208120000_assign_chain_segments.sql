-- Migration: assign_chain_segments
-- Purpose: Assign segments to 130 "Chain/Group Member" organizations
-- Source: Pattern matching on known chain names
-- Date: 2025-12-08

BEGIN;

-- ============================================================================
-- Segment ID Reference (from segments table)
-- ============================================================================
-- Operator Segments:
--   Fast Food/QSR:    33333333-3333-4333-8333-000000000201
--   Fast Casual:      33333333-3333-4333-8333-000000000202
--   Pizza:            33333333-3333-4333-8333-000000000203
--   Casual Dining:    33333333-3333-4333-8333-000000000102
--   Fine Dining:      33333333-3333-4333-8333-000000000101
--   Family Dining:    33333333-3333-4333-8333-000000000103
--   Gastropub:        33333333-3333-4333-8333-000000000104
--   Restaurant Group: 33333333-3333-4333-8333-000000000008
--   Bars & Lounges:   33333333-3333-4333-8333-000000000003
--   Entertainment:    33333333-3333-4333-8333-000000000004
--   Country Clubs:    33333333-3333-4333-8333-000000001501
--   Casinos:          33333333-3333-4333-8333-000000000401

-- ============================================================================
-- STEP 1: QSR / Quick Service chains
-- ============================================================================
UPDATE organizations SET 
    segment_id = '33333333-3333-4333-8333-000000000201'::uuid,
    needs_review = NULL,
    updated_at = NOW()
WHERE needs_review LIKE '%Chain/Group%'
AND deleted_at IS NULL
AND LOWER(name) ~* '(portillo|culver|wendy|mcdonald|burger king|taco bell|kfc|popeye|chick-fil-a|sonic|arby|hardee|carl''s jr|jack in the box|white castle|checkers|rally|del taco|wienerschnitzel|whataburger|in-n-out|five guys|shake shack|smashburger|steak.?n.?shake|cook out|a&w|dog n suds|superdawg)';

-- ============================================================================
-- STEP 2: Fast Casual chains
-- ============================================================================
UPDATE organizations SET 
    segment_id = '33333333-3333-4333-8333-000000000202'::uuid,
    needs_review = NULL,
    updated_at = NOW()
WHERE needs_review LIKE '%Chain/Group%'
AND deleted_at IS NULL
AND LOWER(name) ~* '(chipotle|panera|qdoba|moe''s|panda express|wingstop|zaxby|raising cane|jersey mike|jimmy john|firehouse sub|potbelly|noodles|blaze pizza|mod pizza|sweetgreen|cava|tropical smoothie|jamba|smoothie king|jason''s deli|mcalister|newk|which wich|penn station|fazoli|bibibop|charleys|chicken salad chick|honey berry|wing snob|wings etc)';

-- ============================================================================
-- STEP 3: Pizza chains
-- ============================================================================
UPDATE organizations SET 
    segment_id = '33333333-3333-4333-8333-000000000203'::uuid,
    needs_review = NULL,
    updated_at = NOW()
WHERE needs_review LIKE '%Chain/Group%'
AND deleted_at IS NULL
AND LOWER(name) ~* '(pizza hut|domino|papa john|little caesar|marco''s|jet''s|hungry howie|casey''s|godfather|cici''s|round table|mountain mike|giordano|lou malnati|gino''s east|rosati|aurelio|home run inn|nancy''s|beggar|pizano|connie''s|pequod|donato''s|naty''s pizza|romeo pizza)';

-- ============================================================================
-- STEP 4: Casual Dining chains
-- ============================================================================
UPDATE organizations SET 
    segment_id = '33333333-3333-4333-8333-000000000102'::uuid,
    needs_review = NULL,
    updated_at = NOW()
WHERE needs_review LIKE '%Chain/Group%'
AND deleted_at IS NULL
AND LOWER(name) ~* '(applebee|chili''s|olive garden|red lobster|outback|longhorn|texas roadhouse|cracker barrel|ruby tuesday|tgi friday|buffalo wild|hooters|twin peaks|tilted kilt|golden corral|hometown buffet|old country buffet|sizzler|ponderosa|bonanza|denny''s|ihop|waffle house|perkins|bob evans|village inn|friendly''s|o''charley|cheddar|yard house|bj''s|cheesecake factory|big boy|max and erma|italia gardens|baker street|slymans|stables steakhouse|stacked pancake|wild egg)';

-- ============================================================================
-- STEP 5: Fine Dining chains
-- ============================================================================
UPDATE organizations SET 
    segment_id = '33333333-3333-4333-8333-000000000101'::uuid,
    needs_review = NULL,
    updated_at = NOW()
WHERE needs_review LIKE '%Chain/Group%'
AND deleted_at IS NULL
AND LOWER(name) ~* '(morton''s|ruth''s chris|capital grille|del frisco|eddie v|flemings|mastro|boa steakhouse|stk|catch|nobu|tao|gibson|rpm steak|au cheval|bavette|boka|north pond|virtue|rose mary|j\. alexander)';

-- ============================================================================
-- STEP 6: Restaurant Groups / Management Companies
-- ============================================================================
UPDATE organizations SET 
    segment_id = '33333333-3333-4333-8333-000000000008'::uuid,
    needs_review = NULL,
    updated_at = NOW()
WHERE needs_review LIKE '%Chain/Group%'
AND deleted_at IS NULL
AND LOWER(name) ~* '(cameron mitchell|lettuce entertain|boka restaurant group|hogsalt|one off hospitality|4 star restaurant|four star restaurant|crg dining|derosa|bluegrass hospitality|community hospitality|market fresh restaurant|millenium restaurant|hiraya hospitality|paramount group|royal group|vaughan hospitality|castle hospitality|obi cai|crown restaurant|open kitchens|one hope united|coopershawk)';

-- ============================================================================
-- STEP 7: Gastropub / Sports Bar
-- ============================================================================
UPDATE organizations SET 
    segment_id = '33333333-3333-4333-8333-000000000104'::uuid,
    needs_review = NULL,
    updated_at = NOW()
WHERE needs_review LIKE '%Chain/Group%'
AND deleted_at IS NULL
AND LOWER(name) ~* '(haymarket brewery|bangers and lace|green street smoked|smoke daddy|smoque|dirty franks|hot chicken takeover|local west|hugo fog|postboy|provecho|rootstock|small cheval|smack dab|redwater|gnome town|hoppy gnome|leeds public|evil czech|corndance|bourbon and butcher|carnegie|jesus latin|proximo|caplingers|coppolillo|tomato bar|windy cuty|big woods|third coasting|upstairs pub|station 21|peach cobbler|tony''s tacos|barge|butler|salt\.)';

-- ============================================================================
-- STEP 8: Entertainment / Casinos
-- ============================================================================
UPDATE organizations SET 
    segment_id = '33333333-3333-4333-8333-000000000004'::uuid,
    needs_review = NULL,
    updated_at = NOW()
WHERE needs_review LIKE '%Chain/Group%'
AND deleted_at IS NULL
AND LOWER(name) ~* '(dave.?&.?buster|horseshoe casino|port drive in|redamak|family express|kwiktrip|bagger dave|arthur treachers)';

-- ============================================================================
-- STEP 9: Country Clubs
-- ============================================================================
UPDATE organizations SET 
    segment_id = '33333333-3333-4333-8333-000000001501'::uuid,
    needs_review = NULL,
    updated_at = NOW()
WHERE needs_review LIKE '%Chain/Group%'
AND deleted_at IS NULL
AND LOWER(name) ~* '(country club|harrison lake country club|beverly cc)';

-- ============================================================================
-- STEP 10: Bars & Lounges
-- ============================================================================
UPDATE organizations SET 
    segment_id = '33333333-3333-4333-8333-000000000003'::uuid,
    needs_review = NULL,
    updated_at = NOW()
WHERE needs_review LIKE '%Chain/Group%'
AND deleted_at IS NULL
AND LOWER(name) ~* '(pinewood social|obc kitchens|drake|larosa|joyworldmburger|el salto|hk banjum|gfs saginaw|pavlou|kraft heinz|noble dq|russ|one north|millenium$)';

-- ============================================================================
-- STEP 11: Assign remaining to Restaurant Group with manual review flag
-- ============================================================================
UPDATE organizations SET 
    segment_id = '33333333-3333-4333-8333-000000000008'::uuid,
    needs_review = '[MANUAL-REVIEW] Auto-assigned to Restaurant Group - verify segment',
    updated_at = NOW()
WHERE needs_review LIKE '%Chain/Group%'
AND segment_id IS NULL
AND deleted_at IS NULL;

-- ============================================================================
-- Report results
-- ============================================================================
DO $$
DECLARE
    v_total INT;
    v_assigned INT;
    v_manual_review INT;
BEGIN
    SELECT COUNT(*) INTO v_total FROM organizations WHERE deleted_at IS NULL;
    SELECT COUNT(*) INTO v_assigned FROM organizations WHERE segment_id IS NOT NULL AND needs_review IS NULL AND deleted_at IS NULL;
    SELECT COUNT(*) INTO v_manual_review FROM organizations WHERE needs_review LIKE '%MANUAL-REVIEW%' AND deleted_at IS NULL;
    
    RAISE NOTICE '=== CHAIN SEGMENT ASSIGNMENT RESULTS ===';
    RAISE NOTICE 'Total organizations: %', v_total;
    RAISE NOTICE 'Assigned with segment (no review needed): %', v_assigned;
    RAISE NOTICE 'Auto-assigned but needs manual review: %', v_manual_review;
END $$;

COMMIT;
