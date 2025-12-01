# New Relic Setup Guide for Crispy CRM

## Overview

Based on comprehensive research from Perplexity AI, this document outlines the setup process for New Relic Browser monitoring for our React + Vite + TypeScript application deployed on Vercel.

## Why New Relic?

**Pros:**
- **Full-stack observability** - Unified platform for frontend, backend, and infrastructure
- **Excellent SPA monitoring** - Automatic soft navigation detection for React Router
- **Vercel integration** - Seamless deployment integration
- **Source map support** - Excellent TypeScript debugging with source maps
- **Enterprise-ready** - Mature platform with comprehensive features

**Cons:**
- **Cost at scale** - Usage-based pricing can get expensive
- **CSP requirements** - Needs `unsafe-inline` or nonce-based exceptions
- **Complexity** - More features means more configuration

## Alternatives Considered

### Sentry (Recommended Alternative)
- **Best for:** Error tracking and developer experience
- **Pros:** 50K errors/month free, excellent React integration, self-hostable
- **Cons:** Session replay is newer, less comprehensive than LogRocket
- **Cost:** Error-based pricing ($26/month for 100K errors)

### LogRocket
- **Best for:** Session replay and user behavior analysis
- **Pros:** Industry-leading session replay, captures full context
- **Cons:** Expensive at scale, requires careful privacy configuration
- **Cost:** Session-based pricing (1K sessions/month free)

## Decision Framework

Choose **Sentry** if:
- Error tracking is your primary need
- You want generous free tier
- You value developer experience
- You don't need full backend monitoring

Choose **LogRocket** if:
- You need detailed session replay
- Understanding user behavior is critical
- Product/UX insights are as important as technical issues

Choose **New Relic** if:
- Already using New Relic for backend monitoring
- Need unified full-stack observability
- Comprehensive SPA monitoring required
- Prefer single vendor for all observability

## New Relic Setup Steps

### 1. Create New Relic Account and Browser App

1. Sign up at https://newrelic.com
2. Navigate to **Add Data** → **Browser monitoring**
3. Select **Copy/Paste** method
4. Name your application (e.g., "Crispy CRM Production")
5. Save the generated configuration values

### 2. Install NPM Package

```bash
npm install @newrelic/browser-agent
```

### 3. Configure Environment Variables

Add to `.env.production`:
```env
VITE_NEWRELIC_ENABLED=true
VITE_NEWRELIC_APP_ID=your_app_id_here
VITE_NEWRELIC_LICENSE_KEY=your_license_key_here
```

