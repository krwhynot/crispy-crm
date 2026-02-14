-- Fix products search trigger functions to remove references to deleted food-specific fields
-- Rationale: Migration 20251103220531 removed ingredients, marketing_description, allergens, certifications
-- These fields are referenced by two trigger functions that need updating

-- 1. Update products_search_trigger() function
-- Remove references to: ingredients, marketing_description
CREATE OR REPLACE FUNCTION public.products_search_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    NEW.search_tsv := to_tsvector('english',
        coalesce(NEW.name, '') || ' ' ||
        coalesce(NEW.sku, '') || ' ' ||
        coalesce(NEW.manufacturer_part_number, '') || ' ' ||
        coalesce(NEW.description, '') || ' ' ||
        coalesce(NEW.category::text, '')
    );
    RETURN NEW;
END;
$function$;

-- 2. Update update_search_tsv() function (generic trigger for multiple tables)
-- Remove references to: ingredients, marketing_description, certifications, allergens
CREATE OR REPLACE FUNCTION public.update_search_tsv()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
            COALESCE(NEW.department, '')
        );
    ELSIF TG_TABLE_NAME = 'opportunities' THEN
        NEW.search_tsv := to_tsvector('english',
            COALESCE(NEW.name, '') || ' ' ||
            COALESCE(NEW.description, '')
        );
    ELSIF TG_TABLE_NAME = 'products' THEN
        -- Updated: removed ingredients, marketing_description, certifications, allergens
        NEW.search_tsv := to_tsvector('english',
            COALESCE(NEW.name, '') || ' ' ||
            COALESCE(NEW.description, '') || ' ' ||
            COALESCE(NEW.sku, '') || ' ' ||
            COALESCE(NEW.category::TEXT, '') || ' ' ||
            COALESCE(NEW.manufacturer_part_number, '')
        );
    END IF;
    RETURN NEW;
END;
$function$;

-- Triggers remain unchanged, only functions were updated
-- products_search_update trigger uses products_search_trigger()
-- trigger_update_products_search_tsv trigger uses update_search_tsv()
