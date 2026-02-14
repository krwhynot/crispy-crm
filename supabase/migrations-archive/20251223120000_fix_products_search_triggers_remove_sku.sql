-- Migration: Fix products search triggers - remove references to dropped columns
-- Purpose: Remove sku, ingredients, marketing_description, certifications, allergens
-- from trigger functions after 20251215023234_drop_product_legacy_columns.sql

-- 1. Fix products_search_trigger()
-- This trigger is used by products_search_update trigger
CREATE OR REPLACE FUNCTION public.products_search_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    NEW.search_tsv := to_tsvector('english',
        coalesce(NEW.name, '') || ' ' ||
        coalesce(NEW.manufacturer_part_number, '') || ' ' ||
        coalesce(NEW.description, '') || ' ' ||
        coalesce(NEW.category::text, '')
    );
    RETURN NEW;
END;
$function$;

-- 2. Fix update_search_tsv() - only the products branch
-- Preserve all other table branches (organizations, contacts, opportunities)
CREATE OR REPLACE FUNCTION public.update_search_tsv()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
    IF TG_TABLE_NAME = 'organizations' THEN
        NEW.search_tsv := to_tsvector('english',
            COALESCE(NEW.name, '') || ' ' ||
            COALESCE(NEW.website, '') || ' ' ||
            COALESCE(NEW.address, '') || ' ' ||
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
            COALESCE(NEW.description, '') || ' ' ||
            COALESCE(NEW.next_action, '')
        );
    ELSIF TG_TABLE_NAME = 'products' THEN
        NEW.search_tsv := to_tsvector('english',
            COALESCE(NEW.name, '') || ' ' ||
            COALESCE(NEW.description, '') || ' ' ||
            COALESCE(NEW.category::TEXT, '') || ' ' ||
            COALESCE(NEW.manufacturer_part_number, '')
        );
    END IF;
    RETURN NEW;
END;
$$;

-- 3. Fix update_products_search()
CREATE OR REPLACE FUNCTION public.update_products_search()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    NEW.search_tsv := to_tsvector('english',
        COALESCE(NEW.name, '') || ' ' ||
        COALESCE(NEW.description, '') || ' ' ||
        COALESCE(NEW.category::TEXT, '') || ' ' ||
        COALESCE(NEW.manufacturer_part_number, '')
    );
    RETURN NEW;
END;
$function$;

-- Add comment explaining the fix
COMMENT ON FUNCTION public.products_search_trigger() IS 'Updates search_tsv for products table. Fixed to remove dropped columns (sku, ingredients, marketing_description, certifications, allergens).';
COMMENT ON FUNCTION public.update_search_tsv() IS 'Updates search_tsv for multiple tables. Products branch fixed to remove dropped columns (sku, ingredients, marketing_description, certifications, allergens).';
COMMENT ON FUNCTION public.update_products_search() IS 'Updates search_tsv for products table. Fixed to remove dropped columns (sku, marketing_description).';
