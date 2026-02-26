# Enhance E2E Seed Data for Realistic Reports [Confidence: 95%]

## Problem

After `supabase db reset`, the reports show empty data because the base `seed.sql` has no [RPT] campaign/activity data. The E2E seed (`seed-e2e.sql`) must run separately. Additionally, the current E2E seed has these report-visibility gaps:

1. **Only 3 campaigns, 37.5% coverage** — 5 of 8 array slots are NULL
2. **No lead_source on opportunities** — no diversity in opportunity sources
3. **Activity dates spread uniformly across 90 days** — Weekly Activity Summary looks flat
4. **No intentionally stale opportunities** — Stale leads panel always empty (all opps have recent activities from the 4-per-opp loop)
5. **No outcome or follow_up_required** — activity detail data is sparse

## Plan: Modify `supabase/seed-e2e.sql`

**Single file:** `supabase/seed-e2e.sql`

---

### Task 1: Increase campaign count and coverage [Confidence: 98%]

**Line ~247** — Change campaigns array from 3 real + 5 NULL to 6 real + 2 NULL (~75% coverage):

```sql
v_campaigns TEXT[] := ARRAY[
  'Grand Rapids Trade Show', 'Q4 Email Outreach', 'Midwest Distributor Summit',
  'Spring Menu Launch 2026', 'Heartland Chef Series', 'National Foodservice Expo',
  NULL, NULL
];
```

**Basis:** `get_campaign_report_stats` RPC aggregates `SELECT campaign, count(*) FROM opportunities WHERE campaign IS NOT NULL`. 6 campaigns × ~12-18 opps each = rich dropdown data.

---

### Task 2: Add lead_source to opportunities [Confidence: 95%]

**Line ~246** — Add new variable declaration:
```sql
v_lead_sources TEXT[] := ARRAY['referral', 'trade_show', 'website', 'cold_call', 'email_campaign', 'social_media', 'existing_customer', 'partner'];
```

**Line ~536** — Add `lead_source` to opportunity INSERT column list and values:
```sql
lead_source,
-- in VALUES:
v_lead_sources[((v_opp_idx - 1) % 8) + 1],
```

**Basis:** `lead_source` is a CHECK-constrained text column. These 8 values are the exact allowlist from the schema.

---

### Task 3: Add outcome and follow_up to existing activities [Confidence: 95%]

**Line ~616** — Modify the per-opportunity activity INSERT to include `outcome` and `follow_up_required`/`follow_up_date`:

Add outcome array variable (~line 270):
```sql
v_outcomes_call TEXT[] := ARRAY['Connected', 'Left Voicemail', 'No Answer', 'Connected'];
v_outcomes_email TEXT[] := ARRAY['Sent', 'Replied', 'No Reply', 'Sent'];
v_outcomes_meeting TEXT[] := ARRAY['Held', 'Rescheduled', 'Held', 'Held'];
v_outcomes_sample TEXT[] := ARRAY['Sent', 'Received', 'Feedback Pending', 'Feedback Received'];
```

In the activity INSERT (~line 616), add columns:
```sql
outcome,
follow_up_required,
follow_up_date,
```

Values logic:
```sql
-- outcome: pick from type-appropriate array
CASE
  WHEN v_act_type = 'call' THEN v_outcomes_call[((v_opp_idx + v_act_idx) % 4) + 1]
  WHEN v_act_type = 'email' THEN v_outcomes_email[((v_opp_idx + v_act_idx) % 4) + 1]
  WHEN v_act_type IN ('meeting', 'demo') THEN v_outcomes_meeting[((v_opp_idx + v_act_idx) % 4) + 1]
  WHEN v_act_type = 'sample' THEN v_outcomes_sample[((v_opp_idx + v_act_idx) % 4) + 1]
  WHEN v_act_type = 'site_visit' THEN 'Completed'
  WHEN v_act_type = 'proposal' THEN 'Sent'
  WHEN v_act_type = 'follow_up' THEN 'Completed'
  ELSE NULL
END,
-- follow_up_required: ~30% of activities
((v_opp_idx + v_act_idx) % 3 = 0),
-- follow_up_date: only when follow_up_required
CASE WHEN ((v_opp_idx + v_act_idx) % 3 = 0) THEN
  CURRENT_DATE + (((v_act_idx % 5) + 3) || ' days')::INTERVAL
  ELSE NULL
END,
```

**Basis:** `outcome` is free text (no DB constraint). `follow_up_required` is boolean default false. `follow_up_date` is nullable date. All safe to set in SQL.

---

### Task 4: Add recent activity cluster for Weekly Activity Summary [Confidence: 93%]

**After the main activities loop (~line 646)** — Add a new block that creates ~80 activities concentrated in the last 14 days:

