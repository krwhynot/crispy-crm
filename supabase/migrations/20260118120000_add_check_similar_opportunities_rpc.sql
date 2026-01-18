-- 1. Ensure extensions schema exists and pg_trgm is installed
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

-- 2. GiST index for similarity queries (optimized for similarity() function)
CREATE INDEX IF NOT EXISTS idx_opportunities_name_trgm_gist
  ON opportunities USING GIST (name extensions.gist_trgm_ops)
  WHERE deleted_at IS NULL;

-- 3. RPC Function for server-side similarity check
CREATE OR REPLACE FUNCTION check_similar_opportunities(
  p_name TEXT,
  p_threshold FLOAT DEFAULT 0.3,
  p_exclude_id BIGINT DEFAULT NULL,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id BIGINT,
  name TEXT,
  stage TEXT,
  similarity_score FLOAT,
  principal_organization_name TEXT,
  customer_organization_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.id,
    o.name,
    o.stage::TEXT,
    extensions.similarity(lower(o.name), lower(p_name)) AS similarity_score,
    p.name AS principal_organization_name,
    c.name AS customer_organization_name
  FROM opportunities o
  LEFT JOIN organizations p ON o.principal_organization_id = p.id
  LEFT JOIN organizations c ON o.customer_organization_id = c.id
  WHERE o.deleted_at IS NULL
    AND o.stage NOT IN ('closed_won', 'closed_lost')
    AND (p_exclude_id IS NULL OR o.id != p_exclude_id)
    AND extensions.similarity(lower(o.name), lower(p_name)) >= p_threshold
  ORDER BY similarity_score DESC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION check_similar_opportunities(TEXT, FLOAT, BIGINT, INTEGER) TO authenticated;

COMMENT ON FUNCTION check_similar_opportunities IS
  'Server-side fuzzy matching using pg_trgm. Returns opportunities with names
   similar to p_name above p_threshold (0.3 = 30% similarity). Respects soft
   deletes and excludes closed stages. Performance: Current implementation uses
   similarity() function which may table scan at scale >10k records.';
