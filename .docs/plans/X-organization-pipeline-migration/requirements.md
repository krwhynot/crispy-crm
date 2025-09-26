# Organization & Pipeline Migration Requirements

## Executive Summary

This document outlines the requirements for a comprehensive migration of the Atomic CRM system to:
1. Rebrand "companies" to "organizations" throughout the entire stack
2. Update the opportunity pipeline to a food service industry-specific 8-stage workflow

**Status**: Pre-production (no live data)
**Approach**: Clean slate migration without backward compatibility
**Priority**: High - foundational change before launch

## Goals & Objectives

### Primary Goals
- **Branding Alignment**: Standardize on "organization" terminology across database, code, and UI
- **Industry Focus**: Implement food service-specific sales pipeline stages
- **Code Consistency**: Ensure complete consistency in naming conventions

### Success Criteria
- Zero TypeScript compilation errors
- All CRUD operations functional for organizations
- Opportunity pipeline displays and functions with new stages
- Successful smoke tests for critical user paths

## User Stories

### Organization Management
- **As a sales rep**, I want to manage organizations (not companies) so that the terminology aligns with our industry standards
- **As a sales rep**, I want to see all my contacts' organization relationships clearly displayed
- **As an admin**, I want consistent terminology throughout the system to avoid confusion

### Opportunity Pipeline
- **As a sales rep**, I want to track opportunities through food service-specific stages that match my actual workflow
- **As a sales rep**, I want to see stage-specific fields that are relevant to each phase of the sale
- **As a sales manager**, I want to visualize opportunities in a kanban board with industry-appropriate stages

## Technical Specifications

### Database Migration

#### Schema Changes
```sql
-- Fresh schema approach (not ALTER statements since no production data)
CREATE TABLE organizations (
  -- Same structure as current companies table
  -- All foreign keys reference organization_id
);

CREATE TYPE opportunity_stage AS ENUM (
  'new_lead',
  'initial_outreach',
  'sample_visit_offered',
  'awaiting_response',
  'feedback_logged',
  'demo_scheduled',
  'closed_won',
  'closed_lost'
);
```

#### Affected Tables
- `organizations` (renamed from companies)
- `contact_organizations` (FK: organization_id)
- `opportunities` (FK: organization_id, stage enum)
- `activities` (FK: organization_id)
- `opportunity_participants` (FK: organization_id)

### Pipeline Stage Configuration

