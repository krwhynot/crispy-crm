#!/usr/bin/env python3
"""
Generate review worksheets for human decision-making
Separates into guided review (options A/B/C) and critical manual review
"""

import csv

def categorize_for_review(row):
    """Determine if entry needs critical review or can use guided worksheet"""
    reason = row['Why Needs Review']
    original = row['Original Name']

    # Critical cases (require detailed manual review)
    if 'multiple_people' in reason:
        if ' and ' in original.lower() or '&' in original or ',' in original:
            return 'critical'

    # Extreme cases
    if len(original) > 80:  # Very long descriptive entries
        return 'critical'

    # Embedded contact info
    if 'embedded_contact_info' in reason:
        return 'critical'

    # Everything else can use guided worksheet
    return 'guided'

def suggest_corrections(row):
    """Suggest 2-3 correction options for guided review"""
    original = row['Original Name']
    org = row['Organization']
    curr_first = row['Current First']
    curr_last = row['Current Last']
    curr_title = row['Current Title']

    options = []

    # Option A: Keep current parsing
    options.append({
        'label': 'A',
        'first': curr_first,
        'last': curr_last,
        'title': curr_title,
        'description': 'Keep current parsing'
    })

    # Option B: Alternative based on pattern
    if 'De ' in original or 'Van ' in original or 'Von ' in original:
        # Name prefix case
        parts = original.split()
        if len(parts) >= 2:
            options.append({
                'label': 'B',
                'first': None,
                'last': ' '.join(parts),
                'title': '',
                'description': 'Treat as full last name (name prefix)'
            })

    elif ' chef ' in original.lower() or original.lower().endswith(' chef'):
        # Title at end
        name_part = original.lower().replace('chef de cuisine', '').replace('chef', '').strip()
        parts = name_part.split()
        if len(parts) >= 2:
            options.append({
                'label': 'B',
                'first': parts[0].title(),
                'last': parts[-1].title(),
                'title': 'Chef',
                'description': 'Extract chef title from name'
            })

    elif original.isupper() or original.islower():
        # Capitalization issue
        options.append({
            'label': 'B',
            'first': curr_first.title() if curr_first else None,
            'last': curr_last.title() if curr_last else None,
            'title': curr_title.title() if curr_title else '',
            'description': 'Fix capitalization'
        })

    # Option C: Always available for manual entry
    options.append({
        'label': 'C',
        'first': '[Manual]',
        'last': '[Manual]',
        'title': '[Manual]',
        'description': 'Enter custom correction'
    })

    return options[:3]  # Max 3 options

def main():
    input_file = '/tmp/remaining_for_review.csv'
    output_guided = '/tmp/guided_review_worksheet.csv'
    output_critical = '/tmp/critical_manual_review.csv'

    print("="*70)
    print("CREATING REVIEW WORKSHEETS")
    print("="*70)

    guided_entries = []
    critical_entries = []

    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            category = categorize_for_review(row)
            if category == 'critical':
                critical_entries.append(row)
            else:
                guided_entries.append(row)

    print(f"\nTotal entries to review: {len(guided_entries) + len(critical_entries)}")
    print(f"  Guided review (with options): {len(guided_entries)}")
    print(f"  Critical manual review: {len(critical_entries)}")

    # Create guided review worksheet
    with open(output_guided, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow([
            'Row', 'Original Name', 'Organization',
            'Option A First', 'Option A Last', 'Option A Title', 'Option A Description',
            'Option B First', 'Option B Last', 'Option B Title', 'Option B Description',
            'Option C First', 'Option C Last', 'Option C Title', 'Option C Description',
            'YOUR CHOICE (A/B/C)', 'Custom First', 'Custom Last', 'Custom Title', 'Notes'
        ])

        for entry in guided_entries:
            options = suggest_corrections(entry)

            row_data = [entry['Row'], entry['Original Name'], entry['Organization']]

            # Add options A, B, C
            for opt in options:
                row_data.extend([
                    opt['first'] or '',
                    opt['last'] or '',
                    opt['title'] or '',
                    opt['description']
                ])

            # Pad if less than 3 options
            while len(options) < 3:
                row_data.extend(['', '', '', ''])
                options.append({})

            # Add user input columns
            row_data.extend(['', '', '', '', ''])

            writer.writerow(row_data)

    print(f"\n✓ Generated: {output_guided}")
    print(f"  Instructions: Review each entry, select A/B/C, or enter custom values")

    # Create critical manual review form
    with open(output_critical, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow([
            'Priority', 'Row', 'Original Name', 'Organization',
            'Issue Type', 'Current Parsing (First|Last|Title)',
            'QUESTION / DECISION REQUIRED',
            'YOUR DECISION',
            'New First Name', 'New Last Name', 'New Title',
            'Action (SPLIT/KEEP/NOTES)', 'Additional Notes'
        ])

        for entry in critical_entries:
            # Determine priority
            if ' and ' in entry['Original Name'].lower() or '&' in entry['Original Name']:
                priority = 'P0-CRITICAL'
                question = f"This appears to be 2+ people. Should we: (a) Split into separate contacts, (b) Keep primary person only, (c) Store full text in notes field?"
            elif len(entry['Original Name']) > 80:
                priority = 'P0-CRITICAL'
                question = f"Extremely long entry with multiple people/titles. Manual parsing required. What should we do with this data?"
            elif 'embedded_contact_info' in entry['Why Needs Review']:
                priority = 'P1-HIGH'
                question = f"Contains phone number or contact info. Extract to separate field?"
            else:
                priority = 'P1-HIGH'
                question = "Ambiguous parsing. Please review and provide correct first/last/title."

            current_parsing = f"{entry['Current First']}|{entry['Current Last']}|{entry['Current Title']}"

            writer.writerow([
                priority,
                entry['Row'],
                entry['Original Name'],
                entry['Organization'],
                entry['Why Needs Review'],
                current_parsing,
                question,
                '',  # YOUR DECISION
                '',  # New First Name
                '',  # New Last Name
                '',  # New Title
                '',  # Action
                ''   # Additional Notes
            ])

    print(f"✓ Generated: {output_critical}")
    print(f"  Instructions: Answer questions for each P0/P1 entry")

    # Priority breakdown
    p0_count = sum(1 for e in critical_entries if ' and ' in e['Original Name'].lower() or len(e['Original Name']) > 80)
    p1_count = len(critical_entries) - p0_count

    print(f"\n\nPRIORITY BREAKDOWN:")
    print(f"  P0-CRITICAL (data loss risk): {p0_count} entries")
    print(f"  P1-HIGH (ambiguous parsing): {p1_count} entries")

    print(f"\n{'='*70}")
    print("REVIEW WORKSHEETS COMPLETE!")
    print(f"{'='*70}")

if __name__ == '__main__':
    main()
