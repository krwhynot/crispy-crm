# CRM Migration Visual Guide

## 📊 Migration Overview - The Big Picture

```mermaid
graph TD
    Start([Current State: Deals-based CRM]) --> Check{Ready to Migrate?}
    Check -->|No| Prep[Preparation Phase]
    Check -->|Yes| Backup[Backup Phase]

    Prep --> Validate[Validation Phase]
    Validate --> Check

    Backup --> Execute[Migration Execution]
    Execute --> Verify[Verification Phase]
    Verify --> Decision{All Tests Pass?}

    Decision -->|Yes| Cleanup[Cleanup Phase]
    Decision -->|No| Rollback[Rollback Phase]

    Cleanup --> Complete([New State: Opportunities-based CRM])
    Rollback --> Start

    style Start fill:#ff6b6b
    style Complete fill:#51cf66
    style Rollback fill:#ffd43b
```

## 🔄 Data Transformation Flow

### Before Migration (Current State)
```
┌─────────────────────────────────────────────────────────┐
│                    CURRENT DATABASE                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐       │
│  │ COMPANIES│────>│  DEALS   │<────│ CONTACTS │       │
│  └──────────┘     └──────────┘     └──────────┘       │
│       │                │                  │             │
│       │                ▼                  │             │
│       │          ┌──────────┐            │             │
│       └─────────>│DEAL NOTES│<───────────┘             │
│                  └──────────┘                           │
│                                                          │
│  Simple 1-to-many relationships                         │
│  • One company has many deals                          │
│  • One contact belongs to one company                  │
│  • Deals have notes                                    │
└─────────────────────────────────────────────────────────┘
```

### After Migration (Target State)
```
┌─────────────────────────────────────────────────────────┐
│                     NEW DATABASE                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────┐     ┌──────────────┐     ┌──────────┐   │
│  │COMPANIES │────>│OPPORTUNITIES │<────│ CONTACTS │   │
│  │(enhanced)│     │  (enhanced)  │     │(enhanced)│   │
│  └────┬─────┘     └──────┬───────┘     └────┬─────┘   │
│       │                   │                   │          │
│       ▼                   ▼                   ▼          │
│  ┌──────────┐     ┌──────────────┐     ┌──────────┐   │
│  │  PARENT  │     │ OPPORTUNITY  │     │ CONTACT  │   │
│  │ COMPANY  │     │    NOTES     │     │   ORGS   │   │
│  └──────────┘     └──────────────┘     └──────────┘   │
│                           │                   │          │
│                           ▼                   ▼          │
│                    ┌──────────────┐     ┌──────────┐   │
│                    │ OPPORTUNITY  │     │ACTIVITIES│   │
│                    │ PARTICIPANTS │     │          │   │
│                    └──────────────┘     └──────────┘   │
│                                                          │
│  Complex many-to-many relationships                     │
│  • Contacts can belong to multiple organizations       │
│  • Opportunities have multiple participants            │
│  • Companies have types, priorities, hierarchies      │
└─────────────────────────────────────────────────────────┘
```

## 🚀 Migration Execution Flow

```mermaid
sequenceDiagram
    participant U as User
    participant CLI as CLI Tool
    participant DB as Database
    participant B as Backup
    participant V as Validator

    U->>CLI: npm run migrate:production
    CLI->>CLI: Check prerequisites
    CLI->>U: Show migration plan
    U->>CLI: Confirm execution

    CLI->>B: Create full backup
    B->>DB: Dump current state
    B-->>CLI: Backup ID: backup_2025_01_22

    CLI->>V: Run pre-migration validation
    V->>DB: Check data quality
    V->>DB: Check referential integrity
    V-->>CLI: Validation report

    alt Validation Failed
        CLI->>U: Show errors
        CLI->>U: Migration aborted
    else Validation Passed
        CLI->>DB: BEGIN TRANSACTION

        loop For each migration phase
            CLI->>DB: Execute SQL migration
            CLI->>V: Verify phase completion
            CLI->>CLI: Update progress tracker
        end

        CLI->>V: Run post-migration tests

        alt Tests Failed
            CLI->>DB: ROLLBACK
            CLI->>B: Restore from backup
            CLI->>U: Migration rolled back
        else Tests Passed
            CLI->>DB: COMMIT
            CLI->>U: Migration complete!
        end
    end
```

## 📝 Phase-by-Phase Breakdown