```sql
-- RECENT ACTIVITY CLUSTER (last 14 days, for Weekly Activity visibility)
FOR v_idx IN 1..80 LOOP
  v_sales_idx := ((v_idx - 1) % array_length(v_sales_ids, 1)) + 1;
  v_sales_id := v_sales_ids[v_sales_idx];
  v_principal_idx := ((v_idx - 1) % 10) + 1;
  v_customer_idx := ((v_idx - 1) % array_length(v_customer_ids, 1)) + 1;
  v_days_ago := (v_idx - 1) % 14;  -- 0-13 days ago

  -- Weighted types: call(30%), email(25%), meeting(15%), site_visit(10%), sample(10%), follow_up(10%)
  v_act_type := (ARRAY[
    'call','call','call','call','call','call',
    'email','email','email','email','email',
    'meeting','meeting','meeting',
    'site_visit','site_visit',
    'sample','sample',
    'follow_up','follow_up'
  ])[((v_idx - 1) % 20) + 1];

  v_sentiment := (ARRAY[
    'positive','positive','positive','positive','positive','positive','positive',
    'neutral','neutral','neutral',
    'negative','negative'
  ])[((v_idx - 1) % 12) + 1];

  -- Get a recent [RPT] opportunity for this principal
  SELECT id INTO v_opp_id FROM opportunities
  WHERE name LIKE '[RPT]%' AND deleted_at IS NULL
    AND principal_organization_id = v_principal_ids[v_principal_idx]
  ORDER BY id LIMIT 1;

  -- Get a contact ~70% of the time
  v_contact_id := NULL;
  IF v_idx % 10 < 7 THEN
    SELECT c.id INTO v_contact_id FROM contacts c
    WHERE c.deleted_at IS NULL AND c.organization_id = v_customer_ids[v_customer_idx]
    LIMIT 1;
  END IF;

  INSERT INTO activities (
    activity_type, type, subject, description, activity_date, duration_minutes,
    contact_id, organization_id, opportunity_id, sentiment, outcome,
    sample_status, follow_up_required, follow_up_date,
    created_by, created_at, updated_at
  ) VALUES (
    'activity', v_act_type::interaction_type,
    '[RPT] Recent ' || initcap(replace(v_act_type, '_', ' ')) || ' - ' || v_principal_names[v_principal_idx] || ' #R' || v_idx,
    'Recent activity for reporting visibility',
    NOW() - (v_days_ago || ' days')::INTERVAL,
    CASE WHEN v_act_type IN ('call','check_in') THEN 15 + (v_idx % 30)
         WHEN v_act_type IN ('meeting','demo') THEN 30 + (v_idx % 60) ELSE NULL END,
    v_contact_id, v_customer_ids[v_customer_idx], v_opp_id,
    v_sentiment,
    CASE WHEN v_act_type = 'call' THEN 'Connected'
         WHEN v_act_type = 'email' THEN 'Sent'
         WHEN v_act_type = 'meeting' THEN 'Held'
         WHEN v_act_type = 'sample' THEN 'Received'
         WHEN v_act_type = 'site_visit' THEN 'Completed'
         WHEN v_act_type = 'follow_up' THEN 'Completed' ELSE NULL END,
    CASE WHEN v_act_type = 'sample' THEN
      v_sample_statuses[((v_idx - 1) % 4) + 1]::sample_status ELSE NULL END,
    (v_idx % 4 = 0),
    CASE WHEN v_idx % 4 = 0 THEN CURRENT_DATE + INTERVAL '5 days' ELSE NULL END,
    v_sales_id,
    NOW() - (v_days_ago || ' days')::INTERVAL,
    NOW() - (v_days_ago || ' days')::INTERVAL
  );

  v_act_count := v_act_count + 1;
END LOOP;
```

**Basis:** The Weekly Activity Summary groups by `creator → principal → type` for dates in the selected week. 80 activities across 14 days, ~6/day, ensures the matrix has rich data.

---

### Task 5: Create intentionally stale opportunities [Confidence: 95%]

**After the varied statuses block (~line 665)** — Add a block that pushes selected opportunities' activity dates far into the past so they exceed stage thresholds.

**Staleness triggers (from RPC):**
- `new_lead`: stale when `days_inactive > 7` (COALESCE of MAX(activity_date), opportunity.created_at)
- `initial_outreach`: stale when `days_inactive > 14`
- `sample_visit_offered`: stale when `days_inactive > 14`
- `feedback_logged`: stale when `days_inactive > 21`

**Approach:** Update `created_at` on selected [RPT] opportunities to 30+ days ago AND update their linked activities to have old `activity_date` values:

