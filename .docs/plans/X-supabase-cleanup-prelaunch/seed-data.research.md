# Seed Data Generation and Test User Creation Research

Research conducted on existing seed data generation and test user patterns in Atomic CRM to inform pre-launch infrastructure improvements.

## Overview

The Atomic CRM codebase includes a comprehensive seed data generation system with two main scripts and supporting infrastructure. The system uses @faker-js/faker for realistic test data generation and supports configurable data counts via environment variables. Test user creation currently relies on Supabase Edge Functions for programmatic user management, with automatic sync between auth.users and public.sales tables via database triggers.

**Key Findings:**
- Seed data generation is F&B industry-focused with realistic organization types, job titles, and products
- Environment variables control data volume (SEED_*_COUNT patterns)
- Test users are created via Edge Functions (supabase/functions/users) due to Supabase API limitations
- Database triggers automatically sync auth.users to sales table
- No automated 3-role test user creation currently exists (admin, sales director, account manager)

## Relevant Files

### Seed Data Scripts

- `/home/krwhynot/projects/crispy-crm/scripts/seed-data.js` - Main seed data generator (organizations, contacts, opportunities, activities, notes, tags)
- `/home/krwhynot/projects/crispy-crm/scripts/seed-products.mjs` - Product catalog seeding with validation testing
- `/home/krwhynot/projects/crispy-crm/scripts/add-more-test-data.js` - Incremental data addition without cleanup (orgs + products)

### User Management

- `/home/krwhynot/projects/crispy-crm/supabase/functions/users/index.ts` - Edge function for user creation/updates (POST/PATCH)
- `/home/krwhynot/projects/crispy-crm/supabase/migrations/20251015014019_restore_auth_triggers.sql` - Auth sync triggers
- `/home/krwhynot/projects/crispy-crm/supabase/migrations/20251013000000_cloud_schema_sync.sql` - Contains handle_new_user() and handle_update_user() functions

### Test Utilities

- `/home/krwhynot/projects/crispy-crm/src/tests/utils/mock-providers.ts` - Mock data factories for unit tests (uses faker)
- `/home/krwhynot/projects/crispy-crm/supabase/seed.sql` - Minimal SQL seed file (mostly empty, contains JSONB format examples)

### Configuration

- `/home/krwhynot/projects/crispy-crm/.env.example` - Environment variable templates (OPPORTUNITY_* configs, no SEED_* examples)
- `/home/krwhynot/projects/crispy-crm/package.json` - npm scripts for seeding (seed:data, seed:data:clean, seed:products)

## Architectural Patterns

### Data Generation Architecture

**Pattern: Faker-Based Data Factory**
- Uses @faker-js/faker library for realistic test data generation
- Industry-specific constants (FB_ORGANIZATION_TYPES, FB_JOB_TITLES, FB_PRODUCTS, etc.)
- Generates related entities with proper foreign key relationships
- Example: Contact → Organizations (many-to-many via contact_organizations join table)

**Pattern: Environment-Driven Configuration**
```javascript
const CONFIG = {
  ORGANIZATION_COUNT: parseInt(process.env.SEED_ORGANIZATION_COUNT || "50"),
  CONTACT_COUNT: parseInt(process.env.SEED_CONTACT_COUNT || "100"),
  OPPORTUNITY_COUNT: parseInt(process.env.SEED_OPPORTUNITY_COUNT || "75"),
  ACTIVITY_COUNT: parseInt(process.env.SEED_ACTIVITY_COUNT || "200"),
  NOTE_COUNT: parseInt(process.env.SEED_NOTE_COUNT || "150"),
  TAG_COUNT: parseInt(process.env.SEED_TAG_COUNT || "20"),
  // ...opportunity-specific configs
};
```

**Pattern: Class-Based Generator with Phased Execution**
```javascript
class SeedDataGenerator {
  constructor() {
    this.generatedData = {
      organizations: [],
      contacts: [],
      opportunities: [],
      activities: [],
      notes: [],
      tags: [],
    };
  }

  async run() {
    await this.initialize();
    await this.cleanDatabase();  // Optional with --clean flag
    this.generateOrganizations();
    this.generateContacts();
    this.generateOpportunities();
    this.generateActivities();
    this.generateNotes();
    await this.insertData();
  }
}
```

**Pattern: Dry-Run Mode**
- All seed scripts support `--dry-run` flag
- Shows what data would be inserted without database changes
- Includes `--verbose` flag for detailed output

