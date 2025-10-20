# CSV Import/Export Enhancement - Parallel Implementation Plan

## Overview
The CSV import system currently has a 100% failure rate for real-world CSV files due to rigid header matching. This plan breaks down the enhancement into parallel-executable tasks, with Phase 1 addressing immediate needs (column flexibility, preview validation, error reporting) and Phase 2 providing advanced features if needed. The implementation preserves all existing functionality while adding intelligent column mapping, pre-import validation, and detailed error tracking.

## Critically Relevant Files and Documentation

### Core Import System
- `/src/atomic-crm/contacts/ContactImportDialog.tsx` - Main import dialog with state machine
- `/src/atomic-crm/contacts/useContactImport.tsx` - Business logic for contact importing
- `/src/atomic-crm/misc/usePapaParse.tsx` - Generic CSV parsing hook
- `/src/atomic-crm/contacts/ContactImportButton.tsx` - Toolbar button entry point
- `/src/atomic-crm/contacts/ContactList.tsx` - List view with export functionality

### Data Layer
- `/src/atomic-crm/providers/supabase/unifiedDataProvider.ts` - Data provider with validation
- `/src/atomic-crm/validation/contacts.ts` - Contact Zod schemas
- `/src/atomic-crm/types.ts` - TypeScript interfaces

### Documentation
- `/.docs/plans/csv-import-export-enhancement/shared.md` - Architecture overview
- `/.docs/plans/csv-import-export-enhancement/requirements.md` - Feature specifications
- `/.docs/plans/csv-import-export-enhancement/ui-implementation-plan.md` - UI component details
- `/docs/internal-docs/csv-import-current-state.docs.md` - Current state analysis

## Phase 1: Core Flexibility Enhancement

### Task 1.1: Column Alias Registry [Depends on: none]

**READ THESE BEFORE TASK**
- `/src/atomic-crm/contacts/useContactImport.tsx` - Understand ContactImportSchema fields
- `/src/atomic-crm/validation/contacts.ts` - Contact validation schemas
- `/.docs/plans/csv-import-export-enhancement/requirements.md` - See Appendix for initial alias set

**Instructions**

Files to Create:
- `/src/atomic-crm/contacts/columnAliases.ts`

Create a column mapping registry that maps common CSV header variations to ContactImportSchema fields (NOT database fields). Include utility functions for header normalization and canonical field lookup. The registry should handle 50+ common variations including case-insensitive matching, trimming, and special characters.

Key mappings to include:
- `organization_name` (not organization_id) ← ['Organizations', 'Company', 'Organizations (DropDown)']
- `email_work/email_home/email_other` ← various email header formats
- `phone_work/phone_home/phone_other` ← various phone header formats

Include special pattern detection for full name columns that need splitting.

### Task 1.2: Enhanced CSV Parser Hook [Depends on: 1.1]

**READ THESE BEFORE TASK**
- `/src/atomic-crm/misc/usePapaParse.tsx` - Current parser implementation
- `/src/atomic-crm/contacts/columnAliases.ts` - Column alias registry (from 1.1)
- `/.docs/plans/csv-import-export-enhancement/shared.md` - Line 86-93 for DryRun contract

**Instructions**

Files to Modify:
- `/src/atomic-crm/misc/usePapaParse.tsx`

Add OPTIONAL parameters to the existing usePapaParse hook:
- `transformHeaders?: (headers: string[]) => string[]` - Apply column aliases
- `onPreview?: (rows: T[]) => void` - Callback for preview mode
- `previewRowCount?: number` - Parse only first N rows for preview

All changes must be backward compatible. The hook should remain generic (`<T>`) and work for any resource type, not just contacts.

### Task 1.3: Contact Import Preview Component [Depends on: none]

**READ THESE BEFORE TASK**
- `/src/atomic-crm/contacts/ContactImportDialog.tsx` - Understand dialog structure
- `/src/atomic-crm/validation/contacts.ts` - Validation schemas
- `/.docs/plans/csv-import-export-enhancement/ui-implementation-plan.md` - UI specifications
- `/src/components/ui/dialog.tsx` - Dialog component patterns

**Instructions**

Files to Create:
- `/src/atomic-crm/contacts/ContactImportPreview.tsx`

Create a preview component that displays:
1. Column mapping table showing user headers → CRM fields
2. Sample data preview (first 5 rows transformed)
3. Validation summary with counts and warnings
4. List of new organizations/tags to be created

**IMPORTANT**: For preview validation, use client-side validation by importing the contact schema directly:
```typescript
import { contactSchema } from '@/atomic-crm/validation/contacts';
// Validate locally, don't use data provider yet
```

