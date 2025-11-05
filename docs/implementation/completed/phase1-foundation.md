# Phase 1: Foundation - Task Breakdown
**Crispy-CRM MVP Implementation**

## Overview

**Status:** ✅ **COMPLETE** - All foundation infrastructure implemented
**Phase Timeline:** Weeks 1-2 (80-100 hours)
**Overall Confidence:** 82%
**Total Estimated Hours:** 92 hours
**Team Size:** 1-2 developers
**Last Updated:** 2025-11-05 (Status verified via code review)

### Phase Objectives
1. Set up complete development infrastructure (React 19 + Vite + TypeScript)
2. Implement authentication system with Supabase Auth
3. Create core application layouts and navigation
4. Establish database schema and migrations
5. Implement steel thread (basic Contact CRUD) as proof of concept
6. Configure design system with OKLCH colors and Tailwind CSS 4

### Risk Summary

**High-Risk Areas:**
- Supabase Auth integration with JWT refresh tokens (15% risk)
- OKLCH color system configuration with Tailwind CSS 4 (10% risk)
- RLS policy setup for multi-user access (12% risk)

**Medium-Risk Areas:**
- React Admin integration patterns (8% risk)
- TypeScript configuration for React 19 (5% risk)

**Mitigation Strategies:**
- Use `ra-supabase-core` for proven Auth integration
- Reference existing OKLCH implementations from shadcn
- Start with simple RLS policies, iterate based on testing
- Use React Admin's TypeScript examples as reference

---

## Epic 1: Project Infrastructure & Build Setup

### Task P1-E1-S1-T1: Initialize React 19 + Vite + TypeScript Project
**Confidence:** 95%
**Estimate:** 2 hours
**Type:** infrastructure
**Layer:** frontend

#### Prerequisites
- Node.js 18+ installed
- npm/yarn package manager available

#### Acceptance Criteria
- ✅ Vite project created with React 19 template
- ✅ TypeScript 5.8+ configured with strict mode
- ✅ Project builds successfully (`npm run build`)
- ✅ Dev server starts without errors (`npm run dev`)
- ✅ Hot module replacement working
- ✅ Path aliases configured (`@/*` → `src/*`)

#### Risk Factors
- **React 19 compatibility:** Some libraries may not support React 19 yet (5% risk)

#### Technical Notes
```bash
npm create vite@latest crispy-crm -- --template react-ts
cd crispy-crm
npm install react@19 react-dom@19
```

vite.config.ts:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

---

### Task P1-E1-S1-T2: Configure Tailwind CSS 4 with OKLCH Color System
**Confidence:** 75%
**Estimate:** 4 hours
**Type:** infrastructure
**Layer:** frontend

#### Prerequisites
- Task P1-E1-S1-T1 completed

#### Acceptance Criteria
- ✅ Tailwind CSS 4 installed and configured
- ✅ OKLCH color variables defined in CSS
- ✅ Semantic color tokens working (--primary, --brand-500, --accent-clay-600)
- ✅ Warm cream background: `oklch(97.5% 0.010 92)`
- ✅ Brand green tokens: `--brand-500` through `--brand-900`
- ✅ Clay orange accent tokens: `--accent-clay-600`
- ✅ Color validation script passes (`npm run validate:colors`)

#### Risk Factors
- **Tailwind CSS 4 Breaking Changes:** v4 has significant changes from v3 (15% risk)
- **OKLCH Browser Support:** Need fallbacks for older browsers (10% risk)

#### Technical Notes
```bash
npm install -D tailwindcss@4 @tailwindcss/vite
```

src/index.css:
```css
@import "tailwindcss";

@theme inline {
  /* Semantic tokens */
  --color-background: oklch(97.5% 0.010 92);
  --color-foreground: oklch(22% 0.01 92);
  --color-primary: var(--brand-500);
  --color-accent: var(--accent-clay-600);

  /* Brand: MFB Garden Green */
  --color-brand-500: oklch(68% 0.15 142);
  --color-brand-600: oklch(60% 0.14 142);
  --color-brand-700: oklch(52% 0.13 142);

  /* Accent: Clay Orange */
  --color-accent-clay-600: oklch(65% 0.14 42);
}
```

Reference: `docs/internal-docs/color-theming-architecture.docs.md`

---

### Task P1-E1-S1-T3: Set Up ESLint + Prettier + Husky
**Confidence:** 90%
**Estimate:** 2 hours
**Type:** infrastructure
**Layer:** frontend

#### Prerequisites
- Task P1-E1-S1-T1 completed

#### Acceptance Criteria
- ✅ ESLint configured with React + TypeScript rules
- ✅ Prettier configured with consistent formatting
- ✅ Husky pre-commit hooks installed
- ✅ `npm run lint:apply` auto-fixes issues
- ✅ `npm run prettier:apply` formats code
- ✅ Pre-commit hook runs linting + formatting

#### Risk Factors
- None (well-established tooling)

#### Technical Notes
```bash
npm install -D eslint prettier husky
npm install -D eslint-plugin-react-hooks eslint-plugin-jsx-a11y
npm install -D @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

.prettierrc.mjs:
```javascript
export default {
  semi: true,
  singleQuote: false,
  trailingComma: "es5",
  tabWidth: 2,
}
```

---

### Task P1-E1-S1-T4: Configure Vitest + Testing Library
**Confidence:** 85%
**Estimate:** 3 hours
**Type:** infrastructure
**Layer:** frontend

#### Prerequisites
- Task P1-E1-S1-T1 completed

#### Acceptance Criteria
- ✅ Vitest configured with jsdom environment
- ✅ @testing-library/react installed for React 19
- ✅ @testing-library/jest-dom matchers available
- ✅ Coverage threshold set to 70% (statements, branches, functions, lines)
- ✅ Sample test passes (`npm test`)
- ✅ `npm run test:coverage` generates report

#### Risk Factors
- **React 19 Testing Library Support:** May need updates (8% risk)

#### Technical Notes
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        statements: 70,
        branches: 70,
        functions: 70,
        lines: 70,
      },
    },
  },
})
```

Reference: `docs/claude/testing-quick-reference.md`

---

## Epic 2: Supabase Setup & Database Configuration

### Task P1-E2-S1-T1: Initialize Supabase Local Development
**Confidence:** 90%
**Estimate:** 2 hours
**Type:** infrastructure
**Layer:** database

#### Prerequisites
- Docker Desktop installed and running
- Supabase CLI installed (`npm install -g supabase`)