### Test User Creation

**Pattern: Edge Function User Management**
- Supabase lacks public user CRUD endpoints
- Edge function `/supabase/functions/users/index.ts` wraps auth.admin API
- Supports POST (invite new user) and PATCH (update existing user)
- Permission checks: Only administrators can invite/update users
- User metadata: `{first_name, last_name, role}`

**Pattern: Automatic Auth-Sales Sync via Triggers**
```sql
-- Trigger 1: Auto-create sales record when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger 2: Sync email updates from auth.users to sales
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_update_user();
```

**Current User Creation Flow:**
1. Call Edge Function POST /users with email, password, metadata
2. Edge function calls `supabaseAdmin.auth.admin.createUser()`
3. Database trigger `on_auth_user_created` fires
4. `handle_new_user()` function inserts into public.sales
5. Edge function updates `sales.administrator` field

**Gotcha: No Direct Auth User Creation**
- Cannot use Supabase client to create auth users directly
- Must use Edge Function or CLI `supabase auth admin create`
- Service role key required for auth.admin API access

### Data Relationships and Patterns

**Pattern: Many-to-Many via Junction Tables**
- Contacts ↔ Organizations: `contact_organizations` table with `is_primary` flag
- Opportunities → Contacts: Array of contact IDs (`contact_ids` JSONB column)
- Activities ↔ Contacts: Participants stored as JSONB array

**Pattern: F&B Industry Specialization**
- 44 predefined F&B company names (Fresh Fork Bistro, Golden Grain Mills, etc.)
- 20 organization types (Quick Service Restaurant, Food Manufacturing, Craft Beverage, etc.)
- 24 F&B job titles (Food & Beverage Director, Executive Chef, etc.)
- 15 F&B departments (Kitchen Operations, Supply Chain, etc.)
- 18 F&B software products (Kitchen Management System, POS Integration Platform, etc.)

**Pattern: Opportunity Stage → Status Mapping**
```javascript
getStatusForStage(stage) {
  if (stage === "closed_won") return "won";
  if (stage === "closed_lost") return "lost";
  if (stage === "awaiting_response") return "stalled";
  return "open";
}
```

**Pattern: Probability by Stage**
```javascript
{
  new_lead: 10,
  initial_outreach: 20,
  sample_visit_offered: 30,
  awaiting_response: 25,
  feedback_logged: 50,
  demo_scheduled: 70,
  closed_won: 100,
  closed_lost: 0,
}
```

### Database Initialization

**Pattern: Dependency-Ordered Insertion**
```javascript
// Organizations must exist before contacts can reference them
await this.supabase.from("organizations").insert(organizations);

// Contacts must exist before contact-org relationships
await this.supabase.from("contacts").insert(contacts);
await this.supabase.from("contact_organizations").insert(contactOrgs);

// Opportunities can reference contacts and orgs
await this.supabase.from("opportunities").insert(opportunities);

// Activities/notes can reference opportunities and contacts
await this.supabase.from("activities").insert(activities);
```

**Pattern: Reverse Dependency Order for Cleanup**
```javascript
async cleanDatabase() {
  // Delete in reverse dependency order
  await this.supabase.from("activities").delete().gte("id", 0);
  await this.supabase.from("opportunity_notes").delete().gte("id", 0);
  await this.supabase.from("opportunities").delete().gte("id", 0);
  await this.supabase.from("contact_notes").delete().gte("id", 0);
  await this.supabase.from("contact_organizations").delete().gte("id", 0);
  await this.supabase.from("contacts").delete().gte("id", 0);
  await this.supabase.from("organizations").delete().gte("id", 0);
  // Keep tags - they're managed separately
}
```

### Product Seeding Patterns

**Pattern: Principal (Supplier) Linking**
- Products must reference a principal (supplier) organization
- Script checks for existing `is_principal=true` organizations
- Creates test principal if none exists
- Products distributed across multiple principals

**Pattern: Validation Testing Built-In**
- `seed-products.mjs` includes invalid product test cases
- Tests missing required fields, negative prices, invalid categories
- Validates that database constraints are working

**Pattern: Nutritional Information Generation**
```javascript
generateNutrition() {
  return {
    serving_size: faker.helpers.arrayElement(["1 cup", "100g", "1 piece"]),
    calories: faker.number.int({ min: 50, max: 500 }),
    total_fat_g: faker.number.int({ min: 0, max: 30 }),
    // ... complete nutrition panel
  };
}
```

