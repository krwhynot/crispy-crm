# Data Validation Scripts Patterns

Pre-migration validation framework for Crispy CRM. Validates data quality, referential integrity, unique constraints, and required fields before database migrations. Provides automated Go/No-Go decision with confidence scoring.

---

## Architecture Overview

```
                    run-pre-validation.js
                    (SQL-based validation)
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      go-no-go.js                            │
│                   (Decision Engine)                         │
│    Orchestrates validators, applies thresholds, decides     │
└──────────────────────────┬──────────────────────────────────┘
                           │
       ┌───────────────────┼───────────────────┐
       │                   │                   │
       ▼                   ▼                   ▼
┌──────────────┐  ┌────────────────┐  ┌───────────────┐
│ data-quality │  │  referential-  │  │   required-   │
│    .js       │  │  integrity.js  │  │   fields.js   │
│  (Scoring)   │  │  (FK checks)   │  │ (Completeness)│
└──────────────┘  └────────────────┘  └───────────────┘
       │                   │                   │
       │                   ▼                   │
       │          ┌────────────────┐           │
       │          │    unique-     │           │
       │          │ constraints.js │           │
       │          │  (Duplicates)  │           │
       │          └────────────────┘           │
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │   GO | PROCEED_WITH_   │
              │   CAUTION | DELAY |    │
              │         BLOCK          │
              └────────────────────────┘
```

---

## Pattern A: Validator Class Structure

All JavaScript validators follow a consistent class-based architecture enabling both standalone CLI execution and orchestrated use.

### Structure

```javascript
// From referential-integrity.js
import { createClient } from "@supabase/supabase-js";

export class ReferentialIntegrityValidator {
  // 1. Constructor: Initialize client and containers
  constructor(supabaseUrl, supabaseKey) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.violations = [];  // Stores issues found
    this.warnings = [];    // Stores non-blocking issues
  }

  // 2. Main orchestration method
  async validateAll() {
    console.log("🔗 Starting referential integrity validation...");

    const checks = [
      this.validateContactCompanyReferences,
      this.validateDealCompanyReferences,
      this.validateDealContactReferences,
    ];

    for (const check of checks) {
      try {
        await check.call(this);
      } catch (error) {
        this.violations.push({
          type: "SYSTEM_ERROR",
          entity: check.name,
          severity: "CRITICAL",
          message: `Validation check failed: ${error.message}`,
          count: 1,
        });
      }
    }

    return this.generateReport();
  }

  // 3. Individual check methods push to violations/warnings
  async validateContactCompanyReferences() {
    const { data: orphanedContacts, error } = await this.supabase
      .from("contacts")
      .select("id, first_name, last_name, company_id");

    if (error) throw error;

    if (orphanedContacts?.length > 0) {
      this.violations.push({
        type: "ORPHANED_RECORD",
        entity: "contacts",
        severity: "HIGH",
        message: `Contacts reference non-existent companies`,
        count: orphanedContacts.length,
        samples: orphanedContacts
          .slice(0, 5)  // Always truncate samples
          .map((c) => `Contact ${c.first_name} ${c.last_name} (ID: ${c.id})`),
      });
    }
  }

  // 4. Generate structured report with status
  generateReport() {
    const totalViolations = this.violations.length;
    const criticalCount = this.violations.filter((v) => v.severity === "CRITICAL").length;
    const highCount = this.violations.filter((v) => v.severity === "HIGH").length;

    return {
      status: criticalCount > 0 ? "FAILED" : highCount > 0 ? "WARNING" : "PASSED",
      summary: {
        totalViolations,
        criticalCount,
        highCount,
        mediumCount: this.violations.filter((v) => v.severity === "MEDIUM").length,
        lowCount: this.violations.filter((v) => v.severity === "LOW").length,
      },
      violations: this.violations,
      warnings: this.warnings,
      recommendations: this.generateRecommendations(),
    };
  }

  // 5. Recommendations with optional SQL fixes
  generateRecommendations() {
    const recommendations = [];
    if (this.violations.some((v) => v.entity === "contacts")) {
      recommendations.push({
        type: "FIX",
        priority: "HIGH",
        action: "Remove or reassign contacts with invalid company references",
        sql: `UPDATE contacts SET company_id = NULL
              WHERE company_id NOT IN (SELECT id FROM companies);`,
      });
    }
    return recommendations;
  }
}

// 6. CLI execution block (standalone mode)
if (import.meta.url === new URL(process.argv[1], "file://").href) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  const validator = new ReferentialIntegrityValidator(supabaseUrl, supabaseKey);
  const report = await validator.validateAll();

  if (report.status === "FAILED") {
    console.error("❌ Referential integrity validation failed");
    process.exit(1);
  }
}
```

