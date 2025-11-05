---
**Part of:** Atomic CRM Product Requirements Document
**Feature Module:** User Management & Authentication
**Category:** Features

**Related Documents:**
- 📋 [README - Master Index](./00-README.md)
- 🗄️ [Data Architecture](./02-data-architecture.md) - Database schema for users and roles
- 🎨 [Design System](./15-design-tokens.md) - UI patterns for forms and authentication
- ⚙️ [Technical Stack](./18-tech-stack.md) - Supabase Auth implementation
- 🔒 [Security Patterns](./17-security.md) - Authentication security best practices
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
| **Sales Rep** | Full CRUD | Full CRUD | Full CRUD | Read | Full CRUD | Own tasks only |
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
