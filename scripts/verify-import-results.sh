#!/bin/bash
# Quick validation script to verify import results

echo "🔍 Verifying Import Results..."
echo ""

# Count total contacts
TOTAL=$(PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -t -c "SELECT COUNT(*) FROM contacts;")
echo "Total Contacts: $TOTAL"

# Count "General Contact" entries
GENERAL=$(PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -t -c "SELECT COUNT(*) FROM contacts WHERE first_name = 'General' AND last_name = 'Contact';")
echo "General Contacts: $GENERAL"

# List all contacts with organizations
echo ""
echo "All Imported Contacts:"
PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -c "
SELECT
  c.first_name || ' ' || c.last_name as name,
  o.name as organization
FROM contacts c
LEFT JOIN organizations o ON c.organization_id = o.id
ORDER BY c.created_at DESC
LIMIT 10;
"
