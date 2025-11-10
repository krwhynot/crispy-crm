# Security Key Rotation Plan

**Last Updated:** 2025-11-08
**Next Rotation:** 2026-02-08 (90 days)
**Responsible:** Security Team / Engineering Lead

---

## When to Rotate

Rotate Supabase keys **immediately** if:

1. ✅ Keys committed to public repository (even if removed)
2. ✅ Keys shared via insecure channel (Slack, email, plaintext)
3. ✅ Employee with key access leaves company
4. ✅ Suspected unauthorized access or security incident
5. ✅ Routine rotation schedule (every 90 days recommended)
6. ✅ Compliance audit requires rotation
7. ✅ After penetration testing that exposed keys

**Don't wait** - rotate immediately if any of the above occur.

---

## Supabase Key Types

### Anonymous (Public) Key

**Risk Level:** Low-Medium
**Exposure:** Safe to expose in client-side code (protected by RLS)
**Access:** Can only perform operations allowed by RLS policies

**When to rotate:**
- If committed to public repo
- Routine 90-day schedule
- After security audit findings

### Service Role Key

**Risk Level:** CRITICAL
**Exposure:** NEVER expose in client-side code
**Access:** Full database access, bypasses RLS

**When to rotate:**
- Immediately if exposed anywhere
- After employee with access leaves
- Routine 90-day schedule
- After any security incident

**Location in Atomic CRM:**
- Used only in tests: `tests/setup/supabaseTestClient.ts`
- Should be in `.env.local` (not committed)
- Never used in production client code ✅

---

## How to Rotate Supabase Keys

### Anonymous (Public) Key Rotation

**Downtime:** None (graceful transition)
**Effort:** 30 minutes
**Risk:** Low

#### Step 1: Generate New Key

1. Log in to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to: **Settings** → **API**
4. Click **"Generate new anon key"**
5. Copy the new key immediately

#### Step 2: Update Environment Variables

**Local Development:**
```bash
# Update .env.local
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.NEW_KEY_HERE
```

**Staging/Production (CI/CD):**
```bash
# GitHub Actions
gh secret set VITE_SUPABASE_ANON_KEY --body "NEW_KEY_HERE"

# Or manually in GitHub:
# Settings → Secrets and variables → Actions → Update secret
```

#### Step 3: Deploy

```bash
# Test locally first
npm run dev
# Verify app loads and authentication works

# Deploy to staging
npm run build
npm run deploy:staging

# Test staging thoroughly
# - Login works
# - Data loads
# - CRUD operations work
# - No console errors

# Deploy to production
npm run deploy:production
```

#### Step 4: Verify & Cleanup

**Verification:**
- [ ] Application loads without errors
- [ ] Users can log in
- [ ] Data operations work (Create, Read, Update, Delete)
- [ ] No 401/403 errors in network tab

**Cleanup:**
- Old key automatically invalidated after 24 hours
- No manual cleanup needed

#### Step 5: Document Rotation

Update rotation log:
```markdown
## Rotation Log

- **2025-11-08:** Anon key rotated (Reason: Phase 1 security remediation)
- **Next due:** 2026-02-08
```

---

### Service Role Key Rotation

**Downtime:** Potential (test environment only)
**Effort:** 1 hour
**Risk:** High if not done carefully

⚠️ **WARNING:** Service role key has full database access. Test thoroughly before deploying.

#### Step 1: Generate New Key

1. Log in to Supabase Dashboard
2. Navigate to: **Settings** → **API**
3. Click **"Generate new service_role key"**
4. **SAVE KEY IMMEDIATELY** - You cannot retrieve it later
5. Store in password manager temporarily

#### Step 2: Update Test Configuration

**File:** `tests/setup/supabaseTestClient.ts`

```bash
# Update .env.test or .env.local
SUPABASE_SERVICE_ROLE_KEY=NEW_SERVICE_ROLE_KEY_HERE
```

#### Step 3: Update CI/CD Secrets

```bash
# GitHub Actions
gh secret set SUPABASE_SERVICE_ROLE_KEY --body "NEW_KEY_HERE"
```

#### Step 4: Test Thoroughly

```bash
# Run full test suite
npm test

# Run E2E tests
npm run test:e2e

# Verify:
# - Tests pass
# - Test database setup works
# - No authentication errors
```

#### Step 5: Deploy (if used in server-side code)

