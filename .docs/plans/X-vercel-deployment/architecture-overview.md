# Atomic CRM - Deployment Architecture Overview

**Deployment Status**: ✅ Production Ready
**Live URL**: https://crispy-crm.vercel.app
**Deployment Date**: 2025-10-05
**Architecture**: JAMstack (Serverless)

---

## 🏗️ Complete Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         YOUR COMPUTER                                │
│                                                                       │
│  📂 /home/krwhynot/Projects/atomic                                   │
│  ├── src/                        ← React + React Admin + shadcn/ui   │
│  ├── supabase/functions/         ← Edge Functions (deployed)         │
│  │   ├── users/                  ← User management                   │
│  │   └── updatePassword/         ← Password reset                    │
│  └── .env.development            ← Dev config (localhost)            │
│                                                                       │
│  When you run: npm run dev                                           │
│  Connects to: ↓                                                      │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                │ Development Mode
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    🌐 LOCAL DEVELOPMENT                              │
│                                                                       │
│  http://localhost:5173                                               │
│  ├── Frontend running locally                                        │
│  ├── Hot reload enabled                                              │
│  └── Connects to Supabase ──────────────┐                           │
└──────────────────────────────────────────┼───────────────────────────┘
                                           │
                                           │
                ┌──────────────────────────┼──────────────────────────┐
                │                          │                          │
                │         GitHub Push      │                          │
                ↓                          ↓                          ↓
┌───────────────────────────┐  ┌─────────────────────┐  ┌────────────────────┐
│    📦 GITHUB REPO         │  │   ⚡ VERCEL CDN      │  │  🗄️ SUPABASE       │
│                           │  │                      │  │                    │
│  github.com/krwhynot/     │  │  crispy-crm         │  │  aaqnanddcqvfiwhshndl │
│  crispy-crm               │  │  .vercel.app        │  │  .supabase.co      │
│                           │  │                      │  │                    │
│  Branch: main             │  │  ✅ DEPLOYED         │  │  ✅ CONFIGURED     │
│  Commit: f0ce649          │  │                      │  │                    │
│                           │  │  What it serves:     │  │  What it provides: │
│  When you push:           │  │  ├── dist/ folder    │  │  ├── PostgreSQL DB │
│  1. Vercel rebuilds →     │  │  ├── index.html      │  │  ├── Auth (JWT)    │
│  2. GitHub Actions runs → │  │  ├── JS bundles      │  │  ├── Edge Functions│
│                           │  │  └── CSS files       │  │  └── Storage       │
└───────────────────────────┘  └─────────────────────┘  └────────────────────┘
                                           │                          ↑
                                           │                          │
                                           │  API Calls               │
                                           │  (CORS Protected)        │
                                           └──────────────────────────┘
```

---

## 🔄 Request Flow (When User Visits Your App)

```
1. USER VISITS
   └─→ https://crispy-crm.vercel.app
       │
       ↓
2. VERCEL CDN SERVES
   ├─→ HTML (index.html)
   ├─→ JavaScript bundles (React app)
   ├─→ CSS styles (Tailwind)
   └─→ Assets cached (images, fonts)
       │
       ↓
3. BROWSER RUNS REACT APP
   ├─→ User logs in
   │   └─→ Supabase Auth validates credentials
   │       └─→ Returns JWT token
   │
   ├─→ User views contacts
   │   └─→ Supabase REST API (auto-generated)
   │       └─→ Returns data from PostgreSQL
   │
   └─→ User resets password
       └─→ Supabase Edge Function (updatePassword)
           └─→ Sends reset email via Supabase Auth
```

---

## 🔐 Security Configuration

```
┌─────────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                               │
└─────────────────────────────────────────────────────────────────┘

