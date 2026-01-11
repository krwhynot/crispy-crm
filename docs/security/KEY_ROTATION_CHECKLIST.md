# Key Rotation Checklist

**Created:** 2026-01-11
**Reason:** Environment files were previously tracked in git

## Keys Requiring Rotation

### Supabase Keys
- [ ] `VITE_SUPABASE_URL` - Rotate in Supabase Dashboard → Settings → API
- [ ] `VITE_SUPABASE_ANON_KEY` - Regenerate anon key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Regenerate service role key (CRITICAL)

### Steps
1. Go to Supabase Dashboard → Project Settings → API
2. Click "Regenerate" for each key
3. Update local .env files with new keys
4. Update CI/CD environment variables
5. Update any production deployments
6. Verify application still works

## Verification
- [ ] Local development works
- [ ] CI builds pass
- [ ] Staging environment works
- [ ] Production environment works (if deployed)

## Notes
- Service role key has full database access - highest priority
- Anon key is public but should still be rotated
- URL typically doesn't need rotation
