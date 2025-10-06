# Understanding Roles and RBAC in Your CRM

## What is RBAC?

**RBAC = Role-Based Access Control**

It's a way to control who can do what in your application based on their role.

## Simple Analogy: Office Building

Think of your CRM like an office building:

```
🏢 Office Building (Your CRM)
├─ 🚪 Front Door (anon role)          - Anyone can walk in
├─ 🔑 Employee Badge (authenticated)  - Employees can access their floor
├─ 🎫 Manager Badge (sales manager)   - Managers can access all floors
└─ 🔐 Master Key (service_role)       - Building maintenance, bypasses all locks
```

## Your Current Setup

### PostgreSQL Roles (Database Level)

Think of these as "badge types" in the building:

1. **`anon`** 🚪
   - Public/anonymous users
   - Can only see what's marked as public
   - Like walking into the lobby without ID

2. **`authenticated`** 🔑
   - Logged-in users
   - Can access their own data
   - Like having an employee badge - you can access your desk

3. **`service_role`** 🔐
   - Backend services / admin operations
   - **Bypasses ALL security** (`rolbypassrls: true`)
   - Like the master key - opens everything

### Application Roles (Business Logic Level)

These are roles **YOU** define for your business:

Currently in your `sales` table:
```sql
sales.is_admin BOOLEAN
```

This gives you:
- **Regular Sales Rep** (`is_admin = false`)
- **Sales Admin** (`is_admin = true`)

You COULD expand this to:
```sql
sales.role TEXT  -- 'rep', 'manager', 'admin'
```

## How They Work Together

```
User logs in
    ↓
Gets PostgreSQL role: "authenticated"
    ↓
Gets application role from sales table: "sales rep" or "admin"
    ↓
RLS Policies check both:
    - Is user authenticated? ✅
    - Is user allowed to see this data? (checks sales.is_admin)
```

### Example: Viewing Opportunities

**Regular Sales Rep:**
```
John logs in → authenticated role
              → sales.is_admin = false
              → RLS Policy: "Can only see own opportunities"
              → Sees: Only opportunities where he's assigned
```

**Sales Admin:**
```
Sarah logs in → authenticated role
               → sales.is_admin = true
               → RLS Policy: "Can see all opportunities"
               → Sees: ALL opportunities in system
```

**Service Role (Tests):**
```
Test script runs → service_role
                  → Bypasses ALL RLS
                  → Can insert/delete ANY data
                  → Used for test setup/cleanup
```

## RLS = Row Level Security

RLS is like having **automatic filters** on your data:

```sql
-- Policy: Users can only see their own contacts
CREATE POLICY "users_own_contacts" ON contacts
  FOR SELECT
  USING (auth.uid() = user_id);
```

**What this does:**
```sql
-- User runs this:
SELECT * FROM contacts;

-- But PostgreSQL automatically adds:
SELECT * FROM contacts WHERE user_id = current_user_id;
```

So even if a user tries to hack the SQL, they CANNOT see other people's data.

## Your 14 Supabase Roles

Remember those 14 roles? Here's the breakdown:

### You Use (3 roles):
1. `anon` - Anonymous users
2. `authenticated` - Logged in users
3. `service_role` - Backend / tests

### Supabase Infrastructure Uses (11 roles):
4. `supabase_admin` - Platform superuser
5. `supabase_auth_admin` - Auth service
6. `supabase_storage_admin` - File storage
7. `supabase_realtime_admin` - Live subscriptions
8. ... (7 more for internal services)

**You never touch the Supabase infrastructure roles.** They're for Supabase's microservices.

## Common Patterns

### Pattern 1: Simple (What you have now)
```
authenticated role + is_admin boolean
```
- ✅ Simple
- ✅ Works for small teams
- ❌ Not very flexible

### Pattern 2: Role Column
```
authenticated role + role enum ('rep', 'manager', 'admin')
```
- ✅ More flexible
- ✅ Easy to understand
- ❌ Still limited

### Pattern 3: Full RBAC System
```
authenticated role + user_roles table + permissions table
```
- ✅ Very flexible
- ✅ Enterprise-grade
- ❌ Overkill for 6-8 users

## Current Test Problem

Your tests are failing because:

```
Test tries to create data
    ↓
Uses service_role client
    ↓
Should bypass RLS (rolbypassrls: true)
    ↓
But getting "permission denied" ❌
    ↓
Suggests client isn't properly using service_role
```

## Key Takeaway

- **PostgreSQL Roles** = Database-level access (anon, authenticated, service_role)
- **Application Roles** = Business logic (sales rep, manager, admin)
- **RLS** = Automatic row-level filtering based on rules you define
- **service_role** = Bypass everything (for admin operations and tests)

The 14 Supabase roles are infrastructure - you only care about 3 of them for your app.

## Visual Summary

```
Your Application
├─ Public Website (anon role)
├─ Logged-in Users (authenticated role)
│  ├─ Sales Rep (is_admin = false)
│  │  └─ RLS: See own data only
│  └─ Sales Admin (is_admin = true)
│     └─ RLS: See all data
└─ Backend/Tests (service_role)
   └─ No RLS - full access
```
