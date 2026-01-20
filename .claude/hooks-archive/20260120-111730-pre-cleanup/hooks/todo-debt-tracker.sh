#!/bin/bash
# todo-debt-tracker.sh - Detect TODO/FIXME patterns in edited files
# Hook: PostToolUse (Write|Edit|MultiEdit)
#
# Notifies when code markers are found but doesn't auto-add entries.
# Queues markers for batch processing via /td add.

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
QUEUE_FILE="${SCRIPT_DIR}/state/todo-queue.jsonl"

# Read hook payload from stdin
payload="$(cat)"

# Extract file path from tool input
file_path=$(echo "$payload" | jq -r '.tool_input.file_path // empty' 2>/dev/null)

# Skip if no file path
[[ -z "$file_path" ]] && exit 0

# Skip non-code files
[[ ! "$file_path" =~ \.(ts|tsx|js|jsx)$ ]] && exit 0

# Skip if file doesn't exist (was deleted)
[[ ! -f "$file_path" ]] && exit 0

# Skip test files - they often have intentional TODOs
[[ "$file_path" =~ \.test\.(ts|tsx)$ ]] && exit 0
[[ "$file_path" =~ \.spec\.(ts|tsx)$ ]] && exit 0
[[ "$file_path" =~ __tests__ ]] && exit 0

# Patterns to detect with priority mapping:
# BUG: → P0 (critical)
# HACK: → P1 (high)
# FIXME: → P2 (medium)
# XXX: → P2 (medium)
# TODO: → P3 (low)

detect_markers() {
    local file="$1"
    local markers=()

    # Extract markers with line numbers
    # Format: line_number:marker_type:content
    while IFS= read -r line; do
        [[ -n "$line" ]] && markers+=("$line")
    done < <(grep -n -E '(TODO|FIXME|XXX|HACK|BUG):' "$file" 2>/dev/null || true)

    printf '%s\n' "${markers[@]}"
}

# Detect markers in the edited file
MARKERS=$(detect_markers "$file_path")

if [[ -n "$MARKERS" ]]; then
    # Count by type - grep -c returns 1 on no match, use || true to prevent set -e exit
    BUG_COUNT=$(echo "$MARKERS" | grep -c "BUG:" || true)
    HACK_COUNT=$(echo "$MARKERS" | grep -c "HACK:" || true)
    FIXME_COUNT=$(echo "$MARKERS" | grep -c "FIXME:" || true)
    XXX_COUNT=$(echo "$MARKERS" | grep -c "XXX:" || true)
    TODO_COUNT=$(echo "$MARKERS" | grep -c "TODO:" || true)

    # Ensure counts are numeric (grep -c with || true may return empty)
    : "${BUG_COUNT:=0}" "${HACK_COUNT:=0}" "${FIXME_COUNT:=0}" "${XXX_COUNT:=0}" "${TODO_COUNT:=0}"

    TOTAL=$((BUG_COUNT + HACK_COUNT + FIXME_COUNT + XXX_COUNT + TODO_COUNT))

    if [[ $TOTAL -gt 0 ]]; then
        # Get relative path for cleaner output
        REL_PATH="${file_path#$PROJECT_DIR/}"

        # Output notification
        echo ""
        echo "📝 Found $TOTAL code marker(s) in $REL_PATH:"
        [[ $BUG_COUNT -gt 0 ]] && echo "   🔴 BUG: $BUG_COUNT (suggests P0)"
        [[ $HACK_COUNT -gt 0 ]] && echo "   🟠 HACK: $HACK_COUNT (suggests P1)"
        [[ $FIXME_COUNT -gt 0 ]] && echo "   🟡 FIXME: $FIXME_COUNT (suggests P2)"
        [[ $XXX_COUNT -gt 0 ]] && echo "   🟡 XXX: $XXX_COUNT (suggests P2)"
        [[ $TODO_COUNT -gt 0 ]] && echo "   ⚪ TODO: $TODO_COUNT (suggests P3)"
        echo ""
        echo "💡 Run '/td add' to log as technical debt"

        # Append to queue file for batch processing (JSONL format)
        mkdir -p "$(dirname "$QUEUE_FILE")"

        echo "$MARKERS" | while read -r marker; do
            LINE_NUM=$(echo "$marker" | cut -d: -f1)
            REST=$(echo "$marker" | cut -d: -f2-)

            # Extract marker type
            MARKER_TYPE=""
            if [[ "$REST" =~ BUG: ]]; then
                MARKER_TYPE="BUG"
            elif [[ "$REST" =~ HACK: ]]; then
                MARKER_TYPE="HACK"
            elif [[ "$REST" =~ FIXME: ]]; then
                MARKER_TYPE="FIXME"
            elif [[ "$REST" =~ XXX: ]]; then
                MARKER_TYPE="XXX"
            elif [[ "$REST" =~ TODO: ]]; then
                MARKER_TYPE="TODO"
            fi

            # Append to queue as JSONL
            if [[ -n "$MARKER_TYPE" ]]; then
                jq -n -c \
                    --arg file "$REL_PATH" \
                    --arg line "$LINE_NUM" \
                    --arg type "$MARKER_TYPE" \
                    --arg content "$REST" \
                    --arg timestamp "$(date -Iseconds)" \
                    '{file: $file, line: $line, type: $type, content: $content, timestamp: $timestamp}' \
                    >> "$QUEUE_FILE"
            fi
        done
    fi
fi

exit 0