⚠️ **Note:** Atomic CRM currently only uses service role key in tests, not production. Skip this step unless architecture has changed.

If service role key used in Edge Functions or server-side:
```bash
# Update Edge Functions environment
supabase secrets set SERVICE_ROLE_KEY=NEW_KEY_HERE

# Deploy Edge Functions
npx supabase functions deploy

# Test Edge Functions
curl -X POST https://your-project.supabase.co/functions/v1/your-function \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

#### Step 6: Verify & Cleanup

**Verification:**
- [ ] All tests pass
- [ ] CI/CD pipeline succeeds
- [ ] Edge Functions work (if applicable)
- [ ] No service disruptions

**Cleanup:**
- Old service role key **immediately invalidated**
- Remove old key from password manager
- Notify team of rotation

---

## Project Reset (Last Resort)

If **both keys** are compromised and you're uncertain of the damage extent, consider creating a new Supabase project.

### When to Consider Project Reset

- Keys exposed in public repository for >24 hours
- Confirmed unauthorized database access
- Multiple security incidents in short time
- Unable to verify integrity of existing data

### Project Reset Procedure

⚠️ **WARNING:** This is destructive. Backup everything first.

#### Step 1: Backup Current Project

```bash
# Backup schema
npx supabase db dump --local > backup_schema_$(date +%Y%m%d).sql

# Backup data (if trustworthy)
pg_dump $DATABASE_URL > backup_data_$(date +%Y%m%d).sql

# Backup migrations
cp -r supabase/migrations backup_migrations_$(date +%Y%m%d)/
```

#### Step 2: Create New Project

1. Log in to Supabase Dashboard
2. Click **"New Project"**
3. Choose organization and region
4. Set strong database password (save in password manager)
5. Wait for project creation (~2 minutes)

#### Step 3: Migrate Schema

```bash
# Update local .env with new project details
VITE_SUPABASE_URL=https://NEW_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=NEW_ANON_KEY

# Apply migrations
npx supabase db reset --local
npx supabase db push
```

#### Step 4: Migrate Data (Selective)

```bash
# Review backup data for compromised records
# Only restore verified clean data

# Restore verified data
psql $NEW_DATABASE_URL < verified_clean_data.sql
```

#### Step 5: Update Application

```bash
# Update environment variables everywhere
# - Local .env.local
# - CI/CD secrets
# - Staging environment
# - Production environment

# Deploy to staging first
npm run deploy:staging

# Full QA pass on staging

# Deploy to production
npm run deploy:production
```

#### Step 6: Delete Old Project

1. Verify new project works completely
2. Wait 7 days for safety buffer
3. Delete old project in Supabase Dashboard
4. Document incident and lessons learned

---

## Git History Cleaning

If keys were committed to git (even if removed in later commit), they remain in history and must be purged.

### Check if Keys in History

```bash
# Search entire git history for Supabase keys
git log -p --all -S "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"

# Search for .env files in history
git log --all --full-history -- .env
git log --all --full-history -- .env.cloud
```

### Option 1: BFG Repo Cleaner (Recommended)

**Fastest and safest method for large repos**

```bash
# Install BFG
brew install bfg  # macOS
# or download from: https://rtyley.github.io/bfg-repo-cleaner/

# Create passwords.txt with keys to remove
cat > passwords.txt <<EOF
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.OLD_ANON_KEY
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.OLD_SERVICE_KEY
EOF

# Clone fresh copy
git clone --mirror https://github.com/your-org/crispy-crm.git temp-repo.git
cd temp-repo.git

# Remove passwords from history
bfg --replace-text ../passwords.txt

# Expire reflog and gc
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Push (WARNING: This rewrites history)
git push

# Clone fresh copy to verify
cd ..
git clone https://github.com/your-org/crispy-crm.git verified-clean
cd verified-clean
git log -p --all -S "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
# Should find nothing
```

### Option 2: git-filter-repo (More Control)

**Surgical removal of specific files**

```bash
# Install git-filter-repo
pip install git-filter-repo

# Remove .env files from all history
git filter-repo --path .env --invert-paths
git filter-repo --path .env.cloud --invert-paths
git filter-repo --path .env.local --invert-paths

# Force push
git push origin --force --all
git push origin --force --tags
```

### Option 3: Manual Filter-Branch (Last Resort)

⚠️ **Deprecated but still works**

```bash
# Backup first
git clone --no-hardlinks . ../backup-repo