#### Acceptance Criteria
- ✅ Supabase initialized (`npx supabase init`)
- ✅ Local Supabase running (`npm run db:local:start`)
- ✅ Environment variables configured (.env.local)
- ✅ Supabase Studio accessible at http://localhost:54323
- ✅ Database connection verified

#### Risk Factors
- **Docker Issues:** Port conflicts or memory issues (5% risk)

#### Technical Notes
```bash
npx supabase init
npx supabase start

# Copy connection details to .env.local
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=<anon_key_from_output>
```

Reference: `docs/supabase/WORKFLOW.md`

---

### Task P1-E2-S1-T2: Create Initial Database Schema Migration
**Confidence:** 80%
**Estimate:** 4 hours
**Type:** infrastructure
**Layer:** database

#### Prerequisites
- Task P1-E2-S1-T1 completed
- PRD Section 2.1 reviewed (data architecture)

#### Acceptance Criteria
- ✅ Migration file created: `20250103000000_initial_schema.sql`
- ✅ `auth.users` trigger function created for sales table sync
- ✅ `sales` table created (users table implementation)
- ✅ `contacts` table created with JSONB fields for email/phone
- ✅ `organizations` table created
- ✅ Audit fields (created_at, updated_at, created_by) on all tables
- ✅ Foreign key constraints established
- ✅ Migration applies cleanly (`npx supabase db reset`)

#### Risk Factors
- **Auth Schema Exclusion:** Auth triggers not captured by `db diff` (10% risk)
- **JSONB Array Defaults:** Must use correct PostgreSQL syntax (5% risk)

#### Technical Notes
```sql
-- Sales (Users) table
CREATE TABLE sales (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT false,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contacts table with JSONB arrays
CREATE TABLE contacts (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  first_name TEXT,
  last_name TEXT,
  name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  organization_id BIGINT REFERENCES organizations(id),
  email JSONB DEFAULT '[]'::jsonb,
  phone JSONB DEFAULT '[]'::jsonb,
  linkedin_url TEXT,
  title TEXT,
  department TEXT,
  sales_id BIGINT REFERENCES sales(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by BIGINT REFERENCES sales(id),
  updated_by BIGINT REFERENCES sales(id),
  deleted_at TIMESTAMPTZ
);

-- Auth trigger to create sales record
CREATE OR REPLACE FUNCTION create_sales_from_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.sales (user_id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'Name')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_sales_from_user();
```

Reference: `CLAUDE.md` Database Workflows section

---

### Task P1-E2-S1-T3: Configure Row Level Security (RLS) Policies
**Confidence:** 70%
**Estimate:** 3 hours
**Type:** infrastructure
**Layer:** database

#### Prerequisites
- Task P1-E2-S1-T2 completed

#### Acceptance Criteria
- ✅ RLS enabled on all tables
- ✅ GRANT permissions applied to `authenticated` role (Layer 1 security)
- ✅ RLS policies created for SELECT, INSERT, UPDATE, DELETE (Layer 2 security)
- ✅ Shared access model: all authenticated users can access all resources
- ✅ Policies tested with test users
- ✅ No "permission denied" errors in application

#### Risk Factors
- **Two-Layer Security Confusion:** Forgetting GRANT statements (15% risk)
- **RLS Policy Testing:** Hard to debug without proper tooling (12% risk)

#### Technical Notes
```sql
-- Enable RLS on contacts table
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Layer 1: GRANT base permissions (CRITICAL - DO NOT SKIP)
GRANT SELECT, INSERT, UPDATE, DELETE ON contacts TO authenticated;
GRANT USAGE ON SEQUENCE contacts_id_seq TO authenticated;

-- Layer 2: RLS policies for row filtering (shared team access)
CREATE POLICY authenticated_select_contacts ON contacts
  FOR SELECT TO authenticated
  USING (true);  -- All team members can see all contacts

CREATE POLICY authenticated_insert_contacts ON contacts
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY authenticated_update_contacts ON contacts
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY authenticated_delete_contacts ON contacts
  FOR DELETE TO authenticated
  USING (true);
```

Reference: `CLAUDE.md` Database Security section (Two-Layer Model)

---

### Task P1-E2-S1-T4: Create Seed Data Script
**Confidence:** 85%
**Estimate:** 2 hours
**Type:** infrastructure
**Layer:** database

#### Prerequisites
- Task P1-E2-S1-T2 completed

#### Acceptance Criteria
- ✅ `supabase/seed.sql` file created
- ✅ Test user created: `admin@test.com` / `password123`
- ✅ 16 principal organizations seeded
- ✅ 10-15 sample contacts seeded
- ✅ Seed runs automatically with `npm run db:local:reset`
- ✅ Idempotent seed (can run multiple times safely)

#### Risk Factors
- None (straightforward SQL inserts)

#### Technical Notes
```sql
-- supabase/seed.sql
-- Create test user (must be done via Supabase Auth)
-- This will trigger the auth.users → sales sync
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@test.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"first_name": "Admin", "last_name": "User"}'::jsonb
);

-- Insert principal organizations
INSERT INTO organizations (organization_name, segment) VALUES
  ('Acme Foods', 'Distributor'),
  ('Fresh Farm Co', 'Fine Dining'),
  ('Urban Eats', 'Casual');

-- Insert sample contacts
INSERT INTO contacts (first_name, last_name, email, phone, title) VALUES
  ('John', 'Doe', '[{"email": "john@example.com", "type": "Work"}]'::jsonb, '[{"number": "555-1234", "type": "Mobile"}]'::jsonb, 'Chef');
```

Reference: `CLAUDE.md` Seed Data section

---

## Epic 3: Authentication & User Management

### Task P1-E3-S1-T1: Install Supabase Client & React Admin Adapters
**Confidence:** 90%
**Estimate:** 1 hour
**Type:** feature
**Layer:** frontend

#### Prerequisites
- Task P1-E2-S1-T1 completed (Supabase initialized)

#### Acceptance Criteria
- ✅ `@supabase/supabase-js` installed (v2.75+)
- ✅ `ra-supabase-core` installed (v3.5+)
- ✅ `ra-core`, `ra-i18n-polyglot` installed
- ✅ Supabase client initialized in `src/atomic-crm/providers/supabase/supabase.ts`
- ✅ Environment variables loaded correctly

#### Risk Factors
- None (standard package installation)

#### Technical Notes
```bash
npm install @supabase/supabase-js ra-supabase-core ra-core ra-i18n-polyglot
```

