# Configure External Monitoring Services Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Set up production monitoring with Sentry (error tracking) and UptimeRobot (uptime monitoring) as required by PRD

**Architecture:** Two external services working together - Sentry captures application errors/performance, UptimeRobot monitors site availability. Both use free tiers suitable for MVP.

**Tech Stack:**
- Sentry: @sentry/react + @sentry/vite-plugin (error tracking, performance monitoring)
- UptimeRobot: External service, no code changes (HTTP(S) monitoring, email alerts)
- Integration: Environment variables, Vite configuration

**Effort:** 3 hours (2 hours Sentry + 1 hour UptimeRobot)
**Priority:** CRITICAL (Pre-launch requirement)
**Current Status:** 0% configured

**PRD Reference:** docs/prd/21-monitoring-deployment.md (lines 17-24, Q14)

---

## Part A: Sentry Setup (2 hours)

### Task 1: Create Sentry Account and Project

**Action:** Set up Sentry.io free tier account

---

#### Step 1: Sign up for Sentry free tier

**Manual action required:**

1. Go to: https://sentry.io/signup/
2. Sign up with work email
3. Choose "React" as platform during onboarding
4. Note your DSN (Data Source Name) - looks like:
   ```
   https://<key>@<org>.ingest.sentry.io/<project-id>
   ```

**Free tier includes:**
- 5,000 events/month
- 1 user
- 30-day data retention
- Basic performance monitoring

---

#### Step 2: Save Sentry DSN to environment variables

**Files:**
- Modify: `.env.example:57` (add VITE_SENTRY_DSN template)
- Modify: `.env.local:30` (add actual DSN for local dev)
- Modify: `.env.cloud:29` (add actual DSN for production)

**File:** `.env.example`

**Add at end:**

```bash
# Sentry Error Tracking
VITE_SENTRY_DSN=https://your-key@your-org.ingest.sentry.io/your-project-id
VITE_SENTRY_ENVIRONMENT=development
```

**File:** `.env.local`

**Add at end:**

```bash
# Sentry Error Tracking (Development)
VITE_SENTRY_DSN=https://ACTUAL-KEY@ACTUAL-ORG.ingest.sentry.io/PROJECT-ID
VITE_SENTRY_ENVIRONMENT=development
```

**File:** `.env.cloud`

**Add at end:**

```bash
# Sentry Error Tracking (Production)
VITE_SENTRY_DSN=https://ACTUAL-KEY@ACTUAL-ORG.ingest.sentry.io/PROJECT-ID
VITE_SENTRY_ENVIRONMENT=production
```

---

### Task 2: Install Sentry Dependencies

---

#### Step 3: Install Sentry packages

**Action:** Add Sentry React and Vite plugin

```bash
npm install --save @sentry/react @sentry/vite-plugin
```

**Expected packages:**
- `@sentry/react`: ^7.x or ^8.x (React SDK)
- `@sentry/vite-plugin`: ^2.x (Source maps upload)

---

#### Step 4: Verify installation

```bash
npm list @sentry/react @sentry/vite-plugin
```

**Expected:**
```
├── @sentry/react@8.x.x
└── @sentry/vite-plugin@2.x.x
```

---

### Task 3: Configure Sentry in Vite

---

#### Step 5: Add Sentry plugin to Vite config

**File:** `vite.config.ts`

**Read current config:**

```bash
head -50 vite.config.ts
```

**Find imports section (around line 1-10):**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
```

**Add Sentry import:**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import path from 'path'
```

**Find plugins array (around line 150-160):**

```typescript
plugins: [
  react(),
  // ... other plugins
],
```

**Add Sentry plugin (only for production builds):**

```typescript
plugins: [
  react(),
  // ... other plugins

  // Sentry source maps upload (production only)
  process.env.NODE_ENV === 'production' && sentryVitePlugin({
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    authToken: process.env.SENTRY_AUTH_TOKEN,
    sourcemaps: {
      assets: './dist/**',
    },
    telemetry: false,
  }),
].filter(Boolean),
```

