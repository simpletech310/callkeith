import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv('.env.local')

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Error: Missing credentials")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def check_status():
    print("📊 Checking Ingestion Status...")
    response = supabase.table("resources").select("name").execute()
    data = response.data
    
    print(f"✅ Total Resources Ingested: {len(data)}")
    for item in data:
        print(f" - {item['name']}")

if __name__ == "__main__":
    check_status()