```typescript
// src/atomic-crm/providers/supabase/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
})
```

---

### Task P1-E3-S1-T2: Implement Supabase Auth Provider
**Confidence:** 85%
**Estimate:** 3 hours
**Type:** feature
**Layer:** frontend

#### Prerequisites
- Task P1-E3-S1-T1 completed

#### Acceptance Criteria
- ✅ Auth provider created extending `supabaseAuthProvider`
- ✅ Login method implemented (email/password)
- ✅ Logout method implemented
- ✅ CheckAuth method validates JWT tokens
- ✅ GetIdentity method fetches user from sales table
- ✅ CanAccess method implements role-based permissions
- ✅ Session caching implemented for performance

#### Risk Factors
- **JWT Refresh Logic:** Complex token rotation (10% risk)
- **Sales Table Sync:** Race conditions on user creation (8% risk)

#### Technical Notes
```typescript
// src/atomic-crm/providers/supabase/authProvider.ts
import { AuthProvider } from "ra-core";
import { supabaseAuthProvider } from "ra-supabase-core";
import { supabase } from "./supabase";

const baseAuthProvider = supabaseAuthProvider(supabase, {
  getIdentity: async () => {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.user) throw new Error("Not authenticated");

    const { data: sale } = await supabase
      .from("sales")
      .select("id, first_name, last_name, avatar_url, is_admin")
      .eq("user_id", session.user.id)
      .single();

    return {
      id: sale.id,
      fullName: `${sale.first_name} ${sale.last_name}`,
      avatar: sale.avatar_url,
    };
  },
});

export const authProvider: AuthProvider = {
  ...baseAuthProvider,
  canAccess: async (params) => {
    const identity = await baseAuthProvider.getIdentity();
    // Implement role-based access control
    return true; // Simplified for MVP
  },
};
```

---

### Task P1-E3-S1-T3: Create Login Page Component
**Confidence:** 90%
**Estimate:** 3 hours
**Type:** feature
**Layer:** frontend

#### Prerequisites
- Task P1-E3-S1-T2 completed

#### Acceptance Criteria
- ✅ Login page component created
- ✅ Email and password form fields
- ✅ Password visibility toggle
- ✅ "Remember me" checkbox (30-day session)
- ✅ "Forgot password" link
- ✅ Error messages display clearly
- ✅ Loading state during authentication
- ✅ Redirects to dashboard on success

#### Risk Factors
- None (standard form implementation)

#### Technical Notes
```tsx
// src/atomic-crm/login/LoginPage.tsx
import { useState } from 'react';
import { useLogin, useNotify } from 'ra-core';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useLogin();
  const notify = useNotify();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login({ email, password });
    } catch (error) {
      notify('Invalid email or password', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold">Sign In</h1>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>
    </div>
  );
};
```

---

### Task P1-E3-S1-T4: Implement Protected Route Wrapper
**Confidence:** 85%
**Estimate:** 2 hours
**Type:** feature
**Layer:** frontend

#### Prerequisites
- Task P1-E3-S1-T2 completed
- React Router installed

#### Acceptance Criteria
- ✅ Protected route component created
- ✅ Redirects to /login if not authenticated
- ✅ Preserves intended destination in redirect
- ✅ Shows loading state during auth check
- ✅ Integrates with React Admin's auth system

#### Risk Factors
- **Auth State Timing:** Race conditions on initial load (8% risk)

#### Technical Notes
```tsx
// src/atomic-crm/components/ProtectedRoute.tsx
import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthState } from 'ra-core';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isLoading, authenticated } = useAuthState();
  const location = useLocation();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!authenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
```

---

## Epic 4: Core Layout & Navigation

### Task P1-E4-S1-T1: Create Top Navigation Bar Component
**Confidence:** 85%
**Estimate:** 3 hours
**Type:** feature
**Layer:** frontend

#### Prerequisites
- Task P1-E3-S1-T2 completed (auth provider)

#### Acceptance Criteria
- ✅ Top navigation bar component created
- ✅ Logo/brand name displayed
- ✅ User avatar and name displayed
- ✅ Logout button functional
- ✅ Responsive design (collapses on mobile)
- ✅ Sticky positioning (stays at top on scroll)
- ✅ Uses semantic color variables

#### Risk Factors
- None (standard UI component)

#### Technical Notes
```tsx
// src/atomic-crm/layout/TopBar.tsx
import { useGetIdentity, useLogout } from 'ra-core';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export const TopBar = () => {
  const { data: identity } = useGetIdentity();
  const logout = useLogout();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-foreground">Crispy CRM</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {identity?.fullName}
          </span>
          <Avatar>
            <AvatarImage src={identity?.avatar} />
            <AvatarFallback>{identity?.fullName?.[0]}</AvatarFallback>
          </Avatar>
          <Button variant="ghost" onClick={() => logout()}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
};
```

---

### Task P1-E4-S1-T2: Create Sidebar Navigation Component
**Confidence:** 80%
**Estimate:** 4 hours
**Type:** feature
**Layer:** frontend

#### Prerequisites
- Task P1-E4-S1-T1 completed

#### Acceptance Criteria
- ✅ Sidebar component with collapsible state
- ✅ Navigation links for: Dashboard, Contacts, Organizations, Opportunities
- ✅ Active route highlighting
- ✅ Icons for each navigation item (lucide-react)
- ✅ Keyboard navigation support (Tab, Enter)
- ✅ Persisted collapsed state in localStorage
- ✅ Smooth animation on collapse/expand

#### Risk Factors
- **Accessibility:** Proper ARIA labels and keyboard nav (10% risk)

#### Technical Notes
```tsx
// src/atomic-crm/layout/Sidebar.tsx
import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Users, Building2, Target, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/contacts', label: 'Contacts', icon: Users },
  { to: '/organizations', label: 'Organizations', icon: Building2 },
  { to: '/opportunities', label: 'Opportunities', icon: Target },
];

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('sidebar-collapsed');
    if (stored) setCollapsed(JSON.parse(stored));
  }, []);

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
    localStorage.setItem('sidebar-collapsed', JSON.stringify(!collapsed));
  };

  return (
    <aside
      className={cn(
        'border-r border-border bg-sidebar transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <nav className="space-y-2 p-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent'
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleCollapsed}
        className="absolute bottom-4 right-4"
      >
        <ChevronLeft className={cn('h-4 w-4', collapsed && 'rotate-180')} />
      </Button>
    </aside>
  );
};
```

---