1. CORS PROTECTION (Edge Functions)
   ┌─────────────────────────────────────────┐
   │ ✅ ALLOWED_ORIGINS =                     │
   │    "http://localhost:5173,              │
   │     https://crispy-crm.vercel.app"      │
   │                                          │
   │ ❌ Blocks: evil.com, attacker.com       │
   │ ✅ Allows: Your domains only            │
   └─────────────────────────────────────────┘

2. XSS PROTECTION (Frontend)
   ┌─────────────────────────────────────────┐
   │ ✅ DOMPurify installed (v3.2.7)         │
   │ ✅ HTML sanitization utility ready      │
   │ ❌ No dangerouslySetInnerHTML unsafe    │
   └─────────────────────────────────────────┘

3. AUTH CALLBACK (Supabase)
   ┌─────────────────────────────────────────┐
   │ ✅ Redirect URL configured:             │
   │    https://crispy-crm.vercel.app/       │
   │    auth-callback                        │
   │                                          │
   │ After login → Redirects to Vercel app   │
   └─────────────────────────────────────────┘

4. ENVIRONMENT VARIABLES (Vercel)
   ┌─────────────────────────────────────────┐
   │ VITE_SUPABASE_URL = https://...        │
   │ VITE_SUPABASE_ANON_KEY = eyJ...        │
   │ NODE_ENV = production                   │
   │                                          │
   │ Injected at build time → Secure         │
   └─────────────────────────────────────────┘
```

---

## 📦 Deployment Inventory

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT INVENTORY                          │
└─────────────────────────────────────────────────────────────────┘

VERCEL (crispy-crm.vercel.app)
├── Frontend Assets
│   ├── index.html (SPA entry point)
│   ├── JS bundles (React + dependencies)
│   │   ├── vendor-react.js (React core)
│   │   ├── vendor-supabase.js (Supabase client)
│   │   ├── ui-radix.js (shadcn/ui components)
│   │   └── [50+ more chunks]
│   ├── CSS bundle (Tailwind compiled)
│   └── Static assets (fonts, images)
│
├── Configuration
│   ├── SPA routing (all routes → index.html)
│   ├── Security headers (CSP, HSTS, etc.)
│   └── Asset caching (1 year for /static/*)
│
└── Auto-deploys on: git push to main

───────────────────────────────────────────────────────────────────

SUPABASE (aaqnanddcqvfiwhshndl.supabase.co)
├── Database (PostgreSQL)
│   ├── opportunities table
│   ├── contacts table
│   ├── organizations table
│   ├── tasks table
│   ├── activities table
│   └── [15+ more tables]
│
├── Edge Functions (Deno runtime)
│   ├── users/index.ts
│   │   ├── POST /functions/v1/users (invite user)
│   │   └── PATCH /functions/v1/users (update user)
│   └── updatePassword/index.ts
│       └── PATCH /functions/v1/updatePassword
│
├── Authentication (Supabase Auth)
│   ├── JWT-based sessions
│   ├── Email/password login
│   └── Password reset emails
│
└── Environment Secrets
    ├── ALLOWED_ORIGINS (CORS config)
    ├── DENO_ENV (environment mode)
    └── [Supabase internal keys]

───────────────────────────────────────────────────────────────────

GITHUB ACTIONS (Automated CI/CD)
├── Workflow 1: .github/workflows/check.yml (Quality Gate)
│   ├── Triggers: Push + Pull Requests
│   ├── Jobs: Lint, Test, Build verification
│   └── Node: 22
│
├── Workflow 2: .github/workflows/supabase-deploy.yml (Backend)
│   ├── Triggers: Push to main (supabase/** paths only)
│   ├── Jobs:
│   │   ├── Push DB migrations
│   │   ├── Deploy edge functions
│   │   └── Configure CORS secrets
│   └── Secrets configured:
│       ├── SUPABASE_ACCESS_TOKEN
│       ├── SUPABASE_PROJECT_ID
│       ├── SUPABASE_DB_PASSWORD
│       ├── ALLOWED_ORIGINS
│       └── DENO_ENV
```

---