#### Stage Definitions
| Stage | Display Name | Color (from NEW-COLOR-LIST.md) | Description |
|-------|--------------|--------------------------------|-------------|
| `new_lead` | New Lead | Info Subtle (#dbeafe) | Initial prospect identification |
| `initial_outreach` | Initial Outreach | Teal (#d9f2f0) | First contact and follow-up |
| `sample_visit_offered` | Sample/Visit Offered | Warning Subtle (#fef3c7) | Product sampling and visit scheduling |
| `awaiting_response` | Awaiting Response | Purple (#f3e8ff) | Following up after sample delivery |
| `feedback_logged` | Feedback Logged | Blue (#e5ecff) | Recording customer feedback |
| `demo_scheduled` | Demo Scheduled | Success Subtle (#d0e8d5) | Planning product demonstrations |
| `closed_won` | Closed - Won | Success Strong (#2d7a40) | Successful deal completion |
| `closed_lost` | Closed - Lost | Error Subtle (#fee2e2) | Lost opportunity |

#### Stage-Specific Fields
```typescript
interface StageFields {
  sample_visit_offered: {
    sampleType?: string;
    visitDate?: Date;
    sampleProducts?: string[];
  };
  feedback_logged: {
    feedbackNotes: string;
    sentimentScore?: 1 | 2 | 3 | 4 | 5;
    nextSteps?: string;
  };
  demo_scheduled: {
    demoDate: Date;
    attendees?: string[];
    demoProducts?: string[];
  };
  closed_won: {
    finalAmount: number;
    contractStartDate?: Date;
    contractTermMonths?: number;
  };
  closed_lost: {
    lossReason: 'price' | 'product_fit' | 'competitor' | 'timing' | 'other';
    competitorWon?: string;
    lossNotes?: string;
  };
}
```

### Code Updates

#### Component Renaming Map
| Current | New |
|---------|-----|
| `CompanyList` | `OrganizationList` |
| `CompanyShow` | `OrganizationShow` |
| `CompanyEdit` | `OrganizationEdit` |
| `CompanyCreate` | `OrganizationCreate` |
| `CompanyCard` | `OrganizationCard` |
| `CompanyAvatar` | `OrganizationAvatar` |
| `CompanyInputs` | `OrganizationInputs` |
| `getCompanyAvatar` | `getOrganizationAvatar` |
| All related files and imports | Updated accordingly |

#### Variable Naming Conventions
- `companyId` → `organizationId` (full word, not `orgId`)
- `company_id` → `organization_id`
- Route: `/companies` → `/organizations` (full word, not `/orgs`)

#### Data Provider Updates
```typescript
// Resource mapping
resources: {
  organizations: 'organizations', // was companies: 'companies'
}
```

## Implementation Plan

### Phase 1: Database Migration
1. Create fresh migration with new schema
2. Drop existing test data
3. Create organizations table and related structures
4. Implement new opportunity_stage enum

### Phase 2: Type Generation
1. Generate TypeScript types from new schema
2. Update validation schemas in `/validation/`
3. Rename `companies.ts` to `organizations.ts`

### Phase 3: Code Updates
1. Batch rename all Company* files to Organization*
2. Global search/replace for imports and references
3. Update data provider resource mappings
4. Update opportunity stage display logic

### Phase 4: UI Updates
1. Update stage colors per color scheme
2. Implement stage-specific field visibility
3. Update kanban board stage display
4. Update all UI text references

## Validation Strategy

### Automated Checks
1. **TypeScript Compilation**: Must pass with zero errors
2. **Existing Tests**: Run any existing unit/integration tests
3. **Build Process**: Successful production build

### Manual Smoke Tests

#### Organization CRUD
- [ ] Create new organization via UI
- [ ] View organization in list and detail page
- [ ] Edit organization details
- [ ] Delete organization
- [ ] Verify API endpoints respond correctly

#### Opportunity Pipeline
- [ ] Create new opportunity
- [ ] View all 8 stages in kanban
- [ ] Move opportunity through each stage
- [ ] Verify stage-specific fields appear
- [ ] Check stage colors match spec

#### Critical User Flows
- [ ] Add contact to organization
- [ ] Create opportunity linked to organization
- [ ] Navigate all main UI sections
- [ ] Verify no "company" text remains visible

## Constraints & Assumptions

### Constraints
- No backward compatibility required
- No data migration needed (pre-production)
- Must complete before launch

### Assumptions
- Test data can be deleted without consequence
- Development environment available for testing
- No external integrations affected

## Risk Mitigation

### Identified Risks
1. **Missed References**: Some "company" references might be overlooked
   - *Mitigation*: Global search verification after migration

2. **Type Mismatches**: TypeScript errors from incomplete updates
   - *Mitigation*: Iterative TypeScript compilation during migration

3. **UI Breakage**: Components might not render after renaming
   - *Mitigation*: Hot reload testing during development

## Success Metrics

### Quantitative
- 0 TypeScript errors
- 0 references to "company" in codebase (except historical migrations)
- 8 functional pipeline stages
- 100% CRUD operations working

### Qualitative
- Consistent terminology throughout UI
- Intuitive stage progression for food service sales
- Clean, maintainable code structure

## Notes

- Migration uses industry-standard fresh schema approach since no production data exists
- Stage transitions are unrestricted (any stage to any stage allowed)
- Color choices align with established design system (NEW-COLOR-LIST.md)
- No npm migration script needed per requirements

## Appendix

### File Count Estimates
- ~65 React component files with "Company" references
- ~15 direct Company*.tsx component files
- ~106 total files with company/companies references

### Database Objects Affected
- 1 table rename
- 4+ foreign key column renames
- 1 enum type replacement
- Multiple view updates

---

*Document Version*: 1.0
*Created*: 2025-01-25
*Status*: Ready for Implementation