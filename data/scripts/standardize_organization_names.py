#!/usr/bin/env python3
"""
Organization Name Standardization Script

Standardizes naming conventions for multi-location distributors and chains:
- Gordon Fs/Brighton → Gordon Food Service - Brighton DC
- Sysco/Chicago → Sysco - Chicago DC
- GFS-D → Gordon Food Service - D
- Inconsistent abbreviations unified

Does NOT create parent-child relationships, just clean naming.

Author: Claude Code
Date: 2025-10-24
"""

import csv
import re
from typing import Dict, Optional


class OrganizationNameStandardizer:
    """Standardizes organization names following consistent patterns"""

    def __init__(self):
        self.changes = []
        self.stats = {
            'total_records': 0,
            'names_changed': 0,
            'gfs_standardized': 0,
            'sysco_standardized': 0,
            'pfg_standardized': 0,
            'usf_standardized': 0,
            'other_standardized': 0,
        }

    def standardize_name(self, name: str, org_type: str) -> str:
        """
        Standardize organization name following consistent patterns

        Rules:
        1. Gordon/GFS → "Gordon Food Service - [Location] DC"
        2. Sysco → "Sysco - [Location] DC"
        3. PFG → "PFG - [Location] DC"
        4. USF → "US Foodservice - [Location] DC"
        5. Remove slashes, use dashes
        6. Add "DC" suffix for distributors
        """
        original = name
        name = name.strip()

        # Gordon Food Service / GFS standardization
        if self._is_gfs(name):
            name = self._standardize_gfs(name, org_type)
            self.stats['gfs_standardized'] += 1

        # Sysco standardization
        elif self._is_sysco(name):
            name = self._standardize_sysco(name, org_type)
            self.stats['sysco_standardized'] += 1

        # PFG standardization
        elif self._is_pfg(name):
            name = self._standardize_pfg(name, org_type)
            self.stats['pfg_standardized'] += 1

        # US Foodservice standardization
        elif self._is_usf(name):
            name = self._standardize_usf(name, org_type)
            self.stats['usf_standardized'] += 1

        # Other distributors - just clean up formatting
        elif org_type == 'distributor' and ('/' in name or ' fs' in name.lower()):
            name = self._standardize_other_distributor(name)
            self.stats['other_standardized'] += 1

        # Track if changed
        if name != original:
            self.changes.append({
                'original': original,
                'standardized': name,
                'type': org_type
            })

        return name

    def _is_gfs(self, name: str) -> bool:
        """Check if organization is Gordon Food Service / GFS"""
        name_lower = name.lower()
        return (name_lower.startswith('gfs') or
                'gordon' in name_lower or
                name_lower == 'gfs')

    def _is_sysco(self, name: str) -> bool:
        """Check if organization is Sysco"""
        return 'sysco' in name.lower()

    def _is_pfg(self, name: str) -> bool:
        """Check if organization is PFG"""
        name_lower = name.lower()
        return name_lower.startswith('pfg') or name_lower == 'pfg'

    def _is_usf(self, name: str) -> bool:
        """Check if organization is US Foodservice"""
        name_lower = name.lower()
        return (name_lower.startswith('usf') or
                'u. s. foodservice' in name_lower or
                'us foodservice' in name_lower)

    def _standardize_gfs(self, name: str, org_type: str) -> str:
        """Standardize Gordon Food Service names"""
        name_lower = name.lower()

        # Extract location from various patterns
        location = None

        # Pattern: "Gordon Fs/Location"
        if '/' in name:
            parts = name.split('/', 1)
            location = parts[1].strip()

        # Pattern: "GFS-Location" or "Gfs Location"
        elif name_lower.startswith('gfs'):
            # Remove "GFS" prefix
            remainder = name[3:].strip()
            if remainder.startswith('-'):
                location = remainder[1:].strip()
            elif remainder:
                location = remainder

        # Pattern: "Gordon Food Service" (no location)
        if not location or location.lower() in ['', 'd', 'm', 'q', 'all']:
            if location and location.lower() in ['d', 'm', 'q', 'all']:
                # Keep letter codes as-is
                location = location.upper()
                return f"Gordon Food Service - {location}"
            else:
                return "Gordon Food Service"

        # Clean up location name
        location = self._clean_location_name(location)

        # Add DC suffix for distributors if not present
        if org_type == 'distributor' and not location.upper().endswith('DC'):
            # Check if it's a special location type
            if any(term in location.lower() for term in ['epo', 'fed ex', 'dock', 'refrig', 'froz']):
                # Special handling - keep as descriptive location
                return f"Gordon Food Service - {location}"
            else:
                return f"Gordon Food Service - {location} DC"

        return f"Gordon Food Service - {location}"

    def _standardize_sysco(self, name: str, org_type: str) -> str:
        """Standardize Sysco names"""
        # Extract location
        location = None

        if '/' in name:
            parts = name.split('/', 1)
            location = parts[1].strip()
        elif '(' in name:
            # Handle "Sysco(Bg/Nashville)" format
            match = re.search(r'\(([^)]+)\)', name)
            if match:
                location = match.group(1).strip()
                # Handle nested format like "Bg/Nashville"
                if '/' in location:
                    location = location.split('/')[-1].strip()
        else:
            # Check if there's content after "Sysco"
            remainder = re.sub(r'^sysco\s*', '', name, flags=re.IGNORECASE).strip()
            if remainder and remainder.lower() not in ['', 'foods']:
                location = remainder

        if not location or location.lower() in ['', 'foods']:
            return "Sysco"

        # Clean location
        location = self._clean_location_name(location)

        # Remove "virtual" designation - not needed in name
        location = re.sub(r'\s*-?\s*virtual\s*$', '', location, flags=re.IGNORECASE)

        # Add DC suffix for distributors
        if org_type == 'distributor' and not location.upper().endswith('DC'):
            return f"Sysco - {location} DC"

        return f"Sysco - {location}"

    def _standardize_pfg(self, name: str, org_type: str) -> str:
        """Standardize PFG (Performance Food Group) names"""
        name_lower = name.lower()
        location = None

        # Extract location
        if '/' in name:
            parts = name.split('/', 1)
            location = parts[1].strip()
        elif '-' in name:
            parts = name.split('-', 1)
            location = parts[1].strip()
        elif '=' in name:
            # Handle "Pfg=Jordan Gottlieb" format
            parts = name.split('=', 1)
            location = parts[1].strip()
        else:
            # Get remainder after "PFG"
            remainder = re.sub(r'^pfg\s*', '', name, flags=re.IGNORECASE).strip()
            if remainder:
                location = remainder

        if not location or location.lower() in ['all']:
            if location and location.lower() == 'all':
                return "PFG - All Locations"
            return "PFG"

        # Clean location
        location = self._clean_location_name(location)

        # Handle special formats
        if 'reinhart' in location.lower():
            # "PFG Cincinnati (Formerly Reinhart)" → "PFG - Cincinnati DC"
            location = re.sub(r'\s*\(formerly\s+reinhart\)', '', location, flags=re.IGNORECASE)
            location = location.strip()

        # Add DC suffix for distributors
        if org_type == 'distributor' and not location.upper().endswith('DC'):
            # Special handling for known house/building types
            if any(term in location.lower() for term in ['house', 'building']):
                return f"PFG - {location}"
            return f"PFG - {location} DC"

        return f"PFG - {location}"

    def _standardize_usf(self, name: str, org_type: str) -> str:
        """Standardize US Foodservice names"""
        location = None

        # Extract location
        if '-' in name:
            parts = name.split('-', 1)
            location = parts[1].strip()
        elif '/' in name:
            parts = name.split('/', 1)
            location = parts[1].strip()
        else:
            remainder = re.sub(r'^usf\s*', '', name, flags=re.IGNORECASE).strip()
            if remainder and not remainder.isdigit():  # Ignore numeric codes
                location = remainder

        if not location:
            return "US Foodservice"

        # Clean location
        location = self._clean_location_name(location)

        # Add DC suffix for distributors
        if org_type == 'distributor' and not location.upper().endswith('DC'):
            return f"US Foodservice - {location} DC"

        return f"US Foodservice - {location}"

    def _standardize_other_distributor(self, name: str) -> str:
        """Standardize other distributor names with slashes"""
        # Simply replace slashes with dashes
        name = name.replace('/', ' - ')
        # Clean up multiple spaces
        name = re.sub(r'\s+', ' ', name)
        return name.strip()

    def _clean_location_name(self, location: str) -> str:
        """Clean up location names"""
        # Remove trailing punctuation
        location = location.strip('.,;')

        # Title case for proper names
        if location.isupper() or location.islower():
            # Apply title case, but preserve abbreviations
            words = location.split()
            cleaned = []
            for word in words:
                if len(word) <= 2 and word.isupper():
                    cleaned.append(word)  # Keep abbreviations like "IL", "DC"
                else:
                    cleaned.append(word.capitalize())
            location = ' '.join(cleaned)

        return location.strip()

    def process_file(self, input_file: str, output_file: str) -> None:
        """Process the CSV file and standardize names"""
        print("=" * 80)
        print("ORGANIZATION NAME STANDARDIZATION")
        print("=" * 80)
        print(f"\nInput:  {input_file}")
        print(f"Output: {output_file}")

        # Read input
        with open(input_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            fieldnames = reader.fieldnames
            rows = list(reader)

        self.stats['total_records'] = len(rows)
        print(f"\nProcessing {len(rows):,} records...\n")

        # Standardize names
        standardized_rows = []
        for i, row in enumerate(rows, 1):
            original_name = row['name']
            standardized_name = self.standardize_name(original_name, row['organization_type'])

            if standardized_name != original_name:
                self.stats['names_changed'] += 1
                row['name'] = standardized_name

            standardized_rows.append(row)

            if i % 500 == 0:
                print(f"  Processed {i:,} records...")

        # Write output
        print(f"\n💾 Writing standardized data...")
        with open(output_file, 'w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(standardized_rows)

        print(f"   ✓ Saved: {output_file}")

        # Print summary
        self._print_summary()

    def _print_summary(self):
        """Print standardization summary"""
        print("\n" + "=" * 80)
        print("STANDARDIZATION SUMMARY")
        print("=" * 80)

        print(f"\n📊 Results:")
        print(f"   Total records:       {self.stats['total_records']:,}")
        print(f"   Names changed:       {self.stats['names_changed']:,}")
        print(f"   Unchanged:           {self.stats['total_records'] - self.stats['names_changed']:,}")

        print(f"\n📦 By Company:")
        print(f"   Gordon Food Service: {self.stats['gfs_standardized']:,}")
        print(f"   Sysco:               {self.stats['sysco_standardized']:,}")
        print(f"   PFG:                 {self.stats['pfg_standardized']:,}")
        print(f"   US Foodservice:      {self.stats['usf_standardized']:,}")
        print(f"   Other distributors:  {self.stats['other_standardized']:,}")

        # Show examples
        if self.changes:
            print(f"\n📝 Sample Name Changes (first 15):")
            print(f"   {'BEFORE':<40s} → {'AFTER':<40s}")
            print(f"   {'-'*40} → {'-'*40}")

            for change in self.changes[:15]:
                before = change['original'][:38]
                after = change['standardized'][:38]
                print(f"   {before:<40s} → {after:<40s}")

            if len(self.changes) > 15:
                print(f"\n   ... and {len(self.changes) - 15} more changes")

        print("\n" + "=" * 80)


def main():
    """Main execution"""
    input_file = '/home/krwhynot/projects/crispy-crm/data/csv-files/organizations_deduplicated.csv'
    output_file = '/home/krwhynot/projects/crispy-crm/data/csv-files/organizations_standardized.csv'

    standardizer = OrganizationNameStandardizer()
    standardizer.process_file(input_file, output_file)

    print("✅ STANDARDIZATION COMPLETE!")
    print("=" * 80 + "\n")


if __name__ == '__main__':
    main()
