# Vercel Deployment Requirements

**DEPLOYMENT APPROACH**: Single Supabase Environment (Option 1 - MVP Simplicity)
- Using existing Supabase project (`aaqnanddcqvfiwhshndl.supabase.co`) for both dev and Vercel production
- No separate production Supabase needed
- Faster deployment, simpler configuration
- **See `deployment-steps.md` for step-by-step deployment guide**

## Feature Summary

Deploy the Atomic CRM application to Vercel with the existing Supabase backend, implementing critical security fixes (CORS, XSS) before going live. Use Vercel's GitHub integration for automatic deployments on push to main, while maintaining a separate GitHub Actions workflow for backend operations (database migrations and edge function deployments). This MVP deployment establishes a clean separation of concerns: Vercel handles frontend CI/CD, GitHub Actions handles backend infrastructure.

## User Stories

**As a developer**, I want to deploy the application to Vercel automatically on every push to main, so that code changes go live without manual deployment steps.

**As a developer**, I want separate development and production Supabase environments, so that testing doesn't affect production data and I can deploy schema changes safely.

**As a security-conscious developer**, I want CORS wildcard and XSS vulnerabilities fixed before production deployment, so that users are protected from cross-site attacks.

**As an admin**, I want edge functions deployed to production Supabase automatically via GitHub Actions, so that backend logic stays synchronized with frontend deployments.

**As a developer**, I want a fresh production database with proper migrations, so that the schema is clean and follows our documented migration history.

## Technical Approach

### Frontend Deployment

**Platform**: Vercel with GitHub integration

**Existing Configuration** (`/vercel.json`):
- ✅ Build command: `npm run build`
- ✅ Output directory: `dist`
- ✅ Framework: Vite
- ✅ SPA routing configured
- ✅ Security headers (HSTS, CSP, X-Frame-Options, etc.)
- ✅ Static asset caching (1 year for `/static/*`)

**No code changes required** - existing `vercel.json` is production-ready.

**Environment Variables** (configure in Vercel dashboard):
```bash
VITE_SUPABASE_URL=https://[new-production-project].supabase.co
VITE_SUPABASE_ANON_KEY=[production-anon-key]
NODE_ENV=production
```

**Deployment Flow**:
1. Developer pushes to `main` branch
2. Vercel detects push via GitHub integration
3. Vercel runs `npm install` → `npm run build`
4. Vercel deploys `dist/` to CDN
5. Live at `https://atomic-crm.vercel.app` (or assigned Vercel URL)

### Backend Infrastructure

**New Production Supabase Project**:
- Create fresh Supabase project via dashboard
- No data migration (start with clean schema)
- Run all migrations from `/supabase/migrations/` in order
- Configure authentication settings (custom SMTP, callback URLs)

**Database Migrations**:
- Applied via GitHub Actions workflow on push to main
- Command: `npx supabase db push`
- Migrations already follow timestamp format: `YYYYMMDDHHMMSS_name.sql`
- Fresh schema from: `20250127000000_consolidated_fresh_schema.sql`

**Edge Functions** (deploy 2 of 3):
- ✅ `users` - User management and invitations (required)
- ✅ `updatePassword` - Password reset functionality (required)
- ❌ `postmark` - REMOVED (email capture not needed for MVP)

**Required Environment Secrets** (set via `npx supabase secrets set`):
```bash
SUPABASE_URL=[production-project-url]
SUPABASE_SERVICE_ROLE_KEY=[production-service-key]
ALLOWED_ORIGINS=https://atomic-crm.vercel.app  # CORS security fix
DENO_ENV=production  # Enables CORS allowlist validation
```

### Security Fixes (P0 - Must Fix Before Deployment)

#### 1. CORS Wildcard Vulnerability

**Current Issue** (`/supabase/functions/_shared/utils.ts:8`):
```typescript
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",  // ⚠️ Allows requests from ANY domain
};
```

**Fix**: Use existing secure CORS implementation
- File: `/supabase/functions/_shared/cors-config.ts` (already exists!)
- Replace `utils.ts` CORS usage with `cors-config.ts` in all edge functions
- Validates origin against `ALLOWED_ORIGINS` environment variable
- Defaults to `localhost:5173` in dev, requires explicit allowlist in production

