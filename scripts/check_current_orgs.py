
import os
import json
from dotenv import load_dotenv
from supabase import create_client

load_dotenv('.env.local')

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_KEY:
    print("❌ Missing Service Role Key")
    exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

try:
    res = supabase.table('resources').select('*').execute()
    resources = res.data
    print(f"✅ Found {len(resources)} resources.")
    for r in resources:
        print(f"--- {r['name']} ---")
        print(f"Category: {r['category']}")
        print(f"Description: {r.get('description', '')}")
        print(f"Programs: {json.dumps(r.get('programs', []), indent=2)}")
        print("\n")

except Exception as e:
    print(f"❌ Error: {e}")