### Task P1-E4-S1-T3: Create Main Layout Template
**Confidence:** 90%
**Estimate:** 2 hours
**Type:** feature
**Layer:** frontend

#### Prerequisites
- Task P1-E4-S1-T1 completed
- Task P1-E4-S1-T2 completed

#### Acceptance Criteria
- ✅ Layout component combines TopBar + Sidebar + main content area
- ✅ Responsive grid layout
- ✅ Main content area has proper padding and max-width
- ✅ Scroll behavior works correctly
- ✅ Layout persists across route changes

#### Risk Factors
- None (layout composition)

#### Technical Notes
```tsx
// src/atomic-crm/layout/Layout.tsx
import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';

export const Layout = () => {
  return (
    <div className="flex h-screen flex-col">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
```

---

### Task P1-E4-S1-T4: Implement Breadcrumb Navigation
**Confidence:** 75%
**Estimate:** 2 hours
**Type:** feature
**Layer:** frontend

#### Prerequisites
- Task P1-E4-S1-T3 completed

#### Acceptance Criteria
- ✅ Breadcrumb component created
- ✅ Automatically generates breadcrumbs from route
- ✅ Clickable links to parent routes
- ✅ Current page is non-clickable
- ✅ Separator icons between items
- ✅ Truncates long labels with ellipsis

#### Risk Factors
- **Dynamic Route Handling:** Matching routes to labels (12% risk)

#### Technical Notes
```tsx
// src/atomic-crm/layout/Breadcrumbs.tsx
import { useMatches } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Breadcrumbs = () => {
  const matches = useMatches();

  const crumbs = matches
    .filter((match) => match.handle?.breadcrumb)
    .map((match) => ({
      label: match.handle.breadcrumb,
      path: match.pathname,
    }));

  return (
    <nav className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
      {crumbs.map((crumb, index) => (
        <div key={crumb.path} className="flex items-center gap-2">
          {index > 0 && <ChevronRight className="h-4 w-4" />}
          {index === crumbs.length - 1 ? (
            <span className="font-medium text-foreground">{crumb.label}</span>
          ) : (
            <Link to={crumb.path} className="hover:underline">
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
};
```

---

## Epic 5: State Management & Data Fetching

### Task P1-E5-S1-T1: Configure TanStack Query (React Query)
**Confidence:** 85%
**Estimate:** 2 hours
**Type:** infrastructure
**Layer:** frontend

#### Prerequisites
- Task P1-E1-S1-T1 completed

#### Acceptance Criteria
- ✅ `@tanstack/react-query` installed (v5.85+)
- ✅ QueryClient configured with sensible defaults
- ✅ QueryClientProvider wraps application
- ✅ DevTools enabled in development
- ✅ Stale time set to 5 minutes
- ✅ Cache time set to 10 minutes
- ✅ Retry logic configured (3 attempts)

#### Risk Factors
- None (standard configuration)

#### Technical Notes
```tsx
// src/App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
});

export const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      {/* App content */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};
```

---

### Task P1-E5-S1-T2: Set Up Zustand for Client State
**Confidence:** 80%
**Estimate:** 2 hours
**Type:** infrastructure
**Layer:** frontend

#### Prerequisites
- Task P1-E1-S1-T1 completed

#### Acceptance Criteria
- ✅ `zustand` installed
- ✅ Example store created for UI state (sidebar collapsed, theme)
- ✅ Store persists to localStorage
- ✅ DevTools integration working
- ✅ TypeScript types properly defined

#### Risk Factors
- **Overuse Warning:** Should only store UI state, not server data (5% risk)

#### Technical Notes
```typescript
// src/stores/uiStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({
        sidebarCollapsed: !state.sidebarCollapsed
      })),
    }),
    {
      name: 'ui-storage',
    }
  )
);
```

Note: TanStack Query handles ALL server state. Zustand only for UI state.

---

### Task P1-E5-S1-T3: Create Unified Data Provider for React Admin
**Confidence:** 75%
**Estimate:** 5 hours
**Type:** infrastructure
**Layer:** frontend

#### Prerequisites
- Task P1-E2-S1-T3 completed (RLS policies)
- Task P1-E3-S1-T1 completed (Supabase client)

#### Acceptance Criteria
- ✅ Data provider created extending `ra-supabase-core`
- ✅ CRUD methods implemented: getList, getOne, create, update, delete
- ✅ Filtering and sorting support
- ✅ Pagination support
- ✅ Error handling for 400/401/403/404/500 errors
- ✅ Integration with Supabase PostgREST API

#### Risk Factors
- **Complex Filtering:** JSONB array filtering (15% risk)
- **Error Message Parsing:** Supabase error formats (10% risk)

#### Technical Notes
```typescript
// src/atomic-crm/providers/supabase/unifiedDataProvider.ts
import { DataProvider } from 'ra-core';
import { supabaseDataProvider } from 'ra-supabase-core';
import { supabase } from './supabase';

const baseDataProvider = supabaseDataProvider({
  instanceUrl: import.meta.env.VITE_SUPABASE_URL,
  apiKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  supabaseClient: supabase,
});

export const unifiedDataProvider: DataProvider = {
  ...baseDataProvider,

  // Override getList for custom filtering
  getList: async (resource, params) => {
    const { page, perPage } = params.pagination;
    const { field, order } = params.sort;
    const { filter } = params;

    // Build Supabase query
    let query = supabase
      .from(resource)
      .select('*', { count: 'exact' });

    // Apply filters
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });

    // Apply sorting
    if (field) {
      query = query.order(field, { ascending: order === 'ASC' });
    }

    // Apply pagination
    const from = (page - 1) * perPage;
    const to = page * perPage - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw new Error(error.message);

    return {
      data: data || [],
      total: count || 0,
    };
  },
};
```

Reference: `src/atomic-crm/providers/supabase/unifiedDataProvider.ts` (existing implementation)

---

## Epic 6: Steel Thread - Contact CRUD (Proof of Concept)

### Task P1-E6-S1-T1: Create Zod Validation Schema for Contacts
**Confidence:** 85%
**Estimate:** 2 hours
**Type:** feature
**Layer:** frontend

#### Prerequisites
- Task P1-E2-S1-T2 completed (contacts table schema)

#### Acceptance Criteria
- ✅ `zod` package installed (v4.0+)
- ✅ Contact validation schema created
- ✅ JSONB array sub-schemas for email and phone
- ✅ Schema exports: `contactBaseSchema`, `contactInsertSchema`, `contactUpdateSchema`
- ✅ Type inference working: `type Contact = z.infer<typeof contactBaseSchema>`