Add to Vercel Environment Variables (https://vercel.com/dashboard):
```
VITE_NEWRELIC_ENABLED=true (Production)
VITE_NEWRELIC_APP_ID=your_app_id (Production + Preview)
VITE_NEWRELIC_LICENSE_KEY=your_license_key (Production only)
```

### 4. Initialize Browser Agent

Update `src/main.tsx`:

```typescript
import { BrowserAgent } from '@newrelic/browser-agent/loaders/browser-agent'

// Only initialize in production
const newRelicEnabled = import.meta.env.VITE_NEWRELIC_ENABLED === 'true'

if (newRelicEnabled) {
  const options = {
    init: {
      distributed_tracing: { enabled: true },
      privacy: { cookies_enabled: true },
      ajax: { deny_list: [] }
    },
    info: {
      beacon: "bam.nr-data.net",
      errorBeacon: "bam.nr-data.net",
      licenseKey: import.meta.env.VITE_NEWRELIC_LICENSE_KEY,
      applicationID: import.meta.env.VITE_NEWRELIC_APP_ID,
      sa: 1
    },
    loader_config: {
      accountID: import.meta.env.VITE_NEWRELIC_ACCOUNT_ID,
      trustKey: import.meta.env.VITE_NEWRELIC_ACCOUNT_ID,
      agentID: import.meta.env.VITE_NEWRELIC_APP_ID,
      licenseKey: import.meta.env.VITE_NEWRELIC_LICENSE_KEY,
      applicationID: import.meta.env.VITE_NEWRELIC_APP_ID
    }
  }

  new BrowserAgent(options)
}

// Rest of React application
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

### 5. Update CSP Headers

Update `vite.config.ts` (already done):
```typescript
// Production CSP already includes wasm-unsafe-eval for Vite dynamic imports
"script-src 'self' 'wasm-unsafe-eval' https://js-agent.newrelic.com; " +
"connect-src 'self' https://*.supabase.co https://bam.nr-data.net https://*.nr-data.net; "
```

Update `vercel.json` (if using enforcing CSP):
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "script-src 'self' 'wasm-unsafe-eval' https://js-agent.newrelic.com; connect-src 'self' https://*.supabase.co https://bam.nr-data.net https://*.nr-data.net;"
        }
      ]
    }
  ]
}
```

### 6. Configure Source Maps (Optional but Recommended)

Install source map uploader:
```bash
npm install --save-dev @newrelic/publish-sourcemap
```

Add to `package.json`:
```json
{
  "scripts": {
    "build": "vite build",
    "build:prod": "vite build && npm run upload-sourcemaps",
    "upload-sourcemaps": "publish-sourcemap dist/**/*.js.map --applicationId=$VITE_NEWRELIC_APP_ID --apiKey=$NEWRELIC_USER_API_KEY"
  }
}
```

Update `vercel.json`:
```json
{
  "buildCommand": "npm run build:prod"
}
```

### 7. Add React Error Boundary Integration

Create `src/components/monitoring/ErrorBoundary.tsx`:

```typescript
import React from 'react'

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Report error to New Relic
    if (window.newrelic) {
      window.newrelic.noticeError(error, {
        errorBoundary: true,
        componentStack: errorInfo.componentStack
      })
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
            <p className="text-muted-foreground mb-4">
              We've been notified and are looking into it.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded"
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
```

Wrap your app in `src/main.tsx`:
```typescript
import ErrorBoundary from './components/monitoring/ErrorBoundary'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
```

### 8. Track Route Changes

Create `src/components/monitoring/RouteTracker.tsx`:

```typescript
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export function RouteTracker() {
  const location = useLocation()

  useEffect(() => {
    if (window.newrelic) {
      const interaction = window.newrelic.interaction()
      interaction.setName(location.pathname)
      interaction.save()
    }
  }, [location.pathname])

  return null
}
```

Add to your app root:
```typescript
import { RouteTracker } from './components/monitoring/RouteTracker'

function App() {
  return (
    <Router>
      <RouteTracker />
      {/* Rest of app */}
    </Router>
  )
}
```

### 9. Monitor Core Web Vitals

Install web-vitals library:
```bash
npm install web-vitals
```

Add to `src/main.tsx`:
```typescript
import { onCLS, onINP, onLCP } from 'web-vitals'

function sendToNewRelic(metric: any) {
  if (window.newrelic) {
    window.newrelic.addPageAction('WebVitals', {
      name: metric.name,
      value: metric.value,
      rating: metric.rating
    })
  }
}

if (import.meta.env.PROD) {
  onCLS(sendToNewRelic)
  onINP(sendToNewRelic)
  onLCP(sendToNewRelic)
}
```

### 10. Deploy and Verify

1. Deploy to Vercel: `git push`
2. Wait 5-15 minutes for data to appear
3. Check New Relic UI: https://one.newrelic.com/
4. Verify data collection:
   - Page views appearing
   - Error tracking working
   - Performance metrics visible
   - Core Web Vitals recorded

## Troubleshooting

### No Data Appearing

1. Check browser console for CSP errors
2. Verify environment variables are set correctly
3. Confirm Application ID and license key are correct
4. Check that `VITE_NEWRELIC_ENABLED=true` in production

### CSP Blocking Agent

Update CSP to include:
```
script-src 'self' 'wasm-unsafe-eval' https://js-agent.newrelic.com
connect-src 'self' https://bam.nr-data.net https://*.nr-data.net
```

### Source Maps Not Working

1. Verify source maps are being generated: Check `dist/**/*.js.map` exists
2. Confirm upload script ran successfully in build logs
3. Check API key has proper permissions
4. Verify Application ID matches your New Relic app

## Cost Estimation

**New Relic Pricing (Standard):**
- 100 GB/month data ingest: $0.30/GB = $30/month
- User seats: $99/user/month (first user free)

**Estimated for Crispy CRM:**
- Browser events: ~10-20 GB/month (moderate traffic)
- Total estimated: $3-6/month (data only)

**Sentry Alternative (More Cost-Effective):**
- 100K errors/month: $26/month
- Includes session replay
- No per-GB charges

## Recommendation

**For Crispy CRM MVP:**
Start with **Sentry** instead of New Relic because:
1. **Cost:** $26/month flat vs. usage-based
2. **Features:** Error tracking + session replay + performance monitoring
3. **Free tier:** 50K errors/month (likely sufficient for MVP)
4. **Setup:** Simpler integration, no CSP conflicts
5. **Developer experience:** Excellent React integration

**Switch to New Relic when:**
- Need unified observability across frontend + backend + infrastructure
- Traffic scales beyond Sentry's pricing sweet spot
- Already using New Relic for other services

## Quick Start with Sentry (Recommended)

```bash
# Install Sentry
npm install @sentry/react @sentry/vite-plugin

# Initialize in src/main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

# Wrap app with ErrorBoundary
<Sentry.ErrorBoundary fallback={<ErrorFallback />}>
  <App />
</Sentry.ErrorBoundary>
```

## References

- [New Relic Browser Monitoring Docs](https://docs.newrelic.com/docs/browser/)
- [Sentry React Integration](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Perplexity Research Report](attached in comments)
- [Vite Environment Variables](https://vite.dev/guide/env-and-mode)
- [CSP for SPAs](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
