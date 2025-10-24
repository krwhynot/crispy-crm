"""
Transform cleaned contacts CSV to match Atomic CRM database schema.

This script converts the cleaned contacts CSV into the exact format required by
the contacts table in the Atomic CRM Supabase database, including:
- Converting email to JSONB array format
- Converting phone to JSONB array format
- Mapping organization_name to organization_id (lookup required)
- Ensuring all required fields are present
- Formatting dates properly
"""
import os
import json
import pandas as pd

# --- Configuration ---

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)

INPUT_FILE = os.path.join(PROJECT_ROOT, "data/csv-files/cleaned/contacts_cleaned.csv")
OUTPUT_FILE = os.path.join(PROJECT_ROOT, "data/csv-files/cleaned/contacts_db_ready.csv")
ORG_MAPPING_FILE = os.path.join(PROJECT_ROOT, "data/csv-files/organization_mapping.csv")

# Database schema mapping
DB_SCHEMA_COLUMNS = [
    'name',                   # TEXT NOT NULL
    'first_name',            # TEXT
    'last_name',             # TEXT
    'email',                 # JSONB (array)
    'phone',                 # JSONB (array)
    'title',                 # TEXT
    'department',            # TEXT
    'organization_id',       # BIGINT (FK to organizations)
    'address',               # TEXT
    'city',                  # TEXT
    'state',                 # TEXT
    'postal_code',           # TEXT
    'country',               # TEXT (default 'USA')
    'linkedin_url',          # TEXT
    'notes',                 # TEXT
    # Fields we'll leave empty (require business logic or user input):
    # - birthday, twitter_handle, gender, sales_id, tags
    # - created_by, updated_by (handled by database triggers)
    # - first_seen, last_seen, created_at, updated_at (handled by database)
]


def safe_string(value) -> str:
    """Convert value to string, handling NaN/None."""
    if pd.isna(value) or value is None:
        return ""
    return str(value).strip()


def email_to_jsonb(email_str: str) -> str:
    """Convert email string to JSONB array format."""
    email_str = safe_string(email_str)
    if not email_str:
        return "[]"

    # Single email becomes array with one object
    email_obj = {"email": email_str, "type": "work"}
    return json.dumps([email_obj])


def phone_to_jsonb(phone_str: str) -> str:
    """Convert phone string to JSONB array format."""
    phone_str = safe_string(phone_str)
    if not phone_str:
        return "[]"

    # Single phone becomes array with one object
    phone_obj = {"number": phone_str, "type": "work"}
    return json.dumps([phone_obj])


def load_organization_mapping():
    """
    Load organization name to ID mapping.
    If the file doesn't exist, create a stub that needs to be filled.
    """
    if os.path.exists(ORG_MAPPING_FILE):
        print(f"   Loading organization mapping from {ORG_MAPPING_FILE}")
        mapping_df = pd.read_csv(ORG_MAPPING_FILE)
        mapping = dict(zip(mapping_df['organization_name'], mapping_df['organization_id']))
        return mapping
    else:
        print(f"   ⚠️  No organization mapping file found at {ORG_MAPPING_FILE}")
        print(f"   ℹ️  Will create a stub file that needs to be populated")
        return None


def create_organization_mapping_stub(unique_org_names):
    """Create a stub CSV file for organization name to ID mapping."""
    stub_df = pd.DataFrame({
        'organization_name': sorted(unique_org_names),
        'organization_id': [''] * len(unique_org_names)
    })

    os.makedirs(os.path.dirname(ORG_MAPPING_FILE), exist_ok=True)
    stub_df.to_csv(ORG_MAPPING_FILE, index=False)

    print(f"\n   📝 Created organization mapping stub at: {ORG_MAPPING_FILE}")
    print(f"   ℹ️  This file has {len(unique_org_names)} unique organization names")
    print(f"   ℹ️  You need to fill in the organization_id column with actual IDs from your database")
    print(f"   ℹ️  Then re-run this script to complete the transformation")


