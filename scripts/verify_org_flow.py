
import os
import requests
import json
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv('.env.local')

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") # Needed for admin actions

if not SUPABASE_KEY:
    print("❌ SKIPPING: No Service Role Key found. Cannot act as Admin.")
    exit(0)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def verify_flow():
    print("🧪 STARTING VERIFICATION: Organization Flow")

    # 1. Create a Fake Org Resource
    print("\n1️⃣ Creating Test Organization...")
    # Ideally find a user to attach to
    user_res = supabase.auth.admin.list_users()
    
    # Debug: print type
    # print(f"DEBUG: Type of user_res: {type(user_res)}")
    
    # Handle different supabase-py versions (Response object vs List)
    users = []
    if hasattr(user_res, 'users'):
        users = user_res.users
    elif isinstance(user_res, list):
        users = user_res
    else:
        # Fallback for newer/different versions that might return a tuple or dict
        users = getattr(user_res, 'data', []) or []
        
    if not users:
        print("❌ No users found to attach organization to.")
        return
        
    test_user_id = users[0].id
    print(f"   Attaching to User ID: {test_user_id}")

    org_data = {
        "name": "Test Org Automated",
        "category": "housing",
        "description": "A test organization.",
        "owner_id": test_user_id
    }
    
    # Check if exists or insert
    existing = supabase.table('resources').select('id').eq('name', 'Test Org Automated').execute()
    if existing.data:
        org_id = existing.data[0]['id']
        print(f"   Using existing Org ID: {org_id}")
    else:
        res = supabase.table('resources').insert(org_data).execute()
        org_id = res.data[0]['id']
        print(f"   Created Org ID: {org_id}")

    # 2. Test Scraping API
    print("\n2️⃣ Testing Scraping API...")
    scrape_endpoint = "http://localhost:3000/api/scrape"
    try:
        payload = {"url": "https://example.com"}
        response = requests.post(scrape_endpoint, json=payload, timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ API Success: Title = '{data.get('title')}'")
        else:
            print(f"   ❌ API Failed: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"   ❌ API Connection Error: {e} (Is Next.js running?)")

    # 3. Create a Lead
    print("\n3️⃣ Creating Test Lead...")
    lead_data = {
        "resource_id": org_id,
        "user_id": test_user_id, # Linking to self for simplicity
        "status": "new",
        "notes": "Interested in housing."
    }
    
    lead_res = supabase.table('leads').insert(lead_data).execute()
    lead_id = lead_res.data[0]['id']
    print(f"   Created Lead ID: {lead_id}")

    # 4. Verify Lead Status Update
    print("\n4️⃣ Updating Lead Status...")
    update_res = supabase.table('leads').update({"status": "contacted"}).eq("id", lead_id).execute()
    updated_lead = update_res.data[0]
    
    if updated_lead['status'] == 'contacted':
        print(f"   ✅ Status Updated to: {updated_lead['status']}")
    else:
        print(f"   ❌ Status Mismatch: {updated_lead['status']}")

    print("\n✅ VERIFICATION COMPLETE")

if __name__ == "__main__":
    verify_flow()
