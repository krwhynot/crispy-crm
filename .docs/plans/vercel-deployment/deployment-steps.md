# Vercel Deployment - Step-by-Step Guide

**Approach**: Single Supabase environment (existing project used for both dev and Vercel production)

## Prerequisites ✅

All security fixes completed:
- ✅ CORS wildcard replaced with domain allowlist
- ✅ XSS protection via DOMPurify sanitization
- ✅ Postmark code removed from codebase

**Current Supabase Project:**
- URL: `https://aaqnanddcqvfiwhshndl.supabase.co`
- Status: Active, used for development
- Will be shared: Dev (localhost) + Production (Vercel)

---

## Step 1: Connect Repository to Vercel (5 minutes)

### 1.1 Create Vercel Account (if needed)
- Go to https://vercel.com/signup
- Sign up with your GitHub account
- Authorize Vercel to access your repositories

### 1.2 Import Project
1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your `atomic` repository
4. Vercel will auto-detect:
   - ✅ Framework: Vite
   - ✅ Build Command: `npm run build`
   - ✅ Output Directory: `dist`
   - ✅ Install Command: `npm install`

### 1.3 Configure Environment Variables

Click "Environment Variables" and add:

```bash
VITE_SUPABASE_URL=https://aaqnanddcqvfiwhshndl.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhcW5hbmRkY3F2Zml3aHNobmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1ODIxODUsImV4cCI6MjA3NDE1ODE4NX0.wJi2sGLrvrI5OQUujTByVWjdyCT7Prjlpsx9LC_CUzU
NODE_ENV=production
```

**Important:** Use the exact values from your `.env.development` file.

### 1.4 Disable Preview Deployments

1. After project is created, go to **Project Settings** → **Git**
2. Scroll to "Ignored Build Step"
3. Add custom command: `exit 1`
4. Or toggle OFF "Automatic deployments for preview branches"

This ensures only `main` branch deploys (production-only, as requested).

### 1.5 Deploy

Click **"Deploy"** button.

Vercel will:
- Clone your repository
- Run `npm install`
- Run `npm run build`
- Deploy to CDN
- Provide a URL: `https://atomic-crm-[random].vercel.app`

**Expected build time:** ~2-3 minutes

---

## Step 2: Configure CORS for Edge Functions (2 minutes)

Your edge functions now validate request origins. You need to allow both localhost (dev) and Vercel (production).

### 2.1 Get Your Vercel URL

After deployment completes, Vercel shows your URL like:
```
https://atomic-crm-abc123.vercel.app
```

Copy this exact URL (no trailing slash).

### 2.2 Set Supabase Environment Secrets

Open terminal and run:

```bash
# Link to your Supabase project (if not already linked)
npx supabase link --project-ref aaqnanddcqvfiwhshndl

# Set CORS allowed origins (both dev and Vercel)
npx supabase secrets set ALLOWED_ORIGINS="http://localhost:5173,https://atomic-crm-abc123.vercel.app"

# Keep development mode (friendly defaults)
npx supabase secrets set DENO_ENV="development"
```

**Replace** `https://atomic-crm-abc123.vercel.app` with your actual Vercel URL.

### 2.3 Redeploy Edge Functions

```bash
npx supabase functions deploy
```

This pushes the updated secrets to your edge functions (users, updatePassword).

---

## Step 3: Update Supabase Auth Configuration (2 minutes)

### 3.1 Add Vercel URL to Allowed Redirect URLs

1. Go to https://supabase.com/dashboard
2. Select your project: `aaqnanddcqvfiwhshndl`
3. Navigate to **Authentication** → **URL Configuration**
4. Add to "Redirect URLs":
   ```
   https://atomic-crm-abc123.vercel.app/auth-callback
   ```
5. Click **Save**

This allows Supabase Auth to redirect back to your Vercel app after login.

---

## Step 4: Test Deployment (5 minutes)

### 4.1 Visit Vercel URL

Open `https://atomic-crm-abc123.vercel.app` in browser.

### 4.2 Verify Checklist

- [ ] Application loads (no blank screen)
- [ ] Login page appears
- [ ] Can log in with test credentials
- [ ] Supabase connection works (no CORS errors in console)
- [ ] Can view contacts/opportunities
- [ ] Can create a test contact
- [ ] Edge functions work (try password reset flow)

### 4.3 Check Browser Console

Press `F12` → **Console** tab

**Expected:** No errors (or only warnings)

**Red flags:**
- ❌ CORS errors → Check ALLOWED_ORIGINS secret
- ❌ Supabase connection errors → Check environment variables
- ❌ 401 Unauthorized → Check auth callback URL

---

## Step 5: Configure GitHub Actions for Backend (5 minutes)

Your GitHub Actions workflow currently deploys to GitHub Pages. We'll keep it for backend-only operations.