## Configuration Options

### Environment Variables (Currently Supported)

**Seed Data Counts:**
```bash
SEED_ORGANIZATION_COUNT=50      # Default: 50
SEED_CONTACT_COUNT=100          # Default: 100
SEED_OPPORTUNITY_COUNT=75       # Default: 75
SEED_ACTIVITY_COUNT=200         # Default: 200
SEED_NOTE_COUNT=150             # Default: 150
SEED_TAG_COUNT=20               # Default: 20
```

**Opportunity Configuration:**
```bash
OPPORTUNITY_DEFAULT_CATEGORY=new_business
OPPORTUNITY_DEFAULT_STAGE=new_lead
OPPORTUNITY_PIPELINE_STAGES=new_lead,initial_outreach,sample_visit_offered,awaiting_response,feedback_logged,demo_scheduled,closed_won,closed_lost
OPPORTUNITY_MAX_AMOUNT=1000000
OPPORTUNITY_DEFAULT_PROBABILITY=50
```

**Supabase Connection:**
```bash
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=<anon_key>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>  # Required for user creation
```

### Command Line Flags

**seed-data.js:**
```bash
npm run seed:data                    # Generate and insert
npm run seed:data -- --dry-run       # Preview only
npm run seed:data -- --count=100     # Override all counts
npm run seed:data -- --clean         # Clear existing data first
npm run seed:data -- --verbose       # Detailed output
```

**seed-products.mjs:**
```bash
npm run seed:products                # Insert products
npm run seed:products -- --dry-run   # Preview only
```

**add-more-test-data.js:**
```bash
node scripts/add-more-test-data.js              # Add 5 orgs + 25 products
node scripts/add-more-test-data.js --dry-run    # Preview
node scripts/add-more-test-data.js --verbose    # Detailed output
```

## Gotchas & Edge Cases

### User Creation Limitations

**Gotcha: Supabase Auth User Creation Requires Edge Functions**
- Supabase JavaScript client cannot create auth users directly
- Must use either:
  1. Edge Function with service role key (current approach)
  2. Supabase CLI: `supabase auth admin create`
  3. Direct psql with encrypted password (complex, not recommended)
- Reason: Security - only service role can create users programmatically

**Gotcha: Password Encryption Challenge**
- Auth.users stores encrypted_password using bcrypt
- Cannot easily create users with known passwords via SQL
- Edge function approach allows setting password in plaintext
- Local development: Use CLI or Edge Function approach

**Gotcha: User Metadata vs Sales Table**
- User metadata stored in `auth.users.raw_user_meta_data` (JSONB)
- Sales table has separate fields: `first_name`, `last_name`, `administrator`
- Triggers keep them in sync, but initial creation order matters
- Best practice: Create auth user first, let trigger create sales record, then update sales fields

### Data Generation Edge Cases

**Gotcha: Contact-Organization Relationship Complexity**
- Contacts can belong to multiple organizations
- One must be marked `is_primary=true`
- Script randomly assigns 1-3 organizations per contact
- First organization in array automatically set as primary

**Gotcha: Opportunity Contact IDs Array**
- `opportunities.contact_ids` is JSONB array of UUIDs
- Must ensure all referenced contact IDs exist
- Script generates contacts first, then picks random subsets for opportunities

**Gotcha: Tags Are Managed Separately**
- Tags NOT regenerated during seed:data
- Commented out: `// this.generateTags()` and `// Skip tags - already in database`
- Assumption: Tags are pre-seeded via migration or manual insertion
- Prevents tag duplication and preserves tag usage counts

**Gotcha: Activity Participants**
- Only meetings and calls have participants
- Participants stored as JSONB array: `[{contact_id, participated, notes}]`
- Script only generates participants for `type IN ('meeting', 'call')`

**Gotcha: Notes Table Split**
- Contact notes → `contact_notes` table
- Opportunity notes → `opportunity_notes` table
- Script generates unified note objects, then splits during insertion based on `table` property

### Database Schema Gotchas

**Gotcha: Auth Schema Cannot Be Seeded Directly**
- `auth.users` table requires special handling
- Cannot use standard INSERT without proper password encryption
- Triggers depend on auth.users INSERT events
- Use Edge Functions or CLI for proper user creation

