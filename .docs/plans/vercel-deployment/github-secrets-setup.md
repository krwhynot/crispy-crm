# GitHub Secrets Setup Guide

**Purpose**: Configure GitHub repository secrets for automated Supabase backend deployments

**Workflow**: `.github/workflows/supabase-deploy.yml`

---

## Required Secrets

Navigate to: **GitHub Repo → Settings → Secrets and variables → Actions**

### 1. Supabase Configuration Secrets

| Secret Name | Description | Where to Find | Example |
|------------|-------------|---------------|---------|
| `SUPABASE_ACCESS_TOKEN` | Personal access token for Supabase CLI | https://supabase.com/dashboard/account/tokens | `sbp_xxx...` |
| `SUPABASE_PROJECT_ID` | Project reference ID | Supabase Dashboard → Project Settings | `aaqnanddcqvfiwhshndl` |
| `SUPABASE_DB_PASSWORD` | Database password | Supabase Dashboard → Database Settings | `your-db-password` |

### 2. CORS Configuration Secrets (NEW)

| Secret Name | Description | Value |
|------------|-------------|-------|
| `ALLOWED_ORIGINS` | Comma-separated list of allowed origins for edge functions | `http://localhost:5173,https://crispy-crm.vercel.app` |
| `DENO_ENV` | Deno environment mode | `development` |

---

## Step-by-Step Setup

### Step 1: Get Supabase Access Token

1. Go to https://supabase.com/dashboard/account/tokens
2. Click **"Generate New Token"**
3. Name: `GitHub Actions - Atomic CRM`
4. Copy the token (starts with `sbp_`)
5. Add to GitHub:
   - Name: `SUPABASE_ACCESS_TOKEN`
   - Value: `sbp_xxx...`

### Step 2: Get Project ID

1. Go to https://supabase.com/dashboard
2. Select your project: **Atomic CRM**
3. Click **Settings** → **General**
4. Copy **Reference ID** (e.g., `aaqnanddcqvfiwhshndl`)
5. Add to GitHub:
   - Name: `SUPABASE_PROJECT_ID`
   - Value: `aaqnanddcqvfiwhshndl`

### Step 3: Get Database Password

**Option A: Find Existing Password**
- Check your local `.env.development` file
- Or retrieve from password manager

**Option B: Reset Password**
1. Supabase Dashboard → **Settings** → **Database**
2. Click **"Reset database password"**
3. Copy new password
4. Update locally in `.env.development`

Add to GitHub:
- Name: `SUPABASE_DB_PASSWORD`
- Value: `your-db-password`

### Step 4: Add CORS Configuration

**ALLOWED_ORIGINS**:
- Name: `ALLOWED_ORIGINS`
- Value: `http://localhost:5173,https://crispy-crm.vercel.app`

**DENO_ENV**:
- Name: `DENO_ENV`
- Value: `development`

---

## Verification

After adding all secrets, verify:

1. **GitHub**: Settings → Secrets and variables → Actions
   - You should see 5 secrets listed:
     - ✅ `SUPABASE_ACCESS_TOKEN`
     - ✅ `SUPABASE_PROJECT_ID`
     - ✅ `SUPABASE_DB_PASSWORD`
     - ✅ `ALLOWED_ORIGINS`
     - ✅ `DENO_ENV`

2. **Test the workflow**:
   - Make a change to any file in `supabase/`
   - Commit and push
   - Check **Actions** tab for successful run

---

## Security Notes

### Secret Rotation

Rotate these secrets periodically:
- `SUPABASE_ACCESS_TOKEN` - Every 6 months
- `SUPABASE_DB_PASSWORD` - Every 6 months or on team member departure

### Secret Access

- Never commit secrets to code
- Never log secrets in workflows
- Secrets are encrypted at rest by GitHub
- Only workflow runs can access secrets

### Updating Secrets

To update a secret:
1. Go to GitHub → Settings → Secrets
2. Click secret name
3. Click **"Update secret"**
4. Paste new value
5. Click **"Update secret"**

---

## Troubleshooting

### Workflow fails with "Access token not provided"

**Solution**: Check `SUPABASE_ACCESS_TOKEN` is set correctly
```bash
# Verify token works locally:
export SUPABASE_ACCESS_TOKEN="sbp_xxx..."
npx supabase projects list
```

### Workflow fails with "Invalid project reference"

**Solution**: Verify `SUPABASE_PROJECT_ID` matches your project
```bash
# Check project ID in Supabase dashboard
# Settings → General → Reference ID
```

### Edge functions don't have CORS configured

**Solution**: Verify `ALLOWED_ORIGINS` and `DENO_ENV` secrets are set

Check workflow logs for:
```
🔐 Configure CORS allowed origins
✅ Secrets configured
```

### Secrets not being set

**Cause**: Secrets might be undefined (not set in GitHub)

**Check workflow logs** for:
```yaml
- if: ${{ secrets.ALLOWED_ORIGINS }}  # This checks if secret exists
```

If missing, the step is skipped.

---

## Optional Secrets (Not Currently Used)

These secrets exist in the old workflow but are no longer needed:

- ❌ `DEPLOY_TOKEN` - Was for GitHub Pages (now using Vercel)
- ❌ `POSTMARK_WEBHOOK_*` - Postmark removed from codebase
- ❌ `SUPABASE_URL` - Duplicates `VITE_SUPABASE_URL` (not needed)
- ❌ `SUPABASE_ANON_KEY` - Already in Vercel env vars

**You can safely delete these** if they exist in your repository.

---

## Migration Checklist

If migrating from old `deploy.yml` workflow:

- [ ] Add `ALLOWED_ORIGINS` secret (NEW)
- [ ] Add `DENO_ENV` secret (NEW)
- [ ] Verify `SUPABASE_ACCESS_TOKEN` still works
- [ ] Verify `SUPABASE_PROJECT_ID` is correct
- [ ] Verify `SUPABASE_DB_PASSWORD` is correct
- [ ] Remove `POSTMARK_*` secrets (no longer used)
- [ ] Remove `DEPLOY_TOKEN` (no longer needed)
- [ ] Test new workflow with a Supabase file change

---

**Last Updated**: 2025-10-05
**Workflow**: `.github/workflows/supabase-deploy.yml`