# Remove .env from all history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env .env.cloud" \
  --prune-empty --tag-name-filter cat -- --all

# Force push
git push origin --force --all
git push origin --force --tags
```

### After History Cleaning

**Notify Team:**
```
IMPORTANT: Git history has been rewritten to remove committed secrets.

Action required:
1. Delete your local repo: rm -rf crispy-crm
2. Clone fresh copy: git clone https://github.com/your-org/crispy-crm.git
3. Never force push without coordination

Reason: Security key rotation after accidental commit
```

**Force team repo refresh:**
All team members must:
```bash
# DO NOT git pull - it won't work
cd crispy-crm
git fetch origin
git reset --hard origin/main  # WARNING: Loses local changes
```

---

## Prevention Checklist

Prevent keys from being committed in the first place:

### Pre-Commit Hooks

**File:** `.git/hooks/pre-commit`

```bash
#!/bin/sh
# Block .env commits

if git diff --cached --name-only | grep -E "\.env$|\.env\.cloud$"; then
  echo "ERROR: Attempting to commit .env files"
  exit 1
fi

if git diff --cached | grep -E "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"; then
  echo "WARNING: Potential Supabase key in commit"
  read -p "Continue? (y/N): " choice
  [[ "$choice" != "y" ]] && exit 1
fi
```

```bash
chmod +x .git/hooks/pre-commit
```

### CI/CD Secret Scanning

**File:** `.github/workflows/security.yml`

```yaml
name: Secret Scanning

on: [push, pull_request]

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Run Gitleaks
        uses: gitleaks/gitleaks-action@v2
```

### .gitignore Enforcement

**File:** `.gitignore`

```gitignore
# Environment files
.env
.env.*
!.env.example
supabase/.env
```

### Team Training

- [ ] All team members trained on secret management
- [ ] New hires complete security onboarding
- [ ] Quarterly refresher training
- [ ] Incident response drill annually

---

## Rotation Log

Track all key rotations for audit purposes:

| Date | Key Type | Reason | Performed By | Verified By |
|------|----------|--------|--------------|-------------|
| 2025-11-08 | Anon Key | Phase 1 security remediation | [Engineer] | [Engineer] |
| | Service Role | Phase 1 security remediation | [Engineer] | [Engineer] |
| 2026-02-08 | Both | Routine 90-day rotation | [TBD] | [TBD] |

**Next scheduled rotation:** 2026-02-08 (90 days from last rotation)

---

## Emergency Contacts

If keys compromised outside business hours:

1. **Immediate Action:** Rotate keys via Supabase Dashboard (self-service)
2. **Notify Team:** Post in #security-incidents Slack channel
3. **On-Call Engineer:** [Contact info]
4. **Security Lead:** [Contact info]
5. **CTO/VP Engineering:** [Contact info]

**Supabase Support:**
- Dashboard: https://app.supabase.com
- Support: support@supabase.com
- Emergency: Check Supabase Dashboard for current support contact

---

## Testing Rotation Procedure

Practice key rotation in staging environment quarterly:

```bash
# Staging rotation drill
# 1. Rotate staging anon key
# 2. Update staging CI/CD secrets
# 3. Deploy to staging
# 4. Verify app works
# 5. Time how long it takes
# 6. Document any issues encountered
```

**Last drill:** [Date]
**Next drill:** [Date + 90 days]
**Issues found:** [Document here]

---

## Compliance Notes

### SOC 2 Requirements

- [ ] Key rotation every 90 days (automated reminder)
- [ ] Rotation logged in audit trail
- [ ] Access to keys restricted (password manager, 2FA)
- [ ] Separation of duties (different person verifies rotation)

### NIST 800-53 (SC-12)

- [ ] Cryptographic key establishment and management
- [ ] Keys rotated based on risk assessment
- [ ] Compromised keys rotated immediately
- [ ] Key rotation documented and auditable

---

## References

- [Supabase Security Best Practices](https://supabase.com/docs/guides/security)
- [OWASP Key Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Key_Management_Cheat_Sheet.html)
- [NIST SP 800-57: Key Management](https://csrc.nist.gov/publications/detail/sp/800-57-part-1/rev-5/final)
- [BFG Repo Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)
- [git-filter-repo](https://github.com/newren/git-filter-repo)

---

**Document Owner:** Security Team / Engineering Lead
**Review Frequency:** Quarterly or after incidents
**Last Updated:** 2025-11-08