### Key Points

| Component | Purpose |
|-----------|---------|
| `constructor(url, key)` | Initialize Supabase client + empty arrays |
| `validateAll()` | Entry point; iterates checks; returns `generateReport()` |
| Check methods | Named `validate*()` or `assess*()`; push to violations/warnings |
| `generateReport()` | Summary with status determination + recommendations |
| CLI block | `if (import.meta.url === ...)` enables standalone execution |

### Variants by Validator

- **DataQualityAssessor**: Uses `assessAll()` instead of `validateAll()`, stores in `this.metrics`
- **UniqueConstraintValidator**: Uses `this.conflicts` instead of `violations`
- **RequiredFieldsValidator**: Adds `fixable: boolean` to violations

---

## Pattern B: Severity-Based Error Reporting

Consistent severity hierarchy drives automated decisions across all validators.

### Severity Levels

```javascript
// Implicit enum used across all validators
const SEVERITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

// Status determination hierarchy:
// CRITICAL → FAILED (block migration)
// HIGH     → WARNING (proceed with caution)
// MEDIUM   → PASSED (acceptable)
// LOW      → PASSED (informational)
```

### Violation Object Structure

```javascript
// Standard violation format
{
  type: "ORPHANED_RECORD",           // Classification
  entity: "contacts",                 // Table/entity name
  severity: "HIGH",                   // CRITICAL | HIGH | MEDIUM | LOW
  message: "Contacts reference non-existent companies",
  count: 15,                          // Quantify impact
  samples: [                          // Always truncated to 5
    "Contact John Doe (ID: abc123)",
    "Contact Jane Smith (ID: def456)",
    // ... max 5 items
  ],
  fixable: true,                      // [Optional] Can auto-remediate?
}

// Data quality variant (adds category)
{
  type: "INVALID_EMAIL_FORMAT",
  category: "accuracy",               // accuracy | completeness | consistency
  severity: "MEDIUM",
  message: `15 invalid email formats found`,
  samples: ["bad@", "@nodomain", "spaces in@email.com"],
}
```

### Status Determination Logic

```javascript
// From generateReport() - consistent across validators
const report = {
  status: criticalCount > 0
    ? "FAILED"                        // Block migration
    : highCount > 0
      ? "WARNING"                     // Proceed with caution
      : "PASSED",                     // Safe to proceed

  summary: {
    totalViolations,
    criticalCount,
    highCount,
    mediumCount: this.violations.filter((v) => v.severity === "MEDIUM").length,
    lowCount: this.violations.filter((v) => v.severity === "LOW").length,
  },
};
```

### Sample Truncation Pattern

```javascript
// ALWAYS truncate samples to prevent report bloat
samples: orphanedContacts
  .slice(0, 5)                        // Maximum 5 samples
  .map((c) => `Contact ${c.first_name} ${c.last_name} (ID: ${c.id})`),
```

---

## Pattern C: Database Connection Strategy

Two connection strategies for different purposes: PostgreSQL direct (SQL files) and Supabase SDK (queries).

### Environment Variable Resolution

