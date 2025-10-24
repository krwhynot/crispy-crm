#!/usr/bin/env python3
"""
Deduplicate organizations CSV by keeping the most complete record.

This script resolves the 5 identified duplicates by:
1. Grouping records by normalized name (lowercase, trimmed)
2. Scoring each record by data completeness
3. Keeping the record with the highest completeness score
4. Logging all removed duplicates for audit trail

Usage:
    python3 scripts/data/deduplicate_organizations.py

Output:
    - data/csv-files/organizations_final.csv
    - data/DEDUPLICATION_REPORT.md
"""

import csv
import sys
from pathlib import Path
from collections import defaultdict
from datetime import datetime
from typing import Dict, List, Tuple


class OrganizationDeduplicator:
    """Deduplicate organizations by keeping most complete records."""

    def __init__(self, input_path: Path, output_path: Path):
        self.input_path = input_path
        self.output_path = output_path
        self.duplicates_removed: List[Dict] = []
        self.duplicates_kept: List[Dict] = []

    def calculate_completeness_score(self, row: Dict[str, str]) -> int:
        """
        Calculate data completeness score for a record.
        Higher score = more complete data = preferred to keep.
        """
        score = 0

        # High-value fields (10 points each)
        high_value_fields = ['phone', 'email', 'address', 'website', 'linkedin_url']
        for field in high_value_fields:
            if row.get(field, '').strip():
                score += 10

        # Medium-value fields (5 points each)
        medium_value_fields = ['city', 'state', 'postal_code', 'notes']
        for field in medium_value_fields:
            if row.get(field, '').strip():
                score += 5

        # Bonus for known organization_type (not 'unknown')
        if row.get('organization_type', '') not in ['', 'unknown']:
            score += 15

        # Bonus for priority A or B
        if row.get('priority', '') in ['A', 'B']:
            score += 3

        # Low-value fields (1 point each)
        low_value_fields = [
            'annual_revenue', 'employee_count', 'founded_year',
            'logo_url', 'parent_organization_id'
        ]
        for field in low_value_fields:
            if row.get(field, '').strip():
                score += 1

        return score

    def select_best_record(
        self, group: List[Tuple[int, Dict[str, str]]]
    ) -> Tuple[Tuple[int, Dict[str, str]], List[Tuple[int, Dict[str, str]]]]:
        """
        Select the best record from a group of duplicates.
        Returns: (best_record, discarded_records)
        """
        # Score all records
        scored = [
            (row_num, row, self.calculate_completeness_score(row))
            for row_num, row in group
        ]

        # Sort by score (descending), then by row number (ascending for stability)
        scored.sort(key=lambda x: (-x[2], x[0]))

        # Best record is first after sorting
        best = (scored[0][0], scored[0][1])
        discarded = [(row_num, row) for row_num, row, score in scored[1:]]

        return best, discarded

    def process(self) -> Tuple[int, int]:
        """
        Process the CSV file and remove duplicates.
        Returns: (total_records, duplicates_removed_count)
        """
        print(f"Reading input file: {self.input_path}")

        with open(self.input_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            fieldnames = reader.fieldnames

            # Group records by normalized name
            name_groups: Dict[str, List[Tuple[int, Dict]]] = defaultdict(list)

            for row_num, row in enumerate(reader, start=2):
                normalized_name = row['name'].lower().strip()
                name_groups[normalized_name].append((row_num, row))

        # Process duplicates
        final_records = []
        total_removed = 0

        for normalized_name, group in sorted(name_groups.items()):
            if len(group) == 1:
                # Not a duplicate, keep as-is
                final_records.append(group[0][1])
            else:
                # Duplicate found - select best record
                best, discarded = self.select_best_record(group)
                final_records.append(best[1])

                # Log the decision
                self.duplicates_kept.append({
                    'name': best[1]['name'],
                    'row': best[0],
                    'score': self.calculate_completeness_score(best[1]),
                    'record': best[1]
                })

                for row_num, row in discarded:
                    self.duplicates_removed.append({
                        'name': row['name'],
                        'row': row_num,
                        'score': self.calculate_completeness_score(row),
                        'record': row
                    })
                    total_removed += 1

        # Write deduplicated data
        print(f"Writing deduplicated file: {self.output_path}")
        with open(self.output_path, 'w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(final_records)

        return len(final_records), total_removed

    def generate_report(self, report_path: Path, total_records: int, removed_count: int):
        """Generate deduplication report."""
        print(f"Generating report: {report_path}")

        with open(report_path, 'w', encoding='utf-8') as f:
            f.write("# Organizations Deduplication Report\n\n")
            f.write(f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")

            # Summary
            f.write("## Summary\n\n")
            f.write(f"- **Total records after deduplication:** {total_records}\n")
            f.write(f"- **Duplicate records removed:** {removed_count}\n")
            f.write(f"- **Duplicate groups resolved:** {len(self.duplicates_kept)}\n\n")

            # Deduplication decisions
            if self.duplicates_kept:
                f.write("## Deduplication Decisions\n\n")
                f.write("For each duplicate group, the record with the highest completeness score was kept.\n\n")

                # Group by normalized name
                groups = defaultdict(list)
                for kept in self.duplicates_kept:
                    groups[kept['name'].lower()].append(kept)

                for removed in self.duplicates_removed:
                    groups[removed['name'].lower()].append(removed)

                for name in sorted(groups.keys()):
                    records = groups[name]
                    f.write(f"### {records[0]['name']}\n\n")

                    # Find kept vs removed
                    kept_rec = next((r for r in records if r in self.duplicates_kept), None)
                    removed_recs = [r for r in records if r in self.duplicates_removed]

                    f.write("**Decision:** ")
                    if kept_rec:
                        f.write(f"✅ KEPT Row {kept_rec['row']} (score: {kept_rec['score']})\n\n")

                        # Show key data points
                        rec = kept_rec['record']
                        f.write(f"- **Type:** {rec['organization_type']}\n")
                        f.write(f"- **Priority:** {rec['priority']}\n")
                        f.write(f"- **Phone:** {rec['phone'] or '(none)'}\n")
                        f.write(f"- **Location:** {rec['city'] or '?'}, {rec['state'] or '?'}\n")
                        if rec['address']:
                            f.write(f"- **Address:** {rec['address']}\n")
                        notes_preview = rec['notes'][:100].replace('\n', ' ') if rec['notes'] else '(none)'
                        f.write(f"- **Notes:** {notes_preview}...\n\n")

                    if removed_recs:
                        f.write("**Removed:**\n\n")
                        for removed in removed_recs:
                            f.write(f"- ❌ Row {removed['row']} (score: {removed['score']})\n")
                            rec = removed['record']
                            f.write(f"  - Type: {rec['organization_type']}, Priority: {rec['priority']}\n")
                            f.write(f"  - Location: {rec['city'] or '?'}, {rec['state'] or '?'}\n")

                    f.write("\n")

            # Scoring methodology
            f.write("## Completeness Scoring Methodology\n\n")
            f.write("Records were scored based on data completeness:\n\n")
            f.write("- **High-value fields (10 points each):** phone, email, address, website, linkedin_url\n")
            f.write("- **Medium-value fields (5 points each):** city, state, postal_code, notes\n")
            f.write("- **Bonus (15 points):** Known organization_type (not 'unknown')\n")
            f.write("- **Bonus (3 points):** Priority A or B\n")
            f.write("- **Low-value fields (1 point each):** annual_revenue, employee_count, founded_year, logo_url\n\n")

            f.write("The record with the highest score was kept. In case of ties, the first occurrence was kept.\n\n")

            # Next steps
            f.write("## Next Steps\n\n")
            f.write("1. **Review decisions above** to ensure correct records were kept\n")
            f.write("2. **Proceed with database migration** using `organizations_final.csv`\n")
            f.write("3. **Run seed script:** `scripts/db/seed_organizations.sql`\n\n")

            f.write("**Final CSV location:** `data/csv-files/organizations_final.csv`\n")


def main():
    """Main execution function."""
    # Paths
    project_root = Path(__file__).parent.parent.parent
    input_path = project_root / 'data' / 'csv-files' / 'organizations_cleaned.csv'
    output_path = project_root / 'data' / 'csv-files' / 'organizations_final.csv'
    report_path = project_root / 'data' / 'DEDUPLICATION_REPORT.md'

    # Validate input exists
    if not input_path.exists():
        print(f"Error: Input file not found: {input_path}", file=sys.stderr)
        sys.exit(1)

    # Create deduplicator and process
    deduplicator = OrganizationDeduplicator(input_path, output_path)

    print("=" * 70)
    print("Organizations Deduplication Script")
    print("=" * 70)

    total_records, removed_count = deduplicator.process()
    deduplicator.generate_report(report_path, total_records, removed_count)

    print("\n" + "=" * 70)
    print("✅ Deduplication completed successfully!")
    print("=" * 70)
    print(f"\nResults:")
    print(f"  • Final records: {total_records}")
    print(f"  • Duplicates removed: {removed_count}")
    print(f"  • Duplicate groups resolved: {len(deduplicator.duplicates_kept)}")
    print(f"\nOutput files:")
    print(f"  • Final CSV: {output_path}")
    print(f"  • Report: {report_path}")
    print(f"\n✅ Ready for database migration!")

    sys.exit(0)


if __name__ == '__main__':
    main()
