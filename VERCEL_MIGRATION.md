# Vercel Migration Checklist

**Last Deployment:** 2025-10-06

## ✅ Changes Already Applied

- [x] Updated `base: "/"` in vite.config.ts (was `"./"` for GitHub Pages)
- [x] Updated vercel.json rewrites: `/api/` → `/assets/`
- [x] Updated vercel.json cache headers: `/static/` → `/assets/`
- [x] Added explicit build commands to vercel.json

## 🚀 Deployment Steps

### Step 1: Create Vercel Account & Link Project

1. Go to [vercel.com](https://vercel.com) and sign up
2. Click "Add New Project" → "Import Git Repository"
3. Select your GitHub repository
4. Vercel auto-detects Vite framework ✓

### Step 2: Configure Environment Variables (CRITICAL)

In Vercel Dashboard → Settings → Environment Variables, add:

```
VITE_SUPABASE_URL = https://yourproject.supabase.co
VITE_SUPABASE_ANON_KEY = eyJ... (your anon key)
VITE_IS_DEMO = false
```

**Important:** Add these for ALL environments:
- ✓ Production
- ✓ Preview
- ✓ Development

### Step 3: Deploy to Preview First (Test Branch)

```bash
# Create a test branch
git checkout -b vercel-migration-test

# Make a small change (add a comment somewhere)
# Commit and push
git add .
git commit -m "test: vercel preview deployment"
git push origin vercel-migration-test
```

Vercel will automatically build and give you a preview URL like:
`https://atomic-abc123.vercel.app`

### Step 4: Test Everything on Preview URL

**Critical Tests:**
- [ ] Homepage loads correctly
- [ ] All routes work (no 404s when navigating)
- [ ] Login/authentication works
- [ ] Data loads from Supabase
- [ ] File uploads work (if applicable)
- [ ] All forms submit correctly
- [ ] No console errors

**Performance Check:**
- [ ] Run Lighthouse (should be >90)
- [ ] Check bundle sizes in Vercel dashboard

### Step 5: Update Supabase Settings

Go to Supabase Dashboard → Settings → Authentication → Site URL

Add your Vercel URLs:
```
Production: https://your-app.vercel.app
Preview: https://atomic-*.vercel.app (wildcard for all previews)
```

This is required for:
- Email confirmation links
- Password reset links
- OAuth redirects

### Step 6: Deploy to Production

Once preview looks good:

```bash
# Merge to main
git checkout main
git merge vercel-migration-test
git push origin main
```

Vercel automatically deploys main branch to production!

### Step 7: Stop Using Old Deployment

Update your workflow:
- ❌ Stop running `npm run prod:deploy`
- ✓ Just push to GitHub
- ✓ Supabase still auto-deploys via GitHub Actions (keep this!)

## 🔧 Optional Optimization (Recommended After Testing)

After your preview deployment is working, consider simplifying your build config:

### Current (Complex, 9 chunks):
```typescript
// 9 manual chunks + Terser minification
// Built for GitHub Pages optimization
```

### Recommended (Simple, 3 chunks):
```typescript
// 3 strategic chunks + esbuild
// Let Vercel's infrastructure handle optimization
```

**Why simplify:**
- Faster builds (esbuild is 10-100x faster)
- Vercel's compression makes Terser less necessary
- Easier to maintain

**How to test:**
1. Simplify chunks in vite.config.ts
2. Deploy to preview branch
3. Compare Lighthouse scores
4. If performance is similar, keep simple version

## 🚨 Troubleshooting

### Issue: "404 on all routes"
**Cause:** Base path still set to `"./"` (should be `"/"`)
**Fix:** Already fixed in vite.config.ts:221

### Issue: "Cannot connect to Supabase"
**Cause:** Environment variables not set in Vercel
**Fix:** Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in dashboard

### Issue: "CSP violations blocking features"
**Cause:** CSP is in Report-Only mode (safe)
**Action:** Keep it this way initially. Only enforce after thorough testing.

### Issue: "Slow build times"
**Cause:** Terser minification + complex chunking
**Fix:** Simplify to 3 chunks + esbuild (optional optimization)

## 📊 What to Monitor After Migration

**First 24 Hours:**
- [ ] Check Vercel logs for errors
- [ ] Monitor user reports
- [ ] Compare performance metrics (before/after)
- [ ] Verify CSP reports (should be empty)

**First Week:**
- [ ] Review Vercel Analytics
- [ ] Check build times (should be faster)
- [ ] Confirm preview deployments work for team

## 🎯 Success Criteria

You'll know migration succeeded when:
- ✅ Push to main auto-deploys (no manual commands)
- ✅ Preview branches work for testing
- ✅ Performance is same or better (Lighthouse >90)
- ✅ No console errors in production
- ✅ All features work identically to GitHub Pages

## 📝 Notes

- Backend (Supabase) still deploys via GitHub Actions - this is correct!
- You now have dual CI/CD: Vercel (frontend) + GitHub Actions (backend)
- Vercel preview deployments test frontend changes before production
- Keep CSP in Report-Only mode until you've tested everything thoroughly

## 🆘 Need Help?

- Vercel Docs: https://vercel.com/docs
- Vercel Support: https://vercel.com/help
- Check build logs in Vercel dashboard for errors
