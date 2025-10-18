-- Add explicit search_path to functions to prevent search path manipulation attacks
-- This ensures functions always use the correct schema for their operations

-- Fix get_or_create_segment function
CREATE OR REPLACE FUNCTION public.get_or_create_segment(p_name text)
RETURNS SETOF public.segments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Try to insert, skip if duplicate
  INSERT INTO segments (name, created_by)
  VALUES (trim(p_name), auth.uid())
  ON CONFLICT (lower(name)) DO NOTHING;

  -- Return the record (new or existing)
  RETURN QUERY
  SELECT * FROM segments
  WHERE lower(name) = lower(trim(p_name));
END;
$$;

-- Maintain ownership and permissions
ALTER FUNCTION public.get_or_create_segment(text) OWNER TO postgres;
COMMENT ON FUNCTION public.get_or_create_segment(text) IS 'Get or create a segment by name. Returns the segment record (new or existing). Case-insensitive lookup.';

-- Fix update_products_search function
-- Updated to exclude columns that will be removed in schema cleanup
CREATE OR REPLACE FUNCTION public.update_products_search()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.search_tsv := to_tsvector('english',
        COALESCE(NEW.name, '') || ' ' ||
        COALESCE(NEW.description, '') || ' ' ||
        COALESCE(NEW.sku, '')
    );
    RETURN NEW;
END;
$$;

-- Maintain ownership
ALTER FUNCTION public.update_products_search() OWNER TO postgres;

-- Fix update_search_tsv function
-- Updated to exclude columns that will be removed in schema cleanup
CREATE OR REPLACE FUNCTION public.update_search_tsv()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    IF TG_TABLE_NAME = 'organizations' THEN
        NEW.search_tsv := to_tsvector('english',
            COALESCE(NEW.name, '') || ' ' ||
            COALESCE(NEW.website, '') || ' ' ||
            COALESCE(NEW.city, '') || ' ' ||
            COALESCE(NEW.state, '')
        );
    ELSIF TG_TABLE_NAME = 'contacts' THEN
        NEW.search_tsv := to_tsvector('english',
            COALESCE(NEW.name, '') || ' ' ||
            COALESCE(NEW.first_name, '') || ' ' ||
            COALESCE(NEW.last_name, '') || ' ' ||
            COALESCE(NEW.title, '') || ' ' ||
            COALESCE(NEW.department, '') || ' ' ||
            COALESCE(NEW.email::text, '') || ' ' ||
            COALESCE(NEW.phone::text, '')
        );
    ELSIF TG_TABLE_NAME = 'opportunities' THEN
        NEW.search_tsv := to_tsvector('english',
            COALESCE(NEW.name, '') || ' ' ||
            COALESCE(NEW.description, '')
        );
    ELSIF TG_TABLE_NAME = 'products' THEN
        NEW.search_tsv := to_tsvector('english',
            COALESCE(NEW.name, '') || ' ' ||
            COALESCE(NEW.description, '') || ' ' ||
            COALESCE(NEW.sku, '') || ' ' ||
            COALESCE(NEW.category::TEXT, '')
        );
    END IF;
    RETURN NEW;
END;
$$;

-- Maintain ownership
ALTER FUNCTION public.update_search_tsv() OWNER TO postgres;