**Implementation**:
```typescript
// In each edge function (users, updatePassword)
import { createCorsHeaders } from '../_shared/cors-config.ts';

const corsHeaders = createCorsHeaders(req.headers.get('origin'));
```

**Files to update**:
- `/supabase/functions/users/index.ts`
- `/supabase/functions/updatePassword/index.ts`

#### 2. XSS Vulnerability

**Current Issue** (`/src/atomic-crm/components/MigrationNotification.tsx:312`):
```typescript
<div dangerouslySetInnerHTML={{ __html: migration.description }} />
```

**Fix**: Sanitize HTML before rendering
- Install: `npm install dompurify @types/dompurify`
- Import and use DOMPurify to sanitize migration descriptions
- Prevents script injection through migration metadata

**Implementation**:
```typescript
import DOMPurify from 'dompurify';

<div dangerouslySetInnerHTML={{
  __html: DOMPurify.sanitize(migration.description)
}} />
```

**Files to update**:
- `/src/atomic-crm/components/MigrationNotification.tsx:312`

### GitHub Actions Workflow Refactoring

**Current**: `/.github/workflows/deploy.yml` (deploys to GitHub Pages + Supabase)

**New**: Split into two workflows

**Workflow 1**: `/.github/workflows/supabase-deploy.yml` (backend only)
- Trigger: Push to `main` with changes to `supabase/**`
- Steps:
  1. Link to production Supabase project
  2. Push database migrations
  3. Set environment secrets (ALLOWED_ORIGINS, DENO_ENV)
  4. Deploy edge functions (users, updatePassword)
- Remove: Frontend build, GitHub Pages deployment steps

**Workflow 2**: Frontend deployment (handled by Vercel)
- No workflow needed - Vercel handles automatically via GitHub integration

**GitHub Secrets Required**:
```bash
# Production Supabase
SUPABASE_ACCESS_TOKEN       # Personal access token
SUPABASE_DB_PASSWORD        # Production database password
SUPABASE_PROJECT_ID         # Production project reference ID
SUPABASE_URL                # Production Supabase URL
SUPABASE_ANON_KEY           # Production anonymous key
SUPABASE_SERVICE_ROLE_KEY   # Production service role key

# Removed (no longer needed):
# ❌ POSTMARK_WEBHOOK_USER
# ❌ POSTMARK_WEBHOOK_PASSWORD
# ❌ POSTMARK_WEBHOOK_AUTHORIZED_IPS
# ❌ DEPLOY_TOKEN (GitHub Pages deployment)
```

### Postmark Code Removal

**Files to delete**:
- `/supabase/functions/postmark/` (entire directory)
- `/supabase/functions/postmark/index.ts`

**Environment variables to remove**:
- `.env.example`: Remove `VITE_INBOUND_EMAIL`
- `.env.development`: Remove `VITE_INBOUND_EMAIL`
- `vite.config.ts`: Remove `VITE_INBOUND_EMAIL` from production define
- `CLAUDE.md`: Remove Postmark references from environment variables section

**GitHub Actions to update**:
- `/.github/workflows/deploy.yml`: Remove Postmark secret setting steps

