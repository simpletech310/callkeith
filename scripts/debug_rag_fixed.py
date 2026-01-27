
import os
import sys
import asyncio
import json
from supabase import create_client
from dotenv import load_dotenv

load_dotenv('.env.local') or load_dotenv('onward/.env.local')

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL:
    print("❌ Missing NEXT_PUBLIC_SUPABASE_URL")
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def test_query():
    matched_cat = "food"
    print(f"🔍 Testing Query for category: '{matched_cat}'")
    
    # Syntax check: category.ilike.food OR secondary_categories.cs.{food}
    # Note: ilike is good, but eq is safer for exact enum matches if we know it. 
    # But let's stick to what I wrote: ilike
    
    # Python Client Note: The .or_ method expects a string formatted for PostgREST
    # "category.ilike.food,secondary_categories.cs.{food}"
    
    or_filter = f"category.ilike.{matched_cat},secondary_categories.cs.{{{{'{matched_cat}'}}}}"
    print(f"   Filter String: {or_filter}")
    
    try:
        res = supabase.table('resources').select('*').or_(or_filter).execute()
        print(f"   ✅ Found {len(res.data)} results.")
        for r in res.data:
            print(f"      - {r['name']} (Main: {r['category']}, Sec: {r.get('secondary_categories')})")
            
    except Exception as e:
        print(f"   ❌ Query Failed: {e}")

if __name__ == "__main__":
    test_query()
