-- =====================================================
-- Stage 1, Phase 1.4: Activities System
-- Migration: Engagements vs Interactions Framework
-- Date: 2025-01-22
-- Description: Implement activities system with clear distinction between
--              Engagements (no opportunity) and Interactions (with opportunity)
-- =====================================================

-- Record migration start
INSERT INTO migration_history (phase_number, phase_name, status, started_at)
VALUES ('1.4', 'Activities System', 'in_progress', NOW());

-- =====================================================
-- CREATE ACTIVITIES TABLE (Base for all touchpoints)
-- =====================================================

CREATE TABLE IF NOT EXISTS activities (
    id BIGSERIAL PRIMARY KEY,
    activity_type activity_type NOT NULL,  -- 'engagement' or 'interaction'
    type interaction_type NOT NULL,        -- call, email, meeting, etc.
    subject TEXT NOT NULL,
    description TEXT,
    activity_date TIMESTAMPTZ DEFAULT NOW(),
    duration_minutes INTEGER,

    -- Contact and Organization (always present)
    contact_id BIGINT REFERENCES contacts(id),
    organization_id BIGINT REFERENCES companies(id),

    -- Opportunity (NULL for engagements, required for interactions)
    opportunity_id BIGINT REFERENCES opportunities(id),

    -- Follow-up tracking
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    follow_up_notes TEXT,

    -- Outcome and attachments
    outcome TEXT,
    sentiment VARCHAR(10) CHECK (sentiment IN ('positive', 'neutral', 'negative')),
    attachments TEXT[],

    -- Metadata
    location TEXT,
    attendees TEXT[],  -- Additional attendee names
    tags TEXT[],

    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by BIGINT REFERENCES sales(id),
    deleted_at TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT check_interaction_has_opportunity
        CHECK (
            (activity_type = 'interaction' AND opportunity_id IS NOT NULL) OR
            (activity_type = 'engagement')
        ),
    CONSTRAINT check_has_contact_or_org
        CHECK (contact_id IS NOT NULL OR organization_id IS NOT NULL)
);

