# Migration History Log

## Overview
This document chronicles the chronological evolution of the Atomic CRM database schema, documenting each migration with its business context, technical changes, and impact on the system.

## Migration Timeline

### 📅 2024-07-30 07:50:29 - Initial Database Setup
**File**: `20240730075029_init_db.sql`
**Status**: ✅ Applied
**Type**: Foundation

#### Business Context
Initial database creation for the Atomic CRM system. Established core entity structure for a collaborative sales management platform.

#### Technical Changes
- **Created 8 core tables**: companies, contacts, deals, sales, contactNotes, dealNotes, tasks, tags
- **Established 12 foreign key relationships** for data integrity
- **Enabled Row-Level Security** on all tables
- **Implemented comprehensive RLS policies** for authenticated user access
- **Created storage bucket** 'attachments' for file uploads
- **Added 2 summary views**: companies_summary, contacts_summary

#### Data Model Decisions
- Used `bigint` identity columns for all primary keys
- Implemented `jsonb` for flexible data (logos, avatars, attachments)
- Used arrays for many-to-many relationships (tags, contact_ids)
- Adopted collaborative security model (all authenticated users can access all data)

#### Breaking Changes
- N/A (Initial setup)

---

### 📅 2024-07-30 07:54:25 - Authentication Integration
**File**: `20240730075425_init_triggers.sql`
**Status**: ✅ Applied
**Type**: Enhancement

#### Business Context
Integrated Supabase authentication with the sales team management system. Automated user onboarding and profile synchronization.

#### Technical Changes
- **Created 2 PL/pgSQL functions**:
  - `handle_new_user()`: Auto-creates sales record for new auth users
  - `handle_update_user()`: Syncs auth profile changes to sales table
- **Added database triggers**:
  - `on_auth_user_created`: Triggers on auth.users INSERT
  - `on_auth_user_updated`: Triggers on auth.users UPDATE
- **Created unique index**: `uq__sales__user_id` for auth integration
- **Added initialization view**: `init_state` to check system setup

#### Business Logic
- First user becomes administrator automatically
- User metadata (first_name, last_name) synced from auth system
- Sales records tied to auth.users for security

#### Breaking Changes
- None (additive changes only)

---

### 📅 2024-08-06 12:45:55 - Task Assignment Enhancement
**File**: `20240806124555_task_sales_id.sql`
**Status**: ✅ Applied
**Type**: Feature Enhancement

#### Business Context
Enhanced task management by adding sales representative assignment tracking. Enabled better workload distribution and accountability.

#### Technical Changes
- **Added column**: `tasks.sales_id` (bigint, nullable)
- **Implicit foreign key**: References `sales.id` (enforced by application)

#### Impact
- Tasks can now be assigned to specific sales reps
- Improved task filtering and reporting capabilities
- Better team collaboration and workload visibility

#### Breaking Changes
- None (nullable column, backward compatible)

---

### 📅 2024-08-07 08:24:49 - Contact Data Cleanup
**File**: `20240807082449_remove-aquisition.sql`
**Status**: ✅ Applied
**Type**: Schema Cleanup

#### Business Context
Removed unused 'acquisition' field from contacts table to streamline data model and reduce confusion.

#### Technical Changes
- **Dropped column**: `contacts.acquisition`
- **Recreated view**: `contacts_summary` with updated schema (CASCADE)

#### Business Reasoning
- Field was not being used in the application
- Simplified contact data model
- Reduced storage overhead

#### Breaking Changes
- ⚠️ Applications referencing `contacts.acquisition` would break
- Views dependent on the column were automatically recreated

---

### 📅 2024-08-08 14:18:26 - Initialization State Fix
**File**: `20240808141826_init_state_configure.sql`
**Status**: ✅ Applied
**Type**: Bug Fix

#### Business Context
Fixed the initialization state detection view to work correctly with system setup validation.