```javascript
// From run-pre-validation.js
getConnectionString() {
  // Priority 1: Direct PostgreSQL connection
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  // Priority 2: Build from Supabase environment
  const supabaseUrl = process.env.VITE_SUPABASE_URL;

  if (!supabaseUrl) {
    throw new Error("Missing database configuration. Set DATABASE_URL or VITE_SUPABASE_URL");
  }

  // Extract project ID: https://[project-id].supabase.co
  const projectId = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  if (!projectId) {
    throw new Error("Invalid VITE_SUPABASE_URL format");
  }

  // Construct PostgreSQL connection string
  const dbPassword = process.env.SUPABASE_DB_PASSWORD || "postgres";
  return `postgresql://postgres.${projectId}:${dbPassword}@db.${projectId}.supabase.co:5432/postgres`;
}
```

### PostgreSQL Client (SQL Files)

```javascript
// From run-pre-validation.js - for executing .sql files
import { Client } from "pg";

async createClient() {
  const client = new Client({
    connectionString: this.connectionString,
    ssl: this.connectionString.includes("supabase.co")
      ? { rejectUnauthorized: false }  // Remote: allow self-signed
      : false,                          // Local: no SSL
  });

  await client.connect();
  return client;
}
```

### Supabase SDK (Validators)

```javascript
// From all validator constructors
import { createClient } from "@supabase/supabase-js";

constructor(supabaseUrl, supabaseKey) {
  this.supabase = createClient(supabaseUrl, supabaseKey);
}

// Query pattern
const { data, error } = await this.supabase
  .from("contacts")
  .select("id, first_name, last_name, company_id");

if (error) throw error;
```

### Connection Cleanup

```javascript
// Always cleanup in finally block
async run() {
  let client = null;

  try {
    client = await this.createClient();
    // ... validation logic
  } finally {
    if (client) {
      await client.end();
      console.log("Database connection closed");
    }
  }
}
```

### Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| `DATABASE_URL` | Direct PostgreSQL connection | No (fallback) |
| `VITE_SUPABASE_URL` | Supabase project URL | Yes (primary) |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_DB_PASSWORD` | DB password | No (default: "postgres") |

---

## Pattern D: Go/No-Go Decision Logic

Central decision engine that orchestrates all validators and produces migration recommendation.

### Threshold Configuration

```javascript
// From go-no-go.js
this.criteria = {
  // Critical blocking thresholds (per validator)
  criticalBlockers: {
    referentialIntegrity: { maxCritical: 0, maxHigh: 0 },
    uniqueConstraints: { maxCritical: 0, maxHigh: 5 },
    requiredFields: { maxCritical: 0, maxHigh: 10 },
  },

  // Warning thresholds
  warningThresholds: {
    dataQuality: { minScore: 99.0 },        // <1% issues allowed
    totalViolations: { max: 20 },
    fixableViolations: { minPercentage: 80 },
  },

  // System readiness
  systemReadiness: {
    diskSpaceMinimum: 10 * 1024 * 1024 * 1024,  // 10GB
    backupRequired: true,
    maintenanceWindow: true,
  },
};
```

### Multi-Validator Orchestration

```javascript
// From evaluateMigrationReadiness()
async evaluateMigrationReadiness() {
  const results = {};
  const decision = {
    recommendation: "UNKNOWN",
    confidence: 0,
    blockers: [],
    warnings: [],
    fixes: [],
  };

  // Run all validators
  try {
    results.referentialIntegrity = await this.validators.referentialIntegrity.validateAll();
    results.uniqueConstraints = await this.validators.uniqueConstraints.validateAll();
    results.requiredFields = await this.validators.requiredFields.validateAll();
    results.dataQuality = await this.validators.dataQuality.assessAll();
    results.systemReadiness = await this.checkSystemReadiness();
  } catch (error) {
    decision.blockers.push({
      type: "VALIDATION_FAILURE",
      severity: "CRITICAL",
      message: `Validation suite failed: ${error.message}`,
    });
    decision.recommendation = "BLOCK";
    decision.confidence = 100;
    return this.generateFinalReport(results, decision);
  }

  // Evaluate against criteria
  this.evaluateCriticalBlockers(results, decision);
  this.evaluateWarningThresholds(results, decision);
  this.calculateConfidence(results, decision);
  this.makeFinalDecision(decision);

  return this.generateFinalReport(results, decision);
}
```

