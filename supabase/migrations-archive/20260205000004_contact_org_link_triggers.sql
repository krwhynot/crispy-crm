/**
 * Contact-Organization Link Timeline Triggers
 *
 * Creates timeline entries when contacts are linked to or unlinked from organizations.
 * Uses direct contacts.organization_id field (junction table was deprecated and removed).
 *
 * Events logged:
 * - Contact linked: "Linked contact: {name}" (organization_id set)
 * - Contact unlinked: "Unlinked contact: {name}" (organization_id cleared)
 *
 * Uses existing 'note' type (no enum changes needed).
 */

-- ============================================================================
-- CONTACT LINKED TO ORGANIZATION TRIGGER
-- ============================================================================
-- Fires when contacts.organization_id is set (from NULL to non-NULL)
-- or changed to a different organization
CREATE OR REPLACE FUNCTION public.log_contact_org_linked()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_contact_name TEXT;
BEGIN
  -- Only log when organization_id changes from NULL to non-NULL
  -- (contact being linked to an organization)
  IF OLD.organization_id IS NULL AND NEW.organization_id IS NOT NULL THEN
    v_contact_name := COALESCE(
      NEW.first_name || ' ' || NEW.last_name,
      NEW.first_name,
      NEW.name,
      'Unknown'
    );

    INSERT INTO public.activities (
      activity_type,
      type,
      subject,
      description,
      contact_id,
      organization_id,
      created_by,
      activity_date
    ) VALUES (
      'activity',
      'note',
      'Linked contact: ' || v_contact_name,
      'Contact associated with organization',
      NEW.id,
      NEW.organization_id,
      COALESCE(public.current_sales_id(), NEW.updated_by, NEW.created_by, 1),
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$;

ALTER FUNCTION public.log_contact_org_linked() OWNER TO postgres;

COMMENT ON FUNCTION public.log_contact_org_linked() IS
  'Trigger function that logs a timeline entry when a contact is linked to an organization.';

DROP TRIGGER IF EXISTS trigger_log_contact_org_linked ON public.contacts;

CREATE TRIGGER trigger_log_contact_org_linked
  AFTER UPDATE ON public.contacts
  FOR EACH ROW
  WHEN (OLD.organization_id IS DISTINCT FROM NEW.organization_id AND NEW.organization_id IS NOT NULL)
  EXECUTE FUNCTION public.log_contact_org_linked();

COMMENT ON TRIGGER trigger_log_contact_org_linked ON public.contacts IS
  'Fires after contact organization_id is set to log timeline entry.';

-- ============================================================================
-- CONTACT UNLINKED FROM ORGANIZATION TRIGGER
-- ============================================================================
-- Fires when contacts.organization_id is cleared (from non-NULL to NULL)
CREATE OR REPLACE FUNCTION public.log_contact_org_unlinked()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_contact_name TEXT;
BEGIN
  -- Only log when organization_id changes from non-NULL to NULL
  -- (contact being unlinked from an organization)
  IF OLD.organization_id IS NOT NULL AND NEW.organization_id IS NULL THEN
    v_contact_name := COALESCE(
      NEW.first_name || ' ' || NEW.last_name,
      NEW.first_name,
      NEW.name,
      'Unknown'
    );

    INSERT INTO public.activities (
      activity_type,
      type,
      subject,
      description,
      contact_id,
      organization_id,
      created_by,
      activity_date
    ) VALUES (
      'activity',
      'note',
      'Unlinked contact: ' || v_contact_name,
      'Contact removed from organization',
      NEW.id,
      OLD.organization_id,  -- Use OLD org_id since NEW is NULL
      COALESCE(public.current_sales_id(), NEW.updated_by, NEW.created_by, 1),
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$;

ALTER FUNCTION public.log_contact_org_unlinked() OWNER TO postgres;

COMMENT ON FUNCTION public.log_contact_org_unlinked() IS
  'Trigger function that logs a timeline entry when a contact is unlinked from an organization.';

DROP TRIGGER IF EXISTS trigger_log_contact_org_unlinked ON public.contacts;

CREATE TRIGGER trigger_log_contact_org_unlinked
  AFTER UPDATE ON public.contacts
  FOR EACH ROW
  WHEN (OLD.organization_id IS NOT NULL AND NEW.organization_id IS NULL)
  EXECUTE FUNCTION public.log_contact_org_unlinked();

COMMENT ON TRIGGER trigger_log_contact_org_unlinked ON public.contacts IS
  'Fires after contact organization_id is cleared to log unlink timeline entry.';

-- ============================================================================
-- Verification Queries
-- ============================================================================
-- SELECT tgname, tgrelid::regclass FROM pg_trigger
-- WHERE tgname IN ('trigger_log_contact_org_linked', 'trigger_log_contact_org_unlinked');