The component should accept preview data and return user's confirmation to proceed. Use existing UI components from `/src/components/ui/`.

### Task 1.4: Enhanced Error Result Component [Depends on: none]

**READ THESE BEFORE TASK**
- `/src/atomic-crm/contacts/ContactImportDialog.tsx` - Current result display
- `/src/components/ui/alert.tsx` - Alert component patterns
- `/.docs/plans/csv-import-export-enhancement/requirements.md` - Error reporting requirements

**Instructions**

Files to Create:
- `/src/atomic-crm/contacts/ContactImportResult.tsx`

Create an enhanced result modal that shows:
- Success/skipped/failed counts with progress ring visualization
- Detailed error list with row numbers and reasons
- Import duration and performance metrics
- Action buttons for retry or close

The component should handle both successful and error states gracefully.

### Task 1.5: Import Business Logic Enhancement [Depends on: 1.1]

**READ THESE BEFORE TASK**
- `/src/atomic-crm/contacts/useContactImport.tsx` - Current import logic
- `/src/atomic-crm/contacts/columnAliases.ts` - Column aliases (from 1.1)
- `/.docs/plans/csv-import-export-enhancement/shared.md` - Caching strategy

**Instructions**

Files to Modify:
- `/src/atomic-crm/contacts/useContactImport.tsx`

Enhance the import hook to:
1. Change `Promise.all` to `Promise.allSettled` for better error tracking
2. Track errors per row with detailed reasons
3. Support preview mode (dry-run validation without database writes)
4. Return enhanced result object with row-level error details

Maintain the existing caching strategy for organizations and tags.

### Task 1.6: Import Dialog State Machine Update [Depends on: 1.3, 1.4]

**READ THESE BEFORE TASK**
- `/src/atomic-crm/contacts/ContactImportDialog.tsx` - Current state machine
- `/src/atomic-crm/contacts/ContactImportPreview.tsx` - Preview component (from 1.3)
- `/src/atomic-crm/contacts/ContactImportResult.tsx` - Result component (from 1.4)
- `/.docs/plans/csv-import-export-enhancement/ui-implementation-plan.md` - State machine design

**Instructions**

Files to Modify:
- `/src/atomic-crm/contacts/ContactImportDialog.tsx`

Add new states to the FSM:
- `previewing` state after parsing
- `confirmed` state after user confirms preview

Integrate the new preview and result components. Add feature flag `ENABLE_IMPORT_PREVIEW` (default: false) to allow gradual rollout.

### Task 1.7: Export Template Button [Depends on: none]

**READ THESE BEFORE TASK**
- `/src/atomic-crm/contacts/ContactList.tsx` - Toolbar structure
- `/src/atomic-crm/contacts/contacts_export.csv` - Sample CSV template
- `/src/components/admin/export-button.tsx` - Export button patterns

**Instructions**

Files to Create:
- `/src/atomic-crm/contacts/ContactExportTemplateButton.tsx`

Files to Modify:
- `/src/atomic-crm/contacts/ContactList.tsx`

Create a template download button that generates a blank CSV with canonical headers and one sample row. Add the button to the ContactList toolbar. Include tooltip or modal with format instructions.

### Task 1.8: Export Header Alignment [Depends on: 1.1]

**READ THESE BEFORE TASK**
- `/src/atomic-crm/contacts/ContactList.tsx` - Current exporter function
- `/src/atomic-crm/contacts/columnAliases.ts` - Canonical field names (from 1.1)

**Instructions**

Files to Modify:
- `/src/atomic-crm/contacts/ContactList.tsx`

Update the exporter function to use canonical header names that match import expectations:
- Change `company` → `organization_name`
- Flatten email JSONB to `email_work`, `email_home`, `email_other` columns
- Flatten phone JSONB to `phone_work`, `phone_home`, `phone_other` columns

This ensures exported CSVs can be re-imported without manual header changes.

## Phase 2: Advanced Features (Conditional Implementation)

**IMPORTANT**: Phase 2 tasks should ONLY be implemented if:
- Phase 1 success rate < 85% after 30 days of user testing
- User feedback specifically requests these features
- Import volumes exceed browser limits (10k+ rows regularly)

### Task 2.1: Interactive Column Mapper UI [Depends on: Phase 1 complete]

**READ THESE BEFORE TASK**
- `/src/atomic-crm/contacts/ContactImportDialog.tsx` - Integration point
- `/.docs/plans/csv-import-export-enhancement/requirements.md` - Phase 2 UI specs
- `/src/components/ui/` - Available UI components

**Instructions**

Files to Create:
- `/src/atomic-crm/contacts/ContactColumnMapper.tsx`

