#!/usr/bin/env python3
"""
Simplified Contact Name Cleanup
- Auto-fix entries with 85%+ confidence
- Move low-confidence names to organization notes
"""

import csv
import json

def calculate_confidence_score(original, first, last, title, parse_type):
    """
    Calculate confidence score (0-100) based on pattern clarity
    85+ = auto-fix, <85 = move to notes
    """
    score = 50  # baseline

    # High confidence patterns
    if parse_type == "title_with_name":
        # "Chef Bill Kim" - very clear pattern
        if first and last and title and title.lower() in ['chef', 'owner', 'manager']:
            score = 95
        elif first and last:
            score = 85

    # Job title + single name
    if parse_type in ["title_single_name", "job_title_only"]:
        # "General Manager Jensen" or "Executive Chef"
        if title and any(keyword in title.lower() for keyword in ['manager', 'chef', 'executive', 'director']):
            score = 90

    # Hyphenated name-title
    if '-' in original and len(original.split('-')) == 2:
        parts = original.split('-')
        if any(keyword in parts[1].lower() for keyword in ['gm', 'owner', 'manager', 'chef']):
            score = 95

    # Multiple people indicators - LOW confidence
    if ' and ' in original.lower() or '&' in original or ',' in original:
        score = 20  # Definitely needs notes

    # Very long entries - LOW confidence
    if len(original) > 60:
        score = 20

    # No clear parsing - LOW confidence
    if not first and not last and not title:
        score = 30

    # Weird patterns - LOW confidence
    if any(char.isdigit() for char in original):  # Has numbers
        score = 25

    # Title words in name fields - MEDIUM confidence
    title_keywords = ['chef', 'manager', 'owner', 'director', 'executive', 'president']
    if first and any(keyword in first.lower() for keyword in title_keywords):
        score = 60
    if last and any(keyword in last.lower() for keyword in title_keywords):
        score = 60

    # False positives (name prefixes) - HIGH confidence as-is
    name_prefixes = ['de', 'van', 'von', 'le', 'la']
    if first and first.lower() in name_prefixes:
        score = 90  # Keep as-is, it's correct

    return score

