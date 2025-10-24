"""
Comprehensive cleaning script for contacts CSV file.

This script performs the following actions:
1.  Loads a CSV file, skipping initial instructional rows.
2.  Renames and selects columns according to a target schema.
3.  Parses and cleans complex name fields, extracting titles.
4.  Standardizes phone numbers to E.164 format.
5.  Validates and standardizes email addresses.
6.  Standardizes US state names to 2-letter postal codes.
7.  Performs basic cleaning on organization and other text fields.
8.  Validates rows and separates them into 'cleaned' and 'rejected' files.
9.  Generates a detailed report of the cleaning process.
"""
import os
import re
import time
from typing import Dict, Optional, Tuple

import pandas as pd
import phonenumbers

# --- Configuration ---

# File Paths (relative to project root)
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
INPUT_FILE_PATH = os.path.join(PROJECT_ROOT, "data/csv-files/contacts.csv")
OUTPUT_DIR = os.path.join(PROJECT_ROOT, "data/csv-files/cleaned")
CLEANED_FILE_PATH = os.path.join(OUTPUT_DIR, "contacts_cleaned.csv")
REJECTED_FILE_PATH = os.path.join(OUTPUT_DIR, "contacts_rejected.csv")

# Data Loading
ROWS_TO_SKIP = 3  # Skip instruction rows, use row 4 as header

# Column Mapping: Maps source column names to target schema names
COLUMN_MAPPING = {
    "FULL NAME (FIRST, LAST)": "full_name_raw",
    "Organizations (DropDown)": "organization_name",
    "POSITION (DropDown)": "title_raw",
    "EMAIL": "email",
    "PHONE": "phone",
    "ACCT. MANAGER (DropDown)": "account_manager",
    "LINKEDIN": "linkedin_url",
    "STREET ADDRESS": "address",
    "CITY": "city",
    "STATE (DropDown)": "state",
    "ZIP": "postal_code",
    "NOTES": "notes",
}

# Target Schema: Defines the final structure of the cleaned data
TARGET_SCHEMA = [
    "first_name",
    "last_name",
    "name",
    "title",
    "email",
    "phone",
    "organization_name",
    "account_manager",
    "linkedin_url",
    "address",
    "city",
    "state",
    "postal_code",
    "notes",
]

# Data Cleaning Constants
# Common job titles to extract from name fields. Case-insensitive.
# More specific titles (e.g., 'chef de cuisine') should come before general ones ('chef').
TITLES_TO_EXTRACT = [
    "ceo", "chief executive officer", "cto", "chief technology officer",
    "cfo", "chief financial officer", "coo", "chief operating officer",
    "vp", "vice president", "owner", "partner", "manager", "director",
    "president", "founder", "chef de cuisine", "chef", "consultant",
    "exec chef", "executive chef", "pastry chef", "distributor rep",
    "gm", "general manager"
]

# Placeholder domains to identify invalid emails
PLACEHOLDER_EMAIL_DOMAINS = ["example.com", "test.com", "invalid.com", "noemail.com"]

# US State mapping for standardization
STATE_MAPPING = {
    "alabama": "AL", "alaska": "AK", "arizona": "AZ", "arkansas": "AR",
    "california": "CA", "colorado": "CO", "connecticut": "CT", "delaware": "DE",
    "florida": "FL", "georgia": "GA", "hawaii": "HI", "idaho": "ID",
    "illinois": "IL", "indiana": "IN", "iowa": "IA", "kansas": "KS",
    "kentucky": "KY", "louisiana": "LA", "maine": "ME", "maryland": "MD",
    "massachusetts": "MA", "michigan": "MI", "minnesota": "MN",
    "mississippi": "MS", "missouri": "MO", "montana": "MT", "nebraska": "NE",
    "nevada": "NV", "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM",
    "new york": "NY", "north carolina": "NC", "north dakota": "ND", "ohio": "OH",
    "oklahoma": "OK", "oregon": "OR", "pennsylvania": "PA", "rhode island": "RI",
    "south carolina": "SC", "south dakota": "SD", "tennessee": "TN", "texas": "TX",
    "utah": "UT", "vermont": "VT", "virginia": "VA", "washington": "WA",
    "west virginia": "WV", "wisconsin": "WI", "wyoming": "WY",
    "district of columbia": "DC", "puerto rico": "PR"
}


# --- Helper Functions ---

def safe_string(value) -> str:
    """Converts a value to a string, handling NaN or None."""
    if pd.isna(value) or value is None:
        return ""
    return str(value).strip()