### Phase 1.1: Foundation Setup
```
┌─────────────────────────────────────────────────┐
│              FOUNDATION SETUP                    │
├─────────────────────────────────────────────────┤
│                                                  │
│  1. Add backup columns to existing tables       │
│     • deals.backup_data                        │
│     • contacts.backup_company_id               │
│                                                  │
│  2. Create new tables                          │
│     ┌────────────────┐                         │
│     │ opportunities  │ ← Copy from deals       │
│     └────────────────┘                         │
│     ┌────────────────┐                         │
│     │opportunity_notes│ ← Copy from dealNotes │
│     └────────────────┘                         │
│                                                  │
│  3. Migrate data with transformations          │
│     DEALS ──transform──> OPPORTUNITIES         │
│                                                  │
│  4. Create backward compatibility views        │
│     CREATE VIEW deals AS                       │
│     SELECT * FROM opportunities                │
│                                                  │
└─────────────────────────────────────────────────┘
```

### Phase 1.2: Contact-Organization Relationships
```
┌─────────────────────────────────────────────────┐
│        CONTACT ORGANIZATION SETUP                │
├─────────────────────────────────────────────────┤
│                                                  │
│  Before: Contact ──belongs to──> One Company    │
│                                                  │
│  After:  Contact ←─many-to-many─→ Organizations │
│                                                  │
│  Junction Table Creation:                       │
│  ┌──────────────────────────────────┐          │
│  │   contact_organizations          │          │
│  ├──────────────────────────────────┤          │
│  │ contact_id                       │          │
│  │ organization_id                  │          │
│  │ is_primary_organization          │          │
│  │ role (decision_maker, buyer...)  │          │
│  │ purchase_influence               │          │
│  │ decision_authority               │          │
│  └──────────────────────────────────┘          │
│                                                  │
│  Data Migration:                                │
│  For each contact with company_id:              │
│    INSERT INTO contact_organizations            │
│    (contact_id, organization_id, is_primary)    │
│    VALUES (contact.id, company_id, true)        │
│                                                  │
└─────────────────────────────────────────────────┘
```

### Phase 1.3: Opportunity Enhancements
```
┌─────────────────────────────────────────────────┐
│         OPPORTUNITY ENHANCEMENTS                 │
├─────────────────────────────────────────────────┤
│                                                  │
│  Old Deal Fields:        New Opportunity Fields:│
│  ┌──────────────┐       ┌────────────────────┐ │
│  │ name         │  ───> │ name               │ │
│  │ amount       │  ───> │ amount             │ │
│  │ stage        │  ───> │ stage (enhanced)   │ │
│  │ company_id   │  ───> │ customer_org_id    │ │
│  └──────────────┘       │ + priority         │ │
│                          │ + probability      │ │
│                          │ + status           │ │
│                          │ + value_proposition│ │
│                          │ + competitors      │ │
│                          └────────────────────┘ │
│                                                  │
│  Participant Tracking:                          │
│  ┌──────────────────────────────────┐          │
│  │   opportunity_participants       │          │
│  ├──────────────────────────────────┤          │
│  │ opportunity_id                   │          │
│  │ organization_id                  │          │
│  │ role (customer/partner/vendor)   │          │
│  │ is_primary                       │          │
│  └──────────────────────────────────┘          │
│                                                  │
└─────────────────────────────────────────────────┘
```

## 🔍 Decision Points During Migration

```mermaid
graph TD
    Start([Start Migration]) --> PreCheck{Pre-flight Checks}

    PreCheck -->|Pass| Backup[Create Backup]
    PreCheck -->|Fail| Abort1[Abort: Fix Issues]

    Backup --> Validate{Data Validation}

    Validate -->|< 99% Valid| Abort2[Abort: Data Quality Issues]
    Validate -->|>= 99% Valid| Migrate[Execute Migration]

    Migrate --> Test1{Test Phase 1}
    Test1 -->|Fail| Rollback1[Rollback Phase 1]
    Test1 -->|Pass| Phase2[Execute Phase 2]

    Phase2 --> Test2{Test Phase 2}
    Test2 -->|Fail| Rollback2[Rollback to Phase 1]
    Test2 -->|Pass| Phase3[Execute Phase 3]

    Phase3 --> FinalTest{Final Validation}
    FinalTest -->|Fail| FullRollback[Full Rollback]
    FinalTest -->|Pass| Complete([Migration Complete])

    style Abort1 fill:#ff6b6b
    style Abort2 fill:#ff6b6b
    style Rollback1 fill:#ffd43b
    style Rollback2 fill:#ffd43b
    style FullRollback fill:#ffd43b
    style Complete fill:#51cf66
```

## 🛡️ Safety Mechanisms

