# CRM Migration Feature Requirements

## Overview
Execute the existing database migration to transform Atomic CRM from a simple CRM into a B2B system with principal-distributor relationships, commission tracking, and multi-organization contact support.

## Scope
This is a medium-scope feature implementing the migration plans documented in `/docs/merged/`. The migration will be executed as a one-time transformation of the production database with appropriate safety measures.

## User Goals
- **End Users**: Access enhanced B2B features including principal-distributor relationships, multi-organization contacts, and opportunity management (formerly deals)
- **Administrators**: Safely execute the migration with confidence through dry-run validation and clear progress monitoring

## Core Requirements

### Migration Strategy
- **Type**: Big bang offline migration (system unavailable during execution)
- **Trigger**: CLI command for maximum control and auditability
- **Phases**: Execute Stage 1 (MVP) and Stage 1.5 (Principal features) from existing scripts
- **Downtime**: Estimated 30-60 minutes based on data volume

### Safety Measures

#### Pre-Migration
1. **Full Database Backup**: Automated backup immediately before migration start
2. **Dry Run Mode**: Required execution showing:
   - Total records to be migrated by type
   - Validation warnings/errors with severity
   - New entities to be created
   - Estimated migration duration
   - Resource requirements (disk space, memory)
3. **Validation Checks**:
   - Referential integrity (all foreign keys valid)
   - Unique constraint conflict detection
   - Required field completeness for new schema
   - Source data quality assessment
4. **Go/No-Go Criteria**: Dry run must show <1% data warnings to proceed

#### During Migration
1. **Offline Enforcement**: Application shutdown with connection blocking
2. **Progress Monitoring**: Real-time status updates showing current phase/batch
3. **Resource Monitoring**: Track CPU, memory, disk I/O
4. **Failure Handling**:
   - Transactional batches (rollback on batch failure)
   - Individual record failures logged but don't halt migration
   - State tracking for resume capability

#### Post-Migration
1. **Data Verification**: Automated checks for record counts and integrity
2. **Archive Strategy**: Original data preserved for 90 days
3. **Rollback Option**: Full rollback scripts available for 48 hours

### User Experience Changes

#### Immediate Changes
1. **Navigation**: "Deals" → "Opportunities" throughout the UI
2. **Contact Details**:
   - Primary organization shown prominently
   - "Associated Organizations" section for multi-org relationships
3. **Company Views**: New "Principal Relationships" section
4. **Opportunities**: Commission tracking fields added

#### Data Transformations
- All existing Deals automatically become Opportunities
- Contacts retain all data with enhanced organization linking
- Existing relationships preserved and enhanced

### Technical Implementation

#### Frontend Updates
1. **Component Strategy**: Update existing components in-place
2. **URL Handling**: Automatic redirects from `/deals/*` to `/opportunities/*`
3. **Backward Compatibility**:
   - API endpoints support old patterns for 1 month
   - TypeScript types handle both data shapes temporarily
   - Deprecation warnings in development mode

#### Backend Requirements
1. **Migration Execution**:
   - CLI command: `npm run migrate:production`
   - Requires explicit confirmation
   - Logs to dedicated migration.log file
2. **Idempotency**:
   - Migration can be resumed if interrupted
   - Upsert logic prevents duplicate processing
   - Migration state tracked in dedicated table

#### Data Provider Updates
1. **Supabase Provider**: Full migration with new schema
2. **FakeRest Provider**:
   - Migrate subset to validate logic
   - Generate new B2B showcase data
   - Include principal-distributor examples

### Testing Requirements

#### Required Coverage
1. **Schema Validation**: Verify all tables, columns, constraints created correctly
2. **Data Transformation Tests**:
   - Record count verification (before/after)
   - Spot checks on 100 sample records
   - Edge case handling (nulls, special characters)
3. **Integration Tests**:
   - Create new opportunity
   - Link contact to multiple organizations
   - View principal-distributor relationships
4. **Migration Tests**:
   - Dry run execution
   - Failure and resume scenarios
   - Rollback verification

### Communication Plan

#### Pre-Migration
- **T-24 hours**: Email notification to all users
- **T-2 hours**: In-app banner warning
- **T-30 minutes**: Final warning with countdown

#### During Migration
- Status page showing current progress
- Estimated completion time updates

#### Post-Migration
- Completion email with:
  - Summary of changes
  - Link to "What's New" guide
  - User verification checklist
- In-app tour of new features (optional)

### User Preparation

#### Documentation
1. **Migration Guide**: One-page "What's Changing" document
2. **Feature Guide**: Principal-distributor relationships explained
3. **FAQ**: Common questions and troubleshooting

#### Verification Checklist
Users should verify post-migration:
- [ ] Top 3 accounts appear correctly
- [ ] Contact associations are accurate
- [ ] Open opportunities (formerly deals) migrated
- [ ] Recent activities preserved

## Success Criteria
1. Zero data loss during migration
2. All validation tests pass post-migration
3. System operational within planned downtime window
4. <5% user support tickets in first 48 hours
5. All critical business workflows functional

## Out of Scope
- Stage 2 advanced features (future enhancement)
- Real-time/online migration (not needed for current user base)
- Automated user training (handled via documentation)
- Third-party integration updates (separate task)

## Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| Migration failure | Full backup + rollback scripts ready |
| Longer than expected downtime | Dry run timing + 50% buffer |
| User confusion | Clear communication + documentation |
| Data corruption | Transactional batches + validation |

## Implementation Timeline
1. **Week 1**: Build dry run capability and validation suite
2. **Week 2**: Implement CLI command and monitoring
3. **Week 3**: Update frontend components and data providers
4. **Week 4**: Testing and documentation
5. **Week 5**: Execute migration (scheduled maintenance window)

## Dependencies
- Existing migration scripts in `/docs/merged/migrations/`
- Database backup system operational
- Communication channels (email, in-app notifications) available
- Test environment matching production

## Notes
- This migration is a one-way transformation; the old schema will be deprecated
- Future enhancements (Stage 2) can be added incrementally post-migration
- Consider scheduling during low-usage period (weekend or evening)