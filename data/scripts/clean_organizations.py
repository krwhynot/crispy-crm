#!/usr/bin/env python3
"""
Data Cleaning Script for organizations_transformed.csv

This script standardizes:
- Phone number formatting (to E.164 format)
- Name capitalization (proper title case)
- City/State formatting
- Whitespace normalization
- Special character cleanup

Author: Claude Code
Date: 2025-10-24
"""

import csv
import re
from typing import Dict, Optional


def clean_phone_number(phone: str) -> str:
    """
    Standardize phone number to E.164 format (+1-XXX-XXX-XXXX)

    Examples:
        "(312) 555-1234" -> "+1-312-555-1234"
        "312-555-1234" -> "+1-312-555-1234"
        "+1 (312) 555-1234" -> "+1-312-555-1234"
    """
    if not phone or not phone.strip():
        return ""

    # Remove all non-digit characters
    digits = re.sub(r'\D', '', phone)

    # Handle different lengths
    if len(digits) == 10:
        # US number without country code
        return f"+1-{digits[0:3]}-{digits[3:6]}-{digits[6:10]}"
    elif len(digits) == 11 and digits[0] == '1':
        # US number with country code
        return f"+1-{digits[1:4]}-{digits[4:7]}-{digits[7:11]}"
    elif len(digits) == 7:
        # Local number (no area code) - return as-is with formatting
        return f"{digits[0:3]}-{digits[3:7]}"
    else:
        # Unknown format - return cleaned digits
        return phone.strip()


def title_case_smart(text: str) -> str:
    """
    Apply smart title casing that preserves certain uppercase patterns

    Preserves:
    - Acronyms (LLC, INC, DBA, etc.)
    - State codes (IL, MI, OH, etc.)
    - Roman numerals (II, III, IV, etc.)
    - Known abbreviations
    """
    if not text or not text.strip():
        return ""

    # List of words that should stay uppercase
    uppercase_words = {
        'LLC', 'INC', 'LTD', 'DBA', 'USA', 'US', 'UK', 'CEO', 'CFO', 'CTO',
        'II', 'III', 'IV', 'VI', 'VII', 'VIII', 'IX', 'XI', 'XII',
        'BBQ', 'VIP', 'DJ', 'TV', 'NYC', 'LA', 'SF', 'DC'
    }

    # List of words that should be lowercase (unless first word)
    lowercase_words = {
        'a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'of',
        'on', 'or', 'the', 'to', 'with', 'de', 'del', 'la', 'le'
    }

    # List of common business abbreviations
    abbreviations = {
        'st': 'St',      # Street or Saint
        'ave': 'Ave',
        'dr': 'Dr',
        'blvd': 'Blvd',
        'co': 'Co',
        'corp': 'Corp',
        'bros': 'Bros',
        'mr': 'Mr',
        'mrs': 'Mrs',
        'ms': 'Ms',
    }

    words = text.split()
    result = []

    for i, word in enumerate(words):
        # Remove punctuation for checking
        word_clean = re.sub(r'[^\w]', '', word)

        # Check if it's an uppercase-preserved word
        if word_clean.upper() in uppercase_words:
            result.append(word_clean.upper())
        # Check if it's a known abbreviation
        elif word_clean.lower() in abbreviations:
            result.append(abbreviations[word_clean.lower()])
        # Check if it should be lowercase (but not first word)
        elif i > 0 and word_clean.lower() in lowercase_words:
            result.append(word_clean.lower())
        # Check if it's a possessive (e.g., "McDonald's")
        elif "'" in word:
            parts = word.split("'")
            result.append("'".join([p.capitalize() for p in parts]))
        # Check if it has punctuation
        elif re.search(r'[^\w]', word):
            # Preserve punctuation position
            cleaned = re.sub(r'([^\w])', r'|\1|', word)
            parts = [p.capitalize() if p != '|' and not re.match(r'[^\w]', p) else p
                    for p in cleaned.split('|')]
            result.append(''.join(parts).replace('|', ''))
        else:
            # Default: capitalize first letter
            result.append(word.capitalize())

    return ' '.join(result)


def clean_name(name: str) -> str:
    """
    Clean and standardize organization name
    """
    if not name or not name.strip():
        return ""

    # Remove leading/trailing whitespace
    name = name.strip()

    # Replace multiple spaces with single space
    name = re.sub(r'\s+', ' ', name)

    # Remove quotes if they wrap the entire name
    if name.startswith('"') and name.endswith('"'):
        name = name[1:-1].strip()

    # Apply smart title casing
    name = title_case_smart(name)

    return name


def clean_city(city: str) -> str:
    """Clean and standardize city name"""
    if not city or not city.strip():
        return ""

    city = city.strip()
    city = re.sub(r'\s+', ' ', city)

    # Apply title case
    city = title_case_smart(city)

    return city