### Rollback Strategy
```
┌─────────────────────────────────────────────────┐
│              ROLLBACK LEVELS                     │
├─────────────────────────────────────────────────┤
│                                                  │
│  Level 1: Transaction Rollback (Immediate)      │
│  ├─ Automatic on any SQL error                  │
│  ├─ No data changes committed                   │
│  └─ Zero downtime                               │
│                                                  │
│  Level 2: Phase Rollback (5 minutes)            │
│  ├─ Undo specific phase changes                 │
│  ├─ Uses backup columns                         │
│  └─ Minimal data movement                       │
│                                                  │
│  Level 3: Full Restore (30 minutes)             │
│  ├─ Complete database restore                   │
│  ├─ From backup snapshot                        │
│  └─ Guaranteed original state                   │
│                                                  │
└─────────────────────────────────────────────────┘
```

## 📋 Migration Commands Flow

```mermaid
graph LR
    subgraph "Preparation"
        A[npm run migrate:dry-run] --> B{Validation OK?}
        B -->|No| C[Fix Issues]
        C --> A
        B -->|Yes| D[npm run migrate:backup]
    end

    subgraph "Execution"
        D --> E[npm run migrate:execute]
        E --> F{Success?}
    end

    subgraph "Post-Migration"
        F -->|Yes| G[npm run migrate:verify]
        F -->|No| H[npm run migrate:rollback]
        G --> I{Verified?}
        I -->|Yes| J[npm run migrate:cleanup]
        I -->|No| H
        H --> K[System Restored]
        J --> L[Migration Complete]
    end

    style L fill:#51cf66
    style K fill:#ffd43b
```

## 🎯 What Happens to Your Application

### During Migration (2-hour window)
```
┌──────────────────────────────────────┐
│         APPLICATION STATE             │
├──────────────────────────────────────┤
│                                       │
│  1. Maintenance Mode Activated       │
│     • Users see maintenance page     │
│     • No data modifications allowed  │
│                                       │
│  2. Database Migration Running       │
│     • Tables being modified          │
│     • Data being transformed         │
│     • Indexes being rebuilt          │
│                                       │
│  3. Validation in Progress           │
│     • Data integrity checks          │
│     • Reference validation           │
│     • Performance testing            │
│                                       │
└──────────────────────────────────────┘
```

### After Successful Migration
```
┌──────────────────────────────────────┐
│      NEW APPLICATION FEATURES         │
├──────────────────────────────────────┤
│                                       │
│  ✅ Opportunities (not Deals)        │
│  ✅ Multi-org contacts               │
│  ✅ Company hierarchies              │
│  ✅ Enhanced categorization          │
│  ✅ Activity tracking                │
│  ✅ Participant management           │
│                                       │
│  ❌ No backward compatibility        │
│  ❌ Old "deals" endpoints fail       │
│  ❌ Must use new API structure       │
│                                       │
└──────────────────────────────────────┘
```

## 🚨 Critical Points to Understand

1. **NO BACKWARD COMPATIBILITY** - Once migrated, all code must use "opportunities" not "deals"
2. **VALIDATION THRESHOLD** - Migration aborts if data quality < 99%
3. **ATOMIC OPERATION** - Either everything migrates or nothing does
4. **BACKUP WINDOW** - 48 hours to rollback if issues discovered
5. **TESTING REQUIRED** - Post-migration validation must pass before cleanup

## 📊 Migration Progress Tracking

```
Migration Progress: Phase 1.1 Foundation
[████████████████████] 100% Complete

Migration Progress: Phase 1.2 Relationships
[████████████████████] 100% Complete

Migration Progress: Phase 1.3 Enhancements
[████████████████████] 100% Complete

Migration Progress: Phase 1.4 Activities
[████████████████████] 100% Complete

Overall Migration Status: READY FOR EXECUTION
├─ Pre-flight checks:     ✅ PASSED
├─ Validation:            ✅ PASSED
├─ Backup created:        ⏳ PENDING
├─ Migration executed:    ⏳ PENDING
├─ Post-validation:       ⏳ PENDING
└─ Cleanup completed:     ⏳ PENDING
```

## 🎬 Next Steps

1. **Review this guide** - Ensure you understand each phase
2. **Run dry-run** - `npm run migrate:dry-run` to see what would happen
3. **Schedule downtime** - Pick a 2-hour maintenance window
4. **Execute migration** - Follow the command flow above
5. **Verify results** - Thoroughly test the new structure

This migration is like renovating a house while you're living in it - we're changing the foundation (database schema) while keeping everything functional. The safety mechanisms ensure that if anything goes wrong, we can instantly go back to the original state.