def parse_name_and_title(name_str: str) -> Tuple[str, str, str]:
    """
    Parses a raw name string to extract first name, last name, and title.
    Handles formats like "Last, First", "First Last", and embedded titles.
    """
    first_name, last_name, extracted_title = "", "", ""
    name_str = safe_string(name_str)
    if not name_str:
        return first_name, last_name, extracted_title

    # 1. Extract known titles
    for title in TITLES_TO_EXTRACT:
        # Use word boundaries to avoid matching parts of names
        pattern = re.compile(r'\b' + re.escape(title) + r'\b', re.IGNORECASE)
        if pattern.search(name_str):
            extracted_title = title.title()
            name_str = pattern.sub('', name_str).strip()
            break  # Stop after finding the first title

    # 2. Parse the remaining name string
    name_str = re.sub(r'\s{2,}', ' ', name_str).strip(', ') # Clean up extra spaces/commas

    if "," in name_str:
        # Assumes "Last, First" format
        parts = [p.strip() for p in name_str.split(",", 1)]
        if len(parts) == 2:
            last_name, first_name = parts[0], parts[1]
    else:
        # Assumes "First Last" or just one name
        parts = name_str.split()
        if len(parts) == 1:
            last_name = parts[0] # Assume a single name is a last name
        elif len(parts) == 2:
            first_name, last_name = parts[0], parts[1]
        elif len(parts) > 2:
            # Handle multi-word names (e.g., "John von Neumann")
            first_name = " ".join(parts[:-1])
            last_name = parts[-1]

    return first_name.title(), last_name.title(), extracted_title


def standardize_phone(phone_str: str) -> Optional[str]:
    """
    Standardizes a phone number to E.164 format (e.g., +15551234567).
    Assumes US numbers if no country code is provided.
    """
    phone_str = safe_string(phone_str)
    if not phone_str:
        return None
    try:
        # The 'US' hint helps parse numbers without a country code
        parsed_number = phonenumbers.parse(phone_str, "US")
        if phonenumbers.is_valid_number(parsed_number):
            return phonenumbers.format_number(
                parsed_number, phonenumbers.PhoneNumberFormat.E164
            )
    except phonenumbers.phonenumberutil.NumberParseException:
        return None
    return None


def validate_and_clean_email(email_str: str) -> Optional[str]:
    """
    Validates email format, converts to lowercase, and checks for placeholder domains.
    """
    email_str = safe_string(email_str).lower()
    if not email_str:
        return None

    # Regex for basic email format validation
    email_regex = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
    if not re.match(email_regex, email_str):
        return None

    domain = email_str.split("@")[1]
    if domain in PLACEHOLDER_EMAIL_DOMAINS:
        return None

    return email_str


def standardize_state(state_str: str) -> Optional[str]:
    """Standardizes a state name to its 2-letter postal code."""
    state_str = safe_string(state_str).lower()
    if not state_str:
        return None

    # Direct match
    if state_str in STATE_MAPPING:
        return STATE_MAPPING[state_str]

    # Check if it's already an abbreviation
    if len(state_str) == 2 and state_str.upper() in STATE_MAPPING.values():
        return state_str.upper()

    return None


def generate_report(
    stats: Dict, execution_time: float
) -> None:
    """Prints a detailed report of the cleaning process."""
    print("\n" + "="*60)
    print(" DATA CLEANING REPORT")
    print("="*60)
    print(f"Completed in {execution_time:.2f} seconds.")
    print("-" * 60)
    print(f"Total rows processed: {stats['total_rows']:,}")
    print(f"Rows cleaned and saved: {stats['cleaned_rows']:,}")
    print(f"Rows rejected: {stats['rejected_rows']:,}")
    print("-" * 60)
    print("Cleaning Actions Summary:")
    print(f"  - Names parsed: {stats['names_parsed']:,}")
    print(f"  - Phone numbers standardized: {stats['phones_standardized']:,}")
    print(f"  - Emails validated: {stats['emails_validated']:,}")
    print(f"  - States standardized: {stats['states_standardized']:,}")
    print("-" * 60)
    print("Rejection Reasons Breakdown:")
    if not stats['rejection_reasons']:
        print("  - No rows were rejected.")
    else:
        for reason, count in stats['rejection_reasons'].items():
            print(f"  - {reason}: {count:,}")
    print("="*60 + "\n")