```sql
-- STALE OPPORTUNITIES (push activity dates to trigger staleness)
-- 3 stale new_lead (need days_inactive > 7)
WITH stale_new_leads AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) as rn
  FROM opportunities WHERE name LIKE '[RPT]%' AND deleted_at IS NULL
    AND stage = 'new_lead' LIMIT 3
)
UPDATE opportunities SET created_at = NOW() - INTERVAL '25 days'
FROM stale_new_leads WHERE opportunities.id = stale_new_leads.id;

-- Push their activities to 25 days ago
UPDATE activities SET activity_date = NOW() - INTERVAL '25 days',
  created_at = NOW() - INTERVAL '25 days'
WHERE opportunity_id IN (
  SELECT id FROM opportunities WHERE name LIKE '[RPT]%' AND stage = 'new_lead'
    AND created_at < NOW() - INTERVAL '20 days' AND deleted_at IS NULL
) AND subject LIKE '[RPT]%';

-- 3 stale initial_outreach (need days_inactive > 14)
WITH stale_outreach AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) as rn
  FROM opportunities WHERE name LIKE '[RPT]%' AND deleted_at IS NULL
    AND stage = 'initial_outreach' LIMIT 3
)
UPDATE opportunities SET created_at = NOW() - INTERVAL '30 days'
FROM stale_outreach WHERE opportunities.id = stale_outreach.id;

UPDATE activities SET activity_date = NOW() - INTERVAL '30 days',
  created_at = NOW() - INTERVAL '30 days'
WHERE opportunity_id IN (
  SELECT id FROM opportunities WHERE name LIKE '[RPT]%' AND stage = 'initial_outreach'
    AND created_at < NOW() - INTERVAL '20 days' AND deleted_at IS NULL
) AND subject LIKE '[RPT]%';

-- 2 stale sample_visit_offered (need days_inactive > 14)
WITH stale_samples AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) as rn
  FROM opportunities WHERE name LIKE '[RPT]%' AND deleted_at IS NULL
    AND stage = 'sample_visit_offered' LIMIT 2
)
UPDATE opportunities SET created_at = NOW() - INTERVAL '28 days'
FROM stale_samples WHERE opportunities.id = stale_samples.id;

UPDATE activities SET activity_date = NOW() - INTERVAL '28 days',
  created_at = NOW() - INTERVAL '28 days'
WHERE opportunity_id IN (
  SELECT id FROM opportunities WHERE name LIKE '[RPT]%' AND stage = 'sample_visit_offered'
    AND created_at < NOW() - INTERVAL '20 days' AND deleted_at IS NULL
) AND subject LIKE '[RPT]%';
```

**Basis:** RPC uses `COALESCE(MAX(a.activity_date), o.created_at)`. By pushing both opportunity `created_at` and all linked activity `activity_date` to 25-30 days ago, `days_inactive` exceeds all thresholds (7, 14, 14). Returns 8 stale opportunities.

---

### Task 6: Update summary RAISE NOTICE [Confidence: 98%]

Update the summary block (~line 917) to reflect new counts:
```
- Activities: ~(v_act_count + 80) (including 80 recent cluster)
- Stale: 8 intentionally stale opportunities
- Outcomes: ~70% of activities have outcome values
- Follow-ups: ~30% with follow_up_required + follow_up_date
```

---

### Task 7: Run seed and verify visually [Confidence: 98%]

```bash
npx supabase db reset
# Then run E2E seed (seed.sql runs automatically, E2E runs separately):
docker exec -i supabase_db_crispy-crm psql -U postgres -d postgres < supabase/seed-e2e.sql
```

Then reload the app and check each report tab in the browser.

---

## Verification Checklist

| Tab | Expected Result |
|-----|----------------|
| **Campaign** | Dropdown shows 6 campaigns with counts. Activity Type Breakdown shows varied types (call, email, meeting, etc). Metrics: Total Activities > 50, Coverage Rate > 50%, Avg Per Lead > 2.0 |
| **Overview** | KPI cards: Open Opportunities > 50, Team Activities > 20, Stale Leads > 3, Stale Deals > 3. Pipeline chart has bars across all 5 active stages. Activity trend chart shows recent 14-day spike |
| **Weekly Activity** | Matrix shows 5+ reps × 5+ principals. Cell counts > 0 for common types (call, email, meeting). Low-activity cells flagged |
| **Opportunities by Principal** | 10 principal rows with stage breakdown bars. Multiple stages per principal |
| **Stale Leads (toggle)** | 8 stale opportunities listed with red/amber urgency coloring. Days over threshold > 0 |

## Confidence Summary
- **Overall:** 95%
- **Highest risk:** Task 5 (stale opps) — UPDATE ordering matters to avoid touching recent-cluster activities
- **Mitigation:** The UPDATE WHERE clause filters by `created_at < NOW() - 20 days` AND `subject LIKE '[RPT]%'`, so recent-cluster activities (created at NOW()) won't be affected
- **Verification:** Visual check via browser + `get_stale_opportunities` RPC call