---

#### Step 6: Add Sentry environment variables for build

**File:** `.env.cloud`

**Add at end:**

```bash
# Sentry Build Configuration
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=your-project-slug
SENTRY_AUTH_TOKEN=your-auth-token
```

**To get auth token:**
1. Go to: https://sentry.io/settings/account/api/auth-tokens/
2. Create new token with `project:releases` and `project:write` scopes
3. Copy token (only shown once!)

---

### Task 4: Initialize Sentry in Application

---

#### Step 7: Create Sentry initialization file

**File:** `src/lib/monitoring/sentry.ts` (new file)

**Create complete file:**

```typescript
import * as Sentry from '@sentry/react'

/**
 * Initialize Sentry error tracking and performance monitoring
 *
 * Environment variables required:
 * - VITE_SENTRY_DSN: Sentry project DSN
 * - VITE_SENTRY_ENVIRONMENT: 'development' | 'production'
 */
export function initializeSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  const environment = import.meta.env.VITE_SENTRY_ENVIRONMENT || 'development'

  if (!dsn) {
    console.warn('[Sentry] DSN not configured, error tracking disabled')
    return
  }

  Sentry.init({
    dsn,
    environment,

    // Performance Monitoring
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0, // 10% in prod, 100% in dev

    // Session Replay (optional, uses extra quota)
    replaysSessionSampleRate: 0.0, // Disabled for free tier
    replaysOnErrorSampleRate: 0.0, // Disabled for free tier

    // Integrations
    integrations: [
      Sentry.browserTracingIntegration({
        // Trace React Router navigation
        routingInstrumentation: Sentry.reactRouterV6Instrumentation(
          (window as any).React,
          (window as any).ReactRouterDOM,
        ),
      }),
      Sentry.browserProfilingIntegration(),
    ],

    // Before send hook - sanitize sensitive data
    beforeSend(event, hint) {
      // Remove sensitive data from error reports
      if (event.request) {
        delete event.request.cookies
        delete event.request.headers
      }

      // Filter out known non-critical errors
      const error = hint.originalException
      if (error && typeof error === 'object' && 'message' in error) {
        const message = (error as Error).message

        // Ignore React Admin expected errors
        if (message.includes('ra.navigation')) return null
        if (message.includes('ra.auth')) return null

        // Ignore network timeouts (handled by app)
        if (message.includes('timeout')) return null
      }

      return event
    },
  })

  console.log(`[Sentry] Initialized in ${environment} mode`)
}

/**
 * Manually capture exception with additional context
 */
export function captureException(error: Error, context?: Record<string, any>): void {
  Sentry.captureException(error, {
    extra: context,
  })
}

/**
 * Add user context to Sentry events
 */
export function setUser(user: { id: string; email?: string; username?: string } | null): void {
  Sentry.setUser(user)
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(message: string, category: string, data?: Record<string, any>): void {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  })
}
```

---

#### Step 8: Integrate Sentry in main.tsx

**File:** `src/main.tsx`

**Current content:**

```typescript
import { createRoot } from 'react-dom/client'
import { initializePerformanceMonitoring } from './lib/monitoring/performance'
import './index.css'
import App from './App.tsx'

// Initialize performance monitoring
initializePerformanceMonitoring()

createRoot(document.getElementById('root')!).render(<App />)
```

**Update to add Sentry:**

```typescript
import { createRoot } from 'react-dom/client'
import { initializePerformanceMonitoring } from './lib/monitoring/performance'
import { initializeSentry } from './lib/monitoring/sentry'
import './index.css'
import App from './App.tsx'

// Initialize monitoring (Sentry first for early error capture)
initializeSentry()
initializePerformanceMonitoring()

createRoot(document.getElementById('root')!).render(<App />)
```

---

#### Step 9: Wrap App with Sentry ErrorBoundary

**File:** `src/App.tsx`

**Read current structure:**

```bash
head -30 src/App.tsx
```

**Add Sentry import at top:**

