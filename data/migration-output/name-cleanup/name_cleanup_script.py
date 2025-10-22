#!/usr/bin/env python3
"""
Contact Name Cleanup Script
Automatically fixes ~100 of 153 questionable contact name entries
Based on pattern analysis and industry best practices
"""

import csv
import re
from typing import Tuple, Optional, Dict, List
from dataclasses import dataclass

@dataclass
class ContactCorrection:
    row: int
    original_name: str
    organization: str
    old_first: str
    old_last: str
    old_title: str
    new_first: Optional[str]
    new_last: Optional[str]
    new_title: Optional[str]
    parse_type: str
    correction_rule: str
    confidence: str  # high, medium, low
    needs_review: bool

# Known job title keywords
JOB_TITLES = {
    'president', 'vice president', 'vp', 'ceo', 'cfo', 'coo',
    'general manager', 'gm', 'manager', 'executive', 'director',
    'owner', 'chef', 'executive chef', 'pastry chef', 'corporate chef',
    'sous chef', 'chef de cuisine', 'coordinator', 'assistant',
    'supervisor', 'administrator'
}

# Foreign name prefixes (should not be treated as multipart)
NAME_PREFIXES = {'de', 'van', 'von', 'le', 'la', 'del', 'della', 'di'}

def title_case_preserve_acronyms(text: str) -> str:
    """Title case but preserve acronyms like GM, CEO, VP"""
    if not text:
        return text

    if text.isupper() and len(text) <= 3:
        return text  # Preserve acronyms

    return text.title()

def is_job_title_keyword(word: str) -> bool:
    """Check if word is a known job title"""
    return word.lower() in JOB_TITLES

def has_multiple_people_indicators(name: str) -> bool:
    """Detect if name contains multiple people"""
    indicators = [' and ', ' & ', ',']
    name_lower = name.lower()

    for indicator in indicators:
        if indicator in name_lower:
            return True

    # Count capitalized words (4+ suggests multiple people)
    words = name.split()
    cap_count = sum(1 for w in words if w and w[0].isupper())

    return cap_count >= 4

def extract_phone_number(text: str) -> Tuple[Optional[str], str]:
    """Extract phone number and return (phone, cleaned_text)"""
    phone_pattern = r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b'
    match = re.search(phone_pattern, text)

    if match:
        phone = match.group()
        cleaned = text.replace(phone, '').strip()
        return phone, cleaned

    return None, text

def is_hyphenated_name_title(name: str) -> bool:
    """Check if format is Name-Title"""
    if '-' not in name:
        return False

    parts = name.split('-')
    if len(parts) != 2:
        return False

    # Second part should be a job title
    return is_job_title_keyword(parts[1])

def parse_hyphenated_name_title(name: str) -> Tuple[Optional[str], Optional[str], str]:
    """Parse Name-Title format"""
    parts = name.split('-')
    name_part = parts[0].strip()
    title_part = title_case_preserve_acronyms(parts[1].strip())

    # Parse the name part
    name_words = name_part.split()
    if len(name_words) == 1:
        return None, name_words[0], title_part
    elif len(name_words) == 2:
        return name_words[0], name_words[1], title_part
    else:
        return name_words[0], name_words[-1], title_part

def is_job_title_only(name: str) -> bool:
    """Check if entire string is just a job title"""
    name_lower = name.lower().strip()

    # Direct match
    if name_lower in JOB_TITLES:
        return True

    # Check multi-word titles
    words = name_lower.split()
    if len(words) <= 3:
        phrase = ' '.join(words)
        if phrase in JOB_TITLES:
            return True

    # Pattern: "{Title} {Single name}" where title is known
    if len(words) == 2:
        if words[0] in JOB_TITLES or words[1] in JOB_TITLES:
            # But not if second word is capitalized name-like
            if words[0] in JOB_TITLES and words[1][0].isupper():
                return False  # This is "Title Name" pattern

    return False