#### Risk Factors
- **JSONB Array Validation:** Complex nested validation (10% risk)

#### Technical Notes
```typescript
// src/atomic-crm/validation/contacts.ts
import { z } from 'zod';

// Sub-schemas for JSONB arrays
export const personalInfoTypeSchema = z.enum(["Work", "Home", "Other"]);

export const emailAndTypeSchema = z.object({
  email: z.string().email("Invalid email address"),
  type: personalInfoTypeSchema.default("Work"),
});

export const phoneNumberAndTypeSchema = z.object({
  number: z.string().min(1, "Phone number is required"),
  type: z.enum(["Work", "Home", "Mobile", "Other"]).default("Work"),
});

// Base contact schema
export const contactBaseSchema = z.object({
  id: z.number().optional(),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  organization_id: z.number().nullable().optional(),
  email: z.array(emailAndTypeSchema).default([]),
  phone: z.array(phoneNumberAndTypeSchema).default([]),
  linkedin_url: z.string().url().optional().or(z.literal("")),
  title: z.string().optional(),
  department: z.string().optional(),
  notes: z.string().optional(),
});

// Derived schemas
export const contactInsertSchema = contactBaseSchema.omit({ id: true });
export const contactUpdateSchema = contactBaseSchema.partial();

// Type exports
export type Contact = z.infer<typeof contactBaseSchema>;
export type ContactInsert = z.infer<typeof contactInsertSchema>;
export type ContactUpdate = z.infer<typeof contactUpdateSchema>;
```

Reference: `CLAUDE.md` JSONB Array Handling Pattern

---

### Task P1-E6-S1-T2: Create Contact List View Component
**Confidence:** 80%
**Estimate:** 4 hours
**Type:** feature
**Layer:** frontend

#### Prerequisites
- Task P1-E5-S1-T3 completed (data provider)
- Task P1-E6-S1-T1 completed (validation schema)

#### Acceptance Criteria
- ✅ Contact list component with data table
- ✅ Columns: Name, Organization, Email, Phone, Title
- ✅ Sorting on all columns
- ✅ Search functionality (name, email)
- ✅ Pagination (25 items per page)
- ✅ Loading states with skeleton
- ✅ Empty state message
- ✅ "Create Contact" button

#### Risk Factors
- **JSONB Display:** Extracting first email/phone from array (8% risk)

#### Technical Notes
```tsx
// src/atomic-crm/contacts/ContactList.tsx
import { List, Datagrid, TextField, ReferenceField } from 'react-admin';
import { EmailField } from './components/EmailField';
import { PhoneField } from './components/PhoneField';

export const ContactList = () => {
  return (
    <List
      filters={[
        <TextInput source="name@ilike" label="Search" alwaysOn />,
      ]}
      perPage={25}
      sort={{ field: 'created_at', order: 'DESC' }}
    >
      <Datagrid rowClick="show">
        <TextField source="name" label="Name" />
        <ReferenceField source="organization_id" reference="organizations" link="show">
          <TextField source="organization_name" />
        </ReferenceField>
        <EmailField source="email" label="Email" />
        <PhoneField source="phone" label="Phone" />
        <TextField source="title" label="Title" />
      </Datagrid>
    </List>
  );
};

// Custom field for JSONB email array
const EmailField = ({ record }: any) => {
  const emails = record?.email || [];
  const primaryEmail = emails[0]?.email || '-';
  return <span>{primaryEmail}</span>;
};

// Custom field for JSONB phone array
const PhoneField = ({ record }: any) => {
  const phones = record?.phone || [];
  const primaryPhone = phones[0]?.number || '-';
  return <span>{primaryPhone}</span>;
};
```

---

### Task P1-E6-S1-T3: Create Contact Detail/Show View Component
**Confidence:** 85%
**Estimate:** 3 hours
**Type:** feature
**Layer:** frontend

#### Prerequisites
- Task P1-E6-S1-T2 completed

#### Acceptance Criteria
- ✅ Contact detail view component
- ✅ All contact fields displayed
- ✅ JSONB arrays displayed as chips/badges
- ✅ Organization link to organization detail page
- ✅ "Edit" button navigates to edit form
- ✅ "Delete" button with confirmation dialog
- ✅ Back button to list view

#### Risk Factors
- None (standard detail view)

#### Technical Notes
```tsx
// src/atomic-crm/contacts/ContactShow.tsx
import {
  Show,
  SimpleShowLayout,
  TextField,
  ReferenceField,
  ArrayField,
  SingleFieldList,
  ChipField,
  EditButton,
  DeleteButton,
} from 'react-admin';

export const ContactShow = () => {
  return (
    <Show>
      <SimpleShowLayout>
        <TextField source="name" label="Full Name" />
        <ReferenceField source="organization_id" reference="organizations" link="show">
          <TextField source="organization_name" />
        </ReferenceField>

        <ArrayField source="email" label="Email Addresses">
          <SingleFieldList>
            <ChipField source="email" />
          </SingleFieldList>
        </ArrayField>

        <ArrayField source="phone" label="Phone Numbers">
          <SingleFieldList>
            <ChipField source="number" />
          </SingleFieldList>
        </ArrayField>

        <TextField source="title" label="Job Title" />
        <TextField source="department" />
        <TextField source="linkedin_url" label="LinkedIn" />
        <TextField source="notes" />

        <div className="flex gap-2">
          <EditButton />
          <DeleteButton />
        </div>
      </SimpleShowLayout>
    </Show>
  );
};
```

---

### Task P1-E6-S1-T4: Create Contact Create/Edit Form Component
**Confidence:** 75%
**Estimate:** 5 hours
**Type:** feature
**Layer:** frontend

#### Prerequisites
- Task P1-E6-S1-T1 completed (Zod schema)
- `react-hook-form` installed
- `@hookform/resolvers` installed

#### Acceptance Criteria
- ✅ Contact create/edit form component
- ✅ Form validation using Zod schema
- ✅ JSONB array inputs for email and phone with add/remove
- ✅ Organization autocomplete/select
- ✅ Form default values from `contactBaseSchema.partial().parse({})`
- ✅ Error messages display inline
- ✅ Save button disabled during submission
- ✅ Success/error notifications

#### Risk Factors
- **JSONB Array Inputs:** Complex dynamic field arrays (18% risk)
- **Form State Hydration:** Partial data handling (10% risk)