def main():
    """Main function to orchestrate the data cleaning pipeline."""
    start_time = time.time()

    print("\n🧹 Starting contact data cleaning process...\n")

    if not os.path.exists(INPUT_FILE_PATH):
        print(f"❌ Error: Input file not found at '{INPUT_FILE_PATH}'")
        return

    # 1. Load Data
    print(f"📂 Loading data from: {INPUT_FILE_PATH}")
    # Try different encodings to handle special characters
    encodings_to_try = ['utf-8', 'latin-1', 'iso-8859-1', 'cp1252']
    df = None

    # The CSV has a multi-line header that spans rows 4-8
    # We'll skip to row 9 and manually assign column names
    manual_columns = [
        "PRIORITY (Formula)",
        "FULL NAME (FIRST, LAST)",
        "Organizations (DropDown)",
        "POSITION (DropDown)",
        "EMAIL",
        "PHONE",
        "ACCT. MANAGER (DropDown)",
        "LINKEDIN",
        "STREET ADDRESS",
        "CITY",
        "STATE (DropDown)",
        "ZIP",
        "NOTES",
        "Filtered Contacts",
        "Unnamed_14",
        "Unnamed_15",
        "Unnamed_16"
    ]

    for encoding in encodings_to_try:
        try:
            # Skip the first 8 rows (instructions + multi-line header)
            df = pd.read_csv(INPUT_FILE_PATH, skiprows=8, encoding=encoding, header=None, names=manual_columns)
            print(f"   Successfully loaded with {encoding} encoding")
            break
        except UnicodeDecodeError:
            continue

    if df is None:
        print("❌ Error: Could not read CSV with any supported encoding")
        return

    # Initialize stats
    stats = {
        "total_rows": len(df),
        "cleaned_rows": 0,
        "rejected_rows": 0,
        "names_parsed": 0,
        "phones_standardized": 0,
        "emails_validated": 0,
        "states_standardized": 0,
        "rejection_reasons": {}
    }

    print(f"   Found {stats['total_rows']:,} rows to process")

    # Keep original data for rejected file
    original_df = df.copy()

    # 2. Rename and Select Columns
    print("\n🔄 Mapping columns to target schema...")
    df = df.rename(columns=COLUMN_MAPPING)
    required_cols = list(COLUMN_MAPPING.values())
    df = df[required_cols]

    # 3. Clean and Transform Data
    print("🧼 Cleaning and transforming data...")

    # Name and Title Parsing
    print("   - Parsing names and extracting titles...")
    parsed_names = df["full_name_raw"].apply(parse_name_and_title)
    df[["first_name", "last_name", "extracted_title"]] = pd.DataFrame(
        parsed_names.tolist(), index=df.index
    )
    stats['names_parsed'] = ((df['first_name'] != '') | (df['last_name'] != '')).sum()

    # Combine titles
    df["title"] = df["title_raw"].combine_first(df["extracted_title"])
    df["title"] = df["title"].apply(safe_string).str.title()

    # Standardize other fields
    print("   - Standardizing phone numbers to E.164 format...")
    df["phone_clean"] = df["phone"].apply(standardize_phone)
    stats['phones_standardized'] = df["phone_clean"].notna().sum()

    print("   - Validating and cleaning email addresses...")
    df["email_clean"] = df["email"].apply(validate_and_clean_email)
    stats['emails_validated'] = df["email_clean"].notna().sum()

    print("   - Standardizing state codes...")
    df["state_clean"] = df["state"].apply(standardize_state)
    stats['states_standardized'] = df["state_clean"].notna().sum()

    # Generic cleaning for other text fields
    print("   - Cleaning text fields...")
    for col in ["organization_name", "account_manager", "address", "city", "notes", "linkedin_url"]:
        if col in df.columns:
            df[col] = df[col].apply(safe_string)

    # Create derived 'name' field
    df["name"] = (df["first_name"] + " " + df["last_name"]).str.strip()

    # 4. Validation and Rejection Logic
    print("\n✅ Validating records...")
    rejection_reasons = []
    for _, row in df.iterrows():
        reasons = []
        if not row["first_name"] and not row["last_name"]:
            reasons.append("Missing Name")
        if pd.isna(row["email_clean"]) and pd.isna(row["phone_clean"]):
            reasons.append("Missing Contact Info (Email/Phone)")

        rejection_reasons.append(", ".join(reasons))

    df["rejection_reason"] = rejection_reasons

    # Override cleaned columns with their clean versions
    df['email'] = df['email_clean']
    df['phone'] = df['phone_clean']
    df['state'] = df['state_clean']

    # 5. Split DataFrames
    is_rejected = df["rejection_reason"] != ""
    cleaned_df = df[~is_rejected][TARGET_SCHEMA]

    rejected_df = original_df[is_rejected].copy()
    rejected_df["rejection_reason"] = df[is_rejected]["rejection_reason"]

    # 6. Update Stats
    stats["cleaned_rows"] = len(cleaned_df)
    stats["rejected_rows"] = len(rejected_df)
    reason_counts = rejected_df["rejection_reason"].value_counts().to_dict()
    stats["rejection_reasons"] = reason_counts

    # 7. Save Output Files
    print("\n💾 Saving results...")
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    cleaned_df.to_csv(CLEANED_FILE_PATH, index=False)
    rejected_df.to_csv(REJECTED_FILE_PATH, index=False)

    print(f"   ✓ Cleaned data saved to '{CLEANED_FILE_PATH}'")
    print(f"   ✓ Rejected data saved to '{REJECTED_FILE_PATH}'")

    # 8. Generate Report
    execution_time = time.time() - start_time
    generate_report(stats, execution_time)


if __name__ == "__main__":
    main()