**Gotcha: Storage Schema Excluded from Dumps**
- Storage service may be disabled in local Supabase (known issue)
- Sync scripts exclude `--exclude-schema=storage`
- File uploads should be tested in cloud environment if local storage is broken

**Gotcha: Supabase Anon Key vs Service Role Key**
- Anon key: Limited permissions, respects RLS policies
- Service role key: Bypasses RLS, required for:
  - Creating auth users
  - Bulk data operations
  - Administrative tasks
- Seed scripts prefer service role key but fall back to anon key

### Performance Considerations

**Gotcha: Bulk Insert Performance**
- Inserting 200+ contacts individually is slow
- Scripts use batch inserts: `.insert(arrayOfRecords)`
- Junction tables (contact_organizations) inserted separately after main entities
- Large datasets (500+ records) may take 30-60 seconds

**Gotcha: Faker Determinism**
- @faker-js/faker generates random data by default
- No seed value set, so data differs each run
- For reproducible data, would need to add: `faker.seed(123)`
- Current approach prioritizes variety over reproducibility

## How to Extend the Seed Data System

### Adding a New Resource Type

**Step 1: Add generation method to SeedDataGenerator class**
```javascript
generateMyResource(count = CONFIG.MY_RESOURCE_COUNT) {
  this.spinner.start(`Generating ${count} my resources...`);

  for (let i = 0; i < count; i++) {
    const resource = {
      id: faker.string.uuid(),
      name: faker.company.name(),
      // ... other fields
      created_at: faker.date.past({ years: 1 }),
      updated_at: faker.date.recent(),
    };
    this.generatedData.myResources.push(resource);
  }

  this.spinner.succeed(`Generated ${count} my resources`);
}
```

**Step 2: Add to CONFIG object**
```javascript
const CONFIG = {
  MY_RESOURCE_COUNT: parseInt(process.env.SEED_MY_RESOURCE_COUNT || "30"),
  // ... existing config
};
```

**Step 3: Add to insertData() method**
```javascript
async insertData() {
  // ... existing inserts

  if (this.generatedData.myResources.length > 0) {
    const { error } = await this.supabase
      .from("my_resources")
      .insert(this.generatedData.myResources);
    if (error) throw error;
  }
}
```

**Step 4: Call in run() method**
```javascript
async run() {
  // ... existing calls
  this.generateMyResource(count || CONFIG.MY_RESOURCE_COUNT);
  await this.insertData();
}
```

### Adding Test Users with Specific Roles

**Current Gap: No automated 3-role test user creation**

**Proposed Extension (aligns with requirements.md):**

Create `scripts/dev/create-test-users.sh`:
```bash
#!/bin/bash
# Create 3 test users: admin, director, manager
# Uses Edge Function /users endpoint

ADMIN_EMAIL="${TEST_ADMIN_EMAIL:-admin@test.local}"
DIRECTOR_EMAIL="${TEST_DIRECTOR_EMAIL:-director@test.local}"
MANAGER_EMAIL="${TEST_MANAGER_EMAIL:-manager@test.local}"
PASSWORD="${TEST_USER_PASSWORD:-TestPass123!}"

SUPABASE_URL="${VITE_SUPABASE_URL}"
SERVICE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"

# Create admin user
curl -X POST "${SUPABASE_URL}/functions/v1/users" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${ADMIN_EMAIL}\",
    \"password\": \"${PASSWORD}\",
    \"first_name\": \"Admin\",
    \"last_name\": \"User\",
    \"administrator\": true,
    \"disabled\": false
  }"

# Create director user (non-admin)
curl -X POST "${SUPABASE_URL}/functions/v1/users" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${DIRECTOR_EMAIL}\",
    \"password\": \"${PASSWORD}\",
    \"first_name\": \"Sales\",
    \"last_name\": \"Director\",
    \"administrator\": false,
    \"disabled\": false
  }"

# Create manager user (non-admin)
curl -X POST "${SUPABASE_URL}/functions/v1/users" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${MANAGER_EMAIL}\",
    \"password\": \"${PASSWORD}\",
    \"first_name\": \"Account\",
    \"last_name\": \"Manager\",
    \"administrator\": false,
    \"disabled\": false
  }"
```

