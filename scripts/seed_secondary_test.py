
import os
import sys
import json
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv('.env.local') or load_dotenv('onward/.env.local')

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_KEY:
    print("❌ Missing Service Role Key")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def seed_secondary():
    print("🌱 Seeding Org with Secondary Categories...")
    
    # 1. Check for existing test user to own it
    users = supabase.auth.admin.list_users()
    user_list = users.users if hasattr(users, 'users') else users
    if not user_list:
        print("❌ No users found.")
        return
    owner_id = user_list[0].id
    
    # 2. Upsert Org
    org_data = {
        "name": "Multi-Service Org Test",
        "category": "education",
        "description": "We mainly teach coding but also help students find jobs.",
        "owner_id": owner_id,
        "secondary_categories": ["employment", "technology"],
        "programs": [{"name": "Coding 101", "description": "Learn to code"}]
    }
    
    # Check exist
    existing = supabase.table('resources').select('id').eq('name', 'Multi-Service Org Test').execute()
    if existing.data:
        # Update
        print("   Updating existing org...")
        supabase.table('resources').update(org_data).eq('id', existing.data[0]['id']).execute()
    else:
        # Insert
        print("   Creating new org...")
        supabase.table('resources').insert(org_data).execute()
        
    print("✅ Seed Complete.")

if __name__ == "__main__":
    seed_secondary()
