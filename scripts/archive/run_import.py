#!/usr/bin/env python3

import os
import sys
import httpx

# Read SQL file
print("📖 Reading import file...")
with open('./data/grand_rapids_import_wrapped.sql', 'r') as f:
    sql_content = f.read()

print(f"📊 File size: {len(sql_content) / 1024:.2f} KB")

# Get Supabase URL from .env
supabase_url = None
with open('.env', 'r') as f:
    for line in f:
        if line.startswith('VITE_SUPABASE_URL='):
            supabase_url = line.strip().split('=', 1)[1]
            break

if not supabase_url:
    print("❌ Could not find VITE_SUPABASE_URL in .env")
    sys.exit(1)

print(f"🔗 Supabase URL: {supabase_url}")
print("⏳ Executing SQL via Supabase REST API (this may take 1-2 minutes)...\n")

# Note: This requires postgREST direct access or service role key
print("❌ Direct SQL execution requires service role key or PostgreSQL connection.")
print("\n💡 Alternative approaches:")
print("   1. Get service role key from Supabase dashboard")
print("   2. Use psql with database connection string")
print("   3. Use Supabase Studio SQL editor (copy/paste)")
print("\nFor now, please use the Supabase Studio SQL editor to run the import.")
print(f"📄 File location: ./data/grand_rapids_import_wrapped.sql")