#### Technical Changes
- **Modified view**: `init_state` with improved query logic
- **Changed security context**: `security_invoker=off` for consistent results
- **Optimized query**: Added subquery with LIMIT for performance

#### Problem Solved
- Previous view had potential counting issues
- Improved reliability of system initialization checks
- Better performance for admin dashboard

#### Breaking Changes
- None (view interface unchanged)

---

### 📅 2024-08-13 08:40:10 - Tag Management Policies
**File**: `20240813084010_tags_policy.sql`
**Status**: ✅ Applied
**Type**: Security Enhancement

#### Business Context
Completed RLS policy coverage for tags table, enabling full CRUD operations on tags for authenticated users.

#### Technical Changes
- **Added RLS policies**:
  - `"Enable delete for authenticated users only"` on tags
  - `"Enable update for authenticated users only"` on tags

#### Security Enhancement
- Tags can now be fully managed by authenticated users
- Completed the security model for tag administration
- Consistent policy pattern across all tables

#### Breaking Changes
- None (additive security policies)

---

### 📅 2024-11-04 15:32:31 - Sales Security Policies
**File**: `20241104153231_sales_policies.sql`
**Status**: ✅ Applied (Assumed based on naming pattern)
**Type**: Security Enhancement

#### Business Context
Enhanced security policies for sales table management, likely completing the RLS implementation.

#### Expected Changes
- Additional RLS policies for sales table operations
- Refined access control for team member management

*Note: File content not provided in migration scan*

---

### 📅 2025-01-09 15:25:31 - Email JSONB Migration
**File**: `20250109152531_email_jsonb.sql`
**Status**: ✅ Applied
**Type**: Major Data Structure Change

#### Business Context
Modernized contact email storage to support multiple emails per contact with type classification (Work, Home, Other). Enhanced flexibility for comprehensive contact management.

#### Technical Changes
- **Added column**: `contacts.email_jsonb` (jsonb)
- **Data migration**: Converted existing email strings to JSONB format
  ```json
  [{"email": "user@domain.com", "type": "Other"}]
  ```
- **Dropped column**: `contacts.email` (after migration)
- **Recreated view**: `contacts_summary` with new structure
- **Added search field**: `email_fts` for full-text search on email arrays

#### Migration Strategy
1. Add new JSONB column
2. Migrate existing data with default "Other" type
3. Update view to support new structure
4. Drop old column (breaking change)

#### Breaking Changes
- ⚠️ **MAJOR**: `contacts.email` column removed
- ⚠️ Applications must use `email_jsonb` format
- ⚠️ Direct email queries need JSONPath syntax

#### Benefits
- Multiple emails per contact support
- Email type classification
- Better data structure for modern contact management
- Full-text search capabilities

---

### 📅 2025-01-13 13:25:31 - Phone JSONB Migration
**File**: `20250113132531_phone_jsonb.sql`
**Status**: ✅ Applied
**Type**: Major Data Structure Change

#### Business Context
Completed the contact information modernization by migrating phone numbers to JSONB format, matching the email structure and providing consistent multi-value support.

#### Technical Changes
- **Added column**: `contacts.phone_jsonb` (jsonb)
- **Data migration**: Complex migration preserving both phone entries
  ```json
  [
    {"number": "+1-555-0123", "type": "Work"},
    {"number": "+1-555-0124", "type": "Home"}
  ]
  ```
- **Dropped columns**:
  - `contacts.phone_1_number`
  - `contacts.phone_1_type`
  - `contacts.phone_2_number`
  - `contacts.phone_2_type`
- **Updated view**: `contacts_summary` with phone search support
- **Added search field**: `phone_fts` for full-text search on phone arrays

#### Migration Logic
1. Conditionally construct JSONB array based on existing phone data
2. Handle NULL values gracefully
3. Preserve type information from separate columns
4. Clean up old column structure