### Confidence Calculation

```javascript
calculateConfidence(results, decision) {
  let confidence = 100;

  // Reduce for blockers (25 points each)
  confidence -= decision.blockers.length * 25;

  // Reduce for warnings (5 points each)
  confidence -= decision.warnings.length * 5;

  // Reduce for low data quality
  const dqScore = results.dataQuality.overallScore;
  if (dqScore < 95) {
    confidence -= (95 - dqScore) * 2;
  }

  decision.confidence = Math.max(0, Math.min(100, Math.round(confidence)));
}
```

### Final Decision Logic

```javascript
makeFinalDecision(decision) {
  if (decision.blockers.length > 0) {
    const criticalBlockers = decision.blockers.filter((b) => b.severity === "CRITICAL");
    if (criticalBlockers.length > 0) {
      decision.recommendation = "BLOCK";          // Absolute block
    } else {
      decision.recommendation = "DELAY";          // Non-critical blockers
    }
  } else if (decision.warnings.length > 0) {
    decision.recommendation = "PROCEED_WITH_CAUTION";
  } else {
    decision.recommendation = "GO";               // Clear to proceed
  }
}
```

### Recommendation Types

| Recommendation | Meaning | Exit Code |
|----------------|---------|-----------|
| `GO` | Safe to migrate | 0 |
| `PROCEED_WITH_CAUTION` | Migrate with monitoring | 0 |
| `DELAY` | Fix issues first | 1 |
| `BLOCK` | Critical issues, do not migrate | 2 |

---

## Pattern Comparison Table

| Aspect | data-quality | referential-integrity | required-fields | unique-constraints |
|--------|--------------|----------------------|-----------------|-------------------|
| **Focus** | Scoring (0-100) | FK validation | Field presence | Duplicates |
| **Container** | `metrics` + `issues` | `violations` | `violations` | `conflicts` |
| **Main Method** | `assessAll()` | `validateAll()` | `validateAll()` | `validateAll()` |
| **Output** | Score + issues | Violations list | Violations list | Conflicts list |
| **Threshold** | 99% min score | 0 critical, 0 high | 0 critical, 10 high | 0 critical, 5 high |
| **Has SQL Fixes** | Yes | Yes | Yes | Yes |
| **Fixable Flag** | No | No | Yes | Yes |

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Running Without Environment Variables

```javascript
// ❌ WRONG: Will fail silently or with cryptic errors
const validator = new ReferentialIntegrityValidator(undefined, undefined);

// ✅ CORRECT: Validate before instantiation
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing environment variables");
  process.exit(1);
}

const validator = new ReferentialIntegrityValidator(supabaseUrl, supabaseKey);
```

### Anti-Pattern 2: Ignoring the Fixable Flag

```javascript
// ❌ WRONG: Treating all violations the same
for (const violation of report.violations) {
  console.log(`Fix manually: ${violation.message}`);
}

// ✅ CORRECT: Auto-fix when possible
for (const violation of report.violations) {
  if (violation.fixable && violation.sql) {
    console.log(`Auto-fixing: ${violation.message}`);
    await client.query(violation.sql);
  } else {
    console.log(`Manual fix required: ${violation.message}`);
  }
}
```

### Anti-Pattern 3: Not Handling Database Connection Errors

```javascript
// ❌ WRONG: No cleanup on error
async run() {
  const client = await this.createClient();
  await this.validate(client);  // If this throws, connection leaks!
}

// ✅ CORRECT: Always cleanup in finally
async run() {
  let client = null;
  try {
    client = await this.createClient();
    await this.validate(client);
  } finally {
    if (client) await client.end();
  }
}
```

### Anti-Pattern 4: Unbounded Sample Arrays