Create an interactive mapping interface with:
- Drag-and-drop column assignment
- Visual validation indicators
- Complex transformations (split, combine, format)
- Save/load mapping templates

This replaces automatic alias matching when user needs custom mappings.

### Task 2.2: Database Schema for Import Jobs [Depends on: none]

**READ THESE BEFORE TASK**
- `/docs/supabase/WORKFLOW.md` - Migration workflow
- `/.docs/plans/csv-import-export-enhancement/requirements.md` - Phase 2 schema

**Instructions**

Files to Create:
- `/supabase/migrations/[timestamp]_add_import_jobs.sql`
- `/supabase/migrations/[timestamp]_add_saved_import_mappings.sql`

Create migrations for:
1. `import_jobs` table - Track background import status
2. `saved_import_mappings` table - User's saved column mappings

Include proper RLS policies for user data isolation. Use `npx supabase migration new` to generate files.

### Task 2.3: Import Jobs Edge Function [Depends on: 2.2]

**READ THESE BEFORE TASK**
- `/supabase/functions/` - Edge function patterns
- `/.docs/plans/csv-import-export-enhancement/requirements.md` - Background processing specs
- `/src/atomic-crm/validation/contacts.ts` - Validation to reuse

**Instructions**

Files to Create:
- `/supabase/functions/import-contacts/index.ts`
- `/supabase/functions/import-contacts/schemas.ts`

Create a Supabase Edge Function for server-side import processing:
- Accept CSV file + mapping configuration
- Process in batches with progress updates
- Update job status in database
- Send completion email notification

### Task 2.4: Import Job Status UI [Depends on: 2.2, 2.3]

**READ THESE BEFORE TASK**
- `/src/atomic-crm/providers/supabase/unifiedDataProvider.ts` - Data provider patterns
- `/.docs/plans/csv-import-export-enhancement/requirements.md` - Job tracking UI

**Instructions**

Files to Create:
- `/src/atomic-crm/contacts/ContactImportJobStatus.tsx`
- `/src/atomic-crm/contacts/ContactImportJobList.tsx`

Create components for:
- Real-time job status display with polling
- List of all import jobs for the user
- Download error report functionality

### Task 2.5: Error Report Download [Depends on: 2.2]

**READ THESE BEFORE TASK**
- `/src/atomic-crm/contacts/ContactImportResult.tsx` - Current error display
- `/src/atomic-crm/contacts/ContactList.tsx` - CSV export patterns

**Instructions**

Files to Create:
- `/src/atomic-crm/contacts/ContactImportErrorReport.tsx`

Create functionality to:
- Generate CSV with failed rows + error reasons
- Add import_status and error_message columns
- Enable re-upload of corrected data

## Implementation Advice

### Critical Success Factors
- **Backward Compatibility**: All Phase 1 changes must not break existing imports. Use optional parameters and feature flags.
- **Field Name Mapping**: Always map to ContactImportSchema fields (`email_work`), NOT database fields (`email` JSONB)
- **Validation Boundary**: Respect "Zod at API boundary" - don't duplicate validation logic in preview
- **State Machine Integrity**: Never allow impossible state transitions in the import dialog FSM
- **Error Resilience**: Use `Promise.allSettled` not `Promise.all` to capture individual row failures

### Performance Considerations
- **Preview Performance**: Parse only first 10 rows for preview to keep response under 3 seconds
- **Memory Management**: For files > 10MB, show warning about browser performance
- **Caching Strategy**: Maintain Map-based caching for orgs/tags - reduces API calls by 85%
- **Batch Size**: Keep at 10 contacts per batch - proven optimal for browser/API balance

### Testing Strategy
- **Test Data**: Use `/data/new-contacts.csv` - the actual problematic file from user
- **Edge Cases**: Test with missing orgs, invalid emails, full name columns, uppercase headers
- **Regression**: Ensure existing imports with correct headers still work
- **Feature Flag**: Test both enabled and disabled states of ENABLE_IMPORT_PREVIEW

### Common Pitfalls to Avoid
- **Don't** change the database schema in Phase 1 - use existing tables only
- **Don't** modify core validation schemas - reuse existing Zod schemas
- **Don't** create backward-incompatible changes - all params should be optional
- **Don't** implement Phase 2 unless Phase 1 fails to achieve 85% success rate
- **Don't** duplicate validation logic - use data provider dry-run approach if possible

### Security Notes
- **CSV Injection**: Prepend single quote to values starting with `=`, `+`, `-`, `@`
- **XSS Prevention**: Strip HTML tags from all imported string fields
- **Client-Side Only**: Phase 1 does all processing in browser - no file uploads to server