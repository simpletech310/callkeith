import os
import random
from dotenv import load_dotenv
from supabase import create_client

load_dotenv('.env.local')

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_KEY:
    print("❌ Missing Service Role Key")
    exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# target email
EMAIL = "travis2@email.com" # Simplified from 'travis2email' request
PASSWORD = "password123"

# 1. Create or Find User
try:
    # Try finding first (check if user exists)
    # Using list_users as simplest way in admin api
    users = supabase.auth.admin.list_users()
    target_user_id = None
    
    # Check simplified list
    for u in users:
        if hasattr(u, 'email') and u.email == EMAIL:
            target_user_id = u.id
            print(f"✅ Found existing user with ID: {target_user_id}")
            break
            
    # Also check generic list (paginated wrapper)
    if not target_user_id and hasattr(users, 'users'):
        for u in users.users:
            if u.email == EMAIL:
                target_user_id = u.id
                print(f"✅ Found existing user with ID: {target_user_id}")
                break

    if not target_user_id:
        print(f"🆕 Creating new user: {EMAIL}")
        user = supabase.auth.admin.create_user({
            "email": EMAIL,
            "password": PASSWORD,
            "email_confirm": True,
            "user_metadata": {"first_name": "Travis", "last_name": "Two"}
        })
        target_user_id = user.user.id
        print(f"✅ User created with ID: {target_user_id}")

except Exception as e:
    print(f"⚠️ User creation warning (may already exist?): {e}")
    # Fallback lookup if create failed
    if not target_user_id:
         # Rough retry lookup
         # Just proceed if we can find it somehow or assume failure
         pass

if not target_user_id:
    print("❌ Could not get target user ID. Exiting.")
    exit(1)

# 2. Get Resources for Apps
try:
    # Fetch random 7 resources
    # We'll just fetch all and slice
    res = supabase.table('resources').select('id, name').limit(20).execute()
    resources = res.data
    
    if len(resources) < 7:
        print(f"⚠️ Only found {len(resources)} resources. Using all available.")
        selected = resources
    else:
        # Shuffle or just pick top 7?
        # Let's shuffle for variety if we re-run
        random.shuffle(resources)
        selected = resources[:7]
        
    print(f"🎯 Seeding {len(selected)} applications...")
    
    statuses = ['submitted', 'acknowledged', 'on_hold', 'accepted', 'submitted', 'submitted', 'cancelled']
    
    for i, r in enumerate(selected):
        status = statuses[i % len(statuses)]
        
        # Check if lead exists first to avoid duplicates
        existing = supabase.table('leads').select('id').eq('user_id', target_user_id).eq('resource_id', r['id']).execute()
        
        if not existing.data:
            lead = {
                "user_id": target_user_id,
                "resource_id": r['id'],
                "status": status,
                "notes": f"Seeded application for dashboard testing. Status: {status}"
            }
            supabase.table('leads').insert(lead).execute()
            print(f"   ➕ Added app for: {r['name']} ({status})")
        else:
            print(f"   ℹ️ App already exists for: {r['name']}")

    print("\n✅ Seeding Complete!")
    print(f"🔑 Login Info:\n   Email: {EMAIL}\n   Password: {PASSWORD}")
    print(f"🔗 Dashboard: http://localhost:3000/magic/{target_user_id}") # Assuming magic route fits but login is universal

except Exception as e:
    print(f"❌ Seeding Error: {e}")
