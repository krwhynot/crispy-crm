-- Follow-up: apply OWNER, COMMENT, and GRANT that were missing from the
-- initial 20260303110000 migration when it was pushed to production.
-- All three statements are idempotent.

ALTER FUNCTION public.admin_restore_sale(uuid, text, text, text) OWNER TO postgres;

COMMENT ON FUNCTION public.admin_restore_sale(uuid, text, text, text)
  IS 'SECURITY DEFINER: Restores soft-deleted or creates missing sales record for orphan recovery. Admin-only. Uses ON CONFLICT upsert to handle trigger race.';

GRANT EXECUTE ON FUNCTION public.admin_restore_sale(uuid, text, text, text) TO authenticated;
