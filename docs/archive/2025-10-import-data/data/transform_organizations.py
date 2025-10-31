#!/usr/bin/env python3
"""
Transform organizations.csv to match the database schema.
"""

import csv
import sys
from pathlib import Path

def determine_organization_type(segment, name):
    """Determine organization_type based on SEGMENT column."""
    if not segment or segment.strip() == '':
        return 'unknown'

    segment_lower = segment.lower()

    # Map segment values to organization_type enum
    if 'distributor' in segment_lower:
        return 'distributor'
    elif any(keyword in segment_lower for keyword in ['college', 'education', 'school', 'university']):
        return 'customer'
    elif 'management' in segment_lower:
        return 'customer'
    elif any(keyword in segment_lower for keyword in ['casual', 'fine dining', 'gastropub', 'chain', 'ethnic', 'pizza', 'caterer', 'entertainment', 'casino', 'hospitality']):
        return 'customer'
    else:
        # Default to prospect for unclassified
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

def main():
    input_file = Path('data/csv-files/organizations.csv')
    output_file = Path('data/csv-files/organizations_transformed.csv')

    if not input_file.exists():
        print(f"Error: Input file {input_file} not found")
        sys.exit(1)

    # Define output columns matching database schema
    # Excludes auto-generated fields: id, created_at, updated_at, search_tsv
    output_columns = [
        'name',
        'organization_type',
        'parent_organization_id',
        'priority',
        'segment_id',
        'website',
        'phone',
        'email',
        'address',
        'city',
        'state',
        'postal_code',
        'description',
        'logo_url',
        'linkedin_url',
        'annual_revenue',
        'employee_count',
        'founded_year',
        'tax_identifier',
        'context_links',
        'notes',
        'sales_id',
        'created_by',
        'updated_by',
        'deleted_at',
        'import_session_id'
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

            # Build transformed row
            transformed = {
                'name': org_name,
                'organization_type': determine_organization_type(
                    row.get('SEGMENT\n(DropDown)', ''),
                    org_name
                ),
                'parent_organization_id': '',  # Would need additional data
                'priority': clean_priority(row.get('PRIORITY-FOCUS (A-D) A-highest \n(DropDown)', '')),
                'segment_id': '',  # Would need UUID lookup from segments table
                'website': '',  # Not in source data
                'phone': clean_text(row.get('PHONE', '')),
                'email': '',  # Not in source data
                'address': clean_text(row.get('STREET ADDRESS', '')),
                'city': clean_text(row.get('CITY', '')),
                'state': clean_text(row.get('STATE\n(DropDown)', '')),
                'postal_code': clean_text(row.get('Zip Code', '')),
                'description': clean_text(row.get('SEGMENT\n(DropDown)', '')),  # Use segment as description
                'logo_url': '',  # Not in source data
                'linkedin_url': clean_text(row.get('LINKEDIN', '')),
                'annual_revenue': '',  # Not in source data
                'employee_count': '',  # Not in source data
                'founded_year': '',  # Not in source data
                'tax_identifier': '',  # Not in source data
                'context_links': '',  # Could parse from notes, but leaving empty
                'notes': clean_text(row.get('NOTES', '')),
                'sales_id': '',  # Would need lookup from sales table based on PRIMARY ACCT. MANAGER
                'created_by': '',  # Would need current user ID
                'updated_by': '',  # Would need current user ID
                'deleted_at': '',  # NULL for active records
                'import_session_id': ''  # Could generate UUID for this import batch
            }

            writer.writerow(transformed)
            rows_processed += 1

    print(f"Transformation complete!")
    print(f"  Rows processed: {rows_processed}")
    print(f"  Rows skipped (no name): {rows_skipped}")
    print(f"  Output file: {output_file}")

if __name__ == '__main__':
    main()
