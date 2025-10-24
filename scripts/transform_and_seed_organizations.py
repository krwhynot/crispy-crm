#!/usr/bin/env python3
"""
Transform organizations backup CSV and load into organizations_standardized.csv
Then seed the database.
"""

import csv
import sys
from pathlib import Path

def determine_organization_type(segment):
    """Determine organization_type based on SEGMENT column."""
    if not segment or segment.strip() == '':
        return 'unknown'

    segment_lower = segment.lower()

    # Map segment values to organization_type enum
    if 'distributor' in segment_lower:
        return 'distributor'
    elif 'management' in segment_lower or 'company' in segment_lower:
        return 'customer'
    elif any(keyword in segment_lower for keyword in [
        'casual', 'fine dining', 'gastropub', 'chain', 'ethnic',
        'pizza', 'caterer', 'entertainment', 'casino', 'hospitality',
        'college', 'education', 'school', 'university'
    ]):
        return 'customer'
    else:
        return 'prospect'

def clean_priority(priority):
    """Clean and validate priority value."""
    if not priority or priority.strip() == '':
        return 'C'  # Default

    priority = priority.strip().upper()

    # Handle special cases like "A+"
    if priority.startswith('A'):
        return 'A'
    elif priority in ['B', 'C', 'D']:
        return priority
    else:
        return 'C'  # Default

def clean_text(text):
    """Clean text fields - remove extra whitespace, handle None."""
    if not text or text.strip() == '':
        return ''
    return text.strip()

def map_segment_name(segment):
    """Map segment to a clean segment name for database."""
    if not segment or segment.strip() == '':
        return ''

    segment = clean_text(segment)

    # Standardize segment names
    segment_lower = segment.lower()

    if 'distributor' in segment_lower:
        return 'Distributor'
    elif 'management' in segment_lower:
        return 'Management Company'
    elif 'casual' in segment_lower:
        return 'Casual Dining'
    elif 'fine dining' in segment_lower:
        return 'Fine Dining'
    elif 'chain' in segment_lower or 'group' in segment_lower:
        return 'Chain/Group'
    elif 'ethnic' in segment_lower:
        return 'Ethnic Cuisine'
    elif 'pizza' in segment_lower:
        return 'Pizza'
    elif 'caterer' in segment_lower or 'catering' in segment_lower:
        return 'Catering'
    elif any(kw in segment_lower for kw in ['college', 'education', 'school', 'university']):
        return 'Education'
    elif any(kw in segment_lower for kw in ['casino', 'entertainment']):
        return 'Entertainment'
    elif 'gastropub' in segment_lower or 'pub' in segment_lower:
        return 'Gastropub'
    else:
        return segment

def main():
    # Use backup file as source
    input_file = Path('data/backups/organizations_backup_20251024_123635.csv')
    output_file = Path('data/csv-files/organizations_standardized.csv')

    if not input_file.exists():
        print(f"Error: Input file {input_file} not found")
        sys.exit(1)

    # Output columns for organizations_standardized.csv (simplified for seed script)
    output_columns = [
        'name',
        'organization_type',
        'priority',
        'segment_name',
        'phone',
        'linkedin_url',
        'address',
        'city',
        'state',
        'postal_code',
        'notes'
    ]

    rows_processed = 0
    rows_skipped = 0

    with open(input_file, 'r', encoding='utf-8', errors='replace') as infile, \
         open(output_file, 'w', newline='', encoding='utf-8') as outfile:

        reader = csv.DictReader(infile)
        writer = csv.DictWriter(outfile, fieldnames=output_columns)
        writer.writeheader()

        for row in reader:
            # Skip rows with no organization name
            org_name = clean_text(row.get('Organizations', ''))
            if not org_name:
                rows_skipped += 1
                continue

            # Get segment value
            segment = row.get('SEGMENT\n(DropDown)', '')

            # Build transformed row
            transformed = {
                'name': org_name,
                'organization_type': determine_organization_type(segment),
                'priority': clean_priority(row.get('PRIORITY-FOCUS (A-D) A-highest \n(DropDown)', '')),
                'segment_name': map_segment_name(segment),
                'phone': clean_text(row.get('PHONE', '')),
                'linkedin_url': clean_text(row.get('LINKEDIN', '')),
                'address': clean_text(row.get('STREET ADDRESS', '')),
                'city': clean_text(row.get('CITY', '')),
                'state': clean_text(row.get('STATE\n(DropDown)', '')),
                'postal_code': clean_text(row.get('Zip Code', '')),
                'notes': clean_text(row.get('NOTES', ''))
            }

            writer.writerow(transformed)
            rows_processed += 1

    print(f"✅ Transformation complete!")
    print(f"   Rows processed: {rows_processed}")
    print(f"   Rows skipped (no name): {rows_skipped}")
    print(f"   Output file: {output_file}")

    return rows_processed

if __name__ == '__main__':
    main()
