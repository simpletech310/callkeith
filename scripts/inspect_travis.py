import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv('.env.local')

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("Missing credentials")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

user_id = "5b6097b9-ff82-40f0-beb8-4c723ceac49c"

try:
    response = supabase.auth.admin.get_user_by_id(user_id)
    user = response.user
    print(f"User found: {user.email}")
    print(f"Metadata: {user.user_metadata}")
    print(f"Confirmed: {user.email_confirmed_at}")
    print(f"Last Sign In: {user.last_sign_in_at}")

    # Optional: Reset password if needed to test login
    # supabase.auth.admin.update_user_by_id(user_id, {"password": "password123"})
    # print("Password reset to 'password123'")

except Exception as e:
    print(f"Error: {e}")