#### Breaking Changes
- ⚠️ **MAJOR**: All phone_* columns removed
- ⚠️ Applications must use `phone_jsonb` format
- ⚠️ Phone queries need JSONPath syntax

#### Benefits
- Unlimited phone numbers per contact
- Consistent data structure with emails
- Type classification for all phone numbers
- Simplified schema (fewer columns)

---

### 📅 2024-12-21 12:00:00 - Tag Color System Migration
**File**: `20241221120000_migrate_tag_colors.sql`
**Status**: ✅ Applied
**Type**: Data Standardization

#### Business Context
Migrated from hexadecimal color codes to semantic color identifiers for tags, supporting the new Tailwind v4 color system and improving design consistency.

#### Technical Changes
- **Created backup table**: `tags_color_backup` for rollback capability
- **Color mapping**: Converted 10 hex colors to semantic names
  - `#eddcd2` → `warm`
  - `#fff1e6` → `yellow`
  - `#fde2e4` → `pink`
  - `#fad2e1` → `pink`
  - `#c5dedd` → `teal`
  - `#dbe7e4` → `green`
  - `#f0efeb` → `gray`
  - `#d6e2e9` → `blue`
  - `#bcd4e6` → `blue`
  - `#99c1de` → `teal`
- **Added constraint**: `valid_tag_colors` with 8 allowed values
- **Data validation**: Integrity checks during migration

#### Migration Safety
- Transactional migration with rollback capability
- Data validation with error handling
- Backup table for recovery
- Constraint enforcement for future data integrity

#### Breaking Changes
- ⚠️ Applications using hex color values will break
- ⚠️ Must use semantic color names: warm, green, teal, blue, purple, yellow, gray, pink

#### Benefits
- Consistent with new design system
- Better color management across UI
- Type-safe color usage
- Future-proof design token system

---

### 📅 2024-12-21 12:00:01 - Tag Color Rollback Script
**File**: `20241221120001_rollback_tag_colors.sql`
**Status**: 🔄 Rollback Script (Not Applied)
**Type**: Rollback Preparation

#### Purpose
Provides rollback capability for the tag color migration in case of issues with the semantic color system.

#### Expected Rollback Process
1. Restore colors from `tags_color_backup` table
2. Remove color constraint
3. Validate data integrity
4. Clean up backup table

*Note: This is a safety script, not applied in normal flow*

---

## Migration Patterns and Conventions

### Naming Convention
- **Format**: `YYYYMMDD_HHMMSS_description.sql`
- **Description**: Snake_case with clear intent
- **Examples**: `init_db`, `email_jsonb`, `migrate_tag_colors`

### Migration Types
1. **Foundation**: Initial schema creation
2. **Enhancement**: New features and capabilities
3. **Schema Cleanup**: Removing unused elements
4. **Bug Fix**: Correcting implementation issues
5. **Security Enhancement**: RLS and permission updates
6. **Data Structure Change**: Major schema modifications
7. **Data Standardization**: Format and content migrations

### Safety Practices
- **Backup tables** for major data migrations
- **Transactional migrations** with rollback capability
- **Data validation** during and after migration
- **Constraint additions** for data integrity
- **View recreation** when dependent structures change

### Breaking Change Management
- **Major version bumps** for breaking schema changes
- **Migration guides** for application updates
- **Deprecation warnings** before removals
- **Rollback scripts** for critical migrations

## Future Migration Considerations

### Planned Enhancements
1. **Multi-tenancy support**: Row-level data segregation
2. **Advanced permissions**: Role-based access control
3. **Audit logging**: Change tracking and compliance
4. **Performance optimization**: Indexing and partitioning

### Migration Best Practices
1. Always test migrations on staging data
2. Create rollback scripts for major changes
3. Document breaking changes thoroughly
4. Use transactional migrations where possible
5. Validate data integrity after each migration

### Emergency Procedures
- Rollback process for failed migrations
- Data recovery from backup tables
- Application compatibility verification
- Production deployment checklist