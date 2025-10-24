#!/usr/bin/env python3
"""
Transform organizations CSV for database migration.

This script cleans the organizations_standardized.csv file by:
1. Fixing invalid organization_type values
2. Correcting character encoding issues
3. Identifying duplicate organization names
4. Merging description and notes columns
5. Generating a cleaned CSV ready for migration

Usage:
    python3 scripts/data/transform_organizations_csv.py

Output:
    - data/csv-files/organizations_cleaned.csv
    - data/ORGANIZATIONS_CLEANING_REPORT.md
"""

import csv
import sys
from pathlib import Path
from collections import defaultdict, Counter
from datetime import datetime
from typing import Dict, List, Tuple

# Valid organization_type enum values from database schema
VALID_ORG_TYPES = {'customer', 'principal', 'distributor', 'prospect', 'partner', 'unknown'}

# Mapping for invalid organization_type values
INVALID_ORG_TYPE_MAPPING = {
    ' INC"': 'unknown',
    ' LLC"': 'unknown',
    'Inc"': 'unknown',
    ' Institute of Food Technologists"': 'unknown',
    ' Banquet Hall"': 'customer',
    'Subs and Taps"': 'customer',
    ' Oh Pizza Prod."': 'customer',
    ' Mi"': 'unknown',
    ' in"': 'unknown',
    ' Stanz': 'unknown',
    '"': 'unknown',
    '': 'unknown',  # Empty values
}

# Character encoding fixes - common replacements for � character
ENCODING_FIXES = {
    'School�S': "School's",
    'Caf�': 'Café',
    'Barley�S': "Barley's",
    'Paulie�S': "Paulie's",
    'Belva�': 'Belva',
    'C K O S - Catered Events�': 'C K O S - Catered Events',
    'Mrs C�S': "Mrs C's",
    'Zel�S': "Zel's",
    'Carson�S': "Carson's",
    'Kathryn�S': "Kathryn's",
    'Leona�S': "Leona's",
    'Paulie Gee�S': "Paulie Gee's",
    'Surf�S': "Surf's",
    'Tiger Lily Caf�': 'Tiger Lily Café',
    # Fallback: replace any remaining � with apostrophe
    '�': "'",
}


class OrganizationCleaner:
    """Clean and transform organizations CSV data."""

    def __init__(self, input_path: Path, output_path: Path):
        self.input_path = input_path
        self.output_path = output_path
        self.stats = {
            'total_rows': 0,
            'org_type_fixes': 0,
            'encoding_fixes': 0,
            'duplicates_found': 0,
            'notes_merged': 0,
            'errors': [],
        }
        self.duplicate_names: Dict[str, List[int]] = defaultdict(list)
        self.org_type_changes: List[Tuple[int, str, str]] = []
        self.encoding_changes: List[Tuple[int, str, str]] = []

    def fix_organization_type(self, org_type: str, row_num: int) -> str:
        """Fix invalid organization_type values."""
        # Handle empty or whitespace-only values
        if not org_type or not org_type.strip():
            self.stats['org_type_fixes'] += 1
            self.org_type_changes.append((row_num, org_type, 'unknown'))
            return 'unknown'

        # Check if already valid
        if org_type in VALID_ORG_TYPES:
            return org_type

        # Apply mapping for known invalid values
        if org_type in INVALID_ORG_TYPE_MAPPING:
            fixed = INVALID_ORG_TYPE_MAPPING[org_type]
            self.stats['org_type_fixes'] += 1
            self.org_type_changes.append((row_num, org_type, fixed))
            return fixed

        # Log unknown invalid values
        self.stats['errors'].append(
            f"Row {row_num}: Unknown invalid organization_type '{org_type}' - defaulting to 'unknown'"
        )
        self.stats['org_type_fixes'] += 1
        self.org_type_changes.append((row_num, org_type, 'unknown'))
        return 'unknown'

    def fix_encoding(self, text: str, row_num: int, field_name: str) -> str:
        """Fix character encoding issues (� character)."""
        if not text or '�' not in text:
            return text

        original = text

        # Apply specific fixes first
        for pattern, replacement in ENCODING_FIXES.items():
            if pattern in text:
                text = text.replace(pattern, replacement)

        # If still has �, replace with apostrophe as fallback
        if '�' in text:
            text = text.replace('�', "'")

        if text != original:
            self.stats['encoding_fixes'] += 1
            self.encoding_changes.append((row_num, f"{field_name}: {original}", text))

        return text

    def merge_notes_fields(self, description: str, notes: str) -> str:
        """Merge description and notes fields into single notes field."""
        parts = []

        if description and description.strip():
            parts.append(f"Type: {description.strip()}")

        if notes and notes.strip():
            parts.append(f"Sales Notes: {notes.strip()}")

        return '\n\n'.join(parts) if parts else ''

    def clean_row(self, row: Dict[str, str], row_num: int) -> Dict[str, str]:
        """Clean a single row of data."""
        cleaned = {}

        # Fix organization name encoding
        cleaned['name'] = self.fix_encoding(row['name'], row_num, 'name')

        # Track duplicates
        name_lower = cleaned['name'].lower().strip()
        self.duplicate_names[name_lower].append(row_num)

        # Fix organization_type
        cleaned['organization_type'] = self.fix_organization_type(
            row['organization_type'], row_num
        )

        # Copy other fields as-is (trimmed)
        cleaned['parent_organization_id'] = row.get('parent_organization_id', '').strip()
        cleaned['priority'] = row.get('priority', '').strip() or 'C'  # Default to C if empty
        cleaned['segment_id'] = row.get('segment_id', '').strip()
        cleaned['website'] = row.get('website', '').strip()
        cleaned['phone'] = row.get('phone', '').strip()
        cleaned['email'] = row.get('email', '').strip()
        cleaned['address'] = row.get('address', '').strip()
        cleaned['city'] = row.get('city', '').strip()
        cleaned['state'] = row.get('state', '').strip()
        cleaned['postal_code'] = row.get('postal_code', '').strip()
        cleaned['logo_url'] = row.get('logo_url', '').strip()
        cleaned['linkedin_url'] = row.get('linkedin_url', '').strip()
        cleaned['annual_revenue'] = row.get('annual_revenue', '').strip()
        cleaned['employee_count'] = row.get('employee_count', '').strip()
        cleaned['founded_year'] = row.get('founded_year', '').strip()
        cleaned['tax_identifier'] = row.get('tax_identifier', '').strip()
        cleaned['context_links'] = row.get('context_links', '').strip()
        cleaned['sales_id'] = row.get('sales_id', '').strip()
        cleaned['created_by'] = row.get('created_by', '').strip()
        cleaned['updated_by'] = row.get('updated_by', '').strip()
        cleaned['deleted_at'] = row.get('deleted_at', '').strip()
        cleaned['import_session_id'] = row.get('import_session_id', '').strip()

        # Merge description and notes
        description = row.get('description', '').strip()
        notes = row.get('notes', '').strip()
        cleaned['notes'] = self.merge_notes_fields(description, notes)

        if cleaned['notes']:
            self.stats['notes_merged'] += 1

        return cleaned

    def process(self) -> bool:
        """Process the CSV file and generate cleaned output."""
        print(f"Reading input file: {self.input_path}")

        try:
            with open(self.input_path, 'r', encoding='utf-8') as infile:
                reader = csv.DictReader(infile)

                # Prepare output with updated headers
                output_headers = [
                    'name', 'organization_type', 'parent_organization_id', 'priority',
                    'segment_id', 'website', 'phone', 'email', 'address', 'city',
                    'state', 'postal_code', 'notes', 'logo_url', 'linkedin_url',
                    'annual_revenue', 'employee_count', 'founded_year', 'tax_identifier',
                    'context_links', 'sales_id', 'created_by', 'updated_by',
                    'deleted_at', 'import_session_id'
                ]

                cleaned_rows = []

                for row_num, row in enumerate(reader, start=2):  # Start at 2 (after header)
                    self.stats['total_rows'] += 1
                    cleaned_row = self.clean_row(row, row_num)
                    cleaned_rows.append(cleaned_row)

                # Write cleaned data
                print(f"Writing cleaned file: {self.output_path}")
                with open(self.output_path, 'w', encoding='utf-8', newline='') as outfile:
                    writer = csv.DictWriter(outfile, fieldnames=output_headers)
                    writer.writeheader()
                    writer.writerows(cleaned_rows)

                # Identify duplicates
                self.stats['duplicates_found'] = sum(
                    1 for name, rows in self.duplicate_names.items() if len(rows) > 1
                )

                return True

        except Exception as e:
            print(f"Error processing CSV: {e}", file=sys.stderr)
            self.stats['errors'].append(f"Fatal error: {e}")
            return False

    def generate_report(self, report_path: Path) -> None:
        """Generate a detailed cleaning report."""
        print(f"Generating report: {report_path}")

        with open(report_path, 'w', encoding='utf-8') as f:
            f.write("# Organizations CSV Cleaning Report\n\n")
            f.write(f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")

            # Summary
            f.write("## Summary\n\n")
            f.write(f"- **Total records processed:** {self.stats['total_rows']}\n")
            f.write(f"- **Organization types fixed:** {self.stats['org_type_fixes']}\n")
            f.write(f"- **Encoding issues fixed:** {self.stats['encoding_fixes']}\n")
            f.write(f"- **Duplicate names found:** {self.stats['duplicates_found']}\n")
            f.write(f"- **Notes fields merged:** {self.stats['notes_merged']}\n")
            f.write(f"- **Errors encountered:** {len(self.stats['errors'])}\n\n")

            # Organization type changes
            if self.org_type_changes:
                f.write("## Organization Type Fixes\n\n")
                f.write("| Row | Original Value | Fixed Value |\n")
                f.write("|-----|----------------|-------------|\n")
                for row_num, original, fixed in self.org_type_changes:
                    f.write(f"| {row_num} | `{original}` | `{fixed}` |\n")
                f.write("\n")

            # Encoding fixes
            if self.encoding_changes:
                f.write("## Character Encoding Fixes\n\n")
                f.write("| Row | Field & Original | Fixed |\n")
                f.write("|-----|------------------|-------|\n")
                for row_num, original, fixed in self.encoding_changes[:50]:  # Limit to 50
                    # Escape pipe characters for markdown
                    original_escaped = original.replace('|', '\\|')
                    fixed_escaped = fixed.replace('|', '\\|')
                    f.write(f"| {row_num} | {original_escaped} | {fixed_escaped} |\n")
                if len(self.encoding_changes) > 50:
                    f.write(f"\n*...and {len(self.encoding_changes) - 50} more*\n")
                f.write("\n")

            # Duplicates
            duplicates = [(name, rows) for name, rows in self.duplicate_names.items() if len(rows) > 1]
            if duplicates:
                f.write("## Duplicate Organization Names ⚠️\n\n")
                f.write("**Action Required:** Review these duplicates to determine if they should be:\n")
                f.write("- Merged (same entity)\n")
                f.write("- Differentiated (add location/identifier)\n")
                f.write("- Kept separate (legitimately different entities)\n\n")
                f.write("| Name | Occurrences | Row Numbers |\n")
                f.write("|------|-------------|-------------|\n")
                for name, rows in sorted(duplicates, key=lambda x: len(x[1]), reverse=True):
                    f.write(f"| {name} | {len(rows)} | {', '.join(map(str, rows))} |\n")
                f.write("\n")

            # Errors
            if self.stats['errors']:
                f.write("## Errors and Warnings\n\n")
                for error in self.stats['errors']:
                    f.write(f"- {error}\n")
                f.write("\n")

            # Next steps
            f.write("## Next Steps\n\n")
            f.write("1. **Review duplicates** listed above and manually resolve\n")
            f.write("2. **Validate cleaned CSV** by opening in spreadsheet software\n")
            f.write("3. **Test migration** on local database:\n")
            f.write("   ```bash\n")
            f.write("   npm run db:local:reset\n")
            f.write("   # Run migration script with organizations_cleaned.csv\n")
            f.write("   ```\n")
            f.write("4. **Verify data quality** with SQL queries\n")
            f.write("5. **Document resolution** of duplicates in this report\n\n")

            # Data quality metrics
            f.write("## Data Quality Metrics\n\n")
            f.write(f"- **Ready for migration:** ")
            if self.stats['duplicates_found'] == 0:
                f.write("✅ YES - No blocking issues found\n")
            else:
                f.write(f"⚠️ REVIEW REQUIRED - {self.stats['duplicates_found']} duplicate(s) need manual review\n")
            f.write("\n")
            f.write("**Cleaned CSV location:** `data/csv-files/organizations_cleaned.csv`\n\n")


def main():
    """Main execution function."""
    # Paths
    project_root = Path(__file__).parent.parent.parent
    input_path = project_root / 'data' / 'csv-files' / 'organizations_standardized.csv'
    output_path = project_root / 'data' / 'csv-files' / 'organizations_cleaned.csv'
    report_path = project_root / 'data' / 'ORGANIZATIONS_CLEANING_REPORT.md'

    # Validate input exists
    if not input_path.exists():
        print(f"Error: Input file not found: {input_path}", file=sys.stderr)
        sys.exit(1)

    # Create cleaner and process
    cleaner = OrganizationCleaner(input_path, output_path)

    print("=" * 70)
    print("Organizations CSV Cleaning Script")
    print("=" * 70)

    success = cleaner.process()

    if success:
        cleaner.generate_report(report_path)

        print("\n" + "=" * 70)
        print("✅ Cleaning completed successfully!")
        print("=" * 70)
        print(f"\nResults:")
        print(f"  • Processed: {cleaner.stats['total_rows']} records")
        print(f"  • Org types fixed: {cleaner.stats['org_type_fixes']}")
        print(f"  • Encoding fixed: {cleaner.stats['encoding_fixes']}")
        print(f"  • Duplicates found: {cleaner.stats['duplicates_found']}")
        print(f"  • Notes merged: {cleaner.stats['notes_merged']}")
        print(f"\nOutput files:")
        print(f"  • Cleaned CSV: {output_path}")
        print(f"  • Report: {report_path}")

        if cleaner.stats['duplicates_found'] > 0:
            print(f"\n⚠️  Action required: Review {cleaner.stats['duplicates_found']} duplicate(s) in report")
        else:
            print("\n✅ No duplicates found - ready for migration!")

        sys.exit(0)
    else:
        print("\n❌ Cleaning failed. Check errors above.", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