```javascript
// ❌ WRONG: Could return thousands of records
samples: orphanedContacts.map((c) => `${c.first_name} ${c.last_name}`),

// ✅ CORRECT: Always truncate to 5
samples: orphanedContacts
  .slice(0, 5)
  .map((c) => `${c.first_name} ${c.last_name}`),
```

### Anti-Pattern 5: N+1 Query Pattern

> **Exception for Validation Scripts:** N+1 queries are acceptable in validation scripts that run infrequently (e.g., pre-migration checks). In these cases, code simplicity and readability outweigh query optimization, as the scripts execute once before a migration rather than in hot paths. Prioritize batch queries only when dataset size makes N+1 noticeably slow.

```javascript
// ❌ WRONG (in production code): One query per item
for (const deal of deals) {
  for (const contactId of deal.contact_ids) {
    const { data } = await this.supabase
      .from("contacts")
      .select("id")
      .eq("id", contactId)
      .single();
  }
}

// ✅ CORRECT (preferred for production): Batch query
const allContactIds = deals.flatMap((d) => d.contact_ids || []);
const { data: validContacts } = await this.supabase
  .from("contacts")
  .select("id")
  .in("id", allContactIds);

const validIds = new Set(validContacts.map((c) => c.id));
const orphaned = allContactIds.filter((id) => !validIds.has(id));

// ✅ ACCEPTABLE (in validation scripts): N+1 for simplicity
// When running infrequently and dataset is small, clarity wins
for (const deal of deals) {
  const { data } = await this.supabase
    .from("contacts")
    .select("id")
    .in("id", deal.contact_ids || []);
  // Simple, readable validation logic here
}
```

---

## New Validator Checklist

When adding a new validator to the framework:

### Step 1: Create Validator File

- [ ] Create `scripts/validation/[feature]-validator.js`
- [ ] Implement `constructor(supabaseUrl, supabaseKey)` with Supabase client
- [ ] Create `violations` and `warnings` arrays in constructor
- [ ] Implement `validateAll()` method that iterates check methods
- [ ] Implement individual `validate*()` check methods
- [ ] Push violations with: `type`, `entity`, `severity`, `message`, `count`, `samples`
- [ ] Truncate samples to 5 items maximum
- [ ] Implement `generateReport()` with status determination
- [ ] Implement `generateRecommendations()` with SQL fixes where applicable
- [ ] Add CLI execution block at bottom

### Step 2: Integrate Into go-no-go.js

- [ ] Import the new validator class
- [ ] Add to `this.validators` object in constructor
- [ ] Add threshold configuration in `this.criteria.criticalBlockers`
- [ ] Add result collection in `evaluateMigrationReadiness()`
- [ ] Add evaluation logic in `evaluateCriticalBlockers()`

### Step 3: Update Test Harness

- [ ] Import in `test-validation-framework.js`
- [ ] Add to `validators` object
- [ ] Add to `methodChecks` array

### Step 4: Verify

- [ ] Run standalone: `node scripts/validation/[feature]-validator.js`
- [ ] Run test harness: `node scripts/validation/test-validation-framework.js`
- [ ] Run full suite: `node scripts/validation/go-no-go.js`

---

## File Reference

| File | LOC | Purpose |
|------|-----|---------|
| `run-pre-validation.js` | 403 | SQL-based validation runner, DB connection |
| `go-no-go.js` | 560 | Decision engine, multi-validator orchestration |
| `data-quality.js` | 968 | Completeness, accuracy, consistency scoring |
| `referential-integrity.js` | 449 | Foreign key validation, orphaned records |
| `required-fields.js` | 641 | Missing field detection per entity |
| `unique-constraints.js` | 481 | Duplicate detection, conflict identification |
| `test-validation-framework.js` | 71 | Module verification test harness |
| `pre-migration-validation.sql` | 530 | Database-level validation queries |
| `capture-current-state.sql` | 620 | Snapshot for rollback comparison |
