# Sentry Setup Guide for Crispy CRM

## Overview

Sentry is now integrated into Crispy CRM for error tracking, performance monitoring, and session replay. This guide will help you configure Sentry for your production environment.

## Why Sentry?

**Advantages:**
- ✅ **Cost-effective**: 50K errors/month FREE, then $26/month for 100K errors
- ✅ **No usage-based pricing**: Unlike New Relic, you pay per error not per GB of data
- ✅ **Session replay included**: See exactly what users did before an error
- ✅ **Excellent React integration**: Automatic component stack traces
- ✅ **Source map support**: See original TypeScript code in stack traces
- ✅ **Simple CSP setup**: No additional CSP changes required

**Free Tier Limits:**
- 50,000 errors per month
- Unlimited projects
- 1 user seat
- Session replay (limited sessions)
- Performance monitoring

## Setup Steps

### 1. Create Sentry Account

1. Go to [https://sentry.io/signup/](https://sentry.io/signup/)
2. Sign up with your email or GitHub account
3. Choose "Create a new project"
4. Select **React** as the platform
5. Name your project (e.g., "crispy-crm-production")

### 2. Get Your DSN

After creating the project:

1. Navigate to **Settings** → **Projects** → **[Your Project]**
2. Go to **Client Keys (DSN)**
3. Copy the DSN (looks like: `https://abc123@o123456.ingest.sentry.io/456789`)

### 3. Configure Environment Variables

#### For Vercel (Production):

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add these variables for **Production** environment:

```
VITE_SENTRY_DSN=https://your-dsn-here@o123456.ingest.sentry.io/456789
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=crispy-crm-production
SENTRY_AUTH_TOKEN=your-auth-token-here
```

**To get your Sentry Auth Token:**
1. Go to Sentry: **Settings** → **Auth Tokens**
2. Click **Create New Token**
3. Select scopes: `project:read`, `project:releases`, `org:read`
4. Copy the token (you'll only see it once!)

#### For Local Development:

Create or update `.env.local`:

```env
# Optional - only if you want to test Sentry locally
VITE_SENTRY_DSN=https://your-dsn-here@o123456.ingest.sentry.io/456789
VITE_SENTRY_DEV_ENABLED=false  # Set to true to enable in dev

# Not needed for local development
# SENTRY_ORG=
# SENTRY_PROJECT=
# SENTRY_AUTH_TOKEN=
```

### 4. Deploy to Production

```bash
git add .
git commit -m "feat: add Sentry error monitoring"
git push
```

Vercel will automatically:
1. Build the app with source maps
2. Upload source maps to Sentry (if `SENTRY_AUTH_TOKEN` is configured)
3. Enable error tracking in production

### 5. Verify Integration

1. Wait for deployment to complete (~2 minutes)
2. Visit your production site
3. Trigger a test error (see "Testing" section below)
4. Check Sentry dashboard: [https://sentry.io/organizations/[your-org]/issues/](https://sentry.io/)
5. You should see the error appear within 1-2 minutes

## Testing Sentry

### Test Error Tracking

Add a test button to any page:

```typescript
<button onClick={() => {
  throw new Error("Sentry test error - please ignore");
}}>
  Test Sentry
</button>
```

Or use the browser console:

```javascript
throw new Error("Sentry test error");
```

### Test Error Boundary

To test the React ErrorBoundary, add this to any component:

```typescript
<button onClick={() => {
  // This will be caught by Sentry.ErrorBoundary
  throw new Error("Error boundary test");
}}>
  Test Error Boundary
</button>
```

## What Gets Tracked

### Automatically Tracked:
- ✅ Uncaught JavaScript exceptions
- ✅ React component errors (via ErrorBoundary)
- ✅ Unhandled promise rejections
- ✅ Page load performance (10% sampling in production)
- ✅ Navigation performance
- ✅ Session replays (10% normal, 100% on error)

### Not Tracked:
- ❌ Expected errors (e.g., 404s, validation errors)
- ❌ Console.log messages
- ❌ Handled errors (unless you manually capture them)

### Manually Capture Errors

To capture expected errors that need tracking:

```typescript
import * as Sentry from "@sentry/react";

try {
  // Risky operation
  await saveToDatabase(data);
} catch (error) {
  // Log to Sentry with context
  Sentry.captureException(error, {
    tags: {
      section: "database",
      operation: "save"
    },
    extra: {
      dataId: data.id,
      userId: currentUser.id
    }
  });

  // Show user-friendly error
  notify("Failed to save data", { type: "error" });
}
```

## Features Enabled

### 1. Error Tracking
- Component stack traces show which React component threw the error
- Source maps decode minified code to original TypeScript
- User context (if logged in) attached to errors
- Browser and OS information included

### 2. Performance Monitoring
- **Production**: 10% of page loads tracked (cost control)
- **Development**: 100% tracking (full visibility)
- Tracks: Initial page load, route changes, API calls

### 3. Session Replay
- **Normal sessions**: 10% recorded
- **Sessions with errors**: 100% recorded
- Privacy: Text is NOT masked by default (adjust in `main.tsx` if needed)

## Privacy & Security

### Source Maps
- ✅ Source maps use "hidden" mode (not exposed to users)
- ✅ Uploaded to Sentry during build via `SENTRY_AUTH_TOKEN`
- ✅ Original TypeScript code visible only in Sentry dashboard

### User Privacy
By default:
- User IDs are tracked (helps identify affected users)
- User emails are NOT automatically tracked
- Session replay captures all text and inputs

To increase privacy, edit `src/main.tsx`:

```typescript
Sentry.replayIntegration({
  maskAllText: true,        // Hide all text content
  blockAllMedia: true,      // Hide images and videos
})
```

## Cost Management

### Free Tier (50K errors/month)
For most MVPs, this is sufficient. Typical usage:
- Well-built app: 100-500 errors/month
- App with bugs: 1,000-5,000 errors/month
- 50K limit = ~1,600 errors/day

### Paid Tier
If you exceed 50K errors:
- **100K errors/month**: $26/month
- **500K errors/month**: $67/month

**Cost-saving tips:**
1. Fix errors promptly (fewer repeats)
2. Use `beforeSend` hook to filter non-critical errors
3. Set up alert rules to catch spikes early

### Filtering Errors

To reduce noise, add to `src/main.tsx`:

```typescript
Sentry.init({
  // ... existing config
  beforeSend(event, hint) {
    // Don't send certain errors
    const error = hint.originalException;
    if (error instanceof TypeError && error.message.includes("NetworkError")) {
      return null; // Drop this event
    }
    return event;
  },
});
```

## Troubleshooting

### No errors appearing in Sentry

1. **Check DSN is configured**:
   - Verify `VITE_SENTRY_DSN` is set in Vercel environment variables
   - Check deployment logs for "Sentry initialized" message

2. **Trigger a test error**:
   ```javascript
   throw new Error("Sentry test");
   ```

3. **Check Sentry project is active**:
   - Go to Sentry dashboard
   - Ensure project is not paused or archived

### Source maps not working

1. **Verify auth token has correct permissions**:
   - `project:read`, `project:releases`, `org:read`

2. **Check build logs**:
   - Look for "Uploading source maps to Sentry"
   - Ensure no authentication errors

3. **Verify source maps are generated**:
   ```bash
   ls dist/**/*.map
   ```
   Should show `.js.map` files

### Performance data missing

Performance monitoring is sampled:
- **Production**: Only 10% of page loads tracked
- **Development**: 100% tracked

To see data faster in production, temporarily increase `tracesSampleRate` to 1.0 in `main.tsx`.

## Monitoring Dashboard

### Key Metrics to Watch

1. **Error Rate**: Errors per session
   - Target: <1% of sessions with errors
   - Alert if: >5% of sessions

2. **Most Common Errors**: Top 10 errors by count
   - Fix high-frequency errors first
   - One error can repeat thousands of times

3. **Performance**:
   - Page Load Time: Target <2s
   - Time to First Byte (TTFB): Target <600ms

### Setting Up Alerts

1. Go to **Alerts** → **Create Alert**
2. Choose trigger:
   - "Issue frequency is above X in Y minutes"
   - Recommended: >50 errors in 1 hour
3. Set notification: Email or Slack
4. Save alert rule

## Next Steps

1. ✅ Deploy to production
2. ⏳ Wait for first errors (hopefully none!)
3. ⏳ Review Sentry dashboard weekly
4. ⏳ Set up Slack notifications for critical errors
5. ⏳ Create alert for error spikes (>50/hour)

## Documentation

- [Sentry React SDK](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Session Replay](https://docs.sentry.io/product/session-replay/)
- [Source Maps](https://docs.sentry.io/platforms/javascript/sourcemaps/)

## Support

**Questions?** Check:
1. [Sentry Documentation](https://docs.sentry.io/)
2. [Sentry Community Forum](https://forum.sentry.io/)
3. [GitHub Issues](https://github.com/getsentry/sentry-javascript/issues)

---

**Implementation completed**: 2025-12-01
**Cost estimate**: $0-26/month (depending on error volume)
**Setup time**: ~15 minutes
