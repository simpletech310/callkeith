import os
import random
import time
from dotenv import load_dotenv
from supabase import create_client

load_dotenv('.env.local')

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_KEY:
    print("❌ Missing Service Role Key")
    exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Target Applicant
APPLICANT_EMAIL = "travis2@email.com"
APPLICANT_ID = None

# 1. Get Applicant ID
print(f"🔍 Finding Applicant: {APPLICANT_EMAIL}")
users = supabase.auth.admin.list_users()
for u in users:
     if hasattr(u, 'email') and u.email == APPLICANT_EMAIL:
            APPLICANT_ID = u.id
            break
            
if not APPLICANT_ID and hasattr(users, 'users'):
    for u in users.users:
        if u.email == APPLICANT_EMAIL:
            APPLICANT_ID = u.id
            break

if not APPLICANT_ID:
    print("❌ Applicant not found. Please run seed_dashboard.py first or ensure user exists.")
    exit(1)
    
print(f"✅ Found Applicant ID: {APPLICANT_ID}")

# 2. Get All Resources
print("\n📚 Fetching Resources...")
res = supabase.table('resources').select('*').execute()
resources = res.data
print(f"✅ Found {len(resources)} resources.")

# 3. Iterate and Seed
statuses = ['submitted', 'acknowledged', 'on_hold', 'accepted', 'submitted', 'cancelled', 'new']

for i, r in enumerate(resources):
    print(f"\nPROCESSING: {r['name']}")
    
    # A. Generate Owner Email
    # simplistic slug
    slug = r['name'].lower().replace(' ', '').replace(',', '').replace('.', '')[:10]
    owner_email = f"admin@{slug}.com"
    owner_password = "password123"
    owner_id = None
    
    # B. Create/Find Owner
    try:
        # Check if email exists in our fetched list (might be stale but ok for verify)
        # Better to just try create or get by email
        # list_users doesn't support filter easily in py client sometimes, so we loop or rely on create error
        
        # Try creating
        print(f"   👤 Creating Owner: {owner_email}")
        try:
            user = supabase.auth.admin.create_user({
                "email": owner_email,
                "password": owner_password,
                "email_confirm": True,
                "user_metadata": {"full_name": f"Admin of {r['name']}", "org_name": r['name']}
            })
            owner_id = user.user.id
            print(f"      ✅ Created: {owner_id}")
        except Exception as create_err:
            if "already registered" in str(create_err) or "exists" in str(create_err):
               print("      ℹ️ User exists, finding ID...")
               # Re-fetch users or just use the global list if small
               # We'll just loop global list again to be safe
               refresh_users = supabase.auth.admin.list_users()
               found = False
               if hasattr(refresh_users, 'users'):
                   iterable = refresh_users.users
               else:
                   iterable = refresh_users
                   
               for u in iterable:
                   if u.email == owner_email:
                       owner_id = u.id
                       found = True
                       break
               if found:
                    print(f"      ✅ Found: {owner_id}")
               else:
                    print("      ❌ Could not find existing user ID.")
            else:
                print(f"      ❌ Error creating user: {create_err}")

    except Exception as e:
        print(f"   ❌ Error in owner process: {e}")

    # C. Update Resource with Owner ID
    if owner_id:
        if r.get('owner_id') != owner_id:
            print(f"   🔗 Linking Owner {owner_id} to Resource {r['id']}")
            supabase.table('resources').update({'owner_id': owner_id}).eq('id', r['id']).execute()
        else:
            print("   🔗 Owner already linked.")
            
    # D. Create Lead for Applicant
    # Check if exists
    existing_lead = supabase.table('leads').select('*').eq('user_id', APPLICANT_ID).eq('resource_id', r['id']).execute()
    
    if not existing_lead.data:
        status = statuses[i % len(statuses)]
        print(f"   📝 Creating Application ({status})...")
        lead = {
            "user_id": APPLICANT_ID,
            "resource_id": r['id'],
            "status": status,
            "notes": f"Auto-generated application for {r['name']}"
        }
        supabase.table('leads').insert(lead).execute()
        print("      ✅ Lead Created")
    else:
        print("   📝 Application already exists.")

print("\n\n🎉 SEEDING COMPLETE!")
print("===========================================")
print(f"Applicant Login: {APPLICANT_EMAIL} / password123")
print("Org Owner Logins (Sample):")
for r in resources[:5]:
    slug = r['name'].lower().replace(' ', '').replace(',', '').replace('.', '')[:10]
    print(f" - {r['name']}: admin@{slug}.com / password123")
print("===========================================")