def main():
    """Main transformation pipeline."""
    print("\n🔄 Starting contacts database transformation...\n")

    # 1. Load cleaned contacts
    print(f"📂 Loading cleaned contacts from: {INPUT_FILE}")
    df = pd.read_csv(INPUT_FILE)
    print(f"   Found {len(df):,} contacts to transform")

    # 2. Load or create organization mapping
    org_mapping = load_organization_mapping()

    if org_mapping is None:
        # Extract unique organization names and create stub
        unique_orgs = df['organization_name'].dropna().unique()
        unique_orgs = [org for org in unique_orgs if str(org).strip()]

        if len(unique_orgs) > 0:
            create_organization_mapping_stub(unique_orgs)
            print("\n❌ Cannot complete transformation without organization IDs")
            print("   Please populate the organization mapping file and re-run this script.\n")
            return
        else:
            print("   No organizations found in contact data")
            org_mapping = {}

    # 3. Transform data
    print("\n🔄 Transforming data to database schema...")

    transformed = pd.DataFrame()

    # Direct mappings (no transformation needed)
    transformed['name'] = df['name']
    transformed['first_name'] = df['first_name']
    transformed['last_name'] = df['last_name']
    transformed['title'] = df['title']
    transformed['address'] = df['address']
    transformed['city'] = df['city']
    transformed['state'] = df['state']
    transformed['postal_code'] = df['postal_code']
    transformed['linkedin_url'] = df['linkedin_url']
    transformed['notes'] = df['notes']

    # JSONB transformations
    print("   - Converting emails to JSONB array format...")
    transformed['email'] = df['email'].apply(email_to_jsonb)

    print("   - Converting phones to JSONB array format...")
    transformed['phone'] = df['phone'].apply(phone_to_jsonb)

    # Organization mapping
    print("   - Mapping organization names to IDs...")
    transformed['organization_id'] = df['organization_name'].apply(
        lambda x: org_mapping.get(safe_string(x), '') if org_mapping else ''
    )

    # Add default values
    transformed['country'] = 'USA'
    transformed['department'] = ''  # Not in source data

    # Count statistics
    stats = {
        'total_contacts': len(transformed),
        'contacts_with_email': (transformed['email'] != '[]').sum(),
        'contacts_with_phone': (transformed['phone'] != '[]').sum(),
        'contacts_with_org': (transformed['organization_id'] != '').sum(),
        'contacts_with_address': transformed['address'].notna().sum(),
    }

    # 4. Reorder columns to match schema
    transformed = transformed[DB_SCHEMA_COLUMNS]

    # 5. Save output
    print("\n💾 Saving transformed data...")
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    transformed.to_csv(OUTPUT_FILE, index=False)

    # 6. Generate report
    print(f"   ✓ Database-ready CSV saved to: {OUTPUT_FILE}")

    print("\n" + "="*60)
    print(" TRANSFORMATION REPORT")
    print("="*60)
    print(f"Total contacts transformed: {stats['total_contacts']:,}")
    print(f"Contacts with email: {stats['contacts_with_email']:,}")
    print(f"Contacts with phone: {stats['contacts_with_phone']:,}")
    print(f"Contacts with organization ID: {stats['contacts_with_org']:,}")
    print(f"Contacts with address: {stats['contacts_with_address']:,}")
    print("="*60)

    # Show sample of JSONB format
    print("\n📋 Sample of transformed data (first 3 rows):")
    print("\nEmail JSONB format examples:")
    for idx, email in enumerate(transformed['email'].head(3)):
        if email != '[]':
            print(f"  {idx+1}. {email}")

    print("\nPhone JSONB format examples:")
    for idx, phone in enumerate(transformed['phone'].head(3)):
        if phone != '[]':
            print(f"  {idx+1}. {phone}")

    print("\n✅ Transformation complete!\n")
    print("Next steps:")
    print("1. Review the output file to ensure data quality")
    print("2. Import into Supabase using:")
    print(f"   COPY contacts (name, first_name, ...) FROM '{OUTPUT_FILE}' CSV HEADER;")
    print("   (Or use your preferred import method)\n")


if __name__ == "__main__":
    main()