```typescript
import * as Sentry from '@sentry/react'
// ... other imports
```

**Wrap the app export with ErrorBoundary:**

**Before:**
```typescript
export default function App() {
  return (
    <BrowserRouter>
      {/* ... app content */}
    </BrowserRouter>
  )
}
```

**After:**
```typescript
function App() {
  return (
    <BrowserRouter>
      {/* ... app content */}
    </BrowserRouter>
  )
}

export default Sentry.withErrorBoundary(App, {
  fallback: ({ error, resetError }) => (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Something went wrong</h1>
      <p>{error.message}</p>
      <button onClick={resetError}>Try again</button>
    </div>
  ),
  showDialog: false,
})
```

---

### Task 5: Test Sentry Integration

---

#### Step 10: Create test error component

**File:** `src/components/SentryTestButton.tsx` (new file, temporary)

```typescript
export function SentryTestButton() {
  const triggerError = () => {
    throw new Error('Sentry test error - this is intentional')
  }

  return (
    <button
      onClick={triggerError}
      style={{
        position: 'fixed',
        bottom: '1rem',
        right: '1rem',
        padding: '0.5rem 1rem',
        background: '#red',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        zIndex: 9999,
      }}
    >
      Test Sentry Error
    </button>
  )
}
```

---

#### Step 11: Add test button to App (temporarily)

**File:** `src/App.tsx`

**Add import:**
```typescript
import { SentryTestButton } from './components/SentryTestButton'
```

**Add button to render:**
```typescript
<BrowserRouter>
  {/* ... existing content */}
  {import.meta.env.DEV && <SentryTestButton />}
</BrowserRouter>
```

---

#### Step 12: Verify Sentry is capturing errors

**Action:** Test error reporting

```bash
npm run dev
```

**In browser:**
1. Click "Test Sentry Error" button (bottom-right)
2. Error should be caught by ErrorBoundary
3. Go to Sentry dashboard: https://sentry.io/
4. Navigate to Issues → should see test error within 30 seconds

**Expected in Sentry:**
- Error: "Sentry test error - this is intentional"
- Stack trace showing SentryTestButton.tsx
- Browser info, OS, user agent
- Source maps (if uploaded)

---

#### Step 13: Remove test button after verification

**File:** `src/App.tsx`

**Remove:**
- Import: `import { SentryTestButton } from './components/SentryTestButton'`
- Component: `{import.meta.env.DEV && <SentryTestButton />}`

**Delete file:**
```bash
rm src/components/SentryTestButton.tsx
```

---

### Task 6: Commit Sentry Integration

---

#### Step 14: Commit all Sentry changes

```bash
git add package.json package-lock.json
git add vite.config.ts
git add src/lib/monitoring/sentry.ts
git add src/main.tsx src/App.tsx
git add .env.example .env.local .env.cloud

git commit -m "feat: integrate Sentry error tracking and performance monitoring

- Install @sentry/react and @sentry/vite-plugin
- Create sentry.ts initialization module
- Add Sentry DSN to environment variables
- Initialize Sentry before app render in main.tsx
- Wrap App with Sentry ErrorBoundary for graceful error handling
- Configure source maps upload for production builds
- Add beforeSend hook to sanitize sensitive data
- Set tracesSampleRate to 10% in production (free tier optimization)

Sentry Free Tier: 5K events/month, 30-day retention

Tested: Error capture working, issues appear in Sentry dashboard

🤖 Generated with Claude Code"
```

---

## Part B: UptimeRobot Setup (1 hour)

### Task 7: Create UptimeRobot Account

---

#### Step 15: Sign up for UptimeRobot free tier

**Manual action required:**

1. Go to: https://uptimerobot.com/signUp
2. Sign up with work email
3. Verify email address

**Free tier includes:**
- 50 monitors
- 5-minute check intervals
- Email alerts
- 30-day logs

---

### Task 8: Configure Production URL Monitor

---

#### Step 16: Add HTTP(S) monitor for production site

**In UptimeRobot dashboard:**