**Alternative: Direct psql approach (for local only):**
```sql
-- Insert into auth.users with pre-encrypted password
-- Requires bcrypt password hash
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data
) VALUES (
  gen_random_uuid(),
  'admin@test.local',
  crypt('TestPass123!', gen_salt('bf')),
  NOW(),
  '{"first_name": "Admin", "last_name": "User"}'::jsonb
);
-- Trigger will auto-create sales record
```

### Customizing Data Volume

**Method 1: Environment Variables**
```bash
export SEED_ORGANIZATION_COUNT=200
export SEED_CONTACT_COUNT=500
export SEED_OPPORTUNITY_COUNT=300
npm run seed:data
```

**Method 2: Command Line Override**
```bash
npm run seed:data -- --count=1000
# Sets ALL counts to 1000 (orgs, contacts, opps, activities, notes)
```

**Method 3: Modify CONFIG defaults in seed-data.js**
```javascript
const CONFIG = {
  ORGANIZATION_COUNT: parseInt(process.env.SEED_ORGANIZATION_COUNT || "200"), // Changed from 50
  // ...
};
```

### Adding Industry-Specific Data

**Current: F&B Industry Focus**

**To Add Another Industry (e.g., SaaS):**

1. Add new constants arrays:
```javascript
const SAAS_ORGANIZATION_TYPES = [
  "Enterprise Software",
  "SaaS Platform",
  "DevOps Tools",
  "Analytics Software",
  // ...
];

const SAAS_JOB_TITLES = [
  "CTO",
  "VP of Engineering",
  "Product Manager",
  // ...
];

const SAAS_PRODUCTS = [
  "CI/CD Pipeline",
  "Monitoring Platform",
  "Customer Data Platform",
  // ...
];
```

2. Add industry selection to CONFIG:
```javascript
const CONFIG = {
  INDUSTRY: process.env.SEED_INDUSTRY || "food_beverage", // or "saas"
  // ...
};
```

3. Conditionally select data sources:
```javascript
generateOrganizations() {
  const orgTypes = CONFIG.INDUSTRY === "saas"
    ? SAAS_ORGANIZATION_TYPES
    : FB_ORGANIZATION_TYPES;

  const org = {
    industry: faker.helpers.arrayElement(orgTypes),
    // ...
  };
}
```

### Creating Role-Specific Test Data

**Gap: Current seed data not user-scoped**

**Proposed Extension:**
```javascript
generateContactsForUser(userId, count) {
  this.spinner.start(`Generating ${count} contacts for user ${userId}...`);

  for (let i = 0; i < count; i++) {
    const contact = {
      // ... standard fields
      assigned_to: userId,  // Add ownership field
      created_by: userId,
      // ...
    };
    this.generatedData.contacts.push(contact);
  }
}

// Usage in create-test-users script:
// 1. Create admin user (gets user_id)
// 2. Call: generateContactsForUser(admin_user_id, 100)
// 3. Create director user
// 4. Call: generateContactsForUser(director_user_id, 60)
// 5. Create manager user
// 6. Call: generateContactsForUser(manager_user_id, 40)
```

## Integration with Testing Framework

### Unit Test Mocks

**Pattern: Factory Functions for Test Data**

File: `/home/krwhynot/projects/crispy-crm/src/tests/utils/mock-providers.ts`

```javascript
export const createMockContact = (overrides?: any) => ({
  id: faker.number.int({ min: 1, max: 10000 }),
  first_name: faker.person.firstName(),
  last_name: faker.person.lastName(),
  email: [{ email: faker.internet.email(), type: "Work" }],
  // ...
  ...overrides,  // Allow test-specific overrides
});
```

**Usage in Tests:**
```javascript
import { createMockContact } from '@/tests/utils/mock-providers';

test('contact list renders', () => {
  const testContact = createMockContact({
    first_name: "John",
    last_name: "Doe",
  });
  // ... test with specific data
});
```

### Mock Data Provider

**Pattern: Configurable Mock Provider**
```javascript
export const createMockDataProvider = (overrides?: Partial<DataProvider>) => {
  const defaultProvider: DataProvider = {
    getList: async () => ({ data: [], total: 0 }),
    getOne: async (resource, params) => ({ data: { id: params.id } }),
    // ... other methods
  };

  return { ...defaultProvider, ...overrides };
};
```

**Usage:**
```javascript
const mockProvider = createMockDataProvider({
  getList: async () => ({
    data: [createMockContact(), createMockContact()],
    total: 2,
  }),
});
```

### Error Simulation Helpers

