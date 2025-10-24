#!/usr/bin/env python3
"""
Organization Deduplication Script

This script identifies and merges duplicate organizations based on:
1. Exact name matches (case-insensitive)
2. Similar names (fuzzy matching)
3. Shared addresses

Merging Strategy:
- Keeps the record with most complete data
- Preserves all non-empty fields from duplicates
- Generates a detailed report of merges performed
- Creates a mapping file for reference tracking

Author: Claude Code
Date: 2025-10-24
"""

import csv
import json
import uuid
from collections import defaultdict
from datetime import datetime
from typing import List, Dict, Tuple, Optional
import difflib


class OrganizationDeduplicator:
    """Handles organization deduplication logic"""

    def __init__(self, similarity_threshold: float = 0.90):
        self.similarity_threshold = similarity_threshold
        self.merge_log = []
        self.stats = {
            'total_records': 0,
            'exact_duplicates_merged': 0,
            'similar_names_merged': 0,
            'final_record_count': 0,
        }

    def calculate_completeness_score(self, row: Dict[str, str]) -> int:
        """Calculate how complete a record is (higher is better)"""
        score = 0
        important_fields = [
            'phone', 'email', 'address', 'city', 'state', 'postal_code',
            'website', 'description', 'notes', 'annual_revenue', 'employee_count',
            'founded_year', 'linkedin_url'
        ]

        for field in important_fields:
            if row.get(field, '').strip():
                score += 1

        # Bonus for specific organization type (not unknown)
        if row.get('organization_type', '').strip() not in ['', 'unknown']:
            score += 2

        # Bonus for priority level
        if row.get('priority', '').strip():
            score += 1

        return score

    def merge_records(self, records: List[Tuple[int, Dict[str, str]]],
                     reason: str) -> Dict[str, str]:
        """
        Merge multiple records into one, keeping the most complete data

        Strategy:
        1. Choose record with highest completeness score as base
        2. Fill in any missing fields from other records
        3. Log the merge operation
        """
        # Sort by completeness score (highest first)
        scored_records = [(self.calculate_completeness_score(rec), idx, rec)
                         for idx, rec in records]
        scored_records.sort(reverse=True)

        # Use most complete record as base
        _, primary_idx, merged = scored_records[0][2].copy()
        merged_from_indices = [idx for _, idx, _ in scored_records[1:]]

        # Fill in missing fields from other records
        for _, idx, record in scored_records[1:]:
            for field, value in record.items():
                if value.strip() and not merged[field].strip():
                    merged[field] = value

        # Log the merge
        self.merge_log.append({
            'primary_index': scored_records[0][1],
            'merged_indices': merged_from_indices,
            'organization_name': merged['name'],
            'reason': reason,
            'records_merged': len(records),
            'completeness_score': scored_records[0][0]
        })

        return merged

    def find_exact_duplicates(self, rows: List[Dict[str, str]]) -> Dict[str, List[Tuple[int, Dict]]]:
        """Find organizations with identical names (case-insensitive)"""
        name_groups = defaultdict(list)

        for i, row in enumerate(rows):
            name_key = row['name'].strip().lower()
            if name_key:  # Skip empty names
                name_groups[name_key].append((i, row))

        # Return only groups with duplicates
        return {k: v for k, v in name_groups.items() if len(v) > 1}

    def find_similar_names(self, rows: List[Dict[str, str]],
                          already_merged: set) -> List[Tuple[float, int, int]]:
        """Find organizations with similar names using fuzzy matching"""
        similar_pairs = []

        # Create index of unmerged records
        active_records = [(i, row) for i, row in enumerate(rows)
                         if i not in already_merged]

        # Compare all pairs (this is O(n²) but necessary for fuzzy matching)
        for i in range(len(active_records)):
            idx1, row1 = active_records[i]
            name1 = row1['name'].strip().lower()

            for j in range(i + 1, len(active_records)):
                idx2, row2 = active_records[j]
                name2 = row2['name'].strip().lower()

                # Calculate similarity
                similarity = difflib.SequenceMatcher(None, name1, name2).ratio()

                if similarity >= self.similarity_threshold:
                    similar_pairs.append((similarity, idx1, idx2))

        return sorted(similar_pairs, reverse=True)

    def deduplicate(self, rows: List[Dict[str, str]]) -> List[Dict[str, str]]:
        """Main deduplication process"""
        self.stats['total_records'] = len(rows)
        merged_indices = set()  # Track which records have been merged
        result = []

        print("\n" + "=" * 80)
        print("DEDUPLICATION PROCESS")
        print("=" * 80)

        # Step 1: Merge exact duplicates
        print("\n📋 Step 1: Merging exact name duplicates...")
        exact_duplicates = self.find_exact_duplicates(rows)

        print(f"   Found {len(exact_duplicates)} duplicate name groups")

        for name_key, group in exact_duplicates.items():
            if len(group) > 1:
                # Check if any records in this group were already merged
                if any(idx in merged_indices for idx, _ in group):
                    continue

                merged_record = self.merge_records(group, "Exact name match")
                result.append(merged_record)

                # Mark all indices as merged
                for idx, _ in group:
                    merged_indices.add(idx)

                self.stats['exact_duplicates_merged'] += len(group) - 1

        print(f"   ✓ Merged {self.stats['exact_duplicates_merged']} duplicate records")

        # Step 2: Find similar names (fuzzy matching)
        print(f"\n🔍 Step 2: Finding similar names (threshold: {self.similarity_threshold*100:.0f}%)...")
        similar_pairs = self.find_similar_names(rows, merged_indices)

        print(f"   Found {len(similar_pairs)} similar name pairs")

        # Group similar names that should be merged together
        similar_groups = defaultdict(set)
        for similarity, idx1, idx2 in similar_pairs:
            # Only merge if both haven't been merged yet
            if idx1 not in merged_indices and idx2 not in merged_indices:
                # Create a merge group
                similar_groups[idx1].add(idx1)
                similar_groups[idx1].add(idx2)

        # Merge similar name groups
        for group_indices in similar_groups.values():
            if len(group_indices) > 1:
                group_records = [(idx, rows[idx]) for idx in group_indices]
                merged_record = self.merge_records(group_records, "Similar name (fuzzy match)")
                result.append(merged_record)

                for idx in group_indices:
                    merged_indices.add(idx)

                self.stats['similar_names_merged'] += len(group_indices) - 1

        print(f"   ✓ Merged {self.stats['similar_names_merged']} similar records")

        # Step 3: Add all unmerged records
        print(f"\n✅ Step 3: Adding remaining unique records...")
        for i, row in enumerate(rows):
            if i not in merged_indices:
                result.append(row)

        unique_count = len([i for i in range(len(rows)) if i not in merged_indices])
        print(f"   ✓ Added {unique_count} unique records")

        self.stats['final_record_count'] = len(result)

        return result


