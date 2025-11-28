---
> **⚠️ SUPERSEDED**: See `../PRD.md` v1.18 Section 10 (Technical Requirements) for auth specs.

**Part of:** Crispy-CRM Product Requirements Document (v1.5 - ARCHIVED)
**Feature Module:** User Management & Authentication
**Category:** Features

**Related Documents:**
- 📋 [README - Master Index](./00-README.md)
- 🗄️ [Data Architecture](./02-data-architecture.md) - Database schema for users and roles
- 🎨 [Design System](./15-design-tokens.md) - UI patterns for forms and authentication
- ⚙️ [Technical Stack](./18-tech-stack.md) - Supabase Auth implementation
- 🔒 [Security Patterns](./17-security.md) - Authentication security best practices
---

## 📊 Implementation Status

**Last Updated:** November 6, 2025

| Metric | Status |
|--------|-----------|
| **Completion** | ⚠️ **65%** |
| **Confidence** | 🟡 **MEDIUM** - Core auth works, advanced features missing |
| **Files** | 6 total (auth provider, login, profile) |
| **CRUD Operations** | ✅ Login/Logout complete |
| **Database Schema** | ✅ Supabase auth schema with sales table sync |
| **Validation** | ✅ Basic email/password validation |
| **Advanced Features** | 🚧 Partial - Basic auth only, no OAuth/2FA |

**Completed Requirements:**
- ✅ Email/password authentication (Supabase Auth)
- ✅ Login page (Login.tsx with email/password form)
- ✅ Session management (authProvider.ts)
- ✅ Password reset flow (forgot password link)
- ✅ Auth provider integration (providers/supabase/authProvider.ts)
- ✅ User profile page (Profile.tsx for viewing)
- ✅ Sales table sync with auth.users (database trigger)
- ✅ Shared team collaboration access (RLS policies)

**Missing Requirements (35%):**

| Task | Status | Confidence | Estimate |
|------|--------|-----------|----------|
| Implement password visibility toggle | ❌ Missing | 🟢 HIGH | 2 hours |
| Add "remember me" option (30-day session) | ❌ Missing | 🟢 HIGH | 4 hours |
| Enhance role-based permissions (Account Manager/Read-Only) | ❌ Missing | 🟡 MEDIUM | 2 days |
| Add user profile editing | ❌ Missing | 🟢 HIGH | 1 day |
| Add comprehensive auth test coverage | 🟡 Partial | 🟢 HIGH | 3 days |

**Deferred to Post-MVP:**

| Feature | Status | Rationale |
|---------|--------|-----------|
| OAuth integration (Google) | ⏸️ Deferred | Email/password sufficient for Excel replacement MVP |
| OAuth integration (Microsoft) | ⏸️ Deferred | Enterprise feature, defer until adoption proven |
| Two-factor authentication (2FA/TOTP) | ⏸️ Deferred | Security enhancement, not critical for small team MVP |

**Details:**
- **Core Auth:** Email/password login works with Supabase Auth, password reset functional
- **OAuth:** Deferred to Post-MVP (enterprise feature)
- **2FA:** Deferred to Post-MVP (security enhancement)
- **Role Limitations:** Only basic authenticated access implemented, not full role system (Admin/Sales Manager/Account Manager/Read-Only)
- **UX Gaps:** No password visibility toggle, no "remember me" checkbox
- **Profile:** View-only profile page exists, but no editing capability
- **Test Coverage:** E2E auth setup exists (`auth.setup.ts` + `LoginPage` POM) for login flow, but missing comprehensive tests for logout, password reset, session management, and error scenarios

**Blockers:** None

**Recommendation:** Add password visibility toggle and "remember me" for UX improvements. OAuth and 2FA deferred until team proves they'll adopt the CRM consistently.

---

# 3.1 User Management & Authentication

## User Registration & Login

**Features:**
- Email-based authentication with password
- OAuth integration (Google, Microsoft) for SSO
- Password reset via email link
- Session management (30-day "remember me" option)
- Two-factor authentication (optional, admin-configurable)

**UI Requirements:**
- Clean, centered login form on brand background
- Clear error messages for failed authentication
- Password visibility toggle
- "Forgot password" link prominent
- OAuth buttons visually distinct from form submission

## User Roles & Permissions

**Access Model: Shared Team Collaboration**

This CRM is designed for a **small collaborative team (2-10 people)** working together on a shared customer base. All authenticated users can view and edit all shared resources to enable teamwork and flexibility.

| Role | Organizations | Contacts | Opportunities | Products | Activities | Tasks |
|------|--------------|----------|---------------|----------|------------|-------|
| **Admin** | Full CRUD | Full CRUD | Full CRUD | Full CRUD | Full CRUD | Full CRUD (all users) |
| **Sales Manager** | Full CRUD | Full CRUD | Full CRUD | Full CRUD | Full CRUD | Full CRUD (all users) |
| **Account Manager** | Full CRUD | Full CRUD | Full CRUD | Read | Full CRUD | Own tasks only |
| **Read-Only** | Read | Read | Read | Read | Read | Own tasks only |

**Access Control Rules:**

**Shared Resources** (Collaborative team access):
- **Organizations**: All authenticated users can view, create, edit, and delete
- **Contacts**: All authenticated users can view, create, edit, and delete
- **Opportunities**: All authenticated users can view, create, edit, and delete
- **Activities**: All authenticated users can view, create, edit, and delete
- **Products**: All authenticated users can view (Admins/Managers can edit)

**Personal Resources** (Creator-only access):
- **Tasks**: Users can only view, edit, and delete their own tasks
- Designed for individual task management within shared CRM environment

**Why Shared Access?**
- Enables team members to help each other (cover vacations, handle urgent requests)
- Allows managers to step in on any account when needed
- Simplifies training and reduces permission-related support issues
- Trust-based model suitable for small, collaborative sales teams

**Future Multi-Tenant Note:** If expanding to multiple companies/tenants, add `company_id` to isolate data between organizations.