**Pattern: Pre-Built Error Factories**
```javascript
export const createServerError = (message = "Internal server error") => ({
  message,
  status: 500,
});

export const createRLSViolationError = (field?: string) => ({
  message: "RLS policy violation",
  errors: { [field]: "You do not have permission" },
});
```

## Dependencies

### NPM Packages

**@faker-js/faker** (v9.9.0)
- Purpose: Generate realistic fake data
- Used in: seed-data.js, add-more-test-data.js, mock-providers.ts
- Documentation: https://fakerjs.dev/

**@supabase/supabase-js** (v2.39.0)
- Purpose: Supabase client for database operations
- Used in: All seed scripts, Edge Functions
- Authentication: Supports both anon key and service role key

**chalk** (v5.3.0)
- Purpose: Terminal output coloring
- Used in: All seed scripts for user-friendly output

**ora** (v8.1.1)
- Purpose: Terminal spinner for progress indication
- Used in: seed-data.js, add-more-test-data.js

**dotenv** (v16.6.1)
- Purpose: Load environment variables from .env files
- Used in: All seed scripts

### System Requirements

**PostgreSQL Client Tools:**
- `psql` - Required for direct database queries
- `pg_dump` - Required for backup operations
- Version: Compatible with PostgreSQL 15+ (Supabase default)

**Supabase CLI:**
- Package: `supabase` (v2.45.5)
- Required for: Local Supabase management, migrations, user creation
- Installation: `npm install -D supabase`

## Next Steps for Implementation

Based on requirements.md goals, the following enhancements are recommended:

### Priority 1: Automated Test User Creation (US-2)

**Task:** Create `scripts/dev/create-test-users.sh`
- Auto-create 3 users: admin@test.local, director@test.local, manager@test.local
- Use Edge Function /users endpoint with service role key
- Generate role-specific data volumes:
  - Admin: 100 contacts, 50 orgs, 75 opportunities
  - Director: 60 contacts, 30 orgs, 40 opportunities
  - Manager: 40 contacts, 20 orgs, 25 opportunities

**Implementation Approach:**
1. Bash script to call Edge Function for each user
2. Capture returned user IDs
3. Call seed-data.js with TEST_USER_ID env var for ownership
4. Update seed-data.js to support `assigned_to` field

### Priority 2: Test User Metadata Tracking

**Task:** Implement test_user_metadata table (from requirements.md)
```sql
CREATE TABLE public.test_user_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'sales_director', 'account_manager')),
  created_by TEXT DEFAULT 'automated_script',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_sync_at TIMESTAMPTZ,
  test_data_counts JSONB DEFAULT '{}'::jsonb
);
```

**Purpose:**
- Track which users are test users (vs real users post-launch)
- Record how much test data each user owns
- Enable selective cleanup of test data

### Priority 3: Local → Cloud Sync Script (US-1)

**Task:** Create `scripts/dev/sync-local-to-cloud.sh`
- Export local PostgreSQL data (excluding auth schema)
- Backup cloud database before overwrite
- Import local data to cloud
- Sync auth.users separately (preserve encrypted passwords)
- Verify data counts match after sync

**Key Challenge:** Auth user password preservation
- Option 1: Extract encrypted_password from local auth.users, INSERT to cloud
- Option 2: Use Edge Function to recreate users with same credentials
- Recommendation: Option 1 (preserves exact password hashes)

### Priority 4: Environment Reset Script (US-5)

**Task:** Create `scripts/dev/reset-environment.sh`
- Clear both local and cloud databases (preserve schema)
- Recreate 3 test users
- Regenerate all test data
- Sync to cloud
- Verify parity

### Priority 5: Verification Script

**Task:** Create `scripts/dev/verify-environment.sh`
- Compare table counts between local and cloud
- List test users in both environments
- Exit code 0 if match, 1 if mismatch
- Use in CI/CD health checks

## Related Documentation

- `.docs/plans/supabase-cleanup-prelaunch/requirements.md` - Full infrastructure improvement plan
- `docs/supabase/supabase_workflow_overview.md` - Supabase development workflow
- `CLAUDE.md` - Project architecture and conventions
- Supabase Edge Functions docs: https://supabase.com/docs/guides/functions
- Supabase Auth Admin API: https://supabase.com/docs/reference/javascript/auth-admin-createuser

---

**Research Date:** 2025-10-15
**Researcher:** Claude Code (Sonnet 4.5)
**Status:** Complete