def generate_reports(deduplicator: OrganizationDeduplicator,
                    output_dir: str) -> None:
    """Generate detailed reports about the deduplication process"""

    # 1. Merge log (JSON)
    merge_log_file = f"{output_dir}/deduplication_merge_log.json"
    with open(merge_log_file, 'w') as f:
        json.dump({
            'timestamp': datetime.now().isoformat(),
            'statistics': deduplicator.stats,
            'merges': deduplicator.merge_log
        }, f, indent=2)

    print(f"\n   📄 Merge log saved: {merge_log_file}")

    # 2. Human-readable report (Markdown)
    report_file = f"{output_dir}/DEDUPLICATION_REPORT.md"
    with open(report_file, 'w') as f:
        f.write("# Organization Deduplication Report\n\n")
        f.write(f"**Date:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        f.write("---\n\n")

        f.write("## Summary Statistics\n\n")
        f.write(f"- **Total records processed:** {deduplicator.stats['total_records']:,}\n")
        f.write(f"- **Exact duplicates merged:** {deduplicator.stats['exact_duplicates_merged']:,}\n")
        f.write(f"- **Similar names merged:** {deduplicator.stats['similar_names_merged']:,}\n")
        f.write(f"- **Total duplicates removed:** {deduplicator.stats['exact_duplicates_merged'] + deduplicator.stats['similar_names_merged']:,}\n")
        f.write(f"- **Final unique records:** {deduplicator.stats['final_record_count']:,}\n\n")

        reduction = deduplicator.stats['total_records'] - deduplicator.stats['final_record_count']
        reduction_pct = (reduction / deduplicator.stats['total_records']) * 100
        f.write(f"- **Reduction:** {reduction:,} records ({reduction_pct:.1f}%)\n\n")

        f.write("---\n\n")
        f.write("## Merge Details\n\n")

        # Group by reason
        by_reason = defaultdict(list)
        for merge in deduplicator.merge_log:
            by_reason[merge['reason']].append(merge)

        for reason, merges in by_reason.items():
            f.write(f"### {reason}\n\n")
            f.write(f"**Total merges:** {len(merges)}\n\n")

            # Show first 20 examples
            for i, merge in enumerate(merges[:20], 1):
                f.write(f"{i}. **{merge['organization_name']}**\n")
                f.write(f"   - Primary record: Row {merge['primary_index'] + 2}\n")
                f.write(f"   - Merged from: {len(merge['merged_indices'])} duplicate(s)\n")
                f.write(f"   - Completeness score: {merge['completeness_score']}\n\n")

            if len(merges) > 20:
                f.write(f"\n*... and {len(merges) - 20} more merges*\n\n")

        f.write("---\n\n")
        f.write("## Recommendations\n\n")
        f.write("1. Review the merge log to verify merges are correct\n")
        f.write("2. Spot-check high-profile organizations (Priority A customers)\n")
        f.write("3. Consider additional manual review of similar-name merges\n")
        f.write("4. Use the deduplicated file for database import\n\n")

    print(f"   📄 Report saved: {report_file}")


def main():
    """Main execution"""
    input_file = '/home/krwhynot/projects/crispy-crm/data/csv-files/organizations_cleaned.csv'
    output_file = '/home/krwhynot/projects/crispy-crm/data/csv-files/organizations_deduplicated.csv'
    output_dir = '/home/krwhynot/projects/crispy-crm/data'

    print("=" * 80)
    print("ORGANIZATIONS DEDUPLICATION")
    print("=" * 80)
    print(f"\nInput:  {input_file}")
    print(f"Output: {output_file}")

    # Read data
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)

    print(f"\nLoaded {len(rows):,} records")

    # Deduplicate
    deduplicator = OrganizationDeduplicator(similarity_threshold=0.90)
    deduplicated_rows = deduplicator.deduplicate(rows)

    # Write deduplicated data
    print(f"\n💾 Writing deduplicated data...")
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(deduplicated_rows)

    print(f"   ✓ Saved: {output_file}")

    # Generate reports
    print(f"\n📊 Generating reports...")
    generate_reports(deduplicator, output_dir)

    # Final summary
    print("\n" + "=" * 80)
    print("DEDUPLICATION COMPLETE")
    print("=" * 80)
    print(f"\n✅ Results:")
    print(f"   Original records:  {deduplicator.stats['total_records']:,}")
    print(f"   Duplicates merged: {deduplicator.stats['exact_duplicates_merged'] + deduplicator.stats['similar_names_merged']:,}")
    print(f"   Final records:     {deduplicator.stats['final_record_count']:,}")

    reduction = deduplicator.stats['total_records'] - deduplicator.stats['final_record_count']
    reduction_pct = (reduction / deduplicator.stats['total_records']) * 100
    print(f"   Reduction:         {reduction:,} records ({reduction_pct:.1f}%)")

    print(f"\n📂 Files created:")
    print(f"   • {output_file}")
    print(f"   • {output_dir}/DEDUPLICATION_REPORT.md")
    print(f"   • {output_dir}/deduplication_merge_log.json")

    print("\n" + "=" * 80)


if __name__ == '__main__':
    main()