### 5.1 Update Workflow to Skip Frontend Deployment

**Option A: Keep GitHub Pages Running** (safest - you already chose to disable it later)
- Do nothing for now
- Both GitHub Pages and Vercel will serve the frontend
- Disable GitHub Pages after 1-2 weeks of Vercel stability

**Option B: Disable GitHub Pages Now**
1. Go to GitHub repo → **Settings** → **Pages**
2. Set "Source" to **None**
3. Click **Save**

The workflow will still run backend operations (migrations + edge functions).

### 5.2 Verify GitHub Secrets Exist

Go to GitHub repo → **Settings** → **Secrets and variables** → **Actions**

Required secrets (should already exist):
- ✅ `SUPABASE_ACCESS_TOKEN`
- ✅ `SUPABASE_DB_PASSWORD`
- ✅ `SUPABASE_PROJECT_ID`
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_ANON_KEY`

If any are missing, add them with values from Supabase dashboard.

---

## Step 6: Ongoing Workflow (Daily Development)

### Making Code Changes

```bash
# 1. Make changes locally
git add .
git commit -m "feat: add new feature"
git push origin main
```

**What happens automatically:**
- ✅ Vercel detects push to `main`
- ✅ Vercel rebuilds and deploys frontend (~2 min)
- ✅ GitHub Actions deploys backend (migrations + functions)
- ✅ Changes live at your Vercel URL

### Database Migrations

```bash
# 1. Create migration
npx supabase migration new add_new_feature

# 2. Write SQL in supabase/migrations/[timestamp]_add_new_feature.sql

# 3. Test locally
npx supabase db reset

# 4. Commit and push
git add .
git commit -m "feat: add new database schema"
git push origin main
```

**What happens:**
- ✅ GitHub Actions runs `npx supabase db push`
- ✅ Migration applies to your Supabase database
- ✅ Both dev and Vercel use updated schema

---

## Troubleshooting

### Issue: "Failed to fetch" / CORS Error

**Symptom:** Browser console shows:
```
Access to fetch at 'https://aaqnanddcqvfiwhshndl.supabase.co/functions/v1/users'
has been blocked by CORS policy
```

**Fix:**
```bash
# Verify ALLOWED_ORIGINS includes your Vercel URL
npx supabase secrets list

# If missing, set it:
npx supabase secrets set ALLOWED_ORIGINS="http://localhost:5173,https://[your-vercel-url].vercel.app"
npx supabase functions deploy
```

### Issue: "Invalid credentials" / 401 Errors

**Symptom:** Can't log in, all API calls fail with 401.

**Check:**
1. Environment variables in Vercel dashboard match `.env.development`
2. Auth callback URL in Supabase includes Vercel URL
3. Redeploy Vercel if env vars were updated

### Issue: Build Fails on Vercel

**Symptom:** Vercel deployment shows "Build Failed"

**Check:**
1. Build logs in Vercel dashboard
2. Verify `npm run build` works locally
3. Check TypeScript errors
4. Ensure all dependencies in `package.json`

### Issue: Edge Functions Don't Work

**Symptom:** Password reset, user management features fail

**Check:**
```bash
# Verify functions are deployed
npx supabase functions list

# Check function logs
npx supabase functions logs users --project-ref aaqnanddcqvfiwhshndl

# Redeploy if needed
npx supabase functions deploy
```

---

## Success Criteria ✅

Your deployment is successful when:

- ✅ Vercel URL loads the application
- ✅ Can log in and navigate the CRM
- ✅ No CORS errors in browser console
- ✅ Edge functions work (password reset, user management)
- ✅ GitHub pushes auto-deploy to Vercel
- ✅ Database migrations apply automatically

---

## What's Next?

After 1-2 weeks of stable Vercel deployments:

1. **Disable GitHub Pages** (if still running)
   - Go to repo Settings → Pages
   - Set source to "None"

2. **Custom Domain** (optional)
   - Buy domain (e.g., `atomic-crm.com`)
   - Add to Vercel: Project Settings → Domains
   - Update CORS: Add domain to `ALLOWED_ORIGINS`

3. **Monitoring**
   - Review Vercel Analytics
   - Check Supabase Dashboard for usage
   - Monitor edge function logs

4. **Production Hardening** (when you have real users)
   - Create separate production Supabase project
   - Add staging environment
   - Implement error tracking (Sentry)
   - Set up backups and disaster recovery

---

## Timeline Summary

**Total Time: ~20 minutes**

- Step 1: Connect Vercel (5 min)
- Step 2: Configure CORS (2 min)
- Step 3: Update Supabase Auth (2 min)
- Step 4: Test deployment (5 min)
- Step 5: Configure GitHub Actions (5 min)
- Step 6: Make first change (1 min)

**You're ready to deploy!** 🚀