def clean_state(state: str) -> str:
    """Standardize state to uppercase 2-letter code"""
    if not state or not state.strip():
        return ""

    state = state.strip().upper()

    # Validate it's a 2-letter code
    if len(state) == 2 and state.isalpha():
        return state

    # State name to code mapping (if needed)
    state_codes = {
        'ILLINOIS': 'IL',
        'MICHIGAN': 'MI',
        'OHIO': 'OH',
        'INDIANA': 'IN',
        'KENTUCKY': 'KY',
        'TENNESSEE': 'TN',
        'IOWA': 'IA',
        'WISCONSIN': 'WI',
        'MISSOURI': 'MO',
        'PENNSYLVANIA': 'PA',
        'MINNESOTA': 'MN',
    }

    return state_codes.get(state.upper(), state)


def clean_address(address: str) -> str:
    """Clean and standardize address"""
    if not address or not address.strip():
        return ""

    address = address.strip()
    address = re.sub(r'\s+', ' ', address)

    # Apply smart title casing
    address = title_case_smart(address)

    return address


def clean_text_field(text: str) -> str:
    """Generic text field cleaning"""
    if not text or not text.strip():
        return ""

    text = text.strip()
    text = re.sub(r'\s+', ' ', text)

    return text


def clean_organization_row(row: Dict[str, str]) -> Dict[str, str]:
    """
    Clean all fields in an organization row
    """
    cleaned = row.copy()

    # Clean name (most important)
    cleaned['name'] = clean_name(row['name'])

    # Clean phone
    cleaned['phone'] = clean_phone_number(row['phone'])

    # Clean address fields
    cleaned['address'] = clean_address(row['address'])
    cleaned['city'] = clean_city(row['city'])
    cleaned['state'] = clean_state(row['state'])
    cleaned['postal_code'] = clean_text_field(row['postal_code'])

    # Clean text fields
    cleaned['description'] = clean_text_field(row['description'])
    cleaned['notes'] = clean_text_field(row['notes'])
    cleaned['website'] = clean_text_field(row['website'])
    cleaned['email'] = clean_text_field(row['email'])
    cleaned['linkedin_url'] = clean_text_field(row['linkedin_url'])

    # Clean organization_type (ensure lowercase)
    cleaned['organization_type'] = row['organization_type'].strip().lower() if row['organization_type'].strip() else 'unknown'

    # Clean priority (ensure uppercase)
    cleaned['priority'] = row['priority'].strip().upper() if row['priority'].strip() else ''

    return cleaned


def main():
    """Main execution"""
    input_file = '/home/krwhynot/projects/crispy-crm/data/csv-files/organizations_transformed.csv'
    output_file = '/home/krwhynot/projects/crispy-crm/data/csv-files/organizations_cleaned.csv'

    print("=" * 80)
    print("ORGANIZATIONS DATA CLEANING")
    print("=" * 80)
    print(f"\nInput:  {input_file}")
    print(f"Output: {output_file}")

    # Read and clean data
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)

    print(f"\nProcessing {len(rows):,} records...")

    cleaned_rows = []
    changes = {
        'names': 0,
        'phones': 0,
        'cities': 0,
        'states': 0,
        'addresses': 0,
    }

    for i, row in enumerate(rows, 1):
        cleaned = clean_organization_row(row)
        cleaned_rows.append(cleaned)

        # Track changes
        if cleaned['name'] != row['name']:
            changes['names'] += 1
        if cleaned['phone'] != row['phone']:
            changes['phones'] += 1
        if cleaned['city'] != row['city']:
            changes['cities'] += 1
        if cleaned['state'] != row['state']:
            changes['states'] += 1
        if cleaned['address'] != row['address']:
            changes['addresses'] += 1

        if i % 500 == 0:
            print(f"  Processed {i:,} records...")

    # Write cleaned data
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(cleaned_rows)

    print(f"\n✅ Cleaning complete!")
    print(f"\n📊 CHANGES SUMMARY:")
    print(f"   Names cleaned:     {changes['names']:,} ({changes['names']/len(rows)*100:.1f}%)")
    print(f"   Phones formatted:  {changes['phones']:,} ({changes['phones']/len(rows)*100:.1f}%)")
    print(f"   Cities cleaned:    {changes['cities']:,} ({changes['cities']/len(rows)*100:.1f}%)")
    print(f"   States cleaned:    {changes['states']:,} ({changes['states']/len(rows)*100:.1f}%)")
    print(f"   Addresses cleaned: {changes['addresses']:,} ({changes['addresses']/len(rows)*100:.1f}%)")
    print(f"\n   Total records: {len(cleaned_rows):,}")
    print("=" * 80)


if __name__ == '__main__':
    main()