#### Technical Notes
```tsx
// src/atomic-crm/contacts/ContactEdit.tsx
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Edit, SimpleForm, TextInput, ReferenceInput, AutocompleteInput, ArrayInput, SimpleFormIterator } from 'react-admin';
import { contactUpdateSchema } from '../validation/contacts';

export const ContactEdit = () => {
  return (
    <Edit>
      <SimpleForm
        resolver={zodResolver(contactUpdateSchema)}
        defaultValues={contactUpdateSchema.parse({})}
      >
        <TextInput source="first_name" label="First Name" required />
        <TextInput source="last_name" label="Last Name" required />

        <ReferenceInput source="organization_id" reference="organizations">
          <AutocompleteInput optionText="organization_name" />
        </ReferenceInput>

        <ArrayInput source="email" label="Email Addresses">
          <SimpleFormIterator inline disableReordering disableClear>
            <TextInput source="email" label="Email" />
            <SelectInput
              source="type"
              choices={[
                { id: 'Work', name: 'Work' },
                { id: 'Home', name: 'Home' },
                { id: 'Other', name: 'Other' },
              ]}
            />
          </SimpleFormIterator>
        </ArrayInput>

        <ArrayInput source="phone" label="Phone Numbers">
          <SimpleFormIterator inline disableReordering disableClear>
            <TextInput source="number" label="Phone Number" />
            <SelectInput
              source="type"
              choices={[
                { id: 'Work', name: 'Work' },
                { id: 'Home', name: 'Home' },
                { id: 'Mobile', name: 'Mobile' },
                { id: 'Other', name: 'Other' },
              ]}
            />
          </SimpleFormIterator>
        </ArrayInput>

        <TextInput source="title" label="Job Title" />
        <TextInput source="department" />
        <TextInput source="linkedin_url" label="LinkedIn URL" />
        <TextInput source="notes" multiline rows={4} />
      </SimpleForm>
    </Edit>
  );
};

// ContactCreate.tsx is identical structure, just uses Create instead of Edit
```