1. Click "+ Add New Monitor"
2. **Monitor Type:** HTTP(s)
3. **Friendly Name:** "Atomic CRM - Production"
4. **URL:** `https://your-production-domain.vercel.app` (replace with actual)
5. **Monitoring Interval:** 5 minutes
6. **Monitor Timeout:** 30 seconds

**Click "Create Monitor"**

---

#### Step 17: Add alert contacts

**In UptimeRobot dashboard:**

1. Go to "My Settings" → "Alert Contacts"
2. Click "+ Add Alert Contact"
3. **Alert Contact Type:** Email
4. **Email:** your-team-email@company.com
5. **Friendly Name:** "Dev Team"
6. Verify email address (check inbox for confirmation)

**Repeat for additional team members**

---

#### Step 18: Configure monitor alerts

**Edit monitor settings:**

1. Go to monitor → "Edit"
2. Scroll to "Alert Contacts To Notify"
3. Select all relevant contacts
4. **Alert When:** Down
5. **Alert After:** 1 check (5 minutes)
6. **Email Alert Options:**
   - ✅ When monitor goes down
   - ✅ When monitor comes back up
   - ✅ Send alerts even during maintenance windows: No

**Save monitor**

---

### Task 9: Add API Endpoint Monitors

---

#### Step 19: Add monitor for Supabase API

**Add new monitor:**

1. **Monitor Type:** HTTP(s)
2. **Friendly Name:** "Atomic CRM - Supabase API"
3. **URL:** `https://aaqnanddcqvfiwhshndl.supabase.co/rest/v1/` (your Supabase API URL)
4. **HTTP Method:** GET
5. **Custom HTTP Headers:**
   ```
   apikey: your-anon-key
   ```
6. **Expected Status Code:** 200

**Create monitor**

---

#### Step 20: Add monitor for authentication endpoint

**Add new monitor:**

1. **Monitor Type:** Keyword
2. **Friendly Name:** "Atomic CRM - Auth Health Check"
3. **URL:** `https://your-production-domain.vercel.app/health` (if you have health endpoint)
4. **Keyword:** "ok" or "healthy"
5. **Keyword Type:** Exists

**Create monitor** (optional if no health endpoint)

---

### Task 10: Document UptimeRobot Configuration

---

#### Step 21: Create monitoring documentation

**File:** `docs/operations/uptime-monitoring.md` (new file)

```markdown
# Uptime Monitoring with UptimeRobot

**Service:** UptimeRobot (https://uptimerobot.com)
**Tier:** Free (50 monitors, 5-minute intervals)
**Alerts:** Email notifications

---

## Configured Monitors

### 1. Atomic CRM - Production (HTTP)

- **URL:** https://your-production-domain.vercel.app
- **Interval:** 5 minutes
- **Timeout:** 30 seconds
- **Alerts:** Down + Recovery

**Purpose:** Monitor main application availability

---

### 2. Atomic CRM - Supabase API (HTTP)

- **URL:** https://aaqnanddcqvfiwhshndl.supabase.co/rest/v1/
- **Interval:** 5 minutes
- **Expected:** HTTP 200

**Purpose:** Monitor database API availability

---

## Alert Contacts

- **Dev Team:** dev-team@company.com
- **On-Call:** (add additional contacts as needed)

---

## Response Procedures

### Application Down Alert

1. Check UptimeRobot dashboard for details
2. Verify site is actually down (not false positive)
3. Check Vercel deployment status: https://vercel.com/dashboard
4. Check Sentry for error spike: https://sentry.io/
5. If Vercel issue: Check build logs
6. If Supabase issue: Check Supabase dashboard status

### API Down Alert

1. Check Supabase dashboard: https://supabase.com/dashboard
2. Verify RLS policies haven't blocked access
3. Check API rate limits
4. Check database connection pool

### Recovery Notification

1. Verify all services are responsive
2. Check Sentry for any lingering errors
3. Review logs for root cause
4. Document incident if >15 minutes downtime

---

## Maintenance Windows

To schedule maintenance:

1. Go to monitor → "Pause Monitoring"
2. Set duration
3. Alerts will be suspended during window
4. Resume monitoring after maintenance

---

## Dashboard Access

**URL:** https://uptimerobot.com/dashboard
**Credentials:** Stored in team password manager

---

## Upgrade Considerations

If we exceed free tier (50 monitors, 5-minute intervals):

**Pro Plan ($7/month):**
- 1-minute check intervals
- SMS alerts
- Advanced notifications
- Webhook integrations

---

**Last Updated:** November 4, 2025
```

