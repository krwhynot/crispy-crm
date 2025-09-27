#!/bin/bash
# Verify archive completeness

echo "Archive Verification Report"
echo "=========================="
echo ""

# Check archived files
echo "Archived Migration Files:"
find _archived -name "*.sql" -type f | wc -l

# Check current migrations
echo ""
echo "Current Migration Files:"
find ../.. -maxdepth 1 -name "*.sql" -type f | wc -l

# List current files
echo ""
echo "Current Files in migrations/:"
ls -la ../../*.sql 2>/dev/null || echo "No SQL files in migrations/"

echo ""
echo "Archive Directory Structure:"
tree -L 2 . 2>/dev/null || find . -maxdepth 2 -type d

echo ""
echo "=========================="
echo "Verification Complete"
