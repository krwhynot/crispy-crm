---
name: generate-patterns-scripts-validation
directory: scripts/validation/
complexity: MEDIUM
output: scripts/validation/PATTERNS.md
---

# Generate PATTERNS.md for Data Validation Scripts

## Context

The `scripts/validation/` directory contains a pre-migration validation framework for CRM data. This is a **critical pre-launch safety net** that validates data quality, referential integrity, unique constraints, and required fields before database migrations.

The framework follows a modular validator architecture where individual validators feed into a centralized Go/No-Go decision system. Each validator is standalone (can run independently via CLI) but orchestrated by the main runner.

**Key Domain Concepts:**
- **Pre-migration validation**: Ensure data meets schema requirements before migration
- **Go/No-Go decision**: Automated assessment (GO, PROCEED_WITH_CAUTION, DELAY, BLOCK)
- **Severity levels**: CRITICAL > HIGH > MEDIUM > LOW
- **Fixable violations**: Issues that can be auto-remediated vs manual intervention

---

## Phase 1: Exploration

Read these files to understand the patterns:

### Core Orchestration
| File | Purpose |
|------|---------|
| `run-pre-validation.js` | Main runner - database connection, SQL execution, result display |
| `go-no-go.js` | Decision engine - aggregates all validators, applies thresholds |
| `test-validation-framework.js` | Module verification - ensures all validators are importable |

### Validation Modules
| File | Purpose |
|------|---------|
| `data-quality.js` | Completeness, accuracy, consistency scoring (weighted metrics) |
| `referential-integrity.js` | Foreign key validation, orphaned record detection |
| `required-fields.js` | Missing field detection per entity type |
| `unique-constraints.js` | Duplicate detection, conflict identification |

### SQL Files
| File | Purpose |
|------|---------|
| `pre-migration-validation.sql` | Database-level validation queries |
| `capture-current-state.sql` | Snapshot for rollback comparison |

### Documentation
| File | Purpose |
|------|---------|
| `VALIDATION_FRAMEWORK_SUMMARY.md` | Framework overview |
| `TASK_5_1A_SUMMARY.md` | Task requirements context |

---

## Phase 2: Pattern Identification

Identify these 4 patterns:

### Pattern A: Validator Class Structure
Look for the consistent class pattern across all `.js` validators:
- Constructor with Supabase client initialization
- `violations` and `warnings` arrays
- `validateAll()` method that runs all checks
- Individual check methods that push to violations/warnings
- `generateReport()` that summarizes results
- CLI execution block at bottom

### Pattern B: Severity-Based Error Reporting
Examine how errors are categorized and processed:
- Severity enum: CRITICAL, HIGH, MEDIUM, LOW
- Violation object structure: `{ type, entity, severity, message, count, samples, fixable }`
- Status determination: FAILED > WARNING > PASSED based on severity counts
- Sample truncation pattern (limit to 5 samples)

### Pattern C: Database Connection Strategy
Look at `run-pre-validation.js` and validator constructors:
- Environment variable resolution (DATABASE_URL vs VITE_SUPABASE_URL)
- Supabase client creation with `@supabase/supabase-js`
- PostgreSQL direct connection with `pg` Client for SQL files
- SSL configuration for Supabase connections
- Connection cleanup in finally blocks

### Pattern D: Go/No-Go Decision Logic
Focus on `go-no-go.js` for the decision framework:
- Threshold configuration (maxCritical, maxHigh, minScore)
- Multi-validator orchestration (parallel execution)
- Confidence calculation algorithm
- Recommendation types: GO, PROCEED_WITH_CAUTION, DELAY, BLOCK
- Report generation with next steps

---

## Phase 3: Generate PATTERNS.md

Use the template structure from `_template.md`:

### Required Sections

1. **Header** - "Data Validation Scripts Patterns" with brief description

2. **Architecture Overview** - ASCII diagram showing:
   ```
   run-pre-validation.js
           │
           ▼
   ┌─────────────────────────────────────────┐
   │           go-no-go.js                   │
   │         (Decision Engine)               │
   └───────────┬─────────────────────────────┘
               │
       ┌───────┼───────┬───────┬───────┐
       │       │       │       │       │
       ▼       ▼       ▼       ▼       ▼
   [data-quality] [referential] [required] [unique]
       │       │       │       │       │
       └───────┴───────┴───────┴───────┘
               │
               ▼
        GO / DELAY / BLOCK
   ```

3. **Pattern A: Validator Class Structure**
   - Show class skeleton from `data-quality.js`
   - Highlight constructor pattern, validateAll(), generateReport()
   - Key points: standalone execution, violations array pattern

4. **Pattern B: Severity-Based Error Reporting**
   - Show violation object structure
   - Show status determination logic
   - Key points: sample truncation, fixable flag usage

5. **Pattern C: Database Connection Strategy**
   - Show connection resolution from `run-pre-validation.js`
   - Show Supabase client creation pattern
   - Key points: environment variable fallback, SSL handling

6. **Pattern D: Go/No-Go Decision Logic**
   - Show threshold configuration
   - Show makeFinalDecision() logic
   - Key points: blocker vs warning thresholds, confidence calculation

7. **Pattern Comparison Table** - Compare all 4 validators:
   | Aspect | data-quality | referential-integrity | required-fields | unique-constraints |
   |--------|--------------|----------------------|-----------------|-------------------|
   | **Focus** | Scoring | FK validation | Field presence | Duplicates |
   | **Output** | Score 0-100 | Violations | Violations | Conflicts |
   | **Threshold** | 99% | 0 critical | 0 critical | 0 critical |

8. **Anti-Patterns to Avoid**
   - Anti-pattern 1: Running validators without environment variables
   - Anti-pattern 2: Ignoring fixable flag in violations
   - Anti-pattern 3: Not handling database connection errors

9. **New Validator Checklist**
   - [ ] Create class extending validator pattern
   - [ ] Add to go-no-go.js imports and validators object
   - [ ] Add threshold configuration
   - [ ] Add CLI execution block
   - [ ] Update test-validation-framework.js

10. **File Reference Table**

---

## Phase 4: Write the File

Write the generated PATTERNS.md to:

```
/home/krwhynot/projects/crispy-crm/scripts/validation/PATTERNS.md
```

---

## Quality Verification

After generation, verify:
- [ ] All code examples are from actual files in scripts/validation/
- [ ] ASCII diagram matches the actual orchestration flow
- [ ] Pattern names match what developers would search for
- [ ] Anti-patterns are real issues found in the codebase
- [ ] Checklist covers adding a new validator module
- [ ] Severity levels (CRITICAL/HIGH/MEDIUM/LOW) are correctly documented