---

#### Step 22: Commit documentation

```bash
mkdir -p docs/operations
git add docs/operations/uptime-monitoring.md

git commit -m "docs: add UptimeRobot monitoring configuration

- Document 3 configured monitors (production, API, auth)
- List alert contacts and notification settings
- Add response procedures for downtime incidents
- Document maintenance window process

UptimeRobot Free Tier: 50 monitors, 5-minute intervals, email alerts

🤖 Generated with Claude Code"
```

---

## Verification Checklist

After completing all steps:

**Sentry (Part A):**
- ✅ Sentry account created
- ✅ DSN saved to environment variables
- ✅ @sentry/react and @sentry/vite-plugin installed
- ✅ sentry.ts initialization file created
- ✅ Sentry initialized in main.tsx
- ✅ App wrapped with ErrorBoundary
- ✅ Test error captured successfully
- ✅ Git commit created

**UptimeRobot (Part B):**
- ✅ UptimeRobot account created
- ✅ Production monitor configured
- ✅ API monitor configured
- ✅ Alert contacts added and verified
- ✅ Email notifications configured
- ✅ Documentation created
- ✅ Git commit created

---

## Testing

### Sentry Testing

**1. Trigger test error:**
```typescript
throw new Error('Test error for Sentry')
```

**2. Check Sentry dashboard:**
- Error appears within 30 seconds
- Stack trace is readable
- Source maps working (if uploaded)

**3. Test performance tracking:**
- Navigate between pages
- Check Sentry Performance tab
- Should see route transitions

### UptimeRobot Testing

**1. Verify monitor is active:**
- Green "Up" status in dashboard
- Response time shown (usually <1 second)

**2. Test alert:**
- Pause Vercel deployment temporarily
- Wait 5 minutes for check
- Verify down alert email received
- Resume deployment
- Verify recovery email received

---

## Rollback Procedure

**If Sentry causes issues:**

```bash
# Revert Sentry commits
git revert HEAD~2 HEAD~1 HEAD

# Or uninstall packages
npm uninstall @sentry/react @sentry/vite-plugin
```

**UptimeRobot rollback:**
- Simply pause or delete monitors in dashboard
- No code changes to revert

---

## Cost Analysis

**Sentry Free Tier:**
- 5,000 events/month = ~166 events/day
- Sufficient for MVP with <100 users
- Upgrade to Team ($26/month) when needed

**UptimeRobot Free Tier:**
- 50 monitors = sufficient for MVP
- 5-minute intervals = acceptable for non-critical app
- Upgrade to Pro ($7/month) for 1-minute checks if needed

**Total Monthly Cost:** $0 (free tiers)
**Total Setup Time:** 3 hours

---

## Next Steps

1. **Configure Vercel environment variables** with Sentry DSN
2. **Set up Sentry alerts** for high-priority errors
3. **Create Sentry integration** with Slack (optional)
4. **Add custom performance instrumentation** (future)
5. **Monitor error trends** weekly

---

## References

- **Sentry Docs:** https://docs.sentry.io/platforms/javascript/guides/react/
- **UptimeRobot Docs:** https://uptimerobot.com/api/
- **PRD:** docs/prd/21-monitoring-deployment.md (lines 17-24)

---

**Plan Status:** ✅ Ready for execution
**Estimated Time:** 3 hours (2 Sentry + 1 UptimeRobot)
**Risk:** Low (both services have excellent documentation)
**Impact:** HIGH (production monitoring required before launch)