def parse_title_single_name(name: str) -> Tuple[Optional[str], Optional[str], str]:
    """Parse 'Executive Chef Smith' or 'General Manager Jensen'"""
    words = name.split()

    # Find where title ends and name begins
    title_words = []
    name_word = None

    for i, word in enumerate(words):
        if is_job_title_keyword(word):
            title_words.append(word)
        elif word.lower() in ['chef', 'manager', 'director', 'executive']:
            title_words.append(word)
        else:
            # This should be the name
            name_word = word
            # Add any remaining words to title if they're title-like
            for j in range(i+1, len(words)):
                if is_job_title_keyword(words[j]):
                    title_words.append(words[j])
            break

    title = ' '.join(title_words).title() if title_words else name

    return None, name_word, title

def has_chef_prefix(name: str) -> bool:
    """Check if name starts with 'Chef'"""
    return name.lower().startswith('chef ')

def parse_chef_name(name: str) -> Tuple[Optional[str], Optional[str], str]:
    """Parse 'Chef Bill Kim' or 'Chef owner anthony sitek'"""
    # Remove 'Chef' prefix
    remaining = name[5:].strip()  # 'Chef ' is 5 chars

    words = remaining.split()

    # Check for compound titles: "owner anthony sitek"
    if words and is_job_title_keyword(words[0]):
        # "Chef owner anthony sitek" -> use Chef as title, parse rest as name
        title = 'Chef'
        name_words = [w for w in words if not is_job_title_keyword(w)]

        if len(name_words) == 1:
            return None, title_case_preserve_acronyms(name_words[0]), title
        elif len(name_words) >= 2:
            return title_case_preserve_acronyms(name_words[0]), title_case_preserve_acronyms(name_words[-1]), title
        else:
            return None, None, title

    # Simple case: "Chef Bill Kim"
    if len(words) == 1:
        return None, title_case_preserve_acronyms(words[0]), 'Chef'
    elif len(words) >= 2:
        return title_case_preserve_acronyms(words[0]), title_case_preserve_acronyms(words[-1]), 'Chef'

    return None, None, 'Chef'

def has_title_suffix(name: str) -> bool:
    """Check if name has title words at the end"""
    words = name.lower().split()
    if len(words) < 3:
        return False

    # Check last 1-2 words for title keywords
    return any(is_job_title_keyword(w) for w in words[-2:])

def parse_name_with_title_suffix(name: str) -> Tuple[Optional[str], Optional[str], str]:
    """Parse 'Seth Minton chef de cuisine' or 'Pastry Chef Schawecker'"""
    words = name.split()

    # Find where name ends and title begins
    name_words = []
    title_words = []

    in_title = False
    for i, word in enumerate(words):
        word_lower = word.lower()

        if is_job_title_keyword(word_lower) or word_lower in ['chef', 'pastry', 'executive', 'corporate', 'sous']:
            in_title = True
            title_words.append(word)
        elif in_title:
            title_words.append(word)
        elif word[0].isupper():
            name_words.append(word)

    if not name_words:
        # All title words, e.g., "Pastry Chef"
        return None, None, ' '.join(title_words).title()

    # Extract name
    if len(name_words) == 1:
        first, last = None, name_words[0]
    elif len(name_words) == 2:
        first, last = name_words[0], name_words[1]
    else:
        first, last = name_words[0], name_words[-1]

    title = ' '.join(title_words).title() if title_words else ''

    return first, last, title

