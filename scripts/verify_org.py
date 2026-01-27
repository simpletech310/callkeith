
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv('.env.local')

url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("Missing credentials")
    exit(1)

supabase = create_client(url, key)

# Search for Forever Forward
print("Searching for 'Forever Forward'...")
response = supabase.table('resources').select('*').ilike('name', '%Forever Forward%').execute()

if response.data:
    for org in response.data:
        print(f"\n✅ FOUND: {org['name']}")
        print(f"   ID: {org['id']}")
        print(f"   Category: {org['category']}")
        print(f"   Description: {org['description']}")
        print(f"   Service Area: {org.get('contact_info', {}).get('service_area', 'N/A')}")
        print(f"   Programs: {len(org.get('programs', []))} programs listed")
else:
    print("❌ 'Forever Forward' not found in the database.")
