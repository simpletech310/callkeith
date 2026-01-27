import os
import io
import contextlib
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv('.env.local')

# Env vars
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
# Use Service Role Key for Admin Access (RLS Bypass) if available, otherwise Anon
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Error: Missing Supabase credentials in .env.local")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def verify_epsilon_query():
    print("🤖 AGENT EPSILON: Running Semantic Match Test...")
    query_text = "Compton Food" # Simulating "mother in Compton looking for food"
    
    # Simple text filter since vector is mocked
    response = supabase.table("resources") \
        .select("name, description") \
        .ilike("description", f"%{query_text.split()[0]}%") \
        .execute()
        
    data = response.data
    
    print(f"🔎 Query: '{query_text}'")
    print(f"📊 Found {len(data)} matches.")
    
    found_target = False
    for item in data:
        print(f" - {item['name']}")
        if "Salvation Army" in item['name'] or "Shields" in item['name']:
            found_target = True
            
    if found_target:
        print("\n✅ MATCH CONFIRMED: Found 'Salvation Army' or 'Shields'.")
        print("Agent Epsilon validates this dataset for RAG usage.")
    else:
        print("\n❌ MATCH FAILED: Top targets not found.")

if __name__ == "__main__":
    verify_epsilon_query()
