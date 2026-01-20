#!/bin/bash
# td-generator.sh - Generate technical debt entries with auto-incrementing IDs
# Usage: ./td-generator.sh <category> <priority> <issue> <file_path> [source]
#
# Categories: UI, ASYNC, ERR, IMP, DEAD, DB, FORM, EC
# Priorities: P0 (critical), P1 (high), P2 (medium), P3 (low)

set -e

CATEGORY="$1"      # UI, ASYNC, ERR, IMP, DEAD, DB, FORM, EC
PRIORITY="$2"      # P0, P1, P2, P3
ISSUE="$3"         # Issue description
FILE_PATH="$4"     # Source file
SOURCE="${5:-manual}"  # Discovery source (manual, todo-hook, audit)

TD_FILE="${CLAUDE_PROJECT_DIR:-$(pwd)}/docs/technical-debt.md"

# Validate inputs
if [[ -z "$CATEGORY" || -z "$PRIORITY" || -z "$ISSUE" || -z "$FILE_PATH" ]]; then
    echo "Usage: $0 <category> <priority> <issue> <file_path> [source]" >&2
    echo "Categories: UI, ASYNC, ERR, IMP, DEAD, DB, FORM, EC" >&2
    echo "Priorities: P0, P1, P2, P3" >&2
    exit 1
fi

# Validate category
VALID_CATEGORIES="UI ASYNC ERR IMP DEAD DB FORM EC"
if [[ ! " $VALID_CATEGORIES " =~ " $CATEGORY " ]]; then
    echo "Invalid category: $CATEGORY" >&2
    echo "Valid categories: $VALID_CATEGORIES" >&2
    exit 1
fi

# Validate priority
VALID_PRIORITIES="P0 P1 P2 P3"
if [[ ! " $VALID_PRIORITIES " =~ " $PRIORITY " ]]; then
    echo "Invalid priority: $PRIORITY" >&2
    echo "Valid priorities: $VALID_PRIORITIES" >&2
    exit 1
fi

# Find next available ID for category
get_next_id() {
    local prefix="$1"
    local max_id=0

    if [[ -f "$TD_FILE" ]]; then
        # Extract all IDs for this category and find the maximum
        max_id=$(grep -oP "${prefix}-\d+" "$TD_FILE" 2>/dev/null | \
                 grep -oP '\d+' | sort -rn | head -1 || echo "0")
    fi

    echo $((${max_id:-0} + 1))
}

NEXT_ID=$(get_next_id "$CATEGORY")
FULL_ID="${CATEGORY}-$(printf '%02d' $NEXT_ID)"

# Output formats based on requested mode
case "${6:-table}" in
    json)
        # JSON output for programmatic use
        cat <<EOF
{
  "id": "$FULL_ID",
  "category": "$CATEGORY",
  "priority": "$PRIORITY",
  "issue": "$ISSUE",
  "file": "$FILE_PATH",
  "source": "$SOURCE",
  "status": "Open"
}
EOF
        ;;
    id)
        # Just the ID
        echo "$FULL_ID"
        ;;
    table|*)
        # Markdown table row (default)
        echo "| $FULL_ID | $CATEGORY | $ISSUE | \`$FILE_PATH\` | Open |"
        ;;
esac