## 🚀 Developer Workflow

```
┌──────────────────────────────────────────────────────────────────┐
│           DEVELOPER WORKFLOW (Daily Development)                  │
└──────────────────────────────────────────────────────────────────┘

You code locally:
├── Make changes in src/
├── Test with: npm run dev (localhost:5173)
└── Connected to: Supabase (same as production)

You commit & push:
    git add .
    git commit -m "feat: add new feature"
    git push origin main
        │
        ├─→ GITHUB ACTIONS - check.yml (quality gate)
        │   ├── Runs on all pushes
        │   ├── Lint check (ESLint + Prettier)
        │   ├── Test suite (Vitest)
        │   ├── Build verification
        │   └── ✅ Completes in ~2-3 minutes
        │
        ├─→ VERCEL (frontend deployment)
        │   ├── Detects push to main
        │   ├── Runs npm install
        │   ├── Runs npm run build
        │   ├── Deploys to global CDN
        │   └── ✅ Live in ~2 minutes
        │
        └─→ GITHUB ACTIONS - supabase-deploy.yml (backend deployment)
            ├── Only if supabase/** files changed
            ├── Links to Supabase project
            ├── Pushes database migrations
            ├── Sets CORS environment secrets
            ├── Deploys edge functions
            └── ✅ Backend updated in ~1-2 minutes

Result: Your changes are LIVE everywhere with optimized builds!
```

---

## 🎯 Production Summary

```
┌────────────────────────────────────────────────────────────────┐
│                    ATOMIC CRM - PRODUCTION                      │
│                                                                 │
│  🌍 Public URL: https://crispy-crm.vercel.app                  │
│                                                                 │
│  🏗️ Architecture: JAMstack (Serverless)                        │
│     ├── Frontend: React SPA on Vercel CDN (global)            │
│     ├── Backend: Supabase (PostgreSQL + Auth + Functions)     │
│     └── CI/CD: Automatic deployments via GitHub               │
│                                                                 │
│  🔐 Security: Production-ready                                 │
│     ├── CORS allowlist (no wildcard)                          │
│     ├── XSS protection (DOMPurify)                            │
│     ├── HTTPS everywhere (Vercel + Supabase)                  │
│     └── JWT authentication                                     │
│                                                                 │
│  📊 Features:                                                  │
│     ├── Contacts management                                    │
│     ├── Opportunities pipeline                                 │
│     ├── Organizations/companies                                │
│     ├── Tasks & activities                                     │
│     ├── User management                                        │
│     └── Password reset                                         │
│                                                                 │
│  🚀 Deployment: Zero-config                                    │
│     └── Push to main → Live in 2 minutes                      │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## 📝 Technical Stack

### Frontend
- **Framework**: React 19
- **UI Library**: React Admin 5
- **Component Library**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS 4
- **Build Tool**: Vite 7
- **Hosting**: Vercel (Global CDN)

### Backend
- **Database**: PostgreSQL (via Supabase)
- **API**: Auto-generated REST API (Supabase)
- **Authentication**: Supabase Auth (JWT-based)
- **Edge Functions**: Deno runtime (Supabase)
- **Storage**: Supabase Storage

### Development
- **Version Control**: Git + GitHub
- **CI/CD**: GitHub Actions + Vercel
- **Package Manager**: npm
- **TypeScript**: Full type safety

---

## 🔧 Environment Configuration

### Local Development
```bash
# .env.development
VITE_SUPABASE_URL=https://aaqnanddcqvfiwhshndl.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

### Vercel Production
```bash
# Set in Vercel Dashboard
VITE_SUPABASE_URL=https://aaqnanddcqvfiwhshndl.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
NODE_ENV=production
```

### Supabase Secrets
```bash
# Set via: npx supabase secrets set
ALLOWED_ORIGINS=http://localhost:5173,https://crispy-crm.vercel.app
DENO_ENV=development
```

---