-- Create indexes for performance
CREATE INDEX idx_activities_type ON activities(activity_type, type) WHERE deleted_at IS NULL;
CREATE INDEX idx_activities_date ON activities(activity_date DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_activities_contact ON activities(contact_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_activities_organization ON activities(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_activities_opportunity ON activities(opportunity_id) WHERE deleted_at IS NULL AND opportunity_id IS NOT NULL;
CREATE INDEX idx_activities_follow_up ON activities(follow_up_date) WHERE follow_up_required = true AND deleted_at IS NULL;

-- =====================================================
-- CREATE INTERACTION_PARTICIPANTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS interaction_participants (
    id BIGSERIAL PRIMARY KEY,
    activity_id BIGINT NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    contact_id BIGINT REFERENCES contacts(id),
    organization_id BIGINT REFERENCES companies(id),
    role VARCHAR(20) DEFAULT 'participant',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT has_contact_or_org CHECK (contact_id IS NOT NULL OR organization_id IS NOT NULL)
);

-- Create indexes
CREATE INDEX idx_interaction_participants_activity ON interaction_participants(activity_id);
CREATE INDEX idx_interaction_participants_contact ON interaction_participants(contact_id);
CREATE INDEX idx_interaction_participants_organization ON interaction_participants(organization_id);

-- =====================================================
-- MIGRATE EXISTING INTERACTIONS
-- =====================================================

-- Migrate tasks that look like activities
INSERT INTO activities (
    activity_type,
    type,
    subject,
    description,
    activity_date,
    contact_id,
    organization_id,
    opportunity_id,
    follow_up_required,
    follow_up_date,
    created_at,
    updated_at,
    created_by
)
SELECT
    CASE
        WHEN t.deal_id IS NOT NULL THEN 'interaction'::activity_type
        ELSE 'engagement'::activity_type
    END,
    CASE
        WHEN t.name ILIKE '%call%' THEN 'call'::interaction_type
        WHEN t.name ILIKE '%email%' THEN 'email'::interaction_type
        WHEN t.name ILIKE '%meeting%' THEN 'meeting'::interaction_type
        WHEN t.name ILIKE '%demo%' THEN 'demo'::interaction_type
        ELSE 'follow_up'::interaction_type
    END,
    t.name AS subject,
    t.description,
    t.due_date AS activity_date,
    t.contact_id,
    t.company_id,
    t.deal_id AS opportunity_id,
    NOT t.completed AS follow_up_required,
    CASE WHEN NOT t.completed THEN t.due_date END AS follow_up_date,
    t.created_at,
    t.updated_at,
    t.sale_id
FROM tasks t
WHERE t.archived_at IS NULL
  AND (t.name ILIKE '%call%' OR t.name ILIKE '%email%' OR
       t.name ILIKE '%meeting%' OR t.name ILIKE '%demo%' OR
       t.name ILIKE '%follow%' OR t.name ILIKE '%visit%');

-- =====================================================
-- CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to log an engagement (no opportunity)
CREATE OR REPLACE FUNCTION log_engagement(
    p_type interaction_type,
    p_subject TEXT,
    p_description TEXT DEFAULT NULL,
    p_contact_id BIGINT DEFAULT NULL,
    p_organization_id BIGINT DEFAULT NULL,
    p_activity_date TIMESTAMPTZ DEFAULT NOW(),
    p_duration_minutes INTEGER DEFAULT NULL,
    p_follow_up_required BOOLEAN DEFAULT false,
    p_follow_up_date DATE DEFAULT NULL,
    p_outcome TEXT DEFAULT NULL,
    p_created_by BIGINT DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
    v_activity_id BIGINT;
BEGIN
    -- Validate we have at least contact or organization
    IF p_contact_id IS NULL AND p_organization_id IS NULL THEN
        RAISE EXCEPTION 'Engagement must have either a contact or organization';
    END IF;

    -- If contact provided but no org, get primary org
    IF p_contact_id IS NOT NULL AND p_organization_id IS NULL THEN
        SELECT organization_id INTO p_organization_id
        FROM contact_organizations
        WHERE contact_id = p_contact_id
          AND is_primary_contact = true
          AND deleted_at IS NULL
        LIMIT 1;
    END IF;

    -- Insert engagement
    INSERT INTO activities (
        activity_type,
        type,
        subject,
        description,
        activity_date,
        duration_minutes,
        contact_id,
        organization_id,
        follow_up_required,
        follow_up_date,
        outcome,
        created_by
    )
    VALUES (
        'engagement',
        p_type,
        p_subject,
        p_description,
        p_activity_date,
        p_duration_minutes,
        p_contact_id,
        p_organization_id,
        p_follow_up_required,
        p_follow_up_date,
        p_outcome,
        p_created_by
    )
    RETURNING id INTO v_activity_id;

    RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql;

-- Function to log an interaction (with opportunity)
CREATE OR REPLACE FUNCTION log_interaction(
    p_opportunity_id BIGINT,
    p_type interaction_type,
    p_subject TEXT,
    p_description TEXT DEFAULT NULL,
    p_contact_id BIGINT DEFAULT NULL,
    p_organization_id BIGINT DEFAULT NULL,
    p_activity_date TIMESTAMPTZ DEFAULT NOW(),
    p_duration_minutes INTEGER DEFAULT NULL,
    p_follow_up_required BOOLEAN DEFAULT false,
    p_follow_up_date DATE DEFAULT NULL,
    p_outcome TEXT DEFAULT NULL,
    p_sentiment VARCHAR DEFAULT NULL,
    p_created_by BIGINT DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
    v_activity_id BIGINT;
    v_customer_org_id BIGINT;
BEGIN
    -- Validate opportunity exists
    IF NOT EXISTS (SELECT 1 FROM opportunities WHERE id = p_opportunity_id AND deleted_at IS NULL) THEN
        RAISE EXCEPTION 'Opportunity % does not exist or is deleted', p_opportunity_id;
    END IF;

    -- If no organization provided, get customer organization from opportunity
    IF p_organization_id IS NULL THEN
        SELECT op.organization_id INTO v_customer_org_id
        FROM opportunity_participants op
        WHERE op.opportunity_id = p_opportunity_id
          AND op.role = 'customer'
          AND op.is_primary = true
          AND op.deleted_at IS NULL
        LIMIT 1;

        p_organization_id := v_customer_org_id;
    END IF;

    -- Insert interaction
    INSERT INTO activities (
        activity_type,
        type,
        subject,
        description,
        activity_date,
        duration_minutes,
        contact_id,
        organization_id,
        opportunity_id,
        follow_up_required,
        follow_up_date,
        outcome,
        sentiment,
        created_by
    )
    VALUES (
        'interaction',
        p_type,
        p_subject,
        p_description,
        p_activity_date,
        p_duration_minutes,
        p_contact_id,
        p_organization_id,
        p_opportunity_id,
        p_follow_up_required,
        p_follow_up_date,
        p_outcome,
        p_sentiment,
        p_created_by
    )
    RETURNING id INTO v_activity_id;

    -- Update opportunity last sync date
    UPDATE opportunities
    SET updated_at = NOW()
    WHERE id = p_opportunity_id;

    -- Update contact advocacy if sentiment is positive
    IF p_sentiment = 'positive' AND p_contact_id IS NOT NULL THEN
        UPDATE contact_preferred_principals
        SET last_interaction_date = CURRENT_DATE,
            updated_at = NOW()
        WHERE contact_id = p_contact_id
          AND principal_organization_id IN (
              SELECT organization_id
              FROM opportunity_participants
              WHERE opportunity_id = p_opportunity_id
                AND role = 'principal'
                AND deleted_at IS NULL
          )
          AND deleted_at IS NULL;
    END IF;

    RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql;

-- Function to convert engagement to interaction (when opportunity is created)
CREATE OR REPLACE FUNCTION convert_engagement_to_interaction(
    p_activity_id BIGINT,
    p_opportunity_id BIGINT
)
RETURNS VOID AS $$
BEGIN
    -- Validate the activity is an engagement
    IF NOT EXISTS (
        SELECT 1 FROM activities
        WHERE id = p_activity_id
          AND activity_type = 'engagement'
          AND deleted_at IS NULL
    ) THEN
        RAISE EXCEPTION 'Activity % is not an engagement or does not exist', p_activity_id;
    END IF;

    -- Validate opportunity exists
    IF NOT EXISTS (SELECT 1 FROM opportunities WHERE id = p_opportunity_id AND deleted_at IS NULL) THEN
        RAISE EXCEPTION 'Opportunity % does not exist or is deleted', p_opportunity_id;
    END IF;

    -- Update the activity
    UPDATE activities
    SET activity_type = 'interaction',
        opportunity_id = p_opportunity_id,
        updated_at = NOW()
    WHERE id = p_activity_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get activity timeline for an entity
CREATE OR REPLACE FUNCTION get_activity_timeline(
    p_entity_type VARCHAR,  -- 'contact', 'organization', 'opportunity'
    p_entity_id BIGINT,
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    activity_id BIGINT,
    activity_type activity_type,
    interaction_type interaction_type,
    subject TEXT,
    description TEXT,
    activity_date TIMESTAMPTZ,
    duration_minutes INTEGER,
    contact_name TEXT,
    organization_name TEXT,
    opportunity_name TEXT,
    outcome TEXT,
    sentiment VARCHAR,
    follow_up_required BOOLEAN,
    follow_up_date DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.id AS activity_id,
        a.activity_type,
        a.type AS interaction_type,
        a.subject,
        a.description,
        a.activity_date,
        a.duration_minutes,
        c.name AS contact_name,
        comp.name AS organization_name,
        o.name AS opportunity_name,
        a.outcome,
        a.sentiment,
        a.follow_up_required,
        a.follow_up_date
    FROM activities a
    LEFT JOIN contacts c ON a.contact_id = c.id
    LEFT JOIN companies comp ON a.organization_id = comp.id
    LEFT JOIN opportunities o ON a.opportunity_id = o.id
    WHERE a.deleted_at IS NULL
      AND (
        (p_entity_type = 'contact' AND a.contact_id = p_entity_id) OR
        (p_entity_type = 'organization' AND a.organization_id = p_entity_id) OR
        (p_entity_type = 'opportunity' AND a.opportunity_id = p_entity_id)
      )
    ORDER BY a.activity_date DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CREATE TRIGGERS
-- =====================================================

-- Trigger to validate activity consistency
CREATE OR REPLACE FUNCTION validate_activity_consistency()
RETURNS trigger AS $$
DECLARE
    v_opp_customer_id BIGINT;
    v_contact_org_id BIGINT;
BEGIN
    -- For interactions, validate alignment with opportunity
    IF NEW.activity_type = 'interaction' AND NEW.opportunity_id IS NOT NULL THEN
        -- Get customer organization from opportunity
        SELECT op.organization_id INTO v_opp_customer_id
        FROM opportunity_participants op
        WHERE op.opportunity_id = NEW.opportunity_id
          AND op.role = 'customer'
          AND op.is_primary = true
          AND op.deleted_at IS NULL
        LIMIT 1;

        -- If contact is provided, validate they belong to customer org
        IF NEW.contact_id IS NOT NULL THEN
            SELECT organization_id INTO v_contact_org_id
            FROM contact_organizations
            WHERE contact_id = NEW.contact_id
              AND organization_id = v_opp_customer_id
              AND deleted_at IS NULL
            LIMIT 1;

            IF v_contact_org_id IS NULL THEN
                RAISE WARNING 'Contact % is not associated with opportunity customer organization %',
                              NEW.contact_id, v_opp_customer_id;
            END IF;
        END IF;

        -- Set organization to opportunity customer if not provided
        IF NEW.organization_id IS NULL THEN
            NEW.organization_id := v_opp_customer_id;
        END IF;
    END IF;

    -- For founding interactions, link back to opportunity
    IF NEW.activity_type = 'interaction' AND NEW.opportunity_id IS NOT NULL THEN
        UPDATE opportunities
        SET founding_interaction_id = NEW.id
        WHERE id = NEW.opportunity_id
          AND founding_interaction_id IS NULL;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_activity_consistency
    BEFORE INSERT OR UPDATE ON activities
    FOR EACH ROW
    EXECUTE FUNCTION validate_activity_consistency();

-- =====================================================
-- CREATE VIEWS FOR REPORTING
-- =====================================================

-- View for engagement analytics
CREATE OR REPLACE VIEW engagement_analytics AS
SELECT
    DATE_TRUNC('month', activity_date) AS month,
    type AS engagement_type,
    COUNT(*) AS total_count,
    COUNT(DISTINCT contact_id) AS unique_contacts,
    COUNT(DISTINCT organization_id) AS unique_organizations,
    AVG(duration_minutes) AS avg_duration,
    SUM(CASE WHEN follow_up_required THEN 1 ELSE 0 END) AS follow_ups_required,
    SUM(CASE WHEN sentiment = 'positive' THEN 1 ELSE 0 END) AS positive_sentiment,
    SUM(CASE WHEN sentiment = 'negative' THEN 1 ELSE 0 END) AS negative_sentiment
FROM activities
WHERE activity_type = 'engagement'
  AND deleted_at IS NULL
GROUP BY DATE_TRUNC('month', activity_date), type;

-- View for interaction analytics
CREATE OR REPLACE VIEW interaction_analytics AS
SELECT
    o.id AS opportunity_id,
    o.name AS opportunity_name,
    o.stage AS opportunity_stage,
    COUNT(a.id) AS total_interactions,
    MAX(a.activity_date) AS last_interaction,
    MIN(a.activity_date) AS first_interaction,
    COUNT(DISTINCT a.type) AS interaction_types_used,
    AVG(a.duration_minutes) AS avg_duration,
    SUM(CASE WHEN a.sentiment = 'positive' THEN 1 ELSE 0 END) AS positive_interactions,
    SUM(CASE WHEN a.sentiment = 'negative' THEN 1 ELSE 0 END) AS negative_interactions,
    -- Calculate days since last interaction
    EXTRACT(DAY FROM NOW() - MAX(a.activity_date)) AS days_since_last_interaction
FROM opportunities o
LEFT JOIN activities a ON o.id = a.opportunity_id
    AND a.activity_type = 'interaction'
    AND a.deleted_at IS NULL
WHERE o.deleted_at IS NULL
GROUP BY o.id, o.name, o.stage;

-- View for contact engagement summary
CREATE OR REPLACE VIEW contact_engagement_summary AS
SELECT
    c.id AS contact_id,
    c.name AS contact_name,
    COUNT(DISTINCT a.id) AS total_activities,
    COUNT(DISTINCT CASE WHEN a.activity_type = 'engagement' THEN a.id END) AS engagements,
    COUNT(DISTINCT CASE WHEN a.activity_type = 'interaction' THEN a.id END) AS interactions,
    COUNT(DISTINCT a.opportunity_id) AS opportunities_touched,
    MAX(a.activity_date) AS last_activity,
    AVG(a.duration_minutes) AS avg_interaction_duration,
    STRING_AGG(DISTINCT a.type::TEXT, ', ') AS activity_types
FROM contacts c
LEFT JOIN activities a ON c.id = a.contact_id AND a.deleted_at IS NULL
WHERE c.deleted_at IS NULL
GROUP BY c.id, c.name;

-- =====================================================
-- ENABLE RLS ON NEW TABLES
-- =====================================================

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE interaction_participants ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable all access for authenticated users" ON activities
    FOR ALL
    TO authenticated
    USING (deleted_at IS NULL);

CREATE POLICY "Enable all access for authenticated users" ON interaction_participants
    FOR ALL
    TO authenticated
    USING (true);

-- =====================================================
-- VALIDATION QUERIES
-- =====================================================

DO $$
DECLARE
    v_table_count INTEGER;
    v_function_count INTEGER;
    v_view_count INTEGER;
    v_migrated_count INTEGER;
BEGIN
    -- Check tables created
    SELECT COUNT(*) INTO v_table_count
    FROM information_schema.tables
    WHERE table_name IN ('activities', 'interaction_participants')
    AND table_schema = 'public';

    IF v_table_count < 2 THEN
        RAISE EXCEPTION 'Not all tables were created successfully';
    END IF;

    -- Check functions created
    SELECT COUNT(*) INTO v_function_count
    FROM information_schema.routines
    WHERE routine_name IN ('log_engagement', 'log_interaction',
                          'convert_engagement_to_interaction', 'get_activity_timeline')
    AND routine_schema = 'public';

    IF v_function_count < 4 THEN
        RAISE EXCEPTION 'Not all functions were created successfully';
    END IF;

    -- Check views created
    SELECT COUNT(*) INTO v_view_count
    FROM information_schema.views
    WHERE table_name IN ('engagement_analytics', 'interaction_analytics', 'contact_engagement_summary')
    AND table_schema = 'public';

    IF v_view_count < 3 THEN
        RAISE WARNING 'Some views may not have been created: % found', v_view_count;
    END IF;

    -- Check migrated activities
    SELECT COUNT(*) INTO v_migrated_count
    FROM activities;

    RAISE NOTICE 'Phase 1.4 validation passed. Created activities system with % migrated records', v_migrated_count;
END $$;

-- Record migration completion
UPDATE migration_history
SET status = 'completed',
    completed_at = NOW()
WHERE phase_number = '1.4'
AND status = 'in_progress';

-- =====================================================
-- END OF PHASE 1.4 - ACTIVITIES SYSTEM
-- =====================================================