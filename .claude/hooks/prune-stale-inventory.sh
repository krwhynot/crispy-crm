#!/bin/bash
set -euo pipefail

INVENTORY_DIR="${1:-.claude/state/component-inventory}"
DRY_RUN="${2:-true}"
ARCHIVE_DIR=".claude/state/archive/$(date +%Y%m%d-%H%M%S)"

orphan_count=0
pruned_count=0

echo "🔍 Scanning inventory: $INVENTORY_DIR (dry_run=$DRY_RUN)"

for json_file in "$INVENTORY_DIR"/*.json; do
  [ -f "$json_file" ] || continue

  # Extract file paths from JSON (adapt to schema: .items[].file)
  while IFS= read -r source_path; do
    if [ -n "$source_path" ] && [ ! -f "$source_path" ]; then
      ((orphan_count++))
      echo "⚠️  ORPHAN: $json_file -> $source_path"

      if [ "$DRY_RUN" = "false" ]; then
        mkdir -p "$ARCHIVE_DIR"
        mv "$json_file" "$ARCHIVE_DIR/"
        ((pruned_count++))
        break  # Stop checking this file
      fi
    fi
  done < <(jq -r '.items[]?.file // empty' "$json_file" 2>/dev/null)
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Results:"
echo "   Orphaned entries: $orphan_count"
echo "   Files pruned: $pruned_count"
if [ "$DRY_RUN" = "true" ] && [ "$orphan_count" -gt 0 ]; then
  echo "   💡 Run with 'false' to archive orphaned files"
fi
