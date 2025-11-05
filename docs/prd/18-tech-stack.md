---
**Part of:** Atomic CRM Product Requirements Document
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