def load_contacts_data():
    """Load main contacts CSV to get email/phone data"""
    contacts_file = '/home/krwhynot/projects/crispy-crm/data/migration-output/contacts_cleaned.csv'
    contacts_map = {}

    with open(contacts_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            key = (row['name'], row['organization_name'])
            contacts_map[key] = {
                'email': row['email'],
                'phone': row['phone'],
                'has_data': bool(row['email'] or row['phone'])
            }

    return contacts_map

def main():
    input_file = '/home/krwhynot/projects/crispy-crm/data/migration-output/questionable_names.csv'
    output_keep = '/tmp/contacts_to_keep_corrected.csv'
    output_notes = '/tmp/contacts_to_move_to_notes.csv'
    output_summary = '/tmp/simplified_cleanup_summary.csv'

    print("="*70)
    print("SIMPLIFIED CONTACT NAME CLEANUP")
    print("Strategy: 85%+ confidence = fix, <85% = move to org notes")
    print("="*70)

    # Load contact data to check for emails/phones
    contacts_map = load_contacts_data()

    keep_entries = []
    notes_entries = []

    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            original = row['Original Name']
            org = row['Organization']
            first = row['First Name']
            last = row['Last Name']
            title = row['Title']
            parse_type = row['Parse Type']

            # Calculate confidence
            confidence = calculate_confidence_score(original, first, last, title, parse_type)

            # Check if contact has email/phone (important to preserve)
            contact_key = (original, org)
            contact_data = contacts_map.get(contact_key, {})
            has_important_data = contact_data.get('has_data', False)

            decision = {
                'row': row['Row'],
                'original_name': original,
                'organization': org,
                'first': first,
                'last': last,
                'title': title,
                'confidence': confidence,
                'has_email_phone': has_important_data,
                'email': contact_data.get('email', ''),
                'phone': contact_data.get('phone', '')
            }

            if confidence >= 85:
                keep_entries.append(decision)
            else:
                notes_entries.append(decision)

    print(f"\nTotal entries processed: {len(keep_entries) + len(notes_entries)}")
    print(f"  Keep & correct (85%+ confidence): {len(keep_entries)}")
    print(f"  Move to org notes (<85% confidence): {len(notes_entries)}")

    # Write entries to keep (with corrections)
    with open(output_keep, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['Row', 'Original Name', 'Organization', 'Corrected First',
                        'Corrected Last', 'Corrected Title', 'Confidence', 'Has Email/Phone'])
        for entry in keep_entries:
            writer.writerow([
                entry['row'], entry['original_name'], entry['organization'],
                entry['first'], entry['last'], entry['title'],
                f"{entry['confidence']}%",
                'YES' if entry['has_email_phone'] else 'NO'
            ])

    print(f"\n✓ Generated: {output_keep}")
    print(f"  These contacts will be corrected and kept")

    # Write entries to move to notes
    with open(output_notes, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['Row', 'Original Name', 'Organization', 'Confidence',
                        'Has Email/Phone', 'Email', 'Phone',
                        'Suggested Note Text', 'Action'])
        for entry in notes_entries:
            # Create note text
            note_parts = [f"Contact: {entry['original_name']}"]

            if entry['has_email_phone']:
                if entry['email']:
                    try:
                        email_data = json.loads(entry['email'])
                        email_val = email_data[0]['value'] if email_data else ''
                        note_parts.append(f"Email: {email_val}")
                    except:
                        pass
                if entry['phone']:
                    try:
                        phone_data = json.loads(entry['phone'])
                        phone_val = phone_data[0]['value'] if phone_data else ''
                        note_parts.append(f"Phone: {phone_val}")
                    except:
                        pass

            note_text = " | ".join(note_parts)

            # Determine action
            if entry['has_email_phone']:
                action = "IMPORTANT: Has contact info - preserve carefully"
            else:
                action = "Move to notes, delete contact record"

            writer.writerow([
                entry['row'], entry['original_name'], entry['organization'],
                f"{entry['confidence']}%",
                'YES' if entry['has_email_phone'] else 'NO',
                entry['email'], entry['phone'],
                note_text,
                action
            ])

    print(f"✓ Generated: {output_notes}")
    print(f"  These entries will be moved to organization notes")

    # Summary statistics
    with open(output_summary, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['Metric', 'Count', 'Percentage'])

        total = len(keep_entries) + len(notes_entries)
        writer.writerow(['Total Questionable Entries', total, '100%'])
        writer.writerow(['Keep & Correct (85%+ confidence)', len(keep_entries), f'{len(keep_entries)/total*100:.1f}%'])
        writer.writerow(['Move to Notes (<85% confidence)', len(notes_entries), f'{len(notes_entries)/total*100:.1f}%'])
        writer.writerow(['', '', ''])

        # Important data preservation
        notes_with_data = sum(1 for e in notes_entries if e['has_email_phone'])
        writer.writerow(['Notes entries WITH email/phone', notes_with_data, f'{notes_with_data/len(notes_entries)*100:.1f}%' if notes_entries else '0%'])
        writer.writerow(['Notes entries WITHOUT email/phone', len(notes_entries) - notes_with_data, f'{(len(notes_entries)-notes_with_data)/len(notes_entries)*100:.1f}%' if notes_entries else '0%'])
        writer.writerow(['', '', ''])

        # Confidence breakdown
        high_conf = sum(1 for e in keep_entries if e['confidence'] >= 90)
        medium_conf = sum(1 for e in keep_entries if 85 <= e['confidence'] < 90)
        writer.writerow(['High Confidence (90%+)', high_conf, f'{high_conf/len(keep_entries)*100:.1f}%' if keep_entries else '0%'])
        writer.writerow(['Medium-High Confidence (85-89%)', medium_conf, f'{medium_conf/len(keep_entries)*100:.1f}%' if keep_entries else '0%'])

    print(f"✓ Generated: {output_summary}")

    # Show breakdown
    print(f"\n\nDETAILED BREAKDOWN:")
    print(f"\n**Entries to Keep & Correct ({len(keep_entries)}):**")

    conf_ranges = {
        '95-100%': [e for e in keep_entries if e['confidence'] >= 95],
        '90-94%': [e for e in keep_entries if 90 <= e['confidence'] < 95],
        '85-89%': [e for e in keep_entries if 85 <= e['confidence'] < 90],
    }

    for range_name, entries in conf_ranges.items():
        if entries:
            print(f"  {range_name} confidence: {len(entries)} entries")
            for e in entries[:3]:  # Show first 3 examples
                print(f"    - '{e['original_name']}' → {e['first']} {e['last']} (title: {e['title']})")

    print(f"\n**Entries to Move to Notes ({len(notes_entries)}):**")
    notes_with_data = [e for e in notes_entries if e['has_email_phone']]
    notes_without_data = [e for e in notes_entries if not e['has_email_phone']]

    print(f"  WITH email/phone ({len(notes_with_data)}): ⚠️ IMPORTANT - preserve data")
    for e in notes_with_data[:3]:
        print(f"    - '{e['original_name']}' at {e['organization']}")

    print(f"  WITHOUT email/phone ({len(notes_without_data)}): Can safely delete contact")
    for e in notes_without_data[:3]:
        print(f"    - '{e['original_name']}' at {e['organization']}")

    print(f"\n{'='*70}")
    print("CLEANUP STRATEGY COMPLETE!")
    print(f"{'='*70}")

    print(f"\nNEXT STEPS:")
    print(f"1. Review {output_keep} - apply corrections to these contacts")
    print(f"2. Review {output_notes} - move these to organization notes")
    print(f"3. For notes entries WITH email/phone: Add note to org, keep contact minimal")
    print(f"4. For notes entries WITHOUT email/phone: Add note to org, delete contact")

if __name__ == '__main__':
    main()
