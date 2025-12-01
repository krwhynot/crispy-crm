# Testing Sentry Integration

## Quick Test (Browser Console)

1. **Open your production site**: https://crispy-crm.vercel.app
2. **Open browser console**: Press `F12` or `Cmd+Option+J` (Mac) / `Ctrl+Shift+J` (Windows)
3. **Paste this code and press Enter**:
   ```javascript
   throw new Error("Sentry test error - ignore this");
   ```
4. **Check Sentry dashboard** (https://sentry.io/): Error should appear within 1-2 minutes

## What You Should See in Sentry

### Error Details:
- **Error Message**: "Sentry test error - ignore this"
- **Browser**: Your browser name and version
- **OS**: Your operating system
- **URL**: https://crispy-crm.vercel.app/
- **User ID**: (if you're logged in)

### Stack Trace:
If source maps uploaded correctly, you'll see:
- ✅ Original file names (like `main.tsx`)
- ✅ Original line numbers
- ✅ TypeScript code snippets

If source maps didn't upload, you'll see:
- ❌ Minified file names (like `index-31-fa7xe.js`)
- ❌ Obfuscated code

## Testing Error Boundary

To test that React errors are caught:

1. **Add a test button** to any page temporarily
2. **Throw an error from a component**:
   ```typescript
   <button onClick={() => {
     throw new Error("Error boundary test");
   }}>
     Test Error Boundary
   </button>
   ```
3. **Click the button**
4. **You should see**:
   - Sentry's user dialog asking for feedback
   - Your custom fallback UI (white screen with "Something went wrong")
   - Error logged to Sentry with full React component stack

## Verifying Configuration

Check that all 4 environment variables are set in Vercel:

1. ✅ `VITE_SENTRY_DSN` - Required for error tracking
2. ✅ `SENTRY_ORG` - Required for source map upload
3. ✅ `SENTRY_PROJECT` - Required for source map upload
4. ✅ `SENTRY_AUTH_TOKEN` - Required for source map upload

**Check in Vercel**:
- Go to Settings → Environment Variables
- All 4 should be listed under "Production"

## Checking Source Map Upload

**In your next deployment**, look for this in Vercel build logs:

```
Sentry Vite Plugin
> Uploading source maps...
> Source maps uploaded successfully!
```

If you see errors about authentication or permissions, the `SENTRY_AUTH_TOKEN` might have insufficient scopes.

## Expected Behavior

### ✅ Working Correctly:
- Errors appear in Sentry dashboard within 2 minutes
- Source maps show original TypeScript code
- User context attached (if logged in)
- Browser and environment info captured

### ❌ Not Working:
- No errors appearing → Check `VITE_SENTRY_DSN` is set correctly
- Minified stack traces → Check `SENTRY_AUTH_TOKEN` has `project:releases` scope
- Auth errors in build logs → Regenerate token with correct scopes

## Next Steps After Testing

1. **Resolve the test error** in Sentry (mark as resolved)
2. **Set up alerts**: Settings → Alerts → Create Alert Rule
   - Recommended: Alert when >50 errors in 1 hour
3. **Integrate with Slack** (optional): Settings → Integrations → Slack
4. **Review weekly**: Check dashboard for patterns and fix recurring errors

---

**Need help?** Check `docs/monitoring/SENTRY_SETUP.md` for troubleshooting.