## 🎓 Key Architectural Decisions

### 1. Single Supabase Environment
**Decision**: Use one Supabase project for both dev and production
**Rationale**: MVP simplicity - faster deployment, easier management
**Trade-off**: Dev changes affect production (acceptable for MVP)
**Future**: Create separate production Supabase when scaling

### 2. Vercel for Frontend Hosting
**Decision**: Host static SPA on Vercel CDN
**Rationale**: Automatic deployments, global CDN, zero config
**Alternative Considered**: GitHub Pages (already configured)
**Outcome**: Keeping both during transition period

### 3. Supabase Edge Functions for Backend
**Decision**: Use Supabase edge functions instead of Vercel serverless
**Rationale**: Backend already on Supabase, reduces vendor lock-in
**Benefit**: Functions co-located with database for performance

### 4. CORS Allowlist Security
**Decision**: Replace wildcard with explicit domain list
**Rationale**: Prevent CSRF attacks in production
**Implementation**: Dynamic origin validation via `cors-config.ts`

### 5. Automatic Deployments
**Decision**: Auto-deploy on push to main
**Rationale**: Fast iteration, continuous delivery
**Safety**: Can disable or add manual approval later

---

## 📊 Performance Characteristics

### Build Performance
- **Build Time**: ~2 minutes (Vercel)
- **Bundle Size**: 3.6MB total (gzipped)
- **Code Splitting**: 54 JavaScript chunks
- **CSS Bundle**: 112.58 KB (19.29 KB gzipped)

### Runtime Performance
- **First Contentful Paint**: < 1.5s (target)
- **Time to Interactive**: < 3s (target)
- **CDN**: Global edge network (Vercel)
- **Database**: Regional (Supabase)

### Scalability
- **Frontend**: Auto-scales (CDN)
- **Database**: Supabase free tier limits
- **Edge Functions**: Auto-scales
- **Concurrent Users**: Unlimited (frontend), database limited

---

## 🔍 Monitoring & Observability

### Vercel Dashboard
- Deployment history
- Build logs
- Analytics (optional)
- Error tracking

### Supabase Dashboard
- Database query performance
- Edge function logs
- Auth logs
- API usage metrics

### GitHub Actions
- Workflow run history
- Deployment status
- Secret management

---

## 🚨 Known Limitations (MVP)

1. **Single Environment**: Dev and prod share same database
2. **No Staging**: Changes go directly to production
3. **No Rollback**: Manual rollback via Vercel dashboard
4. **No Monitoring**: Basic dashboards only (no Sentry/DataDog)
5. **No Custom Domain**: Using default Vercel URL
6. **Free Tier Limits**: Supabase and Vercel free tier constraints

---

## 🔮 Future Enhancements

### Phase 1: Production Hardening
- [ ] Create separate production Supabase project
- [ ] Add staging environment
- [ ] Implement error tracking (Sentry)
- [ ] Set up database backups
- [ ] Add custom domain

### Phase 2: Advanced Features
- [ ] Preview deployments for PRs
- [ ] Performance monitoring
- [ ] A/B testing capability
- [ ] Advanced analytics
- [ ] Multi-region deployment

### Phase 3: Scale
- [ ] Database read replicas
- [ ] Edge caching layer
- [ ] Advanced security (WAF, DDoS protection)
- [ ] Compliance (SOC2, GDPR)
- [ ] Team collaboration features

---

## 📚 Related Documentation

- [Deployment Steps](./deployment-steps.md) - Step-by-step deployment guide
- [Requirements](./requirements.md) - Full requirements document
- [CLAUDE.md](../../../CLAUDE.md) - Project configuration and standards
- [Vercel Configuration](../../../vercel.json) - Vercel deployment config
- [Supabase Functions](../../../supabase/functions/) - Edge function source code

---

**Last Updated**: 2025-10-05
**Status**: ✅ Production Ready
**Next Review**: After 1-2 weeks of production usage
