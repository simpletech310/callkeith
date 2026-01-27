import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv('.env.local')

url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("Missing credentials")
    exit(1)

supabase = create_client(url, key)

try:
    print("Checking for 'applications' table...")
    res = supabase.table('applications').select('*').limit(1).execute()
    print("✅ 'applications' table exists.")
    print(res)
except Exception as e:
    print(f"❌ 'applications' table check failed: {e}")

try:
    print("Checking for 'users' table in public schema...")
    res = supabase.table('users').select('*').limit(1).execute()
    print("✅ 'users' table exists.")
except Exception as e:
    print(f"❌ 'users' table check failed: {e}")