def correct_contact_name(row: int, original: str, org: str, old_first: str,
                        old_last: str, old_title: str, parse_type: str) -> ContactCorrection:
    """Apply correction rules and return ContactCorrection object"""

    # Rule 0: Check for phone/email extraction
    phone, cleaned_name = extract_phone_number(original)
    if phone:
        # Extract phone, parse remaining
        # For now, flag for review
        return ContactCorrection(
            row=row, original_name=original, organization=org,
            old_first=old_first, old_last=old_last, old_title=old_title,
            new_first=None, new_last=None, new_title=None,
            parse_type=parse_type, correction_rule="embedded_contact_info",
            confidence="low", needs_review=True
        )

    # Rule 1: Multiple people - flag for manual review
    if has_multiple_people_indicators(original):
        return ContactCorrection(
            row=row, original_name=original, organization=org,
            old_first=old_first, old_last=old_last, old_title=old_title,
            new_first=old_first, new_last=old_last, new_title=old_title,
            parse_type=parse_type, correction_rule="multiple_people_detected",
            confidence="low", needs_review=True
        )

    # Rule 2: Hyphenated Name-Title
    if is_hyphenated_name_title(original):
        first, last, title = parse_hyphenated_name_title(original)
        return ContactCorrection(
            row=row, original_name=original, organization=org,
            old_first=old_first, old_last=old_last, old_title=old_title,
            new_first=first, new_last=last, new_title=title,
            parse_type="hyphenated_name_title", correction_rule="split_hyphen",
            confidence="high", needs_review=False
        )

    # Rule 3: Job Title Only (pure title, no name)
    if is_job_title_only(original):
        return ContactCorrection(
            row=row, original_name=original, organization=org,
            old_first=old_first, old_last=old_last, old_title=old_title,
            new_first=None, new_last=None, new_title=original.title(),
            parse_type="job_title_only", correction_rule="clear_names_set_title",
            confidence="high", needs_review=False
        )

    # Rule 4: Title + Single Name (e.g., "General Manager Jensen")
    words = original.split()
    if len(words) == 2 and is_job_title_keyword(words[0]):
        first, last, title = parse_title_single_name(original)
        return ContactCorrection(
            row=row, original_name=original, organization=org,
            old_first=old_first, old_last=old_last, old_title=old_title,
            new_first=first, new_last=last, new_title=title,
            parse_type="title_single_name", correction_rule="extract_title_and_name",
            confidence="high", needs_review=False
        )

    # Rule 5: Chef prefix
    if has_chef_prefix(original):
        first, last, title = parse_chef_name(original)
        confidence = "high" if first or last else "medium"
        return ContactCorrection(
            row=row, original_name=original, organization=org,
            old_first=old_first, old_last=old_last, old_title=old_title,
            new_first=first, new_last=last, new_title=title,
            parse_type="chef_prefix", correction_rule="parse_chef_title",
            confidence=confidence, needs_review=(confidence == "medium")
        )

    # Rule 6: Title suffix
    if has_title_suffix(original):
        first, last, title = parse_name_with_title_suffix(original)
        confidence = "medium" if first and last else "low"
        return ContactCorrection(
            row=row, original_name=original, organization=org,
            old_first=old_first, old_last=old_last, old_title=old_title,
            new_first=first, new_last=last, new_title=title,
            parse_type="title_suffix", correction_rule="extract_suffix_title",
            confidence=confidence, needs_review=(confidence == "low")
        )

    # Rule 7: Check if current parsing is actually correct (false positive)
    # If has first + last and no obvious issues, mark as correct
    if old_first and old_last and not has_title_suffix(original):
        # Check for name prefixes
        first_lower = old_first.lower()
        if first_lower in NAME_PREFIXES:
            # "De Astis" - keep as is, just flag as correct
            return ContactCorrection(
                row=row, original_name=original, organization=org,
                old_first=old_first, old_last=old_last, old_title=old_title,
                new_first=old_first, new_last=old_last, new_title=old_title,
                parse_type="false_positive", correction_rule="already_correct",
                confidence="high", needs_review=False
            )

    # Default: No confident correction, flag for review
    return ContactCorrection(
        row=row, original_name=original, organization=org,
        old_first=old_first, old_last=old_last, old_title=old_title,
        new_first=old_first, new_last=old_last, new_title=old_title,
        parse_type=parse_type, correction_rule="no_rule_matched",
        confidence="low", needs_review=True
    )