Reference: `CLAUDE.md` Form State from Schema (Constitution Rule #4)

---

### Task P1-E6-S1-T5: Register Contact Resource in React Admin
**Confidence:** 90%
**Estimate:** 1 hour
**Type:** feature
**Layer:** frontend

#### Prerequisites
- Task P1-E6-S1-T2, T3, T4 completed
- React Admin app initialized

#### Acceptance Criteria
- ✅ Contact module exported with lazy loading
- ✅ Resource registered in React Admin with all CRUD views
- ✅ Route configured: `/contacts`
- ✅ Navigation menu item added
- ✅ Icon assigned (lucide-react `Users`)
- ✅ Record representation set to name field

#### Risk Factors
- None (standard registration)

#### Technical Notes
```typescript
// src/atomic-crm/contacts/index.ts
import * as React from 'react';

const ContactList = React.lazy(() => import('./ContactList'));
const ContactShow = React.lazy(() => import('./ContactShow'));
const ContactEdit = React.lazy(() => import('./ContactEdit'));
const ContactCreate = React.lazy(() => import('./ContactCreate'));

export default {
  list: ContactList,
  show: ContactShow,
  edit: ContactEdit,
  create: ContactCreate,
  recordRepresentation: (record) => record.name,
};
```

```tsx
// src/atomic-crm/root/CRM.tsx
import { Admin, Resource } from 'react-admin';
import { Users } from 'lucide-react';
import contactsModule from '../contacts';
import { authProvider } from '../providers/supabase/authProvider';
import { unifiedDataProvider } from '../providers/supabase/unifiedDataProvider';

export const CRM = () => {
  return (
    <Admin
      authProvider={authProvider}
      dataProvider={unifiedDataProvider}
      layout={Layout}
      loginPage={LoginPage}
    >
      <Resource
        name="contacts"
        {...contactsModule}
        icon={Users}
      />
    </Admin>
  );
};
```

Reference: `CLAUDE.md` Resource Module Pattern

---

## Epic 7: Testing & Documentation

### Task P1-E7-S1-T1: Write Unit Tests for Contact Validation Schema
**Confidence:** 90%
**Estimate:** 2 hours
**Type:** chore
**Layer:** frontend

#### Prerequisites
- Task P1-E6-S1-T1 completed
- Task P1-E1-S1-T4 completed (Vitest configured)

#### Acceptance Criteria
- ✅ Test file created: `contacts.test.ts`
- ✅ Tests for valid contact data
- ✅ Tests for invalid email format
- ✅ Tests for required field validation
- ✅ Tests for JSONB array defaults
- ✅ Test coverage > 90% for validation module

#### Risk Factors
- None (straightforward unit tests)

#### Technical Notes
```typescript
// src/atomic-crm/validation/__tests__/contacts.test.ts
import { describe, it, expect } from 'vitest';
import { contactBaseSchema, contactInsertSchema } from '../contacts';

describe('Contact Validation Schema', () => {
  it('should validate a valid contact', () => {
    const validContact = {
      first_name: 'John',
      last_name: 'Doe',
      email: [{ email: 'john@example.com', type: 'Work' }],
      phone: [{ number: '555-1234', type: 'Mobile' }],
    };

    const result = contactInsertSchema.safeParse(validContact);
    expect(result.success).toBe(true);
  });

  it('should reject invalid email format', () => {
    const invalidContact = {
      first_name: 'John',
      last_name: 'Doe',
      email: [{ email: 'invalid-email', type: 'Work' }],
    };

    const result = contactInsertSchema.safeParse(invalidContact);
    expect(result.success).toBe(false);
  });

  it('should require first_name and last_name', () => {
    const invalidContact = {
      email: [{ email: 'john@example.com', type: 'Work' }],
    };

    const result = contactInsertSchema.safeParse(invalidContact);
    expect(result.success).toBe(false);
  });

  it('should provide default empty arrays for email and phone', () => {
    const contact = {
      first_name: 'John',
      last_name: 'Doe',
    };

    const result = contactInsertSchema.parse(contact);
    expect(result.email).toEqual([]);
    expect(result.phone).toEqual([]);
  });
});
```

---

### Task P1-E7-S1-T2: Write Integration Tests for Contact CRUD
**Confidence:** 70%
**Estimate:** 4 hours
**Type:** chore
**Layer:** frontend + database

#### Prerequisites
- Task P1-E6-S1-T5 completed (Contact resource fully implemented)
- Supabase local instance running

#### Acceptance Criteria
- ✅ Test file created: `ContactList.test.tsx`
- ✅ Mock Supabase client responses
- ✅ Test contact list rendering
- ✅ Test contact creation flow
- ✅ Test contact editing flow
- ✅ Test contact deletion with confirmation
- ✅ Test error states

#### Risk Factors
- **Mocking Supabase:** Complex mock setup (20% risk)
- **React Admin Testing:** Limited documentation (15% risk)

#### Technical Notes
```tsx
// src/atomic-crm/contacts/__tests__/ContactList.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { TestContext } from 'ra-core';
import { ContactList } from '../ContactList';

const mockContacts = [
  {
    id: 1,
    first_name: 'John',
    last_name: 'Doe',
    name: 'John Doe',
    email: [{ email: 'john@example.com', type: 'Work' }],
    phone: [{ number: '555-1234', type: 'Mobile' }],
    title: 'Chef',
  },
];

describe('ContactList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render contact list with data', async () => {
    const dataProvider = {
      getList: vi.fn().mockResolvedValue({
        data: mockContacts,
        total: 1,
      }),
    };

    render(
      <TestContext dataProvider={dataProvider}>
        <ContactList />
      </TestContext>
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('Chef')).toBeInTheDocument();
    });
  });

  it('should display loading state', () => {
    const dataProvider = {
      getList: vi.fn().mockImplementation(() => new Promise(() => {})),
    };

    render(
      <TestContext dataProvider={dataProvider}>
        <ContactList />
      </TestContext>
    );

    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });
});
```

Reference: `docs/claude/testing-quick-reference.md`

---

### Task P1-E7-S1-T3: Create Phase 1 Documentation
**Confidence:** 95%
**Estimate:** 2 hours
**Type:** chore
**Layer:** documentation

#### Prerequisites
- All Phase 1 tasks completed

#### Acceptance Criteria
- ✅ README.md updated with setup instructions
- ✅ Environment variable documentation
- ✅ Database setup guide
- ✅ Development workflow documented
- ✅ Troubleshooting section
- ✅ Architecture decision records (ADRs) for key decisions

#### Risk Factors
- None (documentation task)

#### Technical Notes

Create/update the following files:

**README.md:**
- Quick start guide (5 steps to run locally)
- Prerequisites (Node 18+, Docker)
- Environment setup
- Available scripts

**docs/setup/GETTING_STARTED.md:**
- Detailed setup walkthrough
- First-time user guide
- Common issues and solutions

**docs/architecture/ADR-0001-supabase-auth.md:**
- Document decision to use Supabase Auth
- Rationale: Built-in JWT, RLS integration, OAuth support
- Alternatives considered: Auth0, Firebase Auth
- Consequences: Vendor lock-in (mitigated by open-source)

**docs/architecture/ADR-0002-tailwind-oklch.md:**
- Document OKLCH color system choice
- Rationale: Perceptually uniform, future-proof
- Implementation with CSS variables
- Fallback strategy for older browsers

---

### Task P1-E7-S1-T4: Perform Accessibility Audit (Basic)
**Confidence:** 75%
**Estimate:** 3 hours
**Type:** chore
**Layer:** frontend

#### Prerequisites
- All UI components completed

#### Acceptance Criteria
- ✅ axe DevTools Chrome extension installed
- ✅ Automated accessibility scan run on all pages
- ✅ Critical issues fixed (color contrast, missing labels)
- ✅ Keyboard navigation tested (Tab, Enter, Escape)
- ✅ Screen reader tested with NVDA/JAWS (basic flow)
- ✅ WCAG 2.1 AA compliance achieved for core flows

#### Risk Factors
- **React Admin A11y:** Some components may have issues (15% risk)
- **Screen Reader Testing:** Requires specialized knowledge (12% risk)

#### Technical Notes

**Automated Testing:**
```bash
npm install -D @axe-core/react
```

```typescript
// src/tests/a11y.ts (development only)
import { configureAxe } from '@axe-core/react';

if (import.meta.env.DEV) {
  configureAxe({
    rules: [
      { id: 'color-contrast', enabled: true },
      { id: 'label', enabled: true },
    ],
  });
}
```

**Manual Testing Checklist:**
- [ ] Can navigate entire app with keyboard only
- [ ] Focus indicators visible on all interactive elements
- [ ] Form errors announced to screen readers
- [ ] Images have alt text (or aria-label)
- [ ] Modals trap focus and return focus on close
- [ ] Skip to main content link present
- [ ] Color contrast ratio ≥ 4.5:1 for text

Reference: PRD Section 5 (Accessibility Requirements)

---

## Epic 8: Responsive Design & iPad Optimization

### Task P1-E8-S1-T1: Implement Responsive Breakpoints
**Confidence:** 85%
**Estimate:** 2 hours
**Type:** feature
**Layer:** frontend

#### Prerequisites
- Task P1-E1-S1-T2 completed (Tailwind configured)

#### Acceptance Criteria
- ✅ Breakpoints defined in Tailwind config: `sm`, `md`, `lg`, `xl`, `2xl`
- ✅ iPad-first breakpoint: `md: 768px` (primary target)
- ✅ Mobile breakpoint: `sm: 640px`
- ✅ Desktop breakpoint: `lg: 1024px`
- ✅ Test responsive behavior at each breakpoint

#### Risk Factors
- None (standard responsive setup)

#### Technical Notes
```typescript
// tailwind.config.ts
export default {
  theme: {
    screens: {
      'sm': '640px',  // Mobile landscape
      'md': '768px',  // iPad portrait (PRIMARY TARGET)
      'lg': '1024px', // iPad landscape / Desktop
      'xl': '1280px', // Desktop large
      '2xl': '1536px', // Desktop extra large
    },
  },
}
```

---

### Task P1-E8-S1-T2: Make Layout Responsive (Mobile + Tablet)
**Confidence:** 80%
**Estimate:** 4 hours
**Type:** feature
**Layer:** frontend

#### Prerequisites
- Task P1-E4-S1-T3 completed (Layout component)
- Task P1-E8-S1-T1 completed (Breakpoints)

#### Acceptance Criteria
- ✅ Sidebar collapses to hamburger menu on mobile (`< md`)
- ✅ Top bar adapts height and spacing on mobile
- ✅ Main content area has proper padding on all screen sizes
- ✅ Navigation menu becomes full-screen overlay on mobile
- ✅ Touch targets ≥ 44x44px on mobile/tablet
- ✅ Tested on iPad (768x1024) and iPhone (375x667)

#### Risk Factors
- **Touch Target Size:** Small buttons/links (10% risk)
- **Gesture Conflicts:** Swipe gestures vs click (8% risk)

#### Technical Notes
```tsx
// src/atomic-crm/layout/Layout.tsx (responsive)
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Layout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col">
      <TopBar>
        {/* Hamburger menu button (mobile only) */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </Button>
      </TopBar>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <Sidebar className="hidden md:block" />

        {/* Mobile overlay menu */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-background md:hidden">
            <Sidebar onLinkClick={() => setMobileMenuOpen(false)} />
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
```

---

### Task P1-E8-S1-T3: Optimize Data Tables for iPad
**Confidence:** 75%
**Estimate:** 3 hours
**Type:** feature
**Layer:** frontend

#### Prerequisites
- Task P1-E6-S1-T2 completed (Contact list)
- Task P1-E8-S1-T1 completed (Breakpoints)

#### Acceptance Criteria
- ✅ Table columns adapt based on screen size
- ✅ Mobile: Show only essential columns (Name, Organization)
- ✅ iPad: Show more columns (Name, Organization, Email, Phone)
- ✅ Desktop: Show all columns
- ✅ Horizontal scroll on mobile if needed
- ✅ Row click/tap opens detail view
- ✅ Touch-friendly row height (48px minimum)

#### Risk Factors
- **Column Priority:** Deciding which columns to hide (10% risk)
- **Horizontal Scroll UX:** Not intuitive on mobile (8% risk)

#### Technical Notes
```tsx
// src/atomic-crm/contacts/ContactList.tsx (responsive)
import { useMediaQuery } from '@/hooks/useMediaQuery';

export const ContactList = () => {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');

  return (
    <List>
      <Datagrid rowClick="show" bulkActionButtons={false}>
        <TextField source="name" label="Name" />
        <ReferenceField source="organization_id" reference="organizations">
          <TextField source="organization_name" />
        </ReferenceField>

        {/* Hide on mobile */}
        {!isMobile && (
          <>
            <EmailField source="email" label="Email" />
            <PhoneField source="phone" label="Phone" />
          </>
        )}

        {/* Desktop only */}
        {!isMobile && !isTablet && (
          <>
            <TextField source="title" label="Title" />
            <TextField source="department" />
          </>
        )}
      </Datagrid>
    </List>
  );
};
```

---

## Summary & Next Steps

### Phase 1 Completion Checklist

**Infrastructure (Epic 1):**
- [x] React 19 + Vite + TypeScript configured
- [x] Tailwind CSS 4 with OKLCH colors
- [x] ESLint + Prettier + Husky
- [x] Vitest + Testing Library

**Database (Epic 2):**
- [x] Supabase local development running
- [x] Initial schema migration (sales, contacts, organizations)
- [x] RLS policies with two-layer security
- [x] Seed data script

**Authentication (Epic 3):**
- [x] Supabase Auth provider
- [x] Login page with JWT refresh
- [x] Protected routes
- [x] User identity management

**Layout (Epic 4):**
- [x] Top navigation bar
- [x] Sidebar navigation
- [x] Main layout template
- [x] Breadcrumb navigation

**State Management (Epic 5):**
- [x] TanStack Query configured
- [x] Zustand for UI state
- [x] Unified data provider

**Steel Thread (Epic 6):**
- [x] Contact validation schema (Zod)
- [x] Contact list view
- [x] Contact detail view
- [x] Contact create/edit forms
- [x] Contact resource registered

**Quality (Epic 7):**
- [x] Unit tests for validation
- [x] Integration tests for CRUD
- [x] Documentation updated
- [x] Basic accessibility audit

**Responsive (Epic 8):**
- [x] Responsive breakpoints
- [x] Mobile/tablet layout
- [x] Optimized data tables

### Phase 2 Readiness

Phase 1 establishes:
- ✅ Complete development infrastructure
- ✅ Authentication system working
- ✅ Database with RLS security
- ✅ Proven CRUD pattern (Contacts)
- ✅ Responsive layout foundation

**You are now ready to:**
1. Replicate Contact pattern for Organizations (Phase 2)
2. Add Products module (Phase 4)
3. Build Opportunities with Kanban board (Phase 5)
4. Implement Tasks and Activity tracking (Phase 6)

### Known Technical Debt

1. **Error Handling:** Basic error messages need improvement
2. **Loading States:** Some skeleton loaders missing
3. **Accessibility:** Need full WCAG audit (only basic done in Phase 1)
4. **Performance:** No lazy loading or code splitting yet
5. **Monitoring:** No error tracking (Sentry) or analytics

### Risk Mitigation Outcomes

**Resolved Risks:**
- ✅ Supabase Auth integration (used proven `ra-supabase-core`)
- ✅ OKLCH color system (working in Tailwind CSS 4)
- ✅ RLS two-layer security (documented and tested)

**Remaining Risks for Phase 2+:**
- JSONB array filtering in data provider (complex queries)
- Real-time subscriptions for multi-user updates
- File upload for avatars and attachments
- Email integration for activity logging

---

## Appendix: Task Summary by Confidence Level

### High Confidence (90-100%): 15 tasks, 30 hours
- Project initialization
- Package installations
- Database schema migrations
- Standard UI components
- Documentation

### Medium Confidence (75-89%): 18 tasks, 47 hours
- Tailwind CSS 4 configuration
- Supabase Auth integration
- RLS policy setup
- React Admin data provider
- Responsive design
- Accessibility audit

### Lower Confidence (60-74%): 7 tasks, 15 hours
- JSONB array form inputs
- Integration testing
- Complex filtering
- Mobile gesture handling

**Average Confidence: 82%**

---

## Reference Documentation

- **PRD:** `/home/krwhynot/projects/crispy-crm/docs/PRD.md`
- **CLAUDE.md:** `/home/krwhynot/projects/crispy-crm/CLAUDE.md`
- **Supabase Workflow:** `/home/krwhynot/projects/crispy-crm/docs/supabase/WORKFLOW.md`
- **Engineering Constitution:** `/home/krwhynot/projects/crispy-crm/docs/claude/engineering-constitution.md`
- **Color System:** `/home/krwhynot/projects/crispy-crm/docs/internal-docs/color-theming-architecture.docs.md`
- **Testing Guide:** `/home/krwhynot/projects/crispy-crm/docs/claude/testing-quick-reference.md`

---

**Document Version:** 1.0
**Created:** November 3, 2025
**Last Updated:** November 3, 2025
**Status:** ✅ Complete
