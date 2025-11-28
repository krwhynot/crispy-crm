---
> **⚠️ SUPERSEDED**: See `../PRD.md` v1.18 Section 10 (Technical Requirements) for current requirements.

**Part of:** Crispy-CRM Product Requirements Document (v1.5 - ARCHIVED)
**Category:** Technical Specifications
**Document:** 18-tech-stack.md

**Related Documents:**
- 📋 [README - Master Index](./00-README.md)
- 🗄️ [Data Architecture](./02-data-architecture.md)
- 🔌 [API Design](./19-api-design.md)
- 🔒 [Performance & Security](./20-performance-security.md)
- 🚀 [Monitoring & Deployment](./21-monitoring-deployment.md)
- 🏢 [Organizations Feature](./03-organizations.md)
- 🎯 [Opportunities Feature](./04-opportunities.md)
---

## 📊 Implementation Status

**Last Updated:** November 4, 2025

| Metric | Status |
|--------|--------|
| **Completion** | ✅ **95%** |
| **Confidence** | 🟢 **VERY HIGH** - Verified via package.json and config files |
| **React Version** | ⬆️ React 19.2.0 (upgraded from PRD's React 18+) |
| **Build Tool** | ✅ Vite 7.1.10 |
| **TypeScript** | ✅ 5.8.3 |
| **Testing** | ✅ Vitest 3.2.4 + Playwright 1.56.1 |
| **Deployment** | ✅ Vercel with security headers |

**Completed Requirements:**

**Frontend Framework (100%):**
- ✅ React 19.2.0 (upgraded beyond PRD's React 18+)
- ✅ React DOM 19.2.0
- ✅ TypeScript 5.8.3
- ✅ Uses React 19 `createRoot` API (main.tsx:2,6)

**Build Tool (100%):**
- ✅ Vite 7.1.10 with @vitejs/plugin-react 4.6.0
- ✅ Advanced chunk splitting (vite.config.ts:123-185)
- ✅ Dependency pre-bundling (vite.config.ts:10-63)
- ✅ Terser minification (vite.config.ts:201-211)
- ✅ Path alias: `@/*` → `src/*`

**Styling (100%):**
- ✅ Tailwind CSS 4.1.11
- ✅ @tailwindcss/vite 4.1.11
- ✅ OKLCH color system via CSS variables (index.css:1-60)
- ✅ Semantic colors only (--primary, --brand-*, --destructive)

**Component Libraries (100%):**
- ✅ Radix UI (15+ components): dialog 1.1.15, dropdown-menu 2.1.16, select 2.2.6, checkbox 1.3.3, tooltip 1.2.8, slot 1.2.3
- ✅ Active usage in button.tsx, tabs.tsx, select.tsx

**State Management (95%):**
- ✅ TanStack Query 5.85.9 for server state
- ✅ React Admin built-in state (ra-core 5.12.0) instead of Zustand/Redux
- ✅ 3+ files using React Query hooks

**Form Management (100%):**
- ✅ react-hook-form 7.62.0
- ✅ @hookform/resolvers 5.1.1
- ✅ zod 4.0.5
- ✅ Active usage: validation/opportunities.ts, OpportunityInputs.tsx, QuickAddForm.tsx

**Date/Time (100%):**
- ✅ date-fns (vite.config.ts:50)
- ✅ Active usage: NotificationsList.tsx, NotificationDropdown.tsx, RecentActivities.tsx, OpportunityCard.tsx

**Drag & Drop (90%):**
- ✅ @hello-pangea/dnd 18.0.1 (alternative to PRD's dnd-kit)
- ✅ Active usage: OpportunityCard.tsx:1, OpportunityListContent.tsx

**Charts (100%):**
- ✅ recharts 3.3.0
- ✅ @nivo/bar 0.99.0 (bonus)
- ✅ Active usage: PipelineByStage.tsx (dashboard widget)

**Icons (100%):**
- ✅ lucide-react 0.542.0
- ✅ Active usage: NotificationsList.tsx, Header.tsx, NotificationBell.tsx, PipelineByStage.tsx

**Backend (100%):**
- ✅ @supabase/supabase-js 2.75.1
- ✅ ra-supabase-core 3.5.1
- ✅ supabase CLI 2.51.0
- ✅ Active usage: supabase.ts, authProvider.ts, unifiedDataProvider.ts

**React Admin (100%):**
- ✅ ra-core 5.12.0
- ✅ ra-i18n-polyglot 5.10.0
- ✅ ra-language-english 5.10.0
- ✅ Active usage: CRM.tsx, Dashboard.tsx, all resource modules

**Testing Frameworks (100%):**
- ✅ Vitest 3.2.4 with @vitest/coverage-v8, @vitest/ui, jsdom 27.0.0
- ✅ Playwright 1.56.1 with chromium + iPad viewports
- ✅ @testing-library/react 16.3.0, @testing-library/jest-dom 6.6.3
- ✅ Coverage thresholds: 70% lines/functions/branches/statements

**TypeScript Config (100%):**
- ✅ TypeScript 5.8.3
- ✅ tsconfig.json, tsconfig.app.json, tsconfig.node.json
- ✅ Target ES2022, strict mode, noUnusedLocals/Parameters
- ✅ TypeScript-ESLint 8.35.1

**Deployment (100%):**
- ✅ Vercel (vercel.json with build config, rewrites, regions)
- ✅ Security headers: CSP, HSTS, X-Frame-Options, X-Content-Type-Options
- ✅ Supabase Cloud backend
- ✅ CI/CD: GitHub Actions (.github/workflows/check.yml, supabase-deploy.yml)

**Additional Stack (Beyond PRD):**
- ✅ Storybook 9.1.10 (component development)
- ✅ Chromatic 11.18.1 (visual regression testing)
- ✅ Husky 9.1.7 (git hooks)
- ✅ ESLint 9.22.0 + Prettier 3.6.2
- ✅ @faker-js/faker 9.9.0 (test data)
- ✅ class-variance-authority (type-safe styling)

**Deviations from PRD:**

| PRD Spec | Actual | Impact | Risk |
|----------|--------|--------|------|
| React 18+ | React 19.2.0 | ✅ Positive (improved features) | Low |
| dnd-kit | @hello-pangea/dnd 18.0.1 | ⚠️ Neutral (both production-grade) | Low |
| Zustand/Redux | React Admin state | ✅ Appropriate (admin panel) | None |

**Missing Components:** None critical

**Unfinished Tasks:** None

**Blockers:** None

**Status:** Stack implementation exceeds PRD requirements. React 19 upgrade, comprehensive testing infrastructure, and security headers demonstrate production-readiness. Minor deviations (drag-drop library, state management) are architecturally sound.

---

# 18. Technology Stack

## 5.1 Technology Stack (Updated for Crispy-CRM)

### Frontend

**Framework:**
- **React 18+** with TypeScript
- **Rationale**: Component reusability, type safety, large ecosystem, excellent tooling

**State Management:**
- **Zustand** (preferred) or Redux Toolkit
- **Rationale**: Simpler than Redux, less boilerplate, great TypeScript support, sufficient for CRM complexity

**Styling:**
- **Tailwind CSS** with custom configuration
- **OKLCH color model** via CSS variables
- **PostCSS** for processing
- **Rationale**: Utility-first approach aligns with design system, highly performant, excellent responsive design support

**Component Libraries:**
- **Headless UI** (by Tailwind Labs) for accessible unstyled components
- **Radix UI** for complex components (Combobox, Dialog, Dropdown)
- **Rationale**: Unstyled primitives allow full design control while ensuring accessibility

**Data Fetching:**
- **TanStack Query (React Query)** for server state management
- **Rationale**: Automatic caching, background refetching, optimistic updates, pagination support

**Form Management:**
- **React Hook Form** with **Zod** for validation
- **Rationale**: Minimal re-renders, great TypeScript support, declarative validation schemas

**Date/Time:**
- **date-fns** for date manipulation (lightweight alternative to Moment.js)
- **React DatePicker** or **Radix UI DatePicker** for UI

**Drag & Drop:**
- **dnd-kit** for Kanban board
- **Rationale**: Modern, accessible, performant, touch-friendly

**Charts/Visualizations:**
- **Recharts** or **Chart.js** with React wrapper
- **Rationale**: Declarative API, responsive, good default styling

**Icons:**
- **Heroicons** (by Tailwind Labs) or **Lucide React**
- **Rationale**: Consistent style, tree-shakeable, optimized SVGs

**Build Tool:**
- **Vite** (preferred) or Create React App
- **Rationale**: Faster dev server, optimized builds, better HMR

### Backend & Infrastructure

**Backend Platform:**
- **Supabase** (PostgreSQL + Auto-generated REST APIs + Built-in Auth)
- **Rationale**: Eliminates need for custom backend, provides instant REST/GraphQL APIs from database schema, includes Row-Level Security (RLS) for multi-tenant access control

**Database:**
- **PostgreSQL** (via Supabase)
- Field-level audit trail using database triggers (see ADR-0006)
- Soft delete pattern (deleted_at column) for all core entities

**Authentication:**
- **Supabase Auth (GoTrue)** with JWT tokens
- Refresh token rotation for security
- Email/password authentication (MVP)
- Auth triggers sync to internal sales table

**Authorization:**
- **Row Level Security (RLS)** policies in PostgreSQL
- Shared team collaboration model (all authenticated users can access shared resources)
- See PRD Section 3.1 for access control details

**File Storage:**
- **Supabase Storage** for document uploads (built-in)
- Alternative: AWS S3 or Cloudflare R2 if needed

**Deployment:**
- **Frontend**: Vercel or Netlify (static hosting with SSR support)
- **Backend**: Supabase Cloud (managed PostgreSQL + APIs)
- **Rationale**: Serverless architecture, automatic scaling, minimal ops overhead