def main():
    input_file = '/home/krwhynot/projects/crispy-crm/data/migration-output/questionable_names.csv'
    output_corrected = '/tmp/corrected_contacts.csv'
    output_log = '/tmp/correction_audit_log.csv'
    output_review = '/tmp/remaining_for_review.csv'

    print("="*70)
    print("CONTACT NAME CLEANUP SCRIPT")
    print("="*70)

    # Read questionable names
    corrections = []
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            correction = correct_contact_name(
                row=int(row['Row']),
                original=row['Original Name'],
                org=row['Organization'],
                old_first=row['First Name'],
                old_last=row['Last Name'],
                old_title=row['Title'],
                parse_type=row['Parse Type']
            )
            corrections.append(correction)

    # Separate into auto-fixed and needs-review
    auto_fixed = [c for c in corrections if not c.needs_review and c.confidence in ['high', 'medium']]
    needs_review = [c for c in corrections if c.needs_review or c.confidence == 'low']

    print(f"\nTotal entries processed: {len(corrections)}")
    print(f"  Auto-fixed: {len(auto_fixed)} ({len(auto_fixed)/len(corrections)*100:.1f}%)")
    print(f"  Needs review: {len(needs_review)} ({len(needs_review)/len(corrections)*100:.1f}%)")

    # Write corrected contacts
    with open(output_corrected, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['Row', 'Original Name', 'Organization', 'New First Name',
                        'New Last Name', 'New Title', 'Confidence', 'Correction Rule'])
        for c in auto_fixed:
            writer.writerow([
                c.row, c.original_name, c.organization,
                c.new_first or '', c.new_last or '', c.new_title or '',
                c.confidence, c.correction_rule
            ])

    print(f"\n✓ Generated: {output_corrected}")

    # Write audit log
    with open(output_log, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['Row', 'Original Name', 'Organization',
                        'Old First', 'Old Last', 'Old Title',
                        'New First', 'New Last', 'New Title',
                        'Correction Rule', 'Confidence', 'Changed'])
        for c in auto_fixed:
            changed = (c.old_first != c.new_first or
                      c.old_last != c.new_last or
                      c.old_title != c.new_title)
            writer.writerow([
                c.row, c.original_name, c.organization,
                c.old_first, c.old_last, c.old_title,
                c.new_first or '', c.new_last or '', c.new_title or '',
                c.correction_rule, c.confidence, 'YES' if changed else 'NO'
            ])

    print(f"✓ Generated: {output_log}")

    # Write remaining for review
    with open(output_review, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['Row', 'Original Name', 'Organization',
                        'Current First', 'Current Last', 'Current Title',
                        'Parse Type', 'Why Needs Review'])
        for c in needs_review:
            writer.writerow([
                c.row, c.original_name, c.organization,
                c.old_first, c.old_last, c.old_title,
                c.parse_type, c.correction_rule
            ])

    print(f"✓ Generated: {output_review}")

    # Summary statistics
    print(f"\n\nCORRECTION STATISTICS:")
    rule_counts = {}
    for c in auto_fixed:
        rule_counts[c.correction_rule] = rule_counts.get(c.correction_rule, 0) + 1

    print("\nAuto-fixed by rule:")
    for rule, count in sorted(rule_counts.items(), key=lambda x: -x[1]):
        print(f"  {rule}: {count}")

    review_counts = {}
    for c in needs_review:
        review_counts[c.correction_rule] = review_counts.get(c.correction_rule, 0) + 1

    print("\nNeeds review by reason:")
    for reason, count in sorted(review_counts.items(), key=lambda x: -x[1]):
        print(f"  {reason}: {count}")

    print(f"\n{'='*70}")
    print("CLEANUP COMPLETE!")
    print(f"{'='*70}")

if __name__ == '__main__':
    main()