**Documentation to update**:
- Search for "Postmark" or "inbound email" references in `/doc/`
- Remove or mark as deprecated

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     GitHub Repository                        │
│                         (main branch)                        │
└──────────────┬─────────────────────────┬────────────────────┘
               │                         │
               │ Push to main            │ Changes to supabase/**
               ↓                         ↓
┌──────────────────────────┐  ┌─────────────────────────────┐
│   Vercel GitHub App      │  │  GitHub Actions Workflow    │
│   (automatic trigger)    │  │  (supabase-deploy.yml)      │
└──────────────┬───────────┘  └──────────┬──────────────────┘
               │                         │
               │ npm run build           │ npx supabase db push
               ↓                         │ npx supabase functions deploy
┌──────────────────────────┐            ↓
│    Vercel CDN (dist/)    │  ┌─────────────────────────────┐
│  Frontend Static Files   │  │  Production Supabase        │
│  https://[app].vercel.app│  │  - PostgreSQL Database      │
└──────────────┬───────────┘  │  - Edge Functions (users,   │
               │              │    updatePassword)          │
               │              │  - Auth (JWT)               │
               │              │  - Storage                  │
               │              └─────────────────────────────┘
               │                         ↑
               │ API Calls               │
               │ (VITE_SUPABASE_URL)    │
               └─────────────────────────┘
```

## UI/UX Flow (Developer Experience)

### Initial Setup (One-Time)

**Step 1: Create Production Supabase Project**
1. Go to https://supabase.com/dashboard
2. Create new project: "Atomic CRM Production"
3. Note project URL and keys
4. Configure custom SMTP (e.g., Resend, SendGrid)
5. Set authentication callback URL: `https://[app].vercel.app/auth-callback`

**Step 2: Fix Security Vulnerabilities**
1. Install DOMPurify: `npm install dompurify @types/dompurify`
2. Update MigrationNotification.tsx with sanitization
3. Update edge functions to use cors-config.ts
4. Test locally with `npm run dev`
5. Commit security fixes to `main`

**Step 3: Remove Postmark Code**
1. Delete `/supabase/functions/postmark/` directory
2. Remove `VITE_INBOUND_EMAIL` from all .env files
3. Update vite.config.ts to remove VITE_INBOUND_EMAIL
4. Remove Postmark references from CLAUDE.md
5. Commit cleanup to `main`

**Step 4: Connect Vercel**
1. Go to https://vercel.com/new
2. Import Git Repository → Select atomic repository
3. Configure project:
   - Framework Preset: Vite (auto-detected)
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `dist` (auto-detected)
4. Add Environment Variables:
   - `VITE_SUPABASE_URL` = production Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = production anon key
   - `NODE_ENV` = production
5. **IMPORTANT**: Disable preview deployments in project settings
6. Click "Deploy"

**Step 5: Configure GitHub Secrets**
1. Go to GitHub repo → Settings → Secrets and variables → Actions
2. Update/add secrets for production Supabase:
   - `SUPABASE_ACCESS_TOKEN`
   - `SUPABASE_DB_PASSWORD`
   - `SUPABASE_PROJECT_ID`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Remove deprecated secrets:
   - Delete `POSTMARK_WEBHOOK_USER`
   - Delete `POSTMARK_WEBHOOK_PASSWORD`
   - Delete `POSTMARK_WEBHOOK_AUTHORIZED_IPS`

**Step 6: Refactor GitHub Actions Workflow**
1. Rename `deploy.yml` → `supabase-deploy.yml`
2. Remove frontend build and GitHub Pages deployment steps
3. Update to only deploy Supabase backend
4. Add path filter: `paths: ['supabase/**']`
5. Add environment secret setting:
   ```bash
   npx supabase secrets set ALLOWED_ORIGINS="https://[app].vercel.app"
   npx supabase secrets set DENO_ENV="production"
   ```
6. Commit and push workflow changes

**Step 7: Initial Deployment**
1. Push workflow changes to `main`
2. GitHub Actions deploys backend (migrations + edge functions)
3. Vercel automatically deploys frontend
4. Both deployments complete independently

### Ongoing Developer Workflow

**Daily Development**:
1. Developer makes code changes locally
2. Test with `npm run dev` (connects to dev Supabase)
3. Commit and push to `main` branch
4. **Automatic**:
   - Vercel rebuilds and deploys frontend (~2-3 minutes)
   - If Supabase files changed, GitHub Actions deploys backend
5. Changes live at production URL

**Database Schema Changes**:
1. Create migration: `npx supabase migration new feature_name`
2. Write SQL in `/supabase/migrations/[timestamp]_feature_name.sql`
3. Test locally: `npx supabase db reset` (applies all migrations)
4. Commit migration file to `main`
5. Push to GitHub
6. **Automatic**: GitHub Actions runs `npx supabase db push` to production

**Edge Function Changes**:
1. Edit function in `/supabase/functions/[function-name]/`
2. Test locally: `npx supabase functions serve`
3. Commit changes to `main`
4. Push to GitHub
5. **Automatic**: GitHub Actions deploys updated functions

### Verification Steps (Post-Deployment)

**Step 1: Verify Frontend Deployment**
1. Visit Vercel URL (e.g., `https://atomic-crm.vercel.app`)
2. Check login page loads
3. Verify Supabase connection (try logging in)
4. Check browser console for errors

**Step 2: Verify Backend Deployment**
1. Check GitHub Actions workflow succeeded
2. Verify migrations applied:
   ```bash
   npx supabase db remote status --project-ref [prod-project-id]
   ```
3. Test edge functions:
   ```bash
   curl https://[prod-project].supabase.co/functions/v1/users
   ```

**Step 3: Verify Security Fixes**
1. Check CORS headers in edge function responses
2. Verify XSS sanitization in migration notifications
3. Test authentication flow end-to-end

**Step 4: Disable GitHub Pages (After 1-2 Weeks)**
1. Verify Vercel is stable and working
2. Go to GitHub repo → Settings → Pages
3. Set source to "None"
4. Remove GitHub Pages workflow steps from old `deploy.yml`

## Success Metrics

### Deployment Success Criteria

**Automated Deployment**:
- ✅ Push to `main` triggers Vercel build automatically
- ✅ Vercel deployment completes in < 5 minutes
- ✅ GitHub Actions backend deployment completes in < 3 minutes
- ✅ No manual steps required for deployment

**Security**:
- ✅ CORS requests only allowed from Vercel production URL
- ✅ XSS vulnerability fixed and verified (no unsanitized HTML)
- ✅ Edge functions reject requests from unauthorized origins

**Database**:
- ✅ All migrations applied successfully to production
- ✅ Schema matches expected structure (compare with dev)
- ✅ RLS policies active on all tables

**Edge Functions**:
- ✅ `users` function responds correctly to authenticated requests
- ✅ `updatePassword` function handles password reset flow
- ✅ Both functions have proper CORS headers

**Frontend**:
- ✅ Application loads at Vercel URL
- ✅ Login/authentication works
- ✅ All routes accessible (SPA routing works)
- ✅ Supabase API calls succeed
- ✅ No console errors on page load

**Separation of Concerns**:
- ✅ Vercel handles frontend deployments only
- ✅ GitHub Actions handles backend deployments only
- ✅ No overlap or duplicate deployment steps
- ✅ Each system deploys independently

### Performance Benchmarks

**Build Performance**:
- Frontend build: < 2 minutes (current: ~1min 12sec)
- Backend deployment: < 3 minutes (migrations + functions)
- Total deployment time: < 5 minutes (parallel execution)

**Application Performance**:
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Bundle size: < 4MB (current: 3.6MB)

### Monitoring & Alerts

**Vercel Dashboard**:
- Monitor deployment success/failure rates
- Track build times
- Review deployment logs

**Supabase Dashboard**:
- Monitor edge function invocations
- Check database query performance
- Review auth logs

**GitHub Actions**:
- Track workflow success rate
- Monitor backend deployment failures
- Alert on migration errors

## Out of Scope (Not Included in MVP)

### Explicitly Excluded

**Preview Deployments**:
- ❌ No Vercel preview URLs for pull requests
- ❌ No staging environment
- Rationale: MVP focuses on production-only deployment
- Future consideration: Add staging after MVP proven stable

**Postmark Integration**:
- ❌ No inbound email capture
- ❌ No automatic contact creation from emails
- Rationale: Not core CRM functionality, adds complexity
- Alternative: Manually create contacts via UI

**Custom Domain**:
- ❌ No custom domain setup (e.g., `crm.company.com`)
- ✅ Use default Vercel URL (e.g., `atomic-crm.vercel.app`)
- Rationale: MVP doesn't require branded domain
- Future consideration: Add custom domain post-MVP

**Advanced Monitoring**:
- ❌ No third-party error tracking (Sentry, LogRocket, etc.)
- ❌ No custom analytics or performance monitoring
- ✅ Use built-in Vercel and Supabase dashboards
- Future consideration: Add comprehensive monitoring post-MVP

**Multi-Environment Setup**:
- ❌ No separate staging environment
- ❌ No multiple Vercel projects (dev, staging, prod)
- ✅ Single production environment
- Rationale: MVP complexity reduction
- Future consideration: Add staging for larger teams

**Data Migration**:
- ❌ No migration of existing data from dev Supabase
- ✅ Fresh production database from migrations
- Rationale: Currently all test data, no production data exists

**Rollback Strategy**:
- ❌ No automated rollback on deployment failure
- ❌ No blue-green deployment
- ✅ Manual rollback via Vercel dashboard if needed
- Future consideration: Add deployment safety checks

**Advanced Security**:
- ❌ No Web Application Firewall (WAF)
- ❌ No DDoS protection beyond Vercel defaults
- ❌ No penetration testing
- ✅ Fix critical P0 vulnerabilities (CORS, XSS)
- Future consideration: Security audit before handling sensitive data

### Deferred to Post-MVP

**GitHub Pages**:
- Keep GitHub Pages deployment active for 1-2 weeks
- Disable after Vercel proven stable
- Remove workflow steps in future cleanup

**Auth Cache Expiration** (P1 security):
- Current auth cache has no expiration validation
- Low risk for MVP (mostly UX issue, not attack vector)
- Defer to post-MVP security improvements

**Enhanced Input Sanitization** (P1 security):
- Current Zod validation is sufficient for MVP
- Enhanced sanitization can be added post-launch
- No critical attack vectors identified

**Edge Function Observability**:
- No custom logging or tracing
- Use Supabase built-in logs for MVP
- Add structured logging post-MVP if needed

**Environment Variable Validation**:
- No runtime validation that all required env vars are set
- Deployment will fail gracefully if missing
- Can add validation script post-MVP

## Dependencies & Prerequisites

### Required Before Starting

**Access & Permissions**:
- [ ] Supabase account with ability to create new projects
- [ ] Vercel account with GitHub integration enabled
- [ ] GitHub repository admin access (for secrets and workflows)
- [ ] Domain for production (if not using default Vercel URL) - NOT NEEDED FOR MVP

**Development Environment**:
- [ ] Node.js 22.x installed
- [ ] npm 10.x installed
- [ ] Supabase CLI installed (`npx supabase --version`)
- [ ] Git configured

**Knowledge Requirements**:
- [ ] Familiarity with Vercel dashboard
- [ ] Understanding of Supabase migrations
- [ ] GitHub Actions basic knowledge
- [ ] Environment variable configuration

### External Services

**Supabase**:
- New production project (free tier acceptable for MVP)
- Custom SMTP provider configured (Resend, SendGrid, etc.)
- Auth callback URL set to Vercel production URL

**Vercel**:
- Free tier acceptable for MVP
- GitHub integration enabled
- Automatic deployments configured

**GitHub**:
- Repository must be public or Vercel must have private repo access
- GitHub Actions enabled
- Secrets properly configured

## Timeline Estimate

**Total MVP Deployment**: 4-6 hours (one working day)

**Phase 1: Security Fixes** (1-2 hours)
- Install DOMPurify
- Fix XSS vulnerability
- Update CORS implementation in edge functions
- Test locally

**Phase 2: Postmark Cleanup** (30 minutes)
- Delete Postmark edge function
- Remove environment variable references
- Update documentation
- Commit cleanup

**Phase 3: Supabase Production Setup** (1 hour)
- Create new Supabase project
- Configure custom SMTP
- Set auth callback URLs
- Note credentials for Vercel/GitHub

**Phase 4: Vercel Configuration** (30 minutes)
- Import repository to Vercel
- Configure environment variables
- Disable preview deployments
- Initial deployment

**Phase 5: GitHub Actions Refactor** (1 hour)
- Update workflow to backend-only
- Add environment secret setting
- Configure GitHub secrets
- Test deployment

**Phase 6: Verification & Testing** (1 hour)
- Verify frontend deployment
- Test authentication flow
- Check edge functions
- Validate security fixes
- End-to-end testing

**Phase 7: Monitoring Period** (1-2 weeks)
- Monitor Vercel deployments
- Watch for errors in Supabase logs
- Keep GitHub Pages as backup
- Verify stability

**Phase 8: Cleanup** (30 minutes)
- Disable GitHub Pages
- Remove legacy workflow steps
- Update documentation

## Risk Mitigation

### Identified Risks

**Risk 1: Migration Failure on Fresh Database**
- **Likelihood**: Low
- **Impact**: High (blocks deployment)
- **Mitigation**: Test all migrations on fresh local database first
- **Rollback**: Supabase allows manual SQL execution to fix

**Risk 2: CORS Configuration Breaks Functionality**
- **Likelihood**: Medium
- **Impact**: High (API calls fail)
- **Mitigation**: Test CORS changes locally before deploying
- **Rollback**: Revert to wildcard temporarily, fix, redeploy

**Risk 3: Environment Variables Misconfigured**
- **Likelihood**: Medium
- **Impact**: High (app won't connect to Supabase)
- **Mitigation**: Double-check all env vars in Vercel dashboard
- **Rollback**: Update vars in Vercel, automatic redeploy

**Risk 4: GitHub Pages Still Receives Traffic**
- **Likelihood**: High (if DNS or bookmarks point there)
- **Impact**: Low (old deployment, may be stale)
- **Mitigation**: Keep both running for 1-2 weeks, gradual transition
- **Rollback**: Re-enable GitHub Pages if Vercel fails

**Risk 5: Edge Functions Don't Deploy**
- **Likelihood**: Low
- **Impact**: Medium (password reset won't work)
- **Mitigation**: Test edge function deployment to production manually first
- **Rollback**: Redeploy via CLI manually

### Contingency Plans

**If Vercel Deployment Fails**:
1. Check build logs in Vercel dashboard
2. Verify environment variables are set correctly
3. Test build locally: `npm run build`
4. Fall back to GitHub Pages if critical

**If Database Migration Fails**:
1. Check Supabase logs for error details
2. Fix migration SQL syntax
3. Apply corrected migration manually via Supabase dashboard
4. Update migration file in repository

**If CORS Breaks API Calls**:
1. Check browser console for CORS errors
2. Verify `ALLOWED_ORIGINS` secret is set correctly
3. Temporarily revert to wildcard for debugging
4. Fix and redeploy

## Post-Deployment Checklist

### Immediate (Within 24 Hours)

- [ ] Verify application loads at Vercel URL
- [ ] Test user login/authentication
- [ ] Create test contact/opportunity
- [ ] Verify edge functions work (password reset flow)
- [ ] Check for console errors
- [ ] Review Vercel deployment logs
- [ ] Review Supabase logs for errors

### Short-Term (Within 1 Week)

- [ ] Monitor Vercel deployment frequency and success rate
- [ ] Check GitHub Actions workflow runs successfully
- [ ] Verify no production issues reported
- [ ] Test all major CRM workflows (contacts, opportunities, tasks)
- [ ] Review performance metrics in Vercel dashboard

### Medium-Term (Within 2 Weeks)

- [ ] Disable GitHub Pages deployment
- [ ] Remove GitHub Pages workflow steps
- [ ] Update repository README with new deployment process
- [ ] Document production URL for team
- [ ] Verify backup and recovery process

### Long-Term (Within 1 Month)

- [ ] Evaluate need for staging environment
- [ ] Consider adding preview deployments for PRs
- [ ] Review and address P1 security issues (auth cache, input sanitization)
- [ ] Add error tracking (Sentry) if needed
- [ ] Consider custom domain if business requires

---

## Next Steps

After requirements approval:

1. **Implementation Phase**: Execute deployment following this document
2. **Testing Phase**: Verify all success criteria met
3. **Monitoring Phase**: 1-2 week observation period
4. **Cleanup Phase**: Disable legacy GitHub Pages deployment

**Memory Storage**: This requirements document and all architectural decisions will be stored in the memory graph for future reference.
