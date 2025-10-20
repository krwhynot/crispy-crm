s# Supabase Data Sync Workflows

A detailed guide for synchronizing data between Cloud and Local Supabase environments, with different approaches for pre-launch and post-launch phases.

## Table of Contents

- [Pre-Launch Workflow](#pre-launch-workflow-development-phase)
- [Post-Launch Workflow](#post-launch-workflow-production-phase)
- [Transition Checklist](#transition-checklist)

---

## Pre-Launch Workflow (Development Phase)

**When to use**: Before you have real users or sensitive data

**Goal**: Complete data parity between cloud and local for rapid development

### Overview

During development, you can freely copy all data between environments since:
- All users are test accounts
- No sensitive customer data exists
- Passwords are test passwords
- You need exact replication for testing

### Step-by-Step Instructions

#### 1. Initial Setup

First, ensure your local Supabase is initialized:

```bash
# In your project root
npx supabase init

# Start local Supabase
npx supabase start
```

Save the local credentials shown:
```
API URL: http://localhost:54321
DB URL: postgresql://postgres:postgres@localhost:54322/postgres
Studio URL: http://localhost:54323
anon key: eyJ...
service_role key: eyJ...
```

#### 2. Link to Your Cloud Project

```bash
# Get your project ID from: https://app.supabase.com/project/[PROJECT_ID]
npx supabase link --project-ref your-project-id

# Verify connection
npx supabase status
```

#### 3. Pull Complete Cloud Data

```bash
# Option A: Pull everything (schema + data)
npx supabase db dump --data-only > cloud_data_$(date +%Y%m%d).sql

# Option B: Pull with more control
npx supabase db dump \
  --data-only \
  --exclude-table storage.objects \
  > cloud_data_$(date +%Y%m%d).sql
```

#### 4. Import to Local Database

```bash
# Reset local database first (removes existing data)
npx supabase db reset

# Import cloud data
psql postgresql://postgres:postgres@localhost:54322/postgres < cloud_data_$(date +%Y%m%d).sql

# Verify import
psql postgresql://postgres:postgres@localhost:54322/postgres -c "SELECT COUNT(*) FROM auth.users;"
```

#### 5. Test User Authentication

Your cloud users now work locally:

```javascript
// test_login.js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'http://localhost:54321',
  'your-local-anon-key'
)

// Same credentials as cloud!
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'testuser@example.com',    // Your cloud test user
  password: 'testpassword123'        // Your cloud password
})

console.log('Login successful:', data.user.email)
console.log('User ID:', data.user.id)

// All user data is available
const { data: userContacts } = await supabase
  .from('contacts')
  .select('*')

console.log('User contacts:', userContacts.length)
```

#### 6. Daily Sync Routine (Pre-Launch)

Create this script for daily syncing:

```bash
#!/bin/bash
# scripts/sync_dev_data.sh

echo "🔄 Syncing cloud data to local..."

# Backup current local data (optional)
echo "📦 Backing up local data..."
pg_dump postgresql://postgres:postgres@localhost:54322/postgres \
  > backups/local_backup_$(date +%Y%m%d_%H%M%S).sql

# Pull fresh cloud data
echo "☁️ Downloading cloud data..."
npx supabase db dump --data-only > temp_cloud_data.sql

# Reset and import
echo "💾 Importing to local..."
npx supabase db reset --clean
psql postgresql://postgres:postgres@localhost:54322/postgres < temp_cloud_data.sql

# Cleanup
rm temp_cloud_data.sql

echo "✅ Sync complete! Local now matches cloud."
echo "🔐 Test users and passwords are identical."
```

Make it executable:
```bash
chmod +x scripts/sync_dev_data.sh
./scripts/sync_dev_data.sh
```

### What You Get

After following these steps:

| Feature | Cloud | Local |
|---------|-------|-------|
| User Accounts | `john@test.com` / `pass123` | `john@test.com` / `pass123` ✅ |
| User Data | 50 contacts, 10 deals | 50 contacts, 10 deals ✅ |
| Relationships | All foreign keys intact | All foreign keys intact ✅ |
| Auth Sessions | Valid tokens | Valid tokens ✅ |
| RLS Policies | Applied | Applied ✅ |

### Common Development Scenarios

#### Scenario 1: Testing New Features
```bash
# Morning: Sync latest data
./scripts/sync_dev_data.sh

# Develop feature locally
# Test with real test data

# Evening: Push schema changes only (not data)
npx supabase db push
```

#### Scenario 2: Debugging Cloud Issues
```bash
# User reports issue in cloud test environment
# Pull exact state
npx supabase db dump --data-only > debug_state.sql
psql postgresql://postgres:postgres@localhost:54322/postgres < debug_state.sql

# Now you have exact same data to debug
```

#### Scenario 3: Team Collaboration
```bash
# Team member creates test data in cloud
# You pull it instantly
./scripts/sync_dev_data.sh

# You both work with identical data
```

---

## Post-Launch Workflow (Production Phase)

**When to use**: After you have real users and sensitive data

**Goal**: Safe debugging with anonymized data

### Overview

Once live, you CANNOT copy production data directly because:
- Real user emails and passwords are sensitive
- Personal information must be protected
- Compliance requirements (GDPR, CCPA, etc.)
- Security best practices

### Architecture

```
Production (Real Data)
    ↓ [Anonymize]
Staging (Fake Names, Real Structure)
    ↓ [Copy Subset]
Local (For Development)
```

### Step-by-Step Instructions

#### 1. Create Staging Environment

```bash
# 1. Create new Supabase project called "MyApp-Staging"
# 2. Save staging credentials
STAGING_PROJECT_ID="your-staging-id"
STAGING_DB_URL="postgresql://postgres:pass@db.staging.supabase.co:5432/postgres"
```

#### 2. Create Anonymization Script

Create `scripts/anonymize_production.sql`:

```sql
-- scripts/anonymize_production.sql
-- This runs AFTER importing to staging

-- Anonymize auth.users
UPDATE auth.users SET
  email = CONCAT('user_', LEFT(id::text, 8), '@staging-test.com'),
  raw_user_meta_data = jsonb_build_object(
    'full_name', CONCAT('Test User ', LEFT(id::text, 6)),
    'avatar_url', 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || id
  ),
  encrypted_password = crypt('stagingpass123', gen_salt('bf')),
  phone = CONCAT('+1555000', LEFT(abs(hashtext(id::text)), 4));

-- Anonymize profiles
UPDATE public.profiles SET
  email = CONCAT('user_', LEFT(id::text, 8), '@staging-test.com'),
  full_name = CONCAT('Test User ', LEFT(id::text, 6)),
  phone = CONCAT('+1555000', LEFT(abs(hashtext(id::text)), 4)),
  address = '123 Test Street, Test City, TC 12345',
  ssn = NULL,  -- Remove sensitive data
  credit_card = NULL,
  bank_account = NULL;

-- Anonymize contacts
UPDATE public.contacts SET
  first_name = CONCAT('FirstName_', id),
  last_name = CONCAT('LastName_', id),
  email = CONCAT('contact_', id, '@example.com'),
  phone = CONCAT('+1555', LPAD(id::text, 7, '0')),
  address = '456 Example Ave',
  notes = 'Anonymized contact data';

-- Anonymize companies
UPDATE public.organizations SET
  name = CONCAT('Company_', id),
  email = CONCAT('info@company', id, '.example'),
  phone = CONCAT('+1555', LPAD(id::text, 7, '0')),
  website = CONCAT('https://company', id, '.example'),
  address = '789 Business Blvd';

-- Scramble financial data
UPDATE public.opportunities SET
  amount = ROUND(amount * (0.8 + random() * 0.4), 2),
  notes = 'Anonymized opportunity data',
  contract_details = NULL;

-- Log anonymization
INSERT INTO public.anonymization_log (
  anonymized_at,
  tables_affected,
  records_count
) VALUES (
  now(),
  ARRAY['auth.users', 'profiles', 'contacts', 'organizations', 'opportunities'],
  (SELECT COUNT(*) FROM auth.users)
);
```

#### 3. Create Production-to-Staging Sync Script

Create `scripts/sync_staging.sh`:

```bash
#!/bin/bash
# scripts/sync_staging.sh

set -e  # Exit on error

echo "🔐 Production to Staging Sync (Anonymized)"
echo "==========================================="

# Configuration
PROD_DB_URL="${PRODUCTION_DATABASE_URL}"
STAGING_DB_URL="${STAGING_DATABASE_URL}"
BACKUP_DIR="./backups/staging"

# Create backup directory
mkdir -p $BACKUP_DIR

# Step 1: Backup production (for safety)
echo "📦 Backing up production..."
pg_dump $PROD_DB_URL \
  --no-owner \
  --no-acl \
  --data-only \
  --exclude-table=audit_logs \
  --exclude-table=payment_methods \
  > $BACKUP_DIR/prod_backup_$(date +%Y%m%d_%H%M%S).sql

# Step 2: Create staging dump
echo "📤 Exporting production data..."
pg_dump $PROD_DB_URL \
  --no-owner \
  --no-acl \
  --data-only \
  --exclude-table=audit_logs \
  --exclude-table=payment_methods \
  --exclude-table=credit_cards \
  > staging_data.sql

# Step 3: Clear staging database
echo "🧹 Cleaning staging database..."
psql $STAGING_DB_URL << EOF
TRUNCATE TABLE
  auth.users,
  public.profiles,
  public.contacts,
  public.organizations,
  public.opportunities
CASCADE;
EOF

# Step 4: Import to staging
echo "📥 Importing to staging..."
psql $STAGING_DB_URL < staging_data.sql

# Step 5: Anonymize data
echo "🔒 Anonymizing sensitive data..."
psql $STAGING_DB_URL < scripts/anonymize_production.sql

# Step 6: Create test accounts
echo "👤 Creating standard test accounts..."
psql $STAGING_DB_URL << EOF
-- Create known test users for development
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at
) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'admin@staging.test',
    crypt('testpass123', gen_salt('bf')),
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'user@staging.test',
    crypt('testpass123', gen_salt('bf')),
    now(),
    now()
  )
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  encrypted_password = EXCLUDED.encrypted_password;

-- Create profiles for test users
INSERT INTO public.profiles (id, full_name, email)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Admin User', 'admin@staging.test'),
  ('00000000-0000-0000-0000-000000000002', 'Test User', 'user@staging.test')
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email;
EOF

# Step 7: Cleanup
rm staging_data.sql

echo "✅ Staging sync complete!"
echo ""
echo "📊 Statistics:"
psql $STAGING_DB_URL -t << EOF
SELECT
  'Users: ' || COUNT(*) FROM auth.users
UNION ALL
SELECT 'Contacts: ' || COUNT(*) FROM public.contacts
UNION ALL
SELECT 'Organizations: ' || COUNT(*) FROM public.organizations;
EOF

echo ""
echo "🔑 Test Accounts:"
echo "  Email: admin@staging.test"
echo "  Password: testpass123"
echo ""
echo "  Email: user@staging.test"
echo "  Password: testpass123"
```

#### 4. Sync Staging to Local

Create `scripts/staging_to_local.sh`:

```bash
#!/bin/bash
# scripts/staging_to_local.sh

echo "📥 Syncing Staging to Local..."

# Pull from staging (already anonymized)
npx supabase link --project-ref $STAGING_PROJECT_ID
npx supabase db dump --data-only > staging_dump.sql

# Import to local
npx supabase db reset
psql postgresql://postgres:postgres@localhost:54322/postgres < staging_dump.sql

echo "✅ Local now matches staging (anonymized data)"
echo "🔑 Login with: admin@staging.test / testpass123"
```

#### 5. Debug Specific User Issues

When debugging a specific production issue:

```bash
#!/bin/bash
# scripts/debug_user.sh

USER_ID=$1
OUTPUT_FILE="debug_data/user_${USER_ID}_$(date +%Y%m%d).sql"

echo "🔍 Extracting data for user: $USER_ID"

# Extract specific user's data
psql $PRODUCTION_DATABASE_URL << EOF > $OUTPUT_FILE
-- Get user and related data
COPY (
  SELECT * FROM auth.users WHERE id = '$USER_ID'
) TO STDOUT WITH CSV HEADER;

COPY (
  SELECT * FROM public.profiles WHERE id = '$USER_ID'
) TO STDOUT WITH CSV HEADER;

COPY (
  SELECT * FROM public.contacts WHERE user_id = '$USER_ID'
  ORDER BY created_at DESC
  LIMIT 100
) TO STDOUT WITH CSV HEADER;
EOF

# Anonymize the extracted data
sed -i 's/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/user@example.com/g' $OUTPUT_FILE
sed -i 's/\+[0-9]{10,}/+15550000000/g' $OUTPUT_FILE

echo "📦 Anonymized data saved to: $OUTPUT_FILE"
echo "⚠️  Remember to delete after debugging!"
```

### Automated Daily Staging Sync

Set up a GitHub Action for automated syncing:

```yaml
# .github/workflows/sync_staging.yml
name: Sync Staging Database

on:
  schedule:
    - cron: '0 2 * * *'  # 2 AM UTC daily
  workflow_dispatch:  # Manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    environment: staging

    steps:
      - uses: actions/checkout@v4

      - name: Install PostgreSQL client
        run: |
          sudo apt-get update
          sudo apt-get install -y postgresql-client

      - name: Sync and Anonymize
        env:
          PRODUCTION_DATABASE_URL: ${{ secrets.PROD_DB_URL }}
          STAGING_DATABASE_URL: ${{ secrets.STAGING_DB_URL }}
        run: |
          chmod +x scripts/sync_staging.sh
          ./scripts/sync_staging.sh

      - name: Notify Team
        uses: slack-github-action@v1.24.0
        with:
          payload: |
            {
              "text": "✅ Staging database synced and anonymized",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "Staging database has been updated with anonymized production data"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

### Security Checklist

Before syncing production data:

- [ ] Staging environment is access-controlled
- [ ] Anonymization script tested and verified
- [ ] Sensitive fields identified and handled
- [ ] No production passwords copied
- [ ] No PII (Personally Identifiable Information) exposed
- [ ] Audit logging enabled
- [ ] Team trained on data handling procedures

---

## Transition Checklist

### Moving from Pre-Launch to Post-Launch

When you're ready to go live, follow this checklist:

#### 1. Final Development Backup
```bash
# Save your final test data
npx supabase db dump --data-only > final_test_data_$(date +%Y%m%d).sql
```

#### 2. Create Staging Environment
- [ ] Create new Supabase project for staging
- [ ] Configure same settings as production
- [ ] Test anonymization scripts

#### 3. Update Scripts
- [ ] Replace `sync_dev_data.sh` with `sync_staging.sh`
- [ ] Add anonymization steps to all data scripts
- [ ] Update team documentation

#### 4. Security Measures
- [ ] Enable audit logging in production
- [ ] Set up data access alerts
- [ ] Document data handling procedures
- [ ] Train team on new workflow

#### 5. First Production Sync Test
```bash
# Test with minimal data first
./scripts/sync_staging.sh --limit 100

# Verify anonymization worked
psql $STAGING_DB_URL -c "SELECT email, full_name FROM auth.users LIMIT 5;"
# Should show: user_xxx@staging-test.com, Test User xxx
```

## Quick Reference

### Pre-Launch Commands
```bash
# Full sync (safe - all test data)
npx supabase db dump --data-only > data.sql
psql postgresql://postgres:postgres@localhost:54322/postgres < data.sql

# Test login works
# Same email/password as cloud
```

### Post-Launch Commands
```bash
# Staging sync (anonymized)
./scripts/sync_staging.sh

# Local from staging
./scripts/staging_to_local.sh

# Debug specific issue
./scripts/debug_user.sh <user-id>
```

### Test Accounts (Post-Launch)

| Environment | Email | Password |
|------------|-------|----------|
| Production | Real users | Real passwords |
| Staging | `admin@staging.test` | `testpass123` |
| Local | `admin@staging.test` | `testpass123` |

## Troubleshooting

### Issue: Login doesn't work after sync

**Pre-Launch**: Check if auth.users data was included
```bash
grep "INSERT INTO auth.users" your_dump.sql
```

**Post-Launch**: Verify anonymization script ran
```bash
psql $STAGING_DB_URL -c "SELECT email FROM auth.users LIMIT 1;"
# Should show: user_xxx@staging-test.com
```

### Issue: Missing related data

Check foreign key constraints:
```sql
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY';
```

### Issue: Staging sync fails

Check exclusions in dump command:
```bash
# May need to exclude more tables
pg_dump $PROD_DB_URL \
  --exclude-table=sensitive_table \
  --exclude-table=audit_logs \
  --data-only > staging.sql
```

## Summary

- **Pre-Launch**: Copy everything freely, including users and passwords
- **Post-Launch**: Use staging with anonymization, never copy real user data locally
- **Key Difference**: Pre-launch = exact copy, Post-launch = anonymized copy
- **Test Accounts**: Pre-launch = your real test accounts, Post-launch = generic staging accounts

Remember: The transition from pre-launch to post-launch is ONE WAY. Once you have real users, never go back to copying production data directly!