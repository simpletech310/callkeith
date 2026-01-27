
import os
import asyncio
from dotenv import load_dotenv
from supabase import create_client, Client
from pathlib import Path

# Load Env
env_path = Path('onward/.env.local')
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
    print(f"✅ Loaded env from {env_path}")
else:
    # Try current dir
    load_dotenv(dotenv_path='.env.local')

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("❌ Missing Supabase Credentials (URL or SERVICE_ROLE_KEY)")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async def create_superadmin():
    email = "oadmin" # Assuming this is meant to be a username/email, better to make it email-like or just use it if allowed
    # User asked for 'oadmin', Supabase requires email generally. Let's try 'oadmin@onward.ai' to be safe, or just 'oadmin' if they have username logic. 
    # But usually email is required. I'll use oadmin@onward.ai and log it.
    
    # Wait, user explicitly said "create a superadmin user oadmin". 
    # Supabase Auth 'createUser' takes email. 
    # I will modify it to 'oadmin@onward.ai' but output the credentials clearly.
    
    real_email = "oadmin@onward.ai"
    password = "power123"
    
    print(f"👤 Creating Superadmin: {real_email}")
    
    try:
        # Check if exists
        users = supabase.auth.admin.list_users()
        existing_user = None
        # handle pagination manually if needed, but for now lists 50
        user_list = users.users if hasattr(users, 'users') else users
        
        for u in user_list:
            if u.email == real_email:
                existing_user = u
                break
        
        if existing_user:
            print(f"⚠️ User {real_email} already exists. Updating role/password...")
            supabase.auth.admin.update_user_by_id(
                existing_user.id,
                {"password": password, "user_metadata": {"role": "superadmin"}}
            )
            print(f"✅ Updated {real_email} to superadmin with pass: {password}")
        else:
            response = supabase.auth.admin.create_user({
                "email": real_email,
                "password": password,
                "email_confirm": True,
                "user_metadata": {"role": "superadmin"}
            })
            print(f"✅ Created Superadmin: {response.user.id}")
            print(f"📧 Email: {real_email}")
            print(f"🔑 Password: {password}")

    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(create_superadmin())
