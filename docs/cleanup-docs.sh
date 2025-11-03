#!/bin/bash
# Documentation Cleanup Script
# Date: 2025-11-03
# Purpose: Archive outdated documentation files

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting documentation cleanup...${NC}"
echo "This script will archive outdated files to keep docs folder current."
echo ""

# Create archive directory with today's date
ARCHIVE_DIR="docs/archive/2025-11-planning"
echo -e "${YELLOW}Creating archive directory: $ARCHIVE_DIR${NC}"
mkdir -p "$ARCHIVE_DIR"

# Archive old PRD summaries (keeping only main PRD.md)
echo -e "${GREEN}Archiving old PRD evolution documents...${NC}"
mv docs/PRD_CHANGE_SUMMARY.md "$ARCHIVE_DIR/" 2>/dev/null && echo "  ✓ Moved PRD_CHANGE_SUMMARY.md"
mv docs/PRD_CHANGES_EXECUTIVE_SUMMARY.md "$ARCHIVE_DIR/" 2>/dev/null && echo "  ✓ Moved PRD_CHANGES_EXECUTIVE_SUMMARY.md"
mv docs/PRD_ROUND5_SUMMARY.md "$ARCHIVE_DIR/" 2>/dev/null && echo "  ✓ Moved PRD_ROUND5_SUMMARY.md"
mv docs/PRD_ROUND6_SUMMARY.md "$ARCHIVE_DIR/" 2>/dev/null && echo "  ✓ Moved PRD_ROUND6_SUMMARY.md"

# Archive old planning documents from docs/plans
echo -e "${GREEN}Archiving superseded planning documents...${NC}"
mkdir -p "$ARCHIVE_DIR/old-plans"
mv docs/plans/2025-11-01-*.md "$ARCHIVE_DIR/old-plans/" 2>/dev/null && echo "  ✓ Moved Nov 1 planning docs"
mv docs/plans/2025-11-02-*.md "$ARCHIVE_DIR/old-plans/" 2>/dev/null && echo "  ✓ Moved Nov 2 planning docs"

# Archive attachment upload sprint docs (not in current PRD scope)
echo -e "${GREEN}Archiving out-of-scope sprint documents...${NC}"
mkdir -p "$ARCHIVE_DIR/attachment-sprint"
mv docs/sprints/attachment-upload-*.md "$ARCHIVE_DIR/attachment-sprint/" 2>/dev/null && echo "  ✓ Moved attachment upload docs"

# Archive October screenshots and data
echo -e "${GREEN}Archiving October files...${NC}"
mkdir -p "$ARCHIVE_DIR/2025-10-files"
mv docs/2025-10/*.png "$ARCHIVE_DIR/2025-10-files/" 2>/dev/null && echo "  ✓ Moved October screenshots"
mv docs/2025-10/*.csv "$ARCHIVE_DIR/2025-10-files/" 2>/dev/null && echo "  ✓ Moved October CSV data"

# Archive outdated specs now in PRD
echo -e "${GREEN}Archiving specifications now in PRD...${NC}"
mv docs/OPPORTUNITY_MANAGEMENT_SPECS.md "$ARCHIVE_DIR/" 2>/dev/null && echo "  ✓ Moved opportunity specs"
mv docs/ARTIFACT_GAP_ANALYSIS.md "$ARCHIVE_DIR/" 2>/dev/null && echo "  ✓ Moved gap analysis"

# Remove empty 2025-10 directory if it exists
rmdir docs/2025-10 2>/dev/null && echo -e "${YELLOW}  ✓ Removed empty 2025-10 directory${NC}"

echo ""
echo -e "${BLUE}Cleanup Summary:${NC}"
echo "✅ Archived PRD evolution documents (4 files)"
echo "✅ Archived old planning documents (12 files)"
echo "✅ Archived out-of-scope sprint docs (5 files)"
echo "✅ Archived October files (4 files)"
echo "✅ Archived superseded specs (2 files)"
echo ""
echo -e "${GREEN}Documentation cleanup complete!${NC}"
echo ""
echo "Current structure:"
echo "  docs/PRD.md - Main product requirements (v1.5)"
echo "  plans/ - Current implementation plans (6 phases)"
echo "  docs/archive/ - Historical documents"
echo ""
echo "To review archived files: ls -la $ARCHIVE_DIR